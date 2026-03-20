"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

export function UsersToolbar({
  onFilters,
  onAddUser,
}: {
  onFilters?: () => void;
  onAddUser?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-[32px] font-semibold leading-tight text-white">
        Users
      </h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onFilters}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
        </button>
        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add New User
        </button>
      </div>
    </div>
  );
}
