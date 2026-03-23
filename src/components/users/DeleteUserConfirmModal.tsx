"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId } from "react";

export function DeleteUserConfirmModal({
  open,
  userName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  userName: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const titleId = useId();

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div className="relative w-full max-w-[420px] rounded-xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Delete User
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-gray-900">
            Are you sure you want to delete {userName}?
          </p>

          <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-700 bg-white px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
