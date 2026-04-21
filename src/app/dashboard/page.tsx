"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Stat = {
  value: string;
  label: string;
};

type Category = {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  slug: string;
};

const CATEGORY_ICON_ASSET: Record<string, string> = {
  meet: "/Meet.svg",
  sit: "/Sit.svg",
  work: "/Work.svg",
  store: "/Store.svg",
  connect: "/Connect.svg",
  divide: "/Divide.svg",
};

function categoryIconSrc(iconName: string | undefined | null): string | null {
  if (!iconName?.trim()) return null;
  const key = iconName.trim().toLowerCase();
  if (CATEGORY_ICON_ASSET[key]) return CATEGORY_ICON_ASSET[key];
  return `/${iconName.charAt(0).toUpperCase() + iconName.slice(1)}.png`;
}

type Product = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  productUrl: string | null;
};

function Icon({
  name,
  className,
}: {
  name: "spark" | "cube" | "grid" | "users" | "search" | "plus" | "arrowRight";
  className?: string;
}) {
  const common = "stroke-current fill-none";

  if (name === "search") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          className={common}
          strokeWidth="1.8"
        />
        <path
          d="M16.2 16.2 21 21"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z"
          className={common}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5v14M5 12h14"
          className={common}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "arrowRight") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 12h12"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M13 6l6 6-6 6"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "cube") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2.8 20 7.2v9.6l-8 4.4-8-4.4V7.2L12 2.8Z"
          className={common}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 2.8v9.2l8-4.8"
          className={common}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 12 4 7.2"
          className={common}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "grid") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.5 4.5h6.5v6.5H4.5V4.5Zm8 0h7v6.5h-7V4.5ZM4.5 13h6.5v7H4.5v-7Zm8 0h7v7h-7v-7Z"
          className={common}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16.4 20.2c1.9-.8 3.1-2.2 3.1-3.9 0-2.6-3-4.7-6.6-4.7s-6.6 2.1-6.6 4.7c0 1.7 1.2 3.1 3.1 3.9"
          className={common}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M12.9 11a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8Z"
          className={common}
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3l9 9-9 9-9-9 9-9Z"
        className={common}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [stats, setStats] = useState<Stat[]>([
    { value: "0", label: "Total Products" },
    { value: "0", label: "Categories" },
    { value: "0", label: "Active Projects" },
    { value: "0", label: "Team Members" },
  ]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductsPage, setNewProductsPage] = useState(1);
  const newProductsPageSize = 36;
  const [newProductsTotal, setNewProductsTotal] = useState(0);
  const newProductsTotalPages = Math.max(
    1,
    Math.ceil(newProductsTotal / newProductsPageSize),
  );

  // ── Single mount effect: auth + stats + categories in one shot ──
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Single auth call shared across everything
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!isMounted) return;
      if (!user) {
        router.replace("/");
        return;
      }

      // ── Stats + Categories in parallel ──
      setStatsLoading(true);
      setCategoriesLoading(true);

      try {
        const [
          { count: productsCount, error: productsErr },
          { count: categoriesCount, error: categoriesErr },
          { count: teamCount, error: teamErr },
          { count: projectsCount, error: projectsErr },
          { data: categoryRows, error: catRowsErr },
          // FIX: single query for ALL product category_ids instead of N+1
          { data: productCatRows, error: productCatErr },
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("is_archived", false),
          supabase
            .from("categories")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .is("archived_at", null)
            .eq("owner_user_id", user.id),
          supabase
            .from("categories")
            .select("id, name, slug, icon_name")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          // One flat query instead of N separate count queries
          supabase
            .from("products")
            .select("category_id")
            .eq("is_archived", false)
            .not("category_id", "is", null),
        ]);

        if (
          productsErr || categoriesErr || teamErr ||
          projectsErr || catRowsErr || productCatErr
        ) {
          throw productsErr ?? categoriesErr ?? teamErr ??
            projectsErr ?? catRowsErr ?? productCatErr;
        }

        if (!isMounted) return;

        // Build count map client-side — O(n) single pass
        const countMap = new Map<string, number>();
        for (const row of productCatRows ?? []) {
          if (row.category_id) {
            countMap.set(
              row.category_id,
              (countMap.get(row.category_id) ?? 0) + 1,
            );
          }
        }

        setStats([
          { value: String(productsCount ?? 0), label: "Total Products" },
          { value: String(categoriesCount ?? 0), label: "Categories" },
          { value: String(projectsCount ?? 0), label: "Active Projects" },
          { value: String(teamCount ?? 0), label: "Team Members" },
        ]);

        setCategories(
          (categoryRows ?? []).map((cat) => ({
            id: cat.id,
            title: cat.name,
            subtitle: `${countMap.get(cat.id) ?? 0} products`,
            iconName: cat.icon_name || "category",
            slug: cat.slug,
          })),
        );
      } catch {
        if (!isMounted) return;
        setStatsError(true);
        setCategoriesError(true);
      } finally {
        if (isMounted) {
          setStatsLoading(false);
          setCategoriesLoading(false);
        }
      }
    };

    void init();
    return () => { isMounted = false; };
  }, [router]);

  // ── New arrivals — count + data run in parallel ──
  useEffect(() => {
    let isMounted = true;

    const fetchNewArrivals = async () => {
      setProductsLoading(true);
      setProductsError(false);

      try {
        const since = new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const from = (newProductsPage - 1) * newProductsPageSize;
        const to = from + newProductsPageSize - 1;

        // FIX: count + data in parallel instead of sequential
        const [
          { count, error: countError },
          { data, error: dataError },
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("is_archived", false)
            .gte("created_at", since),
          supabase
            .from("products")
            .select(
              "id, name, product_url, manufacturer:manufacturers(name), created_at",
            )
            .eq("is_archived", false)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .range(from, to),
        ]);

        if (countError) throw countError;
        if (dataError) throw dataError;

        const productRows = data ?? [];
        const productIds = productRows.map((p) => p.id);

        let primaryImageMap = new Map<string, string>();

        if (productIds.length > 0) {
          const { data: imagesData, error: imagesError } = await supabase
            .from("product_images")
            .select("product_id, file_path")
            .in("product_id", productIds)
            .eq("is_primary", true);

          if (imagesError) throw imagesError;

          primaryImageMap = new Map(
            (imagesData ?? []).map((img) => [img.product_id, img.file_path]),
          );
        }

        if (!isMounted) return;

        setNewProductsTotal(count ?? 0);
        setProducts(
          productRows.map((product) => {
            const filePath = primaryImageMap.get(product.id);
            const imageUrl = filePath
              ? supabase.storage
                  .from("product-images")
                  .getPublicUrl(filePath).data.publicUrl
              : null;
            return {
              id: product.id,
              title: product.name,
              subtitle:
                (product.manufacturer as { name?: string } | null)?.name ||
                "Unknown supplier",
              imageUrl,
              productUrl: product.product_url,
            };
          }),
        );
      } catch {
        if (!isMounted) return;
        setProductsError(true);
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    };

    void fetchNewArrivals();
    return () => { isMounted = false; };
  }, [newProductsPage]);

  // ... rest of your JSX unchanged

  const showNewArrivals = useMemo(() => {
    return productsLoading || productsError || products.length > 0;
  }, [products.length, productsError, productsLoading]);

  const filteredCategories = useMemo(() => {
    const needle = categorySearch.trim().toLowerCase();
    if (!needle) {
      return categories;
    }
    return categories.filter((category) =>
      category.title.toLowerCase().includes(needle),
    );
  }, [categories, categorySearch]);

  return (
    <>
      {/* Dashboard Home Content */}
      <main>
        <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Product Catalogue Overview
            </h1>
            <p className="mt-1 text-sm font-medium text-emerald-100/75">
              Manage your product catalogue and projects
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsError ? (
            <div className="text-sm font-medium text-emerald-100/75">
              Could not load data
            </div>
          ) : null}
          {stats.map((stat, idx) => {
            const iconName =
              idx === 0
                ? ("cube" as const)
                : idx === 1
                  ? ("grid" as const)
                  : idx === 2
                    ? ("spark" as const)
                    : ("users" as const);

            return (
              <div
                key={stat.label}
                className="rounded-[18px] bg-white px-5 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-semibold text-emerald-950">
                      {statsLoading ? "Loading..." : stat.value}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-900/10">
                      <Icon name={iconName} className="h-5.5 w-5.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-[22px] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-950">
                Product Categories
              </h2>
              <p className="mt-0.5 text-sm font-medium text-gray-500">
                Browse by category
              </p>
            </div>

            <div className="relative w-full sm:max-w-[280px]">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Icon name="search" className="h-4.5 w-4.5" />
              </span>
              <input
                type="search"
                placeholder="Search categories…"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                className="h-10 w-full rounded-full bg-gray-100 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesLoading ? (
              <div className="text-sm font-medium text-gray-500">
                Loading...
              </div>
            ) : null}
            {categoriesError ? (
              <div className="text-sm font-medium text-gray-500">
                Could not load data
              </div>
            ) : null}
            {filteredCategories.map((cat, idx) => {
              const catIconFile = categoryIconSrc(cat.iconName);
              return (
              <Link
                key={cat.id}
                href={`/dashboard/product-catalogue?category=${encodeURIComponent(cat.slug)}`}
                className="group rounded-[18px] bg-[#ecf4f2] p-5 ring-1 ring-emerald-900/10 transition-colors hover:bg-[#e6f1ef]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-900 ring-1 ring-emerald-900/10">
                      <div className="relative inline-flex h-8 w-8 items-center justify-center">
                        {catIconFile ? (
                          <Image
                            src={catIconFile}
                            alt=""
                            width={32}
                            height={32}
                            unoptimized={catIconFile.endsWith(".svg")}
                            className="h-8 w-8 object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-gray-200" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-emerald-950">
                        {cat.title}
                      </div>
                      <div className="text-xs font-medium text-emerald-950/55">
                        {cat.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="hidden text-xs font-semibold text-emerald-900/45 sm:block">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900/45">
                    View All
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-emerald-900 ring-1 ring-emerald-900/10 transition-transform group-hover:translate-x-0.5">
                    <Icon name="arrowRight" className="h-4.5 w-4.5" />
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </section>

        {showNewArrivals ? (
          <section className="mt-6 rounded-[22px] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emerald-950">
                  New Arrivals
                </h2>
                <p className="mt-0.5 text-sm font-medium text-gray-500">
                  Recently added products
                </p>
              </div>
              <Link
                href="/dashboard/product-catalogue?sort=newest"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700"
              >
                View all products
                <Icon name="arrowRight" className="h-4.5 w-4.5" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {productsLoading ? (
                <div className="text-sm font-medium text-gray-500">
                  Loading...
                </div>
              ) : null}
              {productsError ? (
                <div className="text-sm font-medium text-gray-500">
                  Could not load data
                </div>
              ) : null}
              {products.map((p, idx) => {
                const bg =
                  idx === 0
                    ? "from-amber-200 to-amber-500"
                    : idx === 1
                      ? "from-emerald-100 to-emerald-400"
                      : idx === 2
                        ? "from-slate-200 to-slate-500"
                        : "from-stone-200 to-stone-400";

                return (
                  <article
                    key={p.id}
                    className="rounded-[18px] bg-white ring-1 ring-gray-200/80 shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
                  >
                    <div className="p-4">
                      <div
                        className={[
                          "relative aspect-4/3 w-full overflow-hidden rounded-[14px] bg-linear-to-br",
                          bg,
                        ].join(" ")}
                      >
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200" />
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.35),transparent_50%)]" />
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-950 ring-1 ring-black/5">
                          <span className="h-2 w-2 rounded-full bg-emerald-700" />
                          New
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-emerald-950">
                          {p.title}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-gray-500">
                          {p.subtitle}
                        </p>
                      </div>

                      {p.productUrl ? (
                        <div className="mt-4">
                          <a
                            href={p.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-3 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                          >
                            View details
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold text-gray-500">
                Page {newProductsPage} of {newProductsTotalPages} • {newProductsTotal}{" "}
                product{newProductsTotal === 1 ? "" : "s"} (last 90 days)
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setNewProductsPage((p) => Math.max(1, p - 1))
                  }
                  disabled={newProductsPage <= 1}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-gray-100 px-4 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewProductsPage((p) =>
                      Math.min(newProductsTotalPages, p + 1),
                    )
                  }
                  disabled={newProductsPage >= newProductsTotalPages}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-gray-100 px-4 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
