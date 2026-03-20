"use client";

export type ProfileUser = {
  fullName?: string | null;
  email?: string | null;
};

export function ProfileHeaderCard({
  user,
  isEditing,
  onToggleEdit,
}: {
  user: ProfileUser;
  isEditing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 pt-1">
        <div className="truncate text-sm font-semibold text-gray-900">
          {user.fullName || "Your name"}
        </div>
        <div className="mt-0.5 truncate text-xs font-medium text-gray-500">
          {user.email || "you@neooffice.com"}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleEdit}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-900 px-6 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/35"
      >
        {isEditing ? "Save" : "Edit"}
      </button>
    </div>
  );
}

