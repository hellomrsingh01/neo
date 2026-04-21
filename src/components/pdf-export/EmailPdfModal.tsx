"use client";

import { X } from "lucide-react";
import { useMemo } from "react";

export function EmailPdfModal({
  open,
  onClose,
  to,
  cc,
  subject,
  body,
  onToChange,
  onCcChange,
  onSubjectChange,
  onBodyChange,
  onSend,
  sending,
  error,
  success,
}: {
  open: boolean;
  onClose: () => void;
  to: string;
  cc: string;
  subject: string;
  body: string;
  onToChange: (next: string) => void;
  onCcChange: (next: string) => void;
  onSubjectChange: (next: string) => void;
  onBodyChange: (next: string) => void;
  onSend: (payload: { to: string; cc: string; subject: string; body: string }) => void;
  sending: boolean;
  error: string | null;
  success: boolean;
}) {
  const canSend = useMemo(() => Boolean(to.trim()) && Boolean(subject.trim()) && !sending, [sending, subject, to]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[720px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Email PDF</div>
            <div className="mt-0.5 text-[11px] font-medium text-gray-500">
              Send the generated PDF as an attachment
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700">To</label>
              <input
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700">CC</label>
              <input
                value={cc}
                onChange={(e) => onCcChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700">Subject</label>
            <input
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700">Message</label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={7}
            />
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Sent successfully.
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => onSend({ to, cc, subject, body })}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

