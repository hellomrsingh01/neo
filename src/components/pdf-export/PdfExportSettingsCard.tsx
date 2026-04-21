"use client";

import { Download, FileText, Printer, Wand2 } from "lucide-react";
import { Toggle } from "./Toggle";

export type PdfExportSettings = {
  templateStyle: "Professional" | "Minimal";
  pageSize: "A4";
  includeLogo: boolean;
  includeImages: boolean;
  includeProjectNotes: boolean;
  includeSectionNotes: boolean;
  includeItemNotes: boolean;
  includeProductUrls: boolean;
};

export function PdfExportSettingsCard({
  settings,
  onChange,
  onGenerate,
  onDownload,
  onPrint,
  activeTab,
  manufacturers,
  supplierName,
  onSupplierNameChange,
  includeRfqSectionNotes,
  onIncludeRfqSectionNotesChange,
  supplierNotes,
  onSupplierNotesChange,
  onSaveSupplierNotes,
  savingSupplierNotes,
  onGenerateSupplier,
  itemsForUrlToggles,
  urlEnabledByItemId,
  onToggleItemUrl,
  rfqSentMap,
}: {
  settings: PdfExportSettings;
  onChange: (patch: Partial<PdfExportSettings>) => void;
  onGenerate?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  activeTab: "supplier" | "client";
  manufacturers: string[];
  supplierName: string;
  onSupplierNameChange: (name: string) => void;
  includeRfqSectionNotes: boolean;
  onIncludeRfqSectionNotesChange: (next: boolean) => void;
  supplierNotes: string;
  onSupplierNotesChange: (next: string) => void;
  onSaveSupplierNotes: () => void;
  savingSupplierNotes: boolean;
  onGenerateSupplier: () => void;
  itemsForUrlToggles: Array<{ id: string; name: string }>;
  urlEnabledByItemId: Record<string, boolean>;
  onToggleItemUrl: (itemId: string, next: boolean) => void;
  rfqSentMap: Record<string, string>;
}) {
  return (
    <aside className="rounded-[18px] bg-white p-5 shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
      <div>
        <div className="text-sm font-semibold text-gray-900">
          Export Settings
        </div>
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
            onChange={(e) =>
              onChange({
                templateStyle:
                  e.target.value === "Minimal" ? "Minimal" : "Professional",
              })
            }
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
            onChange={() => onChange({ pageSize: "A4" })}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-[12px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
          </select>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">
                Include Logo
              </div>
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
              <div className="text-[12px] font-semibold text-gray-900">
                Include Images
              </div>
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

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">
                Include Project Notes
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                Show project-level notes
              </div>
            </div>
            <Toggle
              checked={settings.includeProjectNotes}
              onChange={(v) => onChange({ includeProjectNotes: v })}
              label="Include project notes"
            />
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">
                Include Section Notes
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                Show section-level notes
              </div>
            </div>
            <Toggle
              checked={settings.includeSectionNotes}
              onChange={(v) => onChange({ includeSectionNotes: v })}
              label="Include section notes"
            />
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">
                Include Item Notes
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                Show item notes in details
              </div>
            </div>
            <Toggle
              checked={settings.includeItemNotes}
              onChange={(v) => onChange({ includeItemNotes: v })}
              label="Include item notes"
            />
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-gray-900">
                Include Product URLs
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                Add product links
              </div>
            </div>
            <Toggle
              checked={settings.includeProductUrls}
              onChange={(v) => onChange({ includeProductUrls: v })}
              label="Include product URLs"
            />
          </div>

          {settings.includeProductUrls ? (
            <div className="mt-3 rounded-lg bg-white p-2 ring-1 ring-gray-200/70">
              <div className="text-[11px] font-semibold text-gray-700">
                Per-item URL control
              </div>
              <div className="mt-2 max-h-[160px] overflow-auto space-y-2 pr-1">
                {itemsForUrlToggles.length === 0 ? (
                  <div className="text-[11px] font-medium text-gray-400">
                    No items
                  </div>
                ) : (
                  itemsForUrlToggles.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-gray-700">
                          {it.name}
                        </div>
                      </div>
                      <Toggle
                        checked={urlEnabledByItemId[it.id] !== false}
                        onChange={(v) => onToggleItemUrl(it.id, v)}
                        label={`Toggle URL for ${it.name}`}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {activeTab === "supplier" ? (
          <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200/70">
            <div className="text-[12px] font-semibold text-gray-900">
              Supplier RFQ
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-gray-500">
              Generate a text-only RFQ for a manufacturer
            </div>

            <div className="mt-3 space-y-2">
              <label className="block text-[11px] font-semibold text-gray-700">
                Manufacturer
              </label>
              <select
                value={supplierName}
                onChange={(e) => onSupplierNameChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                {manufacturers.length === 0 ? (
                  <option value="">No manufacturers</option>
                ) : (
                  manufacturers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold text-gray-900">
                  Include Section Notes
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                  Show section notes in RFQ
                </div>
              </div>
              <Toggle
                checked={includeRfqSectionNotes}
                onChange={onIncludeRfqSectionNotesChange}
                label="Include RFQ section notes"
              />
            </div>

            <div className="mt-3 space-y-2">
              <label className="block text-[11px] font-semibold text-gray-700">
                Supplier notes
              </label>
              <textarea
                value={supplierNotes}
                onChange={(e) => onSupplierNotesChange(e.target.value)}
                placeholder="Add supplier notes..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                rows={4}
              />
              <button
                type="button"
                onClick={onSaveSupplierNotes}
                disabled={savingSupplierNotes || !supplierName}
                className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {savingSupplierNotes ? "Saving..." : "Save Supplier Notes"}
              </button>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={onGenerateSupplier}
                disabled={!supplierName}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25 disabled:opacity-50"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Generate RFQ PDF
              </button>

              {/* RFQ sent badge */}
              {supplierName && rfqSentMap[supplierName] && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  RFQ sent{" "}
                  {new Date(rfqSentMap[supplierName]).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

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
          <span className="font-semibold text-gray-500">Note:</span> PDF
          generation may take a few moments depending on the number of products
          and selected options.
        </div>
      </div>
    </aside>
  );
}
