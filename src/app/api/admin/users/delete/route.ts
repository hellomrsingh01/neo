import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { userId?: string } | null;
    const userId = body?.userId?.trim();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (userId === requesterId) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
    }

    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileDeleteError) {
      return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
