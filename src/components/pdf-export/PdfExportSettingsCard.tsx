"use client";

import { Download, FileText, Printer, Wand2 } from "lucide-react";
import { Toggle } from "./Toggle";

export type PdfExportSettings = {
  templateStyle: "Professional" | "Minimal";
  pageSize: "A4";
  includeLogo: boolean;
  includeImages: boolean;
};

export function PdfExportSettingsCard({
  settings,
  onChange,
  onGenerate,
  onDownload,
  onPrint,
}: {
  settings: PdfExportSettings;
  onChange: (patch: Partial<PdfExportSettings>) => void;
  onGenerate?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}) {
  return (
    <aside className="rounded-[18px] bg-white p-5 shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
      <div>
        <div className="text-sm font-semibold text-gray-900">Export Settings</div>
        <div className="mt-0.5 text-[11px] font-medium text-gray-500">
          Customize your PDF output
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-gray-700">
            Template Style
          </label>
          <select
            value={settings.templateStyle}
            onChange={(e) => onChange({ templateStyle: e.target.value as any })}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-[12px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          >
            <option value="Professional">Professional</option>
            <option value="Minimal">Minimal</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-gray-700">
            Page Size
          </label>
          <select
            value={settings.pageSize}
            onChange={(e) => onChange({ pageSize: e.target.value as any })}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-[12px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
          </select>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">Include Logo</div>
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                Show company branding
              </div>
            </div>
            <Toggle
              checked={settings.includeLogo}
              onChange={(v) => onChange({ includeLogo: v })}
              label="Include logo"
            />
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">Include Images</div>
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                Show product photos
              </div>
            </div>
            <Toggle
              checked={settings.includeImages}
              onChange={(v) => onChange({ includeImages: v })}
              label="Include images"
            />
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <Wand2 className="h-4 w-4" aria-hidden />
            Generate PDF
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </button>
        </div>

        <div className="pt-1 text-[10px] font-medium leading-snug text-gray-400">
          <span className="font-semibold text-gray-500">Note:</span> PDF generation may take a few moments depending on the number of products and selected options.
        </div>
      </div>
    </aside>
  );
}

