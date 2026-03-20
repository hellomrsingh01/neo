import Image from "next/image";
import Link from "next/link";

type Category = {
  id: string;
  label: string;
};

type Supplier = {
  id: string;
  label: string;
};

type Tag = {
  id: string;
  label: string;
};

type Product = {
  id: string;
  name: string;
  subtext: string;
  description: string;
  image: string;
  isWishlisted?: boolean;
};

const categories: Category[] = [
  { id: "chairs", label: "Chair" },
  { id: "desk", label: "Desk" },
  { id: "table", label: "Table" },
  { id: "stool", label: "Stool" },
  { id: "storage", label: "Storage" },
];

const suppliers: Supplier[] = [
  { id: "steelcase", label: "Steelcase" },
  { id: "orangebox", label: "Orangebox" },
  { id: "hni", label: "HNI" },
  { id: "northern", label: "Northern" },
];

const tags: Tag[] = [
  { id: "chairs", label: "Chairs" },
  { id: "desks", label: "Desks" },
  { id: "tables", label: "Tables" },
  { id: "ergonomic", label: "Ergonomic" },
  { id: "meeting", label: "Meeting Room" },
  { id: "storage", label: "Storage" },
];

const productImage = "/Rectangle 11.png";

const products: Product[] = Array.from({ length: 9 }).map((_, idx) => ({
  id: `p-${idx + 1}`,
  name: "Product Name",
  subtext: idx % 3 === 0 ? "Manufacturer underneath" : "Office / Task Chairs",
  description:
    "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin eu accumsan dictum. A sit porttitor blandit ipsum in quis egestas tortor.",
  image: productImage,
  isWishlisted: idx % 2 === 0,
}));

function Icon({
  name,
  className,
}: {
  name:
    | "search"
    | "plus"
    | "heart"
    | "sliders"
    | "grid"
    | "list"
    | "chevronDown"
    | "chevronLeft"
    | "chevronRight";
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

  if (name === "sliders") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6h9M17 6h3M10 6v0"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 12h3M11 12h9M7 12v0"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 18h13M21 18h-3M16 18v0"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="10" cy="6" r="2.1" className={common} strokeWidth="1.6" />
        <circle cx="7" cy="12" r="2.1" className={common} strokeWidth="1.6" />
        <circle cx="16" cy="18" r="2.1" className={common} strokeWidth="1.6" />
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

  if (name === "chevronDown") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.5 9.5 12 15l5.5-5.5"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "chevronLeft") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.5 6.5 9 12l5.5 5.5"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
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
        d="M9.5 6.5 15 12l-5.5 5.5"
        className={common}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductCataloguePage() {
  const totalProducts = 3;
  const availableProducts = products.length;

  return (
    <>
      {/* Product Catalogue Content */}
      <main className="mt-6">
        <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Product Catalogue
            </h1>
            <p className="mt-1 text-sm font-medium text-emerald-100/75">
              {totalProducts} products available
            </p>
          </div>
          <Link
            href="/dashboard/add-product"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
              <Icon name="plus" className="h-4 w-4 text-white" />
            </span>
            Add New Product
          </Link>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          {/* FiltersSidebar (future refactor) */}
          <aside className="h-fit rounded-[18px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-900/10">
                  <Icon name="sliders" className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-emerald-950">
                    Filters
                  </div>
                  <div className="text-xs font-semibold text-gray-500">
                    Refine results
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-700"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[14px] bg-[#f3f6f5] p-3 ring-1 ring-emerald-900/10">
                <div className="text-xs font-semibold text-emerald-950">
                  Category
                </div>
                <div className="mt-2 space-y-2">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[14px] bg-[#f3f6f5] p-3 ring-1 ring-emerald-900/10">
                <div className="text-xs font-semibold text-emerald-950">
                  Supplier
                </div>
                <div className="mt-2 space-y-2">
                  {suppliers.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[14px] bg-[#f3f6f5] p-3 ring-1 ring-emerald-900/10">
                <div className="text-xs font-semibold text-emerald-950">
                  Tags
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <label
                      key={t.id}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          <section className="rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
            {/* CatalogueToolbar (future refactor) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[520px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <Icon name="search" className="h-4.5 w-4.5" />
                </span>
                <input
                  type="search"
                  placeholder="Search products by name or manufacturer..."
                  className="h-10 w-full rounded-full bg-gray-100 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <div className="inline-flex items-center rounded-full bg-gray-100 p-1 ring-1 ring-gray-200">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-900 shadow-sm ring-1 ring-black/5"
                    aria-label="Grid view"
                  >
                    <Icon name="grid" className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
                    aria-label="List view"
                  >
                    <Icon name="list" className="h-4.5 w-4.5" />
                  </button>
                </div>

                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-gray-100 px-3.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                  aria-label="Sort"
                >
                  Sort Product on A - Z
                  <Icon name="chevronDown" className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ProductGrid (future refactor) */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="rounded-[18px] bg-white ring-1 ring-gray-200/80 shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
                >
                  <div className="p-4">
                    <div className="relative overflow-hidden rounded-[14px] bg-[#eef3f2] ring-1 ring-black/5">
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>

                      <button
                        type="button"
                        className={[
                          "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white",
                          p.isWishlisted ? "text-rose-600" : "",
                        ].join(" ")}
                        aria-label="Add to wishlist"
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
                      <h3 className="text-sm font-semibold text-emerald-950">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {p.subtext}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination (future refactor) */}
            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold text-gray-500">
                Showing 1-{Math.min(availableProducts, 9)} of {availableProducts}{" "}
                results
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  <Icon name="chevronLeft" className="h-4.5 w-4.5" />
                </button>

                {[1, 2, 3, 4].map((page) => {
                  const active = page === 2;
                  return (
                    <button
                      key={page}
                      type="button"
                      className={[
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-semibold ring-1 transition-colors",
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

                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                  aria-label="Next page"
                >
                  <Icon name="chevronRight" className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

