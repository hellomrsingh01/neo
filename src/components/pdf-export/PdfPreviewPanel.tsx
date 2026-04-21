"use client";

import {
  Mail,
  Printer,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PDFViewer } from "@react-pdf/renderer";
import { useMemo, useState } from "react";

export type PreviewTab = "supplier" | "client";

function ToolbarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function PdfPreviewPanel({
  activeTab,
  onTabChange,
  document,
  onRegenerate,
  onPrint,
  showEmail,
  onEmail,
}: {
  activeTab: PreviewTab;
  onTabChange?: (tab: PreviewTab) => void;
  document: React.ReactElement;
  onRegenerate?: () => void;
  onPrint?: () => void;
  showEmail?: boolean;
  onEmail?: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }, []);

  return (
    <section className="rounded-[18px] bg-white shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-900/10 text-emerald-900 ring-1 ring-emerald-900/10">
            <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3h9l3 3v15H6V3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M15 3v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          Preview
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 text-[10px] text-gray-500">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTabChange?.("supplier")}
                className={[
                  "font-semibold",
                  activeTab === "supplier" ? "text-gray-700 underline" : "text-gray-400",
                ].join(" ")}
              >
                Suppliers
              </button>
              <button
                type="button"
                onClick={() => onTabChange?.("client")}
                className={[
                  "font-semibold",
                  activeTab === "client" ? "text-gray-700 underline" : "text-gray-400",
                ].join(" ")}
              >
                Client
              </button>
            </div>
            <div className="text-[9px] text-gray-400">
              Generated
              <div className="font-semibold text-gray-500">{today}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 ring-1 ring-gray-200">
            <ToolbarIconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
              <ZoomOut className="h-4 w-4" />
            </ToolbarIconButton>
            <span className="px-1 text-[11px] font-semibold text-gray-700">{zoom}%</span>
            <ToolbarIconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(160, z + 10))}>
              <ZoomIn className="h-4 w-4" />
            </ToolbarIconButton>
          </div>

          <ToolbarIconButton label="Regenerate preview" onClick={onRegenerate}>
            <RotateCcw className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Print" onClick={onPrint}>
            <Printer className="h-4 w-4" />
          </ToolbarIconButton>
          {showEmail ? (
            <ToolbarIconButton label="Email PDF" onClick={onEmail}>
              <Mail className="h-4 w-4" />
            </ToolbarIconButton>
          ) : null}
        </div>
      </div>

      <div className="bg-[#F4F5F6] px-6 py-6">
        <div
          className="origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div className="mx-auto w-[74%] min-w-[280px] max-w-[420px]">
            <div className="aspect-210/297 w-full rounded-sm bg-white shadow-[0_18px_42px_rgba(0,0,0,0.12)] ring-1 ring-black/10 overflow-hidden">
              <PDFViewer
                showToolbar={false}
                style={{ width: "100%", height: "100%", border: "none" }}
              >
                {document}
              </PDFViewer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

