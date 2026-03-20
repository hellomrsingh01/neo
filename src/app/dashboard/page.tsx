import Image from "next/image";

type Stat = {
  value: string;
  label: string;
  change?: string;
};

type Category = {
  title: string;
  subtitle: string;
  icon: string;
};

type Product = {
  title: string;
  subtitle: string;
  image: string;
};

const stats: Stat[] = [
  { value: "585", label: "Total Products", change: "+10%" },
  { value: "8", label: "Categories", change: "+5%" },
  { value: "23", label: "Active Projects", change: "+8%" },
  { value: "12", label: "Team Members", change: "+6%" },
];

const categories: Category[] = [
  { title: "Sit", subtitle: "Office / Task Chairs", icon: "/Sit.png" },
  { title: "Work", subtitle: "Desks + Benches", icon: "/Work.png" },
  { title: "Meet", subtitle: "Boardroom Tables", icon: "/Meet.png" },
  { title: "Store", subtitle: "Lockers", icon: "/Store.png" },
  { title: "Divide", subtitle: "Screens", icon: "/Divide.png" },
  { title: "Connect", subtitle: "Monitor Arms", icon: "/Connect.png" },
];

const products: Product[] = [
  {
    title: "Gesture Chair",
    subtitle: "Ergonomic Premium Chairs",
    image: "/Rectangle 11.png",
  },
  {
    title: "Migration SE Desk",
    subtitle: "Height Adjustable",
    image: "/Rectangle 12.png",
  },
  {
    title: "Orangebox Booth",
    subtitle: "Acoustic Privacy",
    image: "/Rectangle 13.png",
  },
  {
    title: "Flex Mobile Power",
    subtitle: "Wireless Charging",
    image: "/Rectangle 14.png",
  },
];

function Icon({
  name,
  className,
}: {
  name:
    | "spark"
    | "cube"
    | "grid"
    | "users"
    | "search"
    | "plus"
    | "arrowRight";
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
  return (
    <>
      {/* Dashboard Home Content */}
      <main className="mt-7">
        <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Product Catalogue Overview
            </h1>
            <p className="mt-1 text-sm font-medium text-emerald-100/75">
              Manage your product catalogue and projects
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
              <Icon name="plus" className="h-4 w-4 text-white" />
            </span>
            Request New Product
          </button>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      {stat.value}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-900/10">
                      <Icon name={iconName} className="h-5.5 w-5.5" />
                    </div>
                    {stat.change ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        {stat.change}
                      </span>
                    ) : null}
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
                className="h-10 w-full rounded-full bg-gray-100 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <div
                key={cat.title}
                className="group rounded-[18px] bg-[#ecf4f2] p-5 ring-1 ring-emerald-900/10 transition-colors hover:bg-[#e6f1ef]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-900 ring-1 ring-emerald-900/10">
                      <Image
                        src={cat.icon}
                        alt={`${cat.title} icon`}
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] object-contain"
                      />
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
              </div>
            ))}
          </div>
        </section>

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
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700"
            >
              View all products
              <Icon name="arrowRight" className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  key={p.title}
                  className="rounded-[18px] bg-white ring-1 ring-gray-200/80 shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
                >
                  <div className="p-4">
                    <div
                      className={[
                        "relative aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-gradient-to-br",
                        bg,
                      ].join(" ")}
                    >
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
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

                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-3 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

