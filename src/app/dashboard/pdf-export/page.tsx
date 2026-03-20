"use client";

import { Download, RefreshCcw } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { useCallback, useMemo, useRef, useState } from "react";
import { PdfExportSettingsCard, type PdfExportSettings } from "@/components/pdf-export/PdfExportSettingsCard";
import { PdfPreviewPanel } from "@/components/pdf-export/PdfPreviewPanel";
import { MOCK_PREVIEW_ITEMS } from "@/components/pdf-export/mockData";
import { PdfCatalogueDocument } from "@/components/pdf/PdfCatalogueDocument";
import { MOCK_PDF_SECTIONS } from "@/components/pdf/pdfMockData";

export default function PdfExportPage() {
  const items = useMemo(() => MOCK_PREVIEW_ITEMS, []);
  const sections = useMemo(() => MOCK_PDF_SECTIONS, []);
  const [settings, setSettings] = useState<PdfExportSettings>({
    templateStyle: "Professional",
    pageSize: "A4",
    includeLogo: true,
    includeImages: true,
  });
  const lastBlobUrlRef = useRef<string | null>(null);

  const buildPdfBlob = useCallback(async () => {
    const origin = window.location.origin;
    return await pdf(
      <PdfCatalogueDocument
        assetBaseUrl={origin}
        sections={sections}
        generatedDateText="3/2/2026"
        settings={{
          templateStyle: settings.templateStyle,
          includeLogo: settings.includeLogo,
          includeImages: settings.includeImages,
        }}
      />,
    ).toBlob();
  }, [sections, settings.includeImages, settings.includeLogo, settings.templateStyle]);

  const downloadBlob = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    lastBlobUrlRef.current = url;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      if (lastBlobUrlRef.current === url) lastBlobUrlRef.current = null;
    }, 0);
  }, []);

  const openBlobInNewTab = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    lastBlobUrlRef.current = url;
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      URL.revokeObjectURL(url);
      if (lastBlobUrlRef.current === url) lastBlobUrlRef.current = null;
    }, 30_000);
  }, []);

  const handleRegenerate = useCallback(() => {
    // Placeholder: rebuild PDF payload / refresh preview when data becomes dynamic.
    // For now, this is a no-op hook you can extend later.
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const blob = await buildPdfBlob();
    downloadBlob(blob, "neooffice-catalogue.pdf");
  }, [buildPdfBlob, downloadBlob]);

  const handleGeneratePdf = useCallback(async () => {
    // Placeholder behavior: open generated PDF in a new tab for quick preview.
    const blob = await buildPdfBlob();
    openBlobInNewTab(blob);
  }, [buildPdfBlob, openBlobInNewTab]);

  const handlePrint = useCallback(async () => {
    // Placeholder: open in a new tab; user can print from the PDF viewer UI.
    const blob = await buildPdfBlob();
    openBlobInNewTab(blob);
  }, [buildPdfBlob, openBlobInNewTab]);

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-white">
            PDF Export
          </h1>
          <p className="mt-1 text-[11px] font-medium text-emerald-100/70">
            Generate and export product catalogues
          </p>
        </div>

        <div className="flex items-center gap-3 sm:pt-1">
          <button
            type="button"
            onClick={handleRegenerate}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <PdfPreviewPanel items={items} />
        <PdfExportSettingsCard
          settings={settings}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onGenerate={handleGeneratePdf}
          onDownload={handleDownloadPdf}
          onPrint={handlePrint}
        />
      </div>
    </div>
  );
}

