import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AddDefaultBody = { action: "add_default"; productId?: string };
type AddToProjectBody = {
  action: "add_to_project";
  productId?: string;
  projectId?: string;
  sectionId?: string;
};
type MoveBody = {
  action: "move";
  projectItemId?: string;
  projectId?: string;
  sectionId?: string;
};

type Body = AddDefaultBody | AddToProjectBody | MoveBody;

const getSupabaseClient = (accessToken?: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Server configuration error: missing Supabase credentials");
  }
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
};

type SupabaseAuthedClient = ReturnType<typeof getSupabaseClient>;

const getRequester = async (req: Request) => {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
  if (!token) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const anon = getSupabaseClient();
  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const supabaseClient = getSupabaseClient(token);
  const requesterId = authData.user.id;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", requesterId)
    .maybeSingle<{ role: string | null }>();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return {
    requesterId,
    requesterRole: profile.role ?? "internal",
    supabaseClient,
  };
};

const verifyProjectAccess = async ({
  supabaseClient,
  requesterId,
  requesterRole,
  projectId,
}: {
  supabaseClient: SupabaseAuthedClient;
  requesterId: string;
  requesterRole: string;
  projectId: string;
}) => {
  const { data: project, error: projectError } = await supabaseClient
    .from("projects")
    .select("id, owner_user_id, archived_at")
    .eq("id", projectId)
    .maybeSingle<{
      id: string;
      owner_user_id: string;
      archived_at: string | null;
    }>();

  if (projectError) {
    return {
      error: NextResponse.json(
        { ok: false, error: projectError.message },
        { status: 500 },
      ),
    };
  }
  if (!project || project.archived_at) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 },
      ),
    };
  }

  const isAdmin = requesterRole === "admin";
  const isOwner = project.owner_user_id === requesterId;
  if (!isAdmin && !isOwner) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { project };
};

const verifySectionInProject = async (
  supabaseClient: SupabaseAuthedClient,
  projectId: string,
  sectionId: string,
) => {
  const { data, error } = await supabaseClient
    .from("project_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    return {
      error: NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      ),
    };
  }
  if (!data) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Section not found" },
        { status: 404 },
      ),
    };
  }
  return { ok: true as const };
};

const getNextSortOrder = async (
  supabaseClient: SupabaseAuthedClient,
  projectId: string,
  sectionId: string,
) => {
  const { data, error } = await supabaseClient
    .from("project_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number | null }>();

  if (error) {
    throw new Error(error.message);
  }

  const currentMax = data?.sort_order ?? null;
  return currentMax === null ? 0 : currentMax + 1;
};

const ensureGeneralSection = async (
  supabaseClient: SupabaseAuthedClient,
  projectId: string,
) => {
  const { data: existing, error: existingError } = await supabaseClient
    .from("project_sections")
    .select("id, name, sort_order")
    .eq("project_id", projectId)
    .eq("name", "General")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string; name: string; sort_order: number | null }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return existing;
  }

  const { data: created, error: createError } = await supabaseClient
    .from("project_sections")
    .insert({ project_id: projectId, name: "General", sort_order: 0 })
    .select("id, name, sort_order")
    .single<{ id: string; name: string; sort_order: number | null }>();

  if (createError || !created) {
    throw new Error(createError?.message || "Failed to create General section");
  }

  return created;
};

export async function POST(req: Request) {
  try {
    const requester = await getRequester(req);
    if ("error" in requester) return requester.error;

    const { requesterId, requesterRole, supabaseClient } = requester;
    const body = (await req.json().catch(() => null)) as Body | null;

    if (!body || typeof body !== "object" || !("action" in body)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (body.action === "add_default") {
      const productId = body.productId?.trim() ?? "";
      if (!productId) {
        return NextResponse.json(
          { ok: false, error: "Missing productId" },
          { status: 400 },
        );
      }

      const { data: project, error: projectError } = await supabaseClient
        .from("projects")
        .select("id, name")
        .eq("owner_user_id", requesterId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; name: string }>();

      if (projectError) {
        return NextResponse.json(
          { ok: false, error: projectError.message },
          { status: 500 },
        );
      }

      if (!project) {
        return NextResponse.json(
          { ok: false, needsProject: true },
          { status: 200 },
        );
      }

      const section = await ensureGeneralSection(supabaseClient, project.id);
      const sortOrder = await getNextSortOrder(
        supabaseClient,
        project.id,
        section.id,
      );

      const { data: createdItem, error: createError } = await supabaseClient
        .from("project_items")
        .insert({
          project_id: project.id,
          section_id: section.id,
          product_id: productId,
          quantity: 1,
          sort_order: sortOrder,
        })
        .select("id")
        .single<{ id: string }>();

      if (createError || !createdItem) {
        return NextResponse.json(
          { ok: false, error: createError?.message || "Failed to add product" },
          { status: 500 },
        );
      }

      const { error: touchProjectError } = await supabaseClient
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", project.id);
      if (touchProjectError) {
        return NextResponse.json(
          { ok: false, error: touchProjectError.message },
          { status: 500 },
        );
      }

      void (async () => {
        try {
          await supabaseClient.from("product_usage_events").insert({
            product_id: productId,
            project_id: project.id,
            project_item_id: createdItem.id,
            user_id: requesterId,
            event_type: "product_added",
          });
        } catch {
        }
      })();

      return NextResponse.json(
        {
          ok: true,
          projectItemId: createdItem.id,
          project: { id: project.id, name: project.name },
        },
        { status: 200 },
      );
    }

    if (body.action === "add_to_project") {
      const productId = body.productId?.trim() ?? "";
      const projectId = body.projectId?.trim() ?? "";
      const sectionId = body.sectionId?.trim() ?? "";
      if (!productId || !projectId || !sectionId) {
        return NextResponse.json(
          { ok: false, error: "Missing productId/projectId/sectionId" },
          { status: 400 },
        );
      }

      const access = await verifyProjectAccess({
        supabaseClient,
        requesterId,
        requesterRole,
        projectId,
      });
      if ("error" in access) return access.error;
      const sectionCheck = await verifySectionInProject(
        supabaseClient,
        projectId,
        sectionId,
      );
      if ("error" in sectionCheck) return sectionCheck.error;

      const sortOrder = await getNextSortOrder(
        supabaseClient,
        projectId,
        sectionId,
      );

      const { data: createdItem, error: createError } = await supabaseClient
        .from("project_items")
        .insert({
          project_id: projectId,
          section_id: sectionId,
          product_id: productId,
          quantity: 1,
          sort_order: sortOrder,
        })
        .select("id")
        .single<{ id: string }>();

      if (createError || !createdItem) {
        return NextResponse.json(
          { ok: false, error: createError?.message || "Failed to add product" },
          { status: 500 },
        );
      }

      const { error: touchProjectError } = await supabaseClient
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (touchProjectError) {
        return NextResponse.json(
          { ok: false, error: touchProjectError.message },
          { status: 500 },
        );
      }

      const { data: project, error: projectError } = await supabaseClient
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .maybeSingle<{ id: string; name: string }>();

      if (projectError || !project) {
        return NextResponse.json(
          { ok: false, error: projectError?.message || "Project not found" },
          { status: 500 },
        );
      }

      void (async () => {
        try {
          await supabaseClient.from("product_usage_events").insert({
            product_id: productId,
            project_id: project.id,
            project_item_id: createdItem.id,
            user_id: requesterId,
            event_type: "product_added",
          });
        } catch {
        }
      })();

      return NextResponse.json(
        {
          ok: true,
          projectItemId: createdItem.id,
          project: { id: project.id, name: project.name },
        },
        { status: 200 },
      );
    }

    if (body.action === "move") {
      const projectItemId = body.projectItemId?.trim() ?? "";
      const projectId = body.projectId?.trim() ?? "";
      const sectionId = body.sectionId?.trim() ?? "";
      if (!projectItemId || !projectId || !sectionId) {
        return NextResponse.json(
          { ok: false, error: "Missing projectItemId/projectId/sectionId" },
          { status: 400 },
        );
      }

      const access = await verifyProjectAccess({
        supabaseClient,
        requesterId,
        requesterRole,
        projectId,
      });
      if ("error" in access) return access.error;
      const sectionCheck = await verifySectionInProject(
        supabaseClient,
        projectId,
        sectionId,
      );
      if ("error" in sectionCheck) return sectionCheck.error;

      const { data: existingItem, error: existingItemError } =
        await supabaseClient
          .from("project_items")
          .select("id, project_id")
          .eq("id", projectItemId)
          .maybeSingle<{ id: string; project_id: string }>();

      if (existingItemError) {
        return NextResponse.json(
          { ok: false, error: existingItemError.message },
          { status: 500 },
        );
      }
      if (!existingItem) {
        return NextResponse.json(
          { ok: false, error: "Project item not found" },
          { status: 404 },
        );
      }

      const sortOrder = await getNextSortOrder(
        supabaseClient,
        projectId,
        sectionId,
      );

      const { error: updateError } = await supabaseClient
        .from("project_items")
        .update({
          project_id: projectId,
          section_id: sectionId,
          sort_order: sortOrder,
        })
        .eq("id", projectItemId);

      if (updateError) {
        return NextResponse.json(
          { ok: false, error: updateError.message },
          { status: 500 },
        );
      }

      const { error: touchProjectError } = await supabaseClient
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (touchProjectError) {
        return NextResponse.json(
          { ok: false, error: touchProjectError.message },
          { status: 500 },
        );
      }

      const { data: project, error: projectError } = await supabaseClient
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .maybeSingle<{ id: string; name: string }>();

      if (projectError || !project) {
        return NextResponse.json(
          { ok: false, error: projectError?.message || "Project not found" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          projectItemId,
          project: { id: project.id, name: project.name },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported action" },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("POST /api/project-items failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
