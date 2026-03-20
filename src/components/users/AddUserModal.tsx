"use client";

import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type AddUserFormData = {
  email: string;
  name: string;
  password: string;
  role: string;
};

const ROLE_OPTIONS = [
  { value: "", label: "Enter Role" },
  { value: "Admin", label: "Admin" },
  { value: "Designer", label: "Designer" },
  { value: "Developer", label: "Developer" },
  { value: "Manager", label: "Manager" },
];

const initialForm: AddUserFormData = {
  email: "",
  name: "",
  password: "",
  role: "",
};

export function AddUserModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: AddUserFormData) => void;
}) {
  const [form, setForm] = useState<AddUserFormData>(initialForm);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const resetAndClose = useCallback(() => {
    setForm(initialForm);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    // Outside click + Escape-to-close intentionally disabled per design.
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.(form);
      setForm(initialForm);
      onClose();
    },
    [form, onSubmit, onClose]
  );

  if (!open) return null;

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-[420px] rounded-xl bg-white shadow-xl ring-1 ring-black/10"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-900"
          >
            Add User
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="add-user-email"
                className="block text-sm font-semibold text-gray-900"
              >
                Add Email
              </label>
              <input
                ref={firstInputRef}
                id="add-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Enter Email Address"
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="add-user-name"
                className="block text-sm font-semibold text-gray-900"
              >
                Name
              </label>
              <input
                id="add-user-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter Name"
                className={inputClass}
                autoComplete="name"
              />
            </div>
            <div>
              <label
                htmlFor="add-user-password"
                className="block text-sm font-semibold text-gray-900"
              >
                Password
              </label>
              <input
                id="add-user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter Password"
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label
                htmlFor="add-user-role"
                className="block text-sm font-semibold text-gray-900"
              >
                Role
              </label>
              <div className="relative mt-1.5">
                <select
                  id="add-user-role"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className={inputClass + " appearance-none pr-10"}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value || "placeholder"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetAndClose}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-700 bg-white px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
