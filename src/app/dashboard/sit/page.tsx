import Image from "next/image";
import Link from "next/link";

import {
  SIT_CATEGORIES,
  SIT_PRODUCTS,
  type SitCategorySlug,
  type SitProduct,
} from "@/lib/sitCategories";

function Icon({
  name,
  className,
}: {
  name: "search" | "heart" | "grid" | "list" | "filter" | "star";
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

  if (name === "heart") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 21s-7-4.6-9.2-8.9C1.2 9.1 3 6.2 6.3 6c1.9-.1 3.2.8 3.9 1.8.7-1 2-1.9 3.9-1.8 3.3.2 5.1 3.1 3.5 6.1C19 16.4 12 21 12 21Z"
          className={common}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
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

  if (name === "list") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 6h13M8 12h13M8 18h13"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"
          className={common}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "filter") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6h16M7 12h10M10 18h4"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M8.5 6v0M16 12v0M12 18v0"
          className={common}
          strokeWidth="3.2"
          strokeLinecap="round"
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
        d="m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9L12 3.5Z"
        className="fill-current"
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const empty = Math.max(0, 5 - full);

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: full }).map((_, idx) => (
        <Icon key={`f-${idx}`} name="star" className="h-3.5 w-3.5 text-amber-500" />
      ))}
      {Array.from({ length: empty }).map((_, idx) => (
        <Icon key={`e-${idx}`} name="star" className="h-3.5 w-3.5 text-gray-300" />
      ))}
    </div>
  );
}

function isSitSlug(value: string): value is SitCategorySlug {
  return SIT_CATEGORIES.some((c) => c.slug === value);
}

export default async function SitCatalogPage({
  searchParams,
}: {
  // Selected Category From Query Param
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected =
    typeof category === "string" && isSitSlug(category)
      ? (category satisfies SitCategorySlug)
      : ("office-task-chairs" satisfies SitCategorySlug);

  const activeCategory = selected;
  const activeCategoryLabel =
    SIT_CATEGORIES.find((c) => c.slug === activeCategory)?.label ??
    "Office / Task Chairs";

  // Filtered Product Grid
  const products = SIT_PRODUCTS[activeCategory] as SitProduct[];

  return (
    <main className="mt-6 w-full">
      <div className="mb-3 text-xs font-semibold text-emerald-100/70">
        Project Board &gt; {activeCategoryLabel}
      </div>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {activeCategoryLabel}
          </h1>
          <p className="mt-1 text-sm font-medium text-emerald-100/75">
            Browse and add chairs to your project • {products.length} products available
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-full bg-white/10 px-4 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
          >
            2 in project
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 hover:bg-emerald-800"
          >
            View Project
          </button>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[14px] bg-white text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        {/* In-Page Category Tabs */}
        <div className="flex gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SIT_CATEGORIES.map((cat) => {
            const active = cat.slug === activeCategory;
            return (
              <Link
                key={cat.slug}
                href={`/dashboard/sit?category=${cat.slug}`}
                className={[
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition-colors",
                  active
                    ? "bg-emerald-900 text-white ring-emerald-900/20"
                    : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200">
              Selected: 2
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200">
              In Project: 2
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="relative w-full max-w-[320px]">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Icon name="search" className="h-4 w-4" />
              </span>
              <input
                type="search"
                placeholder="Search chairs..."
                className="h-9 w-full rounded-full bg-gray-100 pl-9 pr-3 text-xs font-semibold text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
            </div>

            <div className="inline-flex items-center rounded-full bg-gray-100 p-1 ring-1 ring-gray-200">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-900 ring-1 ring-black/5"
                aria-label="Grid view"
              >
                <Icon name="grid" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
                aria-label="List view"
              >
                <Icon name="list" className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <Icon name="filter" className="h-4 w-4 text-gray-600" />
              Filters
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[18px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article
              key={p.id}
              className="rounded-[18px] bg-white ring-1 ring-gray-200/80 shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
            >
              <div className="p-4">
                <div className="relative overflow-hidden rounded-[14px] bg-[#eef3f2] ring-1 ring-black/5">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={p.imageSrc}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Add to wishlist"
                    className={[
                      "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white",
                      p.isWishlisted ? "text-rose-600" : "",
                    ].join(" ")}
                  >
                    <Icon
                      name="heart"
                      className={[
                        "h-4.5 w-4.5",
                        p.isWishlisted ? "fill-rose-600/15" : "",
                      ].join(" ")}
                    />
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-emerald-950">{p.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {p.manufacturer}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {p.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stars rating={p.rating} />
                      <span className="text-[11px] font-semibold text-gray-400">
                        {p.reviews ? `${p.reviews}` : ""}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-emerald-950">
                      {p.price}
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      className={[
                        "inline-flex h-9 w-full items-center justify-center rounded-full px-3 text-[11px] font-semibold ring-1 transition-colors",
                        p.inProject
                          ? "bg-gray-100 text-gray-700 ring-gray-200"
                          : "bg-emerald-900 text-white ring-emerald-900/20 hover:bg-emerald-800",
                      ].join(" ")}
                    >
                      {p.inProject ? "✓ Added to Project" : "+ Add to Project"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-semibold text-gray-500">
            Showing 3 of 8 products
          </div>
          <div className="flex items-center justify-end gap-2">
            {[1, 2, 3, 4].map((page) => {
              const active = page === 1;
              return (
                <button
                  key={page}
                  type="button"
                  className={[
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-[11px] font-semibold ring-1 transition-colors",
                    active
                      ? "bg-emerald-900 text-white ring-emerald-900/20"
                      : "bg-gray-100 text-gray-700 ring-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

