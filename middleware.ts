import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Simple in-memory rate limiter (login brute-force protection) ─────────────
// Single Docker instance safe. For multi-instance prod, replace with Upstash Redis.
const loginRlMap = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `login:${ip}`;
  const entry = loginRlMap.get(key);
  if (!entry || now > entry.resetAt) {
    loginRlMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 min window
    return true;
  }
  if (entry.count >= 10) return false; // 10 attempts max
  entry.count++;
  return true;
}
// ──────────────────────────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limit login-related API calls ────────────────────────────────────
  // Supabase client-side auth hits their servers directly, so we rate-limit
  // the forgot-password page form submission as a proxy for login attempts.
  // For full login rate limiting, enable it in Supabase Dashboard → Auth → Settings.
  if (pathname === "/forgot-password" && request.method === "POST") {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    if (!checkLoginRateLimit(ip)) {
      return new NextResponse("Too many requests. Try again later.", { status: 429 });
    }
  }

  // ── Build response and Supabase client ────────────────────────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...(options as object) });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "", ...(options as object) });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...(options as object) });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // ── Classify the current path ─────────────────────────────────────────────
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminRoute = isAdminPage || isAdminApi;
  const isPdfExportPage = pathname.startsWith("/dashboard/pdf-export");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/project-items") ||
    pathname.startsWith("/api/send-email") ||
    pathname.startsWith("/api/process-image") ||
    isAdminRoute;

  if (!isProtectedRoute) {
    return response; // public routes — no checks needed
  }

  // ── Auth check ────────────────────────────────────────────────────────────
  if (authError || !user) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    // Page routes → redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ── Role-based restrictions beyond admin ──────────────────────────────────
  // Client spec: external users cannot export/email PDFs.
  if (isPdfExportPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    if (!profile || profile.role === "external") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // ── Admin-only check (pages + API) ────────────────────────────────────────
  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      // API routes → 403 JSON
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Page routes → redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/projects/:path*",
    "/api/project-items/:path*",
    "/api/send-email",
    "/api/process-image",
    "/forgot-password",
  ],
};