import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Body = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  selectedCategories?: string[];
  selectedSuppliers?: string[];
  selectedTags?: string[];
  selectedSubcategoryId?: string | null;
  subcategoryId?: string | null;
};

const getAuthedUserId = async (token: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
};

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await getAuthedUserId(token);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const page = Math.max(1, Number(body?.page ?? 1));
    const pageSize = Math.min(60, Math.max(1, Number(body?.pageSize ?? 24)));
    const searchTerm = (body?.searchTerm ?? "").trim();
    const selectedCategories = (body?.selectedCategories ?? []).filter(Boolean);
    const selectedSuppliers = (body?.selectedSuppliers ?? []).filter(Boolean);
    const selectedTags = (body?.selectedTags ?? []).filter(Boolean);
    const selectedSubcategoryId =
      (body?.selectedSubcategoryId ?? body?.subcategoryId ?? "").trim() || null;

    const supabase = getServiceClient();

    // 90-day window
    const sinceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Build product universe matching current filters (category-scoped by design).
    let productsQ = supabase
      .from("products")
      .select("id, name, popular_flag", { count: "exact" })
      .eq("is_archived", false);

    if (selectedCategories.length > 0) productsQ = productsQ.in("category_id", selectedCategories);
    if (selectedSuppliers.length > 0) productsQ = productsQ.in("manufacturer_id", selectedSuppliers);
    if (selectedSubcategoryId) productsQ = productsQ.eq("subcategory_id", selectedSubcategoryId);

    if (selectedTags.length > 0) {
      const { data: tagJoin, error: tagErr } = await supabase
        .from("product_tags")
        .select("product_id")
        .in("tag_id", selectedTags);
      if (tagErr) return NextResponse.json({ error: tagErr.message }, { status: 500 });
      const ids = Array.from(new Set((tagJoin ?? []).map((r) => (r as { product_id: string }).product_id)));
      productsQ = ids.length ? productsQ.in("id", ids) : productsQ.in("id", ["__none__"]);
    }

    if (searchTerm) {
      const escaped = searchTerm.replace(/,/g, " ");
      const orClauses = [
        `name.ilike.%${escaped}%`,
        `product_type.ilike.%${escaped}%`,
        `short_description.ilike.%${escaped}%`,
      ];

      const { data: matchingManufacturers } = await supabase
        .from("manufacturers")
        .select("id")
        .ilike("name", `%${escaped}%`);
      const manufacturerIds = (matchingManufacturers ?? []).map((m) => (m as { id: string }).id);
      if (manufacturerIds.length) {
        orClauses.push(`manufacturer_id.in.(${manufacturerIds.join(",")})`);
      }

      const { data: matchingTags } = await supabase
        .from("tags")
        .select("id")
        .ilike("name", `%${escaped}%`);
      const tagIds = (matchingTags ?? []).map((t) => (t as { id: string }).id);
      if (tagIds.length) {
        const { data: searchTagJoin } = await supabase
          .from("product_tags")
          .select("product_id")
          .in("tag_id", tagIds);
        const searchTagProductIds = Array.from(
          new Set((searchTagJoin ?? []).map((r) => (r as { product_id: string }).product_id)),
        );
        if (searchTagProductIds.length) {
          orClauses.push(`id.in.(${searchTagProductIds.join(",")})`);
        }
      }

      productsQ = productsQ.or(orClauses.join(","));
    }

    const { data: productRows, count: total, error: productsErr } = await productsQ;
    if (productsErr) return NextResponse.json({ error: productsErr.message }, { status: 500 });

    const universe = (productRows ?? []) as Array<{ id: string; name: string; popular_flag: boolean | null }>;
    const productIds = universe.map((p) => p.id);
    if (!productIds.length) {
      return NextResponse.json({ productIds: [], total: 0, page, pageSize });
    }

    // Popularity: count only "product_added" events within 90 days (increments only on add).
    const { data: events, error: eventsErr } = await supabase
      .from("product_usage_events")
      .select("product_id")
      .in("product_id", productIds)
      .eq("event_type", "product_added")
      .gte("created_at", sinceIso);
    if (eventsErr) return NextResponse.json({ error: eventsErr.message }, { status: 500 });

    const counts = new Map<string, number>();
    for (const row of (events ?? []) as Array<{ product_id: string }>) {
      counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
    }

    // Manual boost via popular_flag.
    const BOOST = 1_000_000;
    const flagged = new Set(universe.filter((p) => p.popular_flag).map((p) => p.id));

    productIds.sort((a, b) => {
      const sa = (counts.get(a) ?? 0) + (flagged.has(a) ? BOOST : 0);
      const sb = (counts.get(b) ?? 0) + (flagged.has(b) ? BOOST : 0);
      if (sb !== sa) return sb - sa;
      const na = universe.find((p) => p.id === a)?.name ?? "";
      const nb = universe.find((p) => p.id === b)?.name ?? "";
      return na.localeCompare(nb);
    });

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageIds = productIds.slice(start, end);

    return NextResponse.json({ productIds: pageIds, total: total ?? productIds.length, page, pageSize });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

