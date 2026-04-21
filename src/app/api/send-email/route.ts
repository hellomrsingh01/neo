import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ─── Simple in-memory rate limiter ────────────────────────────────────────────
const rlMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rlMap.get(key);
  if (!entry || now > entry.resetAt) {
    rlMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
// ──────────────────────────────────────────────────────────────────────────────

type Body = {
  to?: string;
  cc?: string | null;
  subject?: string;
  body?: string;
  pdfBase64?: string;
  filename?: string;
  projectId?: string;
  manufacturerId?: string | null;
  emailType?: string;
};

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
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
};

export async function POST(req: Request) {
  try {
    // ── 1. Rate limit ──────────────────────────────────────────────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const allowed = checkRateLimit(`send-email:${ip}`, 10, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── 2. Auth check ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const anon = getSupabaseClient();
    const { data: authData, error: authError } = await anon.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);

    // ── 3. Role check ──────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    if (profile.role === "external") {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    // ── 4. Parse body ──────────────────────────────────────────────────────
    const payload = (await req.json().catch(() => null)) as Body | null;
    const to = payload?.to?.trim() ?? "";
    const cc = payload?.cc?.trim() || undefined;
    const subject = payload?.subject?.trim() ?? "";
    const message = payload?.body ?? "";
    const pdfBase64 = payload?.pdfBase64 ?? "";
    const filename = payload?.filename?.trim() ?? "export.pdf";
    const projectId = payload?.projectId?.trim() ?? "";
    const manufacturerId = payload?.manufacturerId ?? null;
    const emailType =
      payload?.emailType === "supplier_rfq" ? "supplier_rfq" : "client_pdf";
    if (!to) return NextResponse.json({ error: "Missing to" }, { status: 400 });
    if (!subject)
      return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    if (!pdfBase64)
      return NextResponse.json({ error: "Missing pdfBase64" }, { status: 400 });
    if (!projectId)
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    // ── 5. Project access check ────────────────────────────────────────────
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("owner_user_id, archived_at")
      .eq("id", projectId)
      .maybeSingle<{ owner_user_id: string; archived_at: string | null }>();

    if (projectError || !project || project.archived_at) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.owner_user_id === user.id;
    const isAdmin = profile.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    // ── 6. Send email via Resend ───────────────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY ?? "";
    const from = process.env.RESEND_FROM ?? "";
    if (!apiKey)
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY" },
        { status: 500 },
      );
    if (!from)
      return NextResponse.json(
        { error: "Missing RESEND_FROM" },
        { status: 500 },
      );

    const resend = new Resend(apiKey);
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const { error } = await resend.emails.send({
      from,
      to,
      cc,
      subject,
      text: message,
      attachments: [{ filename, content: pdfBuffer }],
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── 7. Log email activity ──────────────────────────────────────────────
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        await supabaseAdmin.from("project_email_logs").insert({
          project_id: projectId,
          email_type: emailType,
          to_email: to,
          cc_email: cc ?? null, 
          subject: subject,
          message_body: message,
          sent_by: user.id,
          sender_id: user.id,
          sent_at: new Date().toISOString(),
          status: "sent",
          manufacturer_id: manufacturerId,
        });
      }
    } catch {
      // Non-blocking — log failure never blocks email success
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
