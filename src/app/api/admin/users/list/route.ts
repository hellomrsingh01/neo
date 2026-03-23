import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ProfileListRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterId = authData.user.id;
    const { data: requesterProfile, error: requesterError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterId)
      .maybeSingle<{ role: string | null }>();

    if (requesterError || requesterProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
    }

    const { data: users, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .order("full_name", { ascending: true });

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    return NextResponse.json({ users: (users ?? []) as ProfileListRow[] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
