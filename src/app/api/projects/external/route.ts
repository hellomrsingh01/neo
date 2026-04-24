import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getSupabaseClient = (accessToken?: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
};

type ExternalProjectRow = {
  id: string;
  name: string;
  client_name: string | null;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
  project_type: "internal" | "external" | null;
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const anon = getSupabaseClient();
    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);
    const userId = authData.user.id;

    // FIX: profile + projects fetched in parallel
    const [{ data: profile, error: profileError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single<{ role: string }>(),
    ]);

    // Role check after both resolve
    if (profileError || !profile || profile.role === "external") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    let projectsQuery = supabase
      .from("projects")
      .select(
        "id, name, client_name, created_at, updated_at, owner_user_id, project_type",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (profile.role === "admin") {
      projectsQuery = projectsQuery.neq("owner_user_id", userId);
    } else {
      projectsQuery = projectsQuery.eq("project_type", "external");
    }

    const { data: projectRows, error: projectsError } = await projectsQuery;
    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    const rows = (projectRows ?? []) as ExternalProjectRow[];
    const projectIds = rows.map((p) => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    // FIX: item counts + last viewed fetched in parallel
    const [{ data: itemRows }, { data: viewRows }] = await Promise.all([
      supabase
        .from("project_items")
        .select("project_id")
        .in("project_id", projectIds),
      supabase
        .from("project_views")
        .select("project_id, last_viewed_at")
        .eq("user_id", userId)
        .in("project_id", projectIds),
    ]);

    const itemCountMap = new Map<string, number>();
    for (const row of (itemRows ?? []) as Array<{ project_id: string }>) {
      itemCountMap.set(
        row.project_id,
        (itemCountMap.get(row.project_id) ?? 0) + 1,
      );
    }

    const lastViewedMap = new Map<string, string>();
    for (const row of (viewRows ?? []) as Array<{
      project_id: string;
      last_viewed_at: string;
    }>) {
      lastViewedMap.set(row.project_id, row.last_viewed_at);
    }

    const projects = rows.map((p) => ({
      id: p.id,
      name: p.name,
      client_name: p.client_name,
      created_at: p.created_at,
      updated_at: p.updated_at,
      owner_user_id: p.owner_user_id,
      project_type: p.project_type,
      can_edit: profile.role === "admin",
      item_count: itemCountMap.get(p.id) ?? 0,
      last_viewed_at: lastViewedMap.get(p.id) ?? null,
    }));

    return NextResponse.json({ projects });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
