"use client";

import Image from "next/image";
import {
  Printer,
  RotateCcw,
  Share2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { PdfPreviewItem } from "./mockData";

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

function QtySelect({ value }: { value: number }) {
  const options = Array.from(new Set([value, 8, 10, 12, 14, 16]));

  return (
    <select className="h-7 w-[52px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 shadow-sm">
      {options.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

function MockPdfPage({ items }: { items: PdfPreviewItem[] }) {
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }, []);

  return (
    <div className="mx-auto w-[74%] min-w-[280px] max-w-[420px]">
      <div className="aspect-[210/297] w-full rounded-sm bg-white shadow-[0_18px_42px_rgba(0,0,0,0.12)] ring-1 ring-black/10">
        <div className="px-6 pt-5 text-[10px] text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-400">Suppliers</span>
              <span className="font-semibold text-gray-300">Client</span>
            </div>
            <div className="text-[9px] text-gray-400">
              Generated
              <div className="font-semibold text-gray-500">{today}</div>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo2.png" alt="Neo Office" width={120} height={28} className="h-auto w-[120px]" />
            </div>
          </div>

          <div className="mt-2 h-px w-full bg-emerald-900/70" />

          <div className="mt-5 text-center">
            <div className="text-[14px] font-semibold text-gray-900">HSBC Bank</div>
            <div className="mt-1 text-[10px] font-medium text-gray-500">
              Premium Office Furniture Selection
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[11px] font-semibold text-gray-900">Office 1</div>
            <div className="mt-3 space-y-3">
              {items.slice(0, 2).map((p) => (
                <div key={p.id} className="flex items-start gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-100 ring-1 ring-black/5">
                    {p.imageSrc ? (
                      <Image src={p.imageSrc} alt="" fill sizes="48px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-gray-900">{p.name}</div>
                    <div className="text-[9px] font-semibold text-gray-400">{p.manufacturer}</div>
                    <div className="mt-1 text-[9px] leading-snug text-gray-500">{p.description}</div>
                    <div className="mt-1 text-[9px] font-medium text-gray-400">
                      <span className="mr-2">📍</span>
                      Location <span className="ml-1 text-gray-500">{p.location}</span>
                    </div>
                  </div>
                  <QtySelect value={p.quantity} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[11px] font-semibold text-gray-900">Reception</div>
            <div className="mt-3 space-y-3">
              {items.slice(2, 4).map((p) => (
                <div key={p.id} className="flex items-start gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-100 ring-1 ring-black/5">
                    {p.imageSrc ? (
                      <Image src={p.imageSrc} alt="" fill sizes="48px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-gray-900">{p.name}</div>
                    <div className="text-[9px] font-semibold text-gray-400">{p.manufacturer}</div>
                    <div className="mt-1 text-[9px] leading-snug text-gray-500">{p.description}</div>
                    <div className="mt-1 text-[9px] font-medium text-gray-400">
                      <span className="mr-2">📍</span>
                      Location <span className="ml-1 text-gray-500">{p.location}</span>
                    </div>
                  </div>
                  <QtySelect value={p.quantity} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-3 text-center text-[8.5px] text-gray-400">
            <div className="font-semibold text-gray-500">NEO OFFICE Internal Platform</div>
            <div className="mt-1">+44 1534 713240 • hello@neo.je</div>
            <div className="mt-1">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PdfPreviewPanel({ items }: { items: PdfPreviewItem[] }) {
  const [zoom, setZoom] = useState(100);

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
          <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 ring-1 ring-gray-200">
            <ToolbarIconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
              <ZoomOut className="h-4 w-4" />
            </ToolbarIconButton>
            <span className="px-1 text-[11px] font-semibold text-gray-700">{zoom}%</span>
            <ToolbarIconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(160, z + 10))}>
              <ZoomIn className="h-4 w-4" />
            </ToolbarIconButton>
          </div>

          <ToolbarIconButton label="Regenerate preview">
            <RotateCcw className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Print">
            <Printer className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Share">
            <Share2 className="h-4 w-4" />
          </ToolbarIconButton>
        </div>
      </div>

      <div className="bg-[#F4F5F6] px-6 py-6">
        <div
          className="origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <MockPdfPage items={items} />
        </div>
      </div>
    </section>
  );
}

