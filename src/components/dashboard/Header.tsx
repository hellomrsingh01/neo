"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserDropdown } from "@/components/dashboard/UserDropdown";
import { supabase } from "@/lib/supabaseClient";
import { usePathname, useRouter } from "next/navigation";

type HeaderUser = {
  fullName: string;
  email: string;
  role: string | null;
};

type NavTabProps = {
  label: string;
  href: string;
  isActive: boolean;
  iconSrc?: string;
};

function NavTab({ label, href, isActive, iconSrc }: NavTabProps) {
  const isDashboardIcon = iconSrc === "/dashboard.svg";
  const navIconFilterClass = iconSrc
    ? isActive
      ? // Dark-green assets → white on emerald bar; white dashboard asset stays white
        "brightness-0 invert"
      : isDashboardIcon
        ? // White house icon → dark glyph on light gray tabs
          "brightness-0"
        : // catalogue / project board:already #02341E on gray
          ""
    : "";

  return (
    <Link
      href={href}
      className={[
        "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-[13px] font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25",
        isActive
          ? "border-emerald-900 bg-emerald-900 text-white shadow-sm"
          : "border-gray-300/80 bg-gray-100 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
    >
      {iconSrc ? (
        <span className="inline-flex items-center gap-1.5">
          <Image
            src={iconSrc}
            alt=""
            width={18}
            height={18}
            unoptimized
            className={[
              "h-[15px] w-[15px] shrink-0 object-contain transition-[filter]",
              navIconFilterClass,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          />
          <span>{label}</span>
        </span>
      ) : (
        label
      )}
    </Link>
  );
}

function HeaderIcon({
  name,
  className,
}: {
  name: "search" | "bell" | "settings";
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

  if (name === "bell") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 22a2.5 2.5 0 0 0 2.3-1.6"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M18 8.6c0-3.2-2.7-5.8-6-5.8S6 5.4 6 8.6c0 6-2 6.6-2 6.6h16s-2-.6-2-6.6Z"
          className={common}
          strokeWidth="1.8"
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
        d="M12 15.8a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z"
        className={common}
        strokeWidth="1.8"
      />
      <path
        d="M19.4 13.5a8.6 8.6 0 0 0 .1-1.5 8.6 8.6 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a8.5 8.5 0 0 0-2.6-1.5l-.4-2.6H10l-.4 2.6a8.5 8.5 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a8.6 8.6 0 0 0-.1 1.5c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.5 8.5 0 0 0 2.6 1.5l.4 2.6h4l.4-2.6a8.5 8.5 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"
        className={common}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const [user, setUser] = useState<HeaderUser>({
    fullName: "Your name",
    email: "you@neooffice.com",
    role: null,
  });
  const [headerSearch, setHeaderSearch] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const loadHeaderUser = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user;
        if (!authUser?.id || cancelled) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", authUser.id)
          .maybeSingle<{
            full_name: string | null;
            email: string | null;
            role: string | null;
          }>();

        if (cancelled) return;

        setUser({
          fullName: (profile?.full_name ?? "").trim() || "Your name",
          email: profile?.email ?? authUser.email ?? "you@neooffice.com",
          role: profile?.role ?? null,
        });
      } catch {
        // Keep defaults on failure
      }
    };

    loadHeaderUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const isDashboardActive = pathname === "/dashboard";
  const isProductCatalogueActive = pathname.startsWith(
    "/dashboard/product-catalogue",
  );
  const isProjectBoardActive =
    pathname.startsWith("/dashboard/project-board");
  const isAdminCategoriesActive = pathname.startsWith("/admin/categories");
  const isExternalBoardsActive = pathname.startsWith(
    "/dashboard/external-boards",
  );
  const isAdminManufacturersActive = pathname.startsWith(
    "/admin/manufacturers",
  );
  const isAdminProductsActive = pathname.startsWith("/admin/products");

  return (
    // Shared Dashboard Header
    <header className="sticky top-0 z-50 w-full bg-[#F3F4F4] text-gray-900 border-b border-black/10">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="cursor-pointer transition-opacity hover:opacity-90"
              aria-label="Go to dashboard"
            >
              <Image
                src="/logo.svg"
                alt="Neo Office"
                width={145}
                height={40}
                priority
                unoptimized
                className="h-[22px] w-auto object-contain"
              />
            </Link>
          </div>

          <div className="relative hidden md:block">
            <nav className="flex items-center justify-center gap-2">
              <NavTab
                label="Dashboard"
                href="/dashboard"
                isActive={isDashboardActive}
                iconSrc="/dashboard.svg"
              />
              <NavTab
                label="Product Catalogue"
                href="/dashboard/product-catalogue"
                isActive={isProductCatalogueActive}
                iconSrc="/catalogue.svg"
              />
              <NavTab
                label="Project Board"
                href="/dashboard/project-board"
                isActive={isProjectBoardActive}
                iconSrc="/Project Board.svg"
              />
              {user.role === "admin" || user.role === "internal" ? (
                <NavTab
                  label="External Boards"
                  href="/dashboard/external-boards"
                  isActive={isExternalBoardsActive}
                />
              ) : null}
              {user.role === "admin" ? (
                <>
                  <NavTab
                    label="Categories"
                    href="/admin/categories"
                    isActive={isAdminCategoriesActive}
                  />
                  <NavTab
                    label="Manufacturers"
                    href="/admin/manufacturers"
                    isActive={isAdminManufacturersActive}
                  />
                  <NavTab
                    label="Products"
                    href="/admin/products"
                    isActive={isAdminProductsActive}
                  />
                </>
              ) : null}
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2.5">
            <div className="relative hidden w-full max-w-[320px] sm:block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <HeaderIcon name="search" className="h-4 w-4" />
              </span>
              <input
                type="search"
                placeholder="Search products..."
                value={headerSearch}
                onChange={(event) => setHeaderSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const term = headerSearch.trim();
                  const destination = term
                    ? `/dashboard/product-catalogue?search=${encodeURIComponent(term)}`
                    : "/dashboard/product-catalogue";
                  router.push(destination);
                }}
                className="h-8.5 w-full rounded-full bg-white pl-9 pr-3 text-xs font-medium text-gray-900 placeholder:text-gray-400/90 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
              />
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: "Settings", icon: "settings" as const },
                { label: "Notifications", icon: "bell" as const },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 ring-1 ring-gray-300/80 transition-colors hover:bg-gray-50"
                  aria-label={action.label}
                >
                  <HeaderIcon name={action.icon} className="h-4.5 w-4.5" />
                  {action.icon === "bell" ? (
                    <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-red-500" />
                  ) : null}
                </button>
              ))}

              <div className="ml-1 flex items-center">
                <UserDropdown user={user} onLogout={logout} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
