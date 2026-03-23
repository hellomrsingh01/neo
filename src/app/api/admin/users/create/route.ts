import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateBody = {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
};

const ALLOWED_ROLES = new Set(["admin", "internal", "external"]);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.error("CREATE USER: missing bearer token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("CREATE USER: missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server configuration error: missing service role key" },
        { status: 500 },
      );
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData.user) {
      console.error("CREATE USER: requester auth failed", authError);
      return NextResponse.json(
        { error: authError?.message || "Unauthorized" },
        { status: 401 },
      );
    }

    const requesterId = authData.user.id;
    const { data: requesterProfile, error: requesterError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterId)
      .maybeSingle<{ role: string | null }>();

    if (requesterError || requesterProfile?.role !== "admin") {
      console.error("CREATE USER: admin verification failed", {
        requesterId,
        requesterError,
        requesterRole: requesterProfile?.role ?? null,
      });
      return NextResponse.json(
        { error: "Forbidden: admin role required" },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => null)) as CreateBody | null;
    const email = body?.email?.trim();
    const name = body?.name?.trim();
    const password = body?.password ?? "";
    const role = body?.role?.trim().toLowerCase() ?? "";

    if (!email || !name || !password || !role) {
      console.error("CREATE USER: missing required fields", {
        hasEmail: Boolean(email),
        hasName: Boolean(name),
        hasPassword: Boolean(password),
        role,
      });
      return NextResponse.json(
        { error: "email, name, password, and role are required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      console.error("CREATE USER: invalid role", { role });
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { data: createdAuth, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authCreateError || !createdAuth.user) {
      console.error("CREATE USER: auth create failed", {
        email,
        role,
        error: authCreateError,
      });
      return NextResponse.json(
        { error: authCreateError?.message || "Failed to create auth user" },
        { status: 500 },
      );
    }

    const createdUserId = createdAuth.user.id;
    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: createdUserId,
          full_name: name,
          email,
          role,
          is_active: true,
        },
        { onConflict: "id" },
      );

    if (profileInsertError) {
      console.error("CREATE USER: profile insert failed", {
        userId: createdUserId,
        email,
        role,
        error: profileInsertError,
      });

      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      if (rollbackError) {
        console.error("CREATE USER: rollback auth delete failed", {
          userId: createdUserId,
          rollbackError,
        });
      }

      return NextResponse.json(
        { error: `Profile insert failed: ${profileInsertError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: createdUserId,
        name,
        email,
        role,
      },
    });
  } catch (err) {
    console.error("CREATE USER: unhandled error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
