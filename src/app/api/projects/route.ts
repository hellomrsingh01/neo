import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type ProjectListRow = {
  id: string;
  name: string;
  client_name: string | null;
  internal_reference: string | null;
  project_notes: string | null;
  created_at: string;
  owner_user_id: string;
  project_type?: "internal" | "external";
  archived_at: string | null;
};

type CreateBody = {
  name?: string;
  client_name?: string;
  internal_reference?: string;
  project_notes?: string;
};

const getSupabaseClient = (accessToken?: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Server configuration error: missing Supabase credentials");
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
};

const getRequester = async (req: Request) => {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const anon = getSupabaseClient();

  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabaseClient = getSupabaseClient(token);
  const requesterId = authData.user.id;
  const { data: requesterProfile, error: requesterError } = await supabaseClient
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", requesterId)
    .maybeSingle<{ role: string | null; full_name: string | null; email: string | null }>();

  if (requesterError || !requesterProfile) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    requesterId,
    requesterRole: requesterProfile.role ?? "internal",
    supabaseClient,
  };
};

export async function GET(req: Request) {
  try {
    const requester = await getRequester(req);
    if ("error" in requester) {
      return requester.error;
    }

    const { requesterId, requesterRole, supabaseClient } = requester;
    let query = supabaseClient
      .from("projects")
      .select("id, name, client_name, internal_reference, project_notes, created_at, owner_user_id, project_type, archived_at")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (requesterRole === "admin") {
      // admin sees only their own internal projects on this page
      query = query.eq("owner_user_id", requesterId).eq("project_type", "internal");
    } else if (requesterRole === "external") {
      // external users only see their own external projects
      query = query.eq("owner_user_id", requesterId).eq("project_type", "external");
    } else {
      // internal users only see their own internal projects
      query = query.eq("owner_user_id", requesterId).eq("project_type", "internal");
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const projectRows = (data ?? []) as ProjectListRow[];
    const projectIds = projectRows.map((project) => project.id);
    const ownerIds = Array.from(new Set(projectRows.map((project) => project.owner_user_id)));

    const itemsByProjectId = new Map<string, Array<{ quantity: number | null }>>();
    if (projectIds.length > 0) {
      const { data: itemRows, error: itemError } = await supabaseClient
        .from("project_items")
        .select("project_id, quantity")
        .in("project_id", projectIds);

      if (itemError) {
        return NextResponse.json(
          { error: `Failed loading project items: ${itemError.message}` },
          { status: 500 },
        );
      }

      for (const row of (itemRows ?? []) as Array<{ project_id: string; quantity: number | null }>) {
        const list = itemsByProjectId.get(row.project_id) ?? [];
        list.push({ quantity: row.quantity });
        itemsByProjectId.set(row.project_id, list);
      }
    }

    const ownerById = new Map<string, { full_name: string | null; email: string | null }>();
    if (ownerIds.length > 0) {
      const { data: ownerRows, error: ownerError } = await supabaseClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);

      if (ownerError) {
        return NextResponse.json(
          { error: `Failed loading project owners: ${ownerError.message}` },
          { status: 500 },
        );
      }

      for (const owner of (ownerRows ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
        ownerById.set(owner.id, { full_name: owner.full_name, email: owner.email });
      }
    }

    const projects = projectRows.map((project) => {
      const items = itemsByProjectId.get(project.id) ?? [];
      const owner = ownerById.get(project.owner_user_id);
      return {
        id: project.id,
        name: project.name,
        client_name: project.client_name,
        internal_reference: project.internal_reference,
        project_notes: project.project_notes,
        created_at: project.created_at,
        owner_user_id: project.owner_user_id,
        totalList: items.length,
        totalUnits: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
        owner_name: owner?.full_name ?? null,
        owner_email: owner?.email ?? null,
      };
    });

    const totalUnits = projects.reduce((sum, project) => sum + project.totalUnits, 0);

    return NextResponse.json({
      projects,
      showingCount: projects.length,
      totalCount: projects.length,
      totalUnits,
      canViewAll: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("GET /api/projects failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const requester = await getRequester(req);
    if ("error" in requester) {
      return requester.error;
    }

    const { requesterId, requesterRole, supabaseClient } = requester;
    const body = (await req.json().catch(() => null)) as CreateBody | null;
    const name = body?.name?.trim() ?? "";
    const clientName = body?.client_name?.trim() || null;
    const internalReference = body?.internal_reference?.trim() || null;
    const projectNotes = body?.project_notes?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const projectType = requesterRole === "external" ? "external" : "internal";

    const { data: createdProject, error: createError } = await supabaseClient
      .from("projects")
      .insert({
        owner_user_id: requesterId,
        project_type: projectType,
        name,
        client_name: clientName,
        internal_reference: internalReference,
        project_notes: projectNotes,
      })
      .select("id")
      .single<{ id: string }>();

    if (createError || !createdProject) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create project" },
        { status: 500 },
      );
    }

    const { error: sectionError } = await supabaseClient.from("project_sections").insert({
      project_id: createdProject.id,
      name: "General",
      sort_order: 0,
    });

    if (sectionError) {
      await supabaseClient.from("projects").delete().eq("id", createdProject.id);
      return NextResponse.json(
        { error: `Failed to create default section: ${sectionError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, projectId: createdProject.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("POST /api/projects failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
