import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type UpdateBody = {
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
    .select("role")
    .eq("id", requesterId)
    .maybeSingle<{ role: string | null }>();

  if (requesterError || !requesterProfile) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    requesterId,
    requesterRole: requesterProfile.role ?? "internal",
    supabaseClient,
  };
};

const verifyProjectAccess = async (
  projectId: string,
  requesterId: string,
  requesterRole: string,
  supabaseClient: ReturnType<typeof createClient>,
) => {
  const { data: project, error } = await supabaseClient
    .from("projects")
    .select("id, owner_user_id, archived_at")
    .eq("id", projectId)
    .maybeSingle<{ id: string; owner_user_id: string; archived_at: string | null }>();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }
  if (!project || project.archived_at) {
    return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) };
  }
  if (requesterRole !== "admin" && project.owner_user_id !== requesterId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { project };
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const requester = await getRequester(req);
    if ("error" in requester) {
      return requester.error;
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const { requesterId, requesterRole, supabaseClient } = requester;
    const access = await verifyProjectAccess(id, requesterId, requesterRole, supabaseClient);
    if ("error" in access) {
      return access.error;
    }

    const body = (await req.json().catch(() => null)) as UpdateBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updates: Record<string, string | null> = {
      name: body.name?.trim() ?? "",
      client_name: body.client_name?.trim() || null,
      internal_reference: body.internal_reference?.trim() || null,
      project_notes: body.project_notes?.trim() || null,
    };

    if (!updates.name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const { error: updateError } = await supabaseClient.from("projects").update(updates).eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const requester = await getRequester(req);
    if ("error" in requester) {
      return requester.error;
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const { requesterId, requesterRole, supabaseClient } = requester;
    const access = await verifyProjectAccess(id, requesterId, requesterRole, supabaseClient);
    if ("error" in access) {
      return access.error;
    }

    const { error: archiveError } = await supabaseClient
      .from("projects")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
