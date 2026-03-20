"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";

export type TableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function UserRow({
  user,
  index,
  onEdit,
  onDelete,
}: {
  user: TableUser;
  index: number;
  onEdit?: (user: TableUser) => void;
  onDelete?: (user: TableUser) => void;
}) {
  const initials = getInitials(user.name);
  const zebra = index % 2 === 0 ? "bg-white" : "bg-gray-50";

  return (
    <tr
      className={[
        zebra,
        "border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-100/70",
      ].join(" ")}
    >
      <td className="py-3.5 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-[10px] font-semibold text-gray-600">
                {initials}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900">{user.name}</span>
        </div>
      </td>
      <td className="py-3.5 pr-4 text-sm font-medium text-gray-500">
        {user.email}
      </td>
      <td className="py-3.5 pr-4 text-sm font-medium text-gray-700">
        {user.role}
      </td>
      <td className="py-3.5 pr-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(user)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
            aria-label={`Edit ${user.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(user)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25"
            aria-label={`Delete ${user.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
