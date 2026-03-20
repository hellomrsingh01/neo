"use client";

import { UserRow, type TableUser } from "./UserRow";

export function UsersTable({
  users,
  showingCount,
  totalUnits,
  onEdit,
  onDelete,
}: {
  users: TableUser[];
  showingCount?: number;
  totalUnits?: number;
  onEdit?: (user: TableUser) => void;
  onDelete?: (user: TableUser) => void;
}) {
  const count = users.length;
  const showing = showingCount ?? count;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="bg-gray-200/70">
              <th className="py-3.5 pl-6 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Name
              </th>
              <th className="py-3.5 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Email
              </th>
              <th className="py-3.5 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Role
              </th>
              <th className="py-3.5 pr-6 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Others
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <UserRow
                key={user.id}
                user={user}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-gray-500">
          Showing {showing} of {count} items
        </p>
        <p className="text-xs font-medium text-gray-500">
          Total Units: <span className="font-semibold text-gray-700">{totalUnits ?? 28}</span>
        </p>
      </div>
    </div>
  );
}
