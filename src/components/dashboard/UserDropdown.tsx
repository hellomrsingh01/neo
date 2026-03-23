"use client";

import { LogOut, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type UserDropdownUser = {
  fullName: string;
  email: string;
  role: string | null;
};

function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function UserDropdown({
  user,
  onLogout,
}: {
  user: UserDropdownUser;
  onLogout?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => {
    const baseItems = [
      {
        key: "profile",
        label: "Profile Settings",
        icon: User,
        onSelect: () => router.push("/profile"),
        danger: false,
      },
    ];

    const adminItems =
      user.role === "admin"
        ? [
            {
              key: "users",
              label: "Users",
              icon: Users,
              onSelect: () => router.push("/users"),
              danger: false,
            },
          ]
        : [];

    const logoutItem = [
      {
        key: "logout",
        label: "Sign out",
        icon: LogOut,
        onSelect: async () => {
          await onLogout?.();
        },
        danger: true,
      },
    ];

    return [...baseItems, ...adminItems, ...logoutItem];
  }, [onLogout, router, user.role]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-left transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="hidden leading-tight sm:block">
          <span className="block text-[12px] font-semibold text-gray-900">
            {user.fullName}
          </span>
          <span className="block text-[10px] font-medium text-gray-500">
            {user.email}
          </span>
        </span>

        <span className="flex items-center gap-1.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 ring-1 ring-black/10 text-[11px] font-semibold text-white"
          aria-hidden="true"
        >
          {getInitials(user.fullName)}
        </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.8 7.5 10 11.7l4.2-4.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-[252px] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/10"
        >
          <div className="px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">
              {user.fullName}
            </div>
            <div className="mt-0.5 text-xs font-medium text-gray-500">
              {user.email}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="py-1">
            {items.map((item) => {
              const Icon = item.icon;
              const base =
                "flex w-full items-center gap-3 px-4 py-2 text-sm font-medium transition-colors";
              const color = item.danger
                ? "text-red-500 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50";

              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={[base, color].join(" ")}
                  onClick={async () => {
                    await item.onSelect();
                    setOpen(false);
                  }}
                >
                  <Icon
                    className={[
                      "h-4 w-4",
                      item.danger ? "text-red-500" : "text-gray-500",
                    ].join(" ")}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

