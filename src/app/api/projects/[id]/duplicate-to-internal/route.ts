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

type SectionRow = {
  id: string;
  name: string;
  notes: string | null;
  sort_order: number;
};

type ItemRow = {
  id: string;
  section_id: string;
  product_id: string;
  quantity: number;
  client_notes: string | null;
  supplier_notes: string | null;
  sort_order: number | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }, // ✅ Promise
) {
  try {
    const { id: sourceProjectId } = await params; // ✅ awaited

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anon = getSupabaseClient();
    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);
    const userId = authData.user.id;

    // Role check — external users cannot duplicate
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single<{ role: string }>();

    if (profileError || !profile || profile.role === "external") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch source project (role-based access)
    const { data: sourceProject, error: sourceError } = await supabase
      .from("projects")
      .select(
        "name, client_name, internal_reference, project_notes, owner_user_id, project_type",
      )
      .eq("id", sourceProjectId)
      .is("archived_at", null)
      .maybeSingle<{
        name: string;
        client_name: string | null;
        internal_reference: string | null;
        project_notes: string | null;
        owner_user_id: string;
        project_type: "internal" | "external" | null;
      }>();

    if (sourceError || !sourceProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const canDuplicate =
      (profile.role === "admin" && sourceProject.owner_user_id !== userId) ||
      (profile.role === "internal" && sourceProject.project_type === "external");

    if (!canDuplicate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch source sections
    const { data: sourceSections, error: sectionsError } = await supabase
      .from("project_sections")
      .select("id, name, notes, sort_order")
      .eq("project_id", sourceProjectId)
      .order("sort_order", { ascending: true });

    if (sectionsError) {
      return NextResponse.json(
        { error: sectionsError.message },
        { status: 500 },
      );
    }

    // Fetch source items
    const { data: sourceItems, error: itemsError } = await supabase
      .from("project_items")
      .select(
        "id, section_id, product_id, quantity, client_notes, supplier_notes, sort_order",
      )
      .eq("project_id", sourceProjectId);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Create new internal project
    const { data: newProject, error: createProjectError } = await supabase
      .from("projects")
      .insert({
        owner_user_id: userId,
        project_type: "internal",
        name: sourceProject.name,
        client_name: sourceProject.client_name,
        internal_reference: sourceProject.internal_reference,
        project_notes: sourceProject.project_notes,
      })
      .select("id")
      .single<{ id: string }>();

    if (createProjectError || !newProject) {
      return NextResponse.json(
        { error: createProjectError?.message ?? "Failed to create project" },
        { status: 500 },
      );
    }

    const newProjectId = newProject.id;
    const sectionIdMap = new Map<string, string>();

    // Copy sections
    const sections = (sourceSections ?? []) as SectionRow[];

    if (sections.length > 0) {
      for (const section of sections) {
        const { data: newSection, error: newSectionError } = await supabase
          .from("project_sections")
          .insert({
            project_id: newProjectId,
            name: section.name,
            notes: section.notes,
            sort_order: section.sort_order,
          })
          .select("id")
          .single<{ id: string }>();

        if (newSectionError || !newSection) {
          await supabase.from("projects").delete().eq("id", newProjectId);
          return NextResponse.json(
            { error: newSectionError?.message ?? "Failed to copy sections" },
            { status: 500 },
          );
        }

        sectionIdMap.set(section.id, newSection.id);
      }
    } else {
      const { data: genSection, error: genError } = await supabase
        .from("project_sections")
        .insert({ project_id: newProjectId, name: "General", sort_order: 0 })
        .select("id")
        .single<{ id: string }>();

      if (genError || !genSection) {
        await supabase.from("projects").delete().eq("id", newProjectId);
        return NextResponse.json(
          { error: "Failed to create General section" },
          { status: 500 },
        );
      }
    }

    // Copy items with remapped section IDs
    const items = (sourceItems ?? []) as ItemRow[];
    if (items.length > 0) {
      const itemsToInsert = items
        .map((item) => {
          const newSectionId = sectionIdMap.get(item.section_id);
          if (!newSectionId) return null;
          return {
            project_id: newProjectId,
            section_id: newSectionId,
            product_id: item.product_id,
            quantity: item.quantity ?? 1,
            client_notes: item.client_notes ?? null,
            supplier_notes: item.supplier_notes ?? null,
            sort_order: item.sort_order ?? 0,
          };
        })
        .filter(Boolean);

      if (itemsToInsert.length > 0) {
        const { error: insertItemsError } = await supabase
          .from("project_items")
          .insert(itemsToInsert);

        if (insertItemsError) {
          await supabase.from("projects").delete().eq("id", newProjectId);
          return NextResponse.json(
            { error: insertItemsError.message },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ ok: true, projectId: newProjectId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
