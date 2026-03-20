"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SIT_CATEGORIES } from "@/lib/sitCategories";
import { UserDropdown } from "@/components/dashboard/UserDropdown";

type NavItem = {
  id: "sit" | "work" | "meet" | "store" | "divide" | "connect";
  label: string;
  active?: boolean;
  icon: string;
  popup?: {
    kind: "sit" | "placeholder";
  };
};

// Header Nav Data
const navItems: NavItem[] = [
  { id: "sit", label: "Sit", icon: "/Sit.png", popup: { kind: "sit" } },
  { id: "work", label: "Work", icon: "/Work.png", active: true, popup: { kind: "placeholder" } },
  { id: "meet", label: "Meet", icon: "/Meet.png", popup: { kind: "placeholder" } },
  { id: "store", label: "Store", icon: "/Store.png", popup: { kind: "placeholder" } },
  { id: "divide", label: "Divide", icon: "/Divide.png", popup: { kind: "placeholder" } },
  { id: "connect", label: "Connect", icon: "/Connect.png", popup: { kind: "placeholder" } },
];

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
  // Active Mega Menu State
  const [activeMenu, setActiveMenu] = useState<NavItem["id"] | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; width: number } | null>(
    null,
  );

  const user = useMemo(
    () => ({
      fullName: "Sandra Johnson",
      email: "sarah@neooffice.com",
    }),
    [],
  );

  const logout = async () => {
    // Placeholder logout: replace with Supabase/Auth when wired
    console.log("logout");
  };

  const navWrapRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const sitMenuItems = useMemo(
    () =>
      SIT_CATEGORIES.map((c) => ({
        label: c.label,
        // Header Category Navigation
        href: `/dashboard/sit?category=${c.slug}`,
        emphasis: c.slug === "office-task-chairs",
      })),
    [],
  );

  useEffect(() => {
    if (!activeMenu) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const wrap = navWrapRef.current;
      const btn = triggerRefs.current[activeMenu];
      if (!wrap || !btn) return;

      const wrapRect = wrap.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const left = Math.round(btnRect.left - wrapRect.left);
      const width = Math.round(btnRect.width);
      setMenuPosition({ left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activeMenu]);

  useEffect(() => {
    if (!activeMenu) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const wrap = navWrapRef.current;
      const popup = popupRef.current;
      if (wrap?.contains(target)) return;
      if (popup?.contains(target)) return;
      setActiveMenu(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [activeMenu]);

  return (
    // Shared Dashboard Header
    <header className="w-full bg-[#F3F4F4] text-gray-900 border-b border-black/10">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="cursor-pointer transition-opacity hover:opacity-90"
                aria-label="Go to dashboard"
              >
                <Image
                  src="/logo2.png"
                  alt="Neo Office"
                  width={145}
                  height={40}
                  priority
                  className="h-[22px] w-auto object-contain"
                />
              </Link>
            </div>
          </div>

          <div className="relative hidden md:block" ref={navWrapRef}>
            <nav className="flex items-center justify-center gap-2">
              {navItems.map((item) => {
                const isOpen = activeMenu === item.id;
                // Nav Trigger Button
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      triggerRefs.current[item.id] = el;
                    }}
                    type="button"
                    onClick={() => {
                      if (!item.popup) return;
                      setActiveMenu((prev) => (prev === item.id ? null : item.id));
                    }}
                    className={[
                      "inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25",
                      isOpen
                        ? "border-emerald-900 bg-emerald-900 text-white"
                        : "border-gray-300/80 bg-white text-gray-700 hover:bg-gray-50",
                      !isOpen && item.active ? "text-gray-900 bg-gray-100/70" : "",
                    ].join(" ")}
                    aria-haspopup={item.popup ? "dialog" : undefined}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={[
                        "inline-flex h-5 w-5 items-center justify-center rounded-md ring-1",
                        isOpen
                          ? "bg-white/15 ring-white/15"
                          : "bg-emerald-900/10 ring-emerald-900/10",
                      ].join(" ")}
                    >
                      <Image
                        src={item.icon}
                        alt=""
                        width={14}
                        height={14}
                        className="h-[14px] w-[14px] object-contain"
                      />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mega Menu Popup */}
            {activeMenu && menuPosition ? (
              <div
                ref={popupRef}
                role="dialog"
                aria-label="Navigation menu"
                className="absolute left-0 top-[calc(100%+10px)] z-50"
                style={{
                  transform: `translateX(${menuPosition.left}px)`,
                }}
              >
                <div className="min-w-[520px] rounded-[16px] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.16)] ring-1 ring-black/10">
                  {activeMenu === "sit" ? (
                    // Sit Menu Content
                    <div className="grid grid-cols-3 gap-x-10 gap-y-2.5">
                      {sitMenuItems.map((m) => (
                        <Link
                          key={m.label}
                          href={m.href}
                          onClick={() => setActiveMenu(null)}
                          className={[
                            "text-left text-[12px] font-medium transition-colors",
                            m.emphasis
                              ? "text-emerald-950"
                              : "text-gray-500 hover:text-gray-700",
                          ].join(" ")}
                        >
                          {m.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    // Placeholder Menu Content
                    <div className="py-6 text-center text-xs font-semibold text-gray-400">
                      Coming soon
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2.5">
            <div className="relative hidden w-full max-w-[320px] sm:block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <HeaderIcon name="search" className="h-4 w-4" />
              </span>
              <input
                type="search"
                placeholder="Search products..."
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

