"use client";

import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type ExportSection = { id: string; name: string; sort_order: number; notes: string | null };
export type ExportItem = {
  id: string;
  project_id: string;
  section_id: string;
  product_id: string;
  producturl?: string | null;
  quantity: number;
  client_notes: string | null;
  supplier_notes: string | null;
  sort_order: number;
  product_name: string;
  manufacturer_name: string;
  product_type: string;
  tags: string[];
};

export type ClientPdfSettings = {
  includeProjectNotes: boolean;
  includeSectionNotes: boolean;
  includeItemNotes: boolean;
  includeProductImages: boolean;
  includeProductUrls: boolean;
};

export type TemplateStyle = "Professional" | "Minimal";

const A4_PAGE_HEIGHT = 841.89;
const PAGE_TOP_PADDING = 28;
const PAGE_BOTTOM_SAFE_PADDING = 64;
const SECTION_TOP_MARGIN = 14;
const SECTION_TITLE_HEIGHT = 20;
const TABLE_HEADER_HEIGHT = 22;
const CHUNK_SAFETY_BUFFER = 10;
const PAGINATION_TOP_FUDGE = 8;
const NOTE_BLOCK_BASE_HEIGHT = 24;
const NOTE_LINE_HEIGHT = 10;
const MAX_NOTE_CHARS_PER_LINE = 74;
const MAX_DETAIL_CHARS_PER_LINE = 34;
const MAX_NAME_CHARS_PER_LINE = 28;
const MAX_MANUFACTURER_CHARS_PER_LINE = 24;
const MAX_PRODUCT_TYPE_CHARS_PER_LINE = 28;
const MAX_URL_CHARS_PER_LINE = 34;

function estimateLineCount(text: string, maxCharsPerLine: number): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  const explicitLines = normalized.split(/\r?\n/);
  return explicitLines.reduce((total, line) => {
    const len = line.trim().length;
    if (!len) return total + 1;
    return total + Math.max(1, Math.ceil(len / maxCharsPerLine));
  }, 0);
}

function estimateSectionNotesHeight(notes: string | null | undefined): number {
  if (!notes?.trim()) return 0;
  const lines = estimateLineCount(notes, MAX_NOTE_CHARS_PER_LINE);
  return NOTE_BLOCK_BASE_HEIGHT + lines * NOTE_LINE_HEIGHT + 8;
}

function paginateSectionRows<T>(
  rows: T[],
  estimateRowHeight: (row: T) => number,
  options: { maxChunkHeight: number; chunkBaseHeight: number; safetyBuffer?: number },
): T[][] {
  if (rows.length === 0) return [];
  const chunks: T[][] = [];
  let currentChunk: T[] = [];
  let usedRowsHeight = 0;
  const safeLimit = options.maxChunkHeight - (options.safetyBuffer ?? CHUNK_SAFETY_BUFFER);

  for (const row of rows) {
    const rowHeight = Math.max(estimateRowHeight(row), 20);
    const projectedChunkHeight = options.chunkBaseHeight + usedRowsHeight + rowHeight;
    const wouldOverflow = projectedChunkHeight > safeLimit;
    if (currentChunk.length > 0 && wouldOverflow) {
      chunks.push(currentChunk);
      currentChunk = [row];
      usedRowsHeight = rowHeight;
      continue;
    }
    currentChunk.push(row);
    usedRowsHeight += rowHeight;
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
}

function createStyles(templateStyle: TemplateStyle) {
  const minimal = templateStyle === "Minimal";
  return StyleSheet.create({
    page: {
      padding: 28,
      paddingBottom: PAGE_BOTTOM_SAFE_PADDING,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#111827",
    },
    header: { marginBottom: 16 },
    title: { fontSize: 18, fontWeight: 700 },
    metaRow: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", gap: 12 },
    metaText: { fontSize: 10, color: minimal ? "#111827" : "#374151" },
    section: { marginTop: 14 },
    sectionTitleWrap: minimal
      ? { marginBottom: 6 }
      : { marginBottom: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "#0E5C4E", borderRadius: 6 },
    sectionTitle: minimal
      ? { fontSize: 12, fontWeight: 700, color: "#111827" }
      : { fontSize: 12, fontWeight: 700, color: "#FFFFFF" },
    subtle: { color: minimal ? "#111827" : "#6B7280" },
    table: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, overflow: "hidden" },
    row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    rowLast: { borderBottomWidth: 0 },
    th: { paddingVertical: 6, paddingHorizontal: 8, fontWeight: 700, backgroundColor: minimal ? "#FFFFFF" : "#F9FAFB" },
    td: { paddingVertical: 6, paddingHorizontal: 8 },
    colName: { width: "44%" },
    colMan: { width: "26%" },
    colQty: { width: "10%", textAlign: "right" },
    colExtra: { width: "20%" },
    noteBlock: { marginTop: 6, padding: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6 },
    imageCell: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 },
    productImage: { width: 44, height: 44, objectFit: "cover", borderRadius: 6 },
    placeholder: { fontSize: 9, color: minimal ? "#111827" : "#6B7280" },
    cellText: { fontSize: 9, color: "#111827" },
    footerWrap: { position: "absolute", left: 28, right: 28, bottom: 18, alignItems: "center" },
    footerTitle: { fontSize: 8.5, fontWeight: 800, color: minimal ? "#111827" : "#6B7280" },
    footerText: { marginTop: 4, fontSize: 8, color: minimal ? "#111827" : "#9CA3AF" },
    footerPage: { marginTop: 4, fontSize: 8, color: minimal ? "#111827" : "#9CA3AF" },
    logo: { width: 138, height: 28 },
    divider: { marginTop: 10, height: 2, backgroundColor: minimal ? "#111827" : "#0E5C4E" },
  });
}

export function ClientProjectPdfDocument({
  projectName,
  clientName,
  dateLabel,
  sections,
  items,
  projectNotes,
  settings,
  templateStyle = "Professional",
  includeLogo = true,
  imageByProductId,
  urlByProductId,
  urlEnabledByItemId,
}: {
  projectName: string;
  clientName: string;
  dateLabel: string;
  sections: ExportSection[];
  items: ExportItem[];
  projectNotes: string;
  settings: ClientPdfSettings;
  templateStyle?: TemplateStyle;
  includeLogo?: boolean;
  imageByProductId: Map<string, string | null>;
  urlByProductId: Map<string, string | null>;
  urlEnabledByItemId: Record<string, boolean>;
}) {
  const styles = createStyles(templateStyle);
  const minimal = templateStyle === "Minimal";
  const includeImages = minimal ? false : settings.includeProductImages;
  const showLogo = minimal ? false : includeLogo;
  const orderedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const pageContentHeight = A4_PAGE_HEIGHT - PAGE_TOP_PADDING - PAGE_BOTTOM_SAFE_PADDING;

  const estimateClientRowHeight = (item: ExportItem) => {
    const nameLines = estimateLineCount(item.product_name, MAX_NAME_CHARS_PER_LINE);
    const manufacturerLines = estimateLineCount(
      item.manufacturer_name,
      MAX_MANUFACTURER_CHARS_PER_LINE,
    );
    const notesLines =
      settings.includeItemNotes && item.client_notes
        ? estimateLineCount(item.client_notes, MAX_DETAIL_CHARS_PER_LINE)
        : 0;
    const url = urlByProductId.get(item.product_id) ?? null;
    const producturl = item.producturl ?? url;
    const urlEnabled = settings.includeProductUrls ? urlEnabledByItemId[item.id] !== false : false;
    const urlLines =
      settings.includeProductUrls && urlEnabled && producturl
        ? estimateLineCount(producturl, MAX_URL_CHARS_PER_LINE)
        : 0;

    const textDrivenHeight = 14 + nameLines * 8 + manufacturerLines * 7 + notesLines * 7 + urlLines * 7;
    // Account for cell padding/borders and image block margins to keep chunks safely within a page.
    const rowChromeHeight = 6;
    const imageBlockHeight = includeImages ? 48 : 0;
    const estimated = textDrivenHeight + rowChromeHeight;
    return includeImages ? Math.max(60, Math.max(estimated, imageBlockHeight)) : Math.max(30, estimated);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{projectName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Client: {clientName || "—"}</Text>
            <Text style={styles.metaText}>Date: {dateLabel}</Text>
          </View>
          {showLogo ? (
            <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src="/logo2.png" style={styles.logo} />
            </View>
          ) : null}
          <View style={styles.divider} />
          {settings.includeProjectNotes && projectNotes?.trim() ? (
            <View style={styles.noteBlock}>
              <Text style={{ fontWeight: 700 }}>Project Notes</Text>
              <Text style={styles.subtle}>{projectNotes}</Text>
            </View>
          ) : null}
        </View>

        {orderedSections.map((section) => {
          const sectionItems = items
            .filter((i) => i.section_id === section.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          const sectionNotesHeight =
            settings.includeSectionNotes && section.notes?.trim()
              ? estimateSectionNotesHeight(section.notes)
              : 0;
          const firstChunkBaseHeight =
            SECTION_TOP_MARGIN + SECTION_TITLE_HEIGHT + TABLE_HEADER_HEIGHT + sectionNotesHeight;
          const continuedChunkBaseHeight =
            SECTION_TOP_MARGIN + SECTION_TITLE_HEIGHT + TABLE_HEADER_HEIGHT;
          const maxChunkHeight = pageContentHeight - PAGINATION_TOP_FUDGE;
          const clientChunks =
            sectionItems.length === 0
              ? []
              : (() => {
                  const chunks: ExportItem[][] = [];
                  let remaining = [...sectionItems];
                  const first = paginateSectionRows(remaining, estimateClientRowHeight, {
                    maxChunkHeight,
                    chunkBaseHeight: firstChunkBaseHeight,
                    safetyBuffer: CHUNK_SAFETY_BUFFER,
                  })[0];
                  if (!first || first.length === 0) return chunks;
                  chunks.push(first);
                  remaining = remaining.slice(first.length);
                  if (remaining.length > 0) {
                    chunks.push(
                      ...paginateSectionRows(remaining, estimateClientRowHeight, {
                        maxChunkHeight,
                        chunkBaseHeight: continuedChunkBaseHeight,
                        safetyBuffer: CHUNK_SAFETY_BUFFER,
                      }),
                    );
                  }
                  return chunks;
                })();

          return (
            <View key={section.id}>
              {sectionItems.length === 0 ? (
                <View style={styles.section} minPresenceAhead={24}>
                  <View style={styles.sectionTitleWrap} minPresenceAhead={24}>
                    <Text style={styles.sectionTitle}>{section.name}</Text>
                  </View>
                  {settings.includeSectionNotes && section.notes?.trim() ? (
                    <View style={[styles.noteBlock, { marginTop: 0, marginBottom: 8 }]}>
                      <Text style={{ fontWeight: 700 }}>Section Notes</Text>
                      <Text style={styles.subtle}>{section.notes}</Text>
                    </View>
                  ) : null}
                  <View style={styles.table}>
                    <View style={styles.row} wrap={false}>
                      <Text style={[styles.th, styles.colName]}>Product</Text>
                      <Text style={[styles.th, styles.colMan]}>Manufacturer</Text>
                      <Text style={[styles.th, styles.colQty]}>Qty</Text>
                      <Text style={[styles.th, styles.colExtra]}>
                        {settings.includeItemNotes || settings.includeProductUrls ? "Details" : ""}
                      </Text>
                    </View>
                    <View style={[styles.row, styles.rowLast]}>
                      <Text style={[styles.td, styles.colName, styles.subtle]}>—</Text>
                      <Text style={[styles.td, styles.colMan, styles.subtle]}>—</Text>
                      <Text style={[styles.td, styles.colQty, styles.subtle]}>—</Text>
                      <Text style={[styles.td, styles.colExtra, styles.subtle]}>Empty section</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {clientChunks.map((chunkItems, chunkIdx) => (
                <View
                  key={`${section.id}-chunk-${chunkIdx}`}
                  style={styles.section}
                  minPresenceAhead={24}
                >
                  <View style={styles.sectionTitleWrap} minPresenceAhead={24}>
                    <Text style={styles.sectionTitle}>
                      {chunkIdx === 0 ? section.name : `${section.name} (continued)`}
                    </Text>
                  </View>
                  {chunkIdx === 0 && settings.includeSectionNotes && section.notes?.trim() ? (
                    <View style={[styles.noteBlock, { marginTop: 0, marginBottom: 8 }]}>
                      <Text style={{ fontWeight: 700 }}>Section Notes</Text>
                      <Text style={styles.subtle}>{section.notes}</Text>
                    </View>
                  ) : null}
                  <View style={styles.table}>
                    <View style={styles.row} wrap={false}>
                      <Text style={[styles.th, styles.colName]}>Product</Text>
                      <Text style={[styles.th, styles.colMan]}>Manufacturer</Text>
                      <Text style={[styles.th, styles.colQty]}>Qty</Text>
                      <Text style={[styles.th, styles.colExtra]}>
                        {settings.includeItemNotes || settings.includeProductUrls ? "Details" : ""}
                      </Text>
                    </View>
                    {chunkItems.map((item, idx) => {
                      const isLast = idx === chunkItems.length - 1;
                      const imageUrl = imageByProductId.get(item.product_id) ?? null;
                      const url = urlByProductId.get(item.product_id) ?? null;
                      const urlEnabled = settings.includeProductUrls
                        ? urlEnabledByItemId[item.id] !== false
                        : false;
                      const producturl = item.producturl ?? url;

                      return (
                        <View
                          key={item.id}
                          wrap={false}
                          style={isLast ? [styles.row, styles.rowLast] : styles.row}
                        >
                          <View style={[styles.td, styles.colName]}>
                            <Text style={{ fontWeight: 700 }}>{item.product_name}</Text>
                            {includeImages ? (
                              <View style={styles.imageCell}>
                                {imageUrl ? (
                                  // eslint-disable-next-line jsx-a11y/alt-text
                                  <Image src={imageUrl} style={styles.productImage} />
                                ) : (
                                  <Text style={styles.placeholder}>Image not available</Text>
                                )}
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.td, styles.colMan]}>{item.manufacturer_name}</Text>
                          <Text style={[styles.td, styles.colQty]}>{String(item.quantity)}</Text>
                          <View style={[styles.td, styles.colExtra]}>
                            {settings.includeItemNotes && item.client_notes ? (
                              <Text style={styles.cellText}>{item.client_notes}</Text>
                            ) : null}
                            {settings.includeProductUrls && urlEnabled && producturl ? (
                              <Link src={producturl}>
                                <Text style={{ fontSize: 8, color: "#0ea5e9" }}>{producturl}</Text>
                              </Link>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {templateStyle === "Minimal" ? (
          <View style={styles.footerWrap} fixed>
            <Text
              style={styles.footerPage}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        ) : (
          <View style={styles.footerWrap} fixed>
            <Text style={styles.footerTitle}>NEO OFFICE Internal Platform</Text>
            <Text style={styles.footerText}>+44 1534 713240 • hello@neo.je</Text>
            <Text
              style={styles.footerPage}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        )}
      </Page>
    </Document>
  );
}

export function SupplierRfqPdfDocument({
  projectName,
  clientName,
  dateLabel,
  supplierName,
  sections,
  items,
  includeSectionNotes,
  supplierNotes,
  templateStyle = "Professional",
}: {
  projectName: string;
  clientName: string;
  dateLabel: string;
  supplierName: string;
  sections: ExportSection[];
  items: ExportItem[];
  includeSectionNotes: boolean;
  supplierNotes: string;
  templateStyle?: TemplateStyle;
}) {
  const styles = createStyles(templateStyle);
  const orderedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const pageContentHeight = A4_PAGE_HEIGHT - PAGE_TOP_PADDING - PAGE_BOTTOM_SAFE_PADDING;

  const estimateSupplierRowHeight = (item: ExportItem) => {
    const nameLines = estimateLineCount(item.product_name, MAX_NAME_CHARS_PER_LINE);
    const manufacturerLines = estimateLineCount(
      item.manufacturer_name,
      MAX_MANUFACTURER_CHARS_PER_LINE,
    );
    const productTypeLines = estimateLineCount(item.product_type || "", MAX_PRODUCT_TYPE_CHARS_PER_LINE);
    const note = (item.supplier_notes?.trim() || item.client_notes?.trim() || "").trim();
    const noteLines = note ? estimateLineCount(note, MAX_DETAIL_CHARS_PER_LINE) : 1;
    const textDrivenHeight = 14 + nameLines * 8 + manufacturerLines * 7 + productTypeLines * 7 + noteLines * 7;
    const rowChromeHeight = 6;
    return Math.max(32, textDrivenHeight + rowChromeHeight);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            RFQ — {supplierName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Project: {projectName}</Text>
            <Text style={styles.metaText}>Client: {clientName || "—"}</Text>
          </View>
          <View style={[styles.metaRow, { marginTop: 2 }]}>
            <Text style={styles.metaText}>Date: {dateLabel}</Text>
            <Text style={styles.metaText}> </Text>
          </View>

          {supplierNotes?.trim() ? (
            <View style={styles.noteBlock}>
              <Text style={{ fontWeight: 700 }}>Supplier Notes</Text>
              <Text style={styles.subtle}>{supplierNotes}</Text>
            </View>
          ) : null}
        </View>

        {orderedSections.map((section) => {
          const sectionItems = items
            .filter((i) => i.section_id === section.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          if (sectionItems.length === 0) return null;

          const sectionNotesHeight =
            includeSectionNotes && section.notes?.trim()
              ? estimateSectionNotesHeight(section.notes)
              : 0;
          const firstChunkBaseHeight =
            SECTION_TOP_MARGIN + SECTION_TITLE_HEIGHT + TABLE_HEADER_HEIGHT + sectionNotesHeight;
          const continuedChunkBaseHeight =
            SECTION_TOP_MARGIN + SECTION_TITLE_HEIGHT + TABLE_HEADER_HEIGHT;
          const maxChunkHeight = pageContentHeight - PAGINATION_TOP_FUDGE;
          const supplierChunks = (() => {
            const chunks: ExportItem[][] = [];
            let remaining = [...sectionItems];
            const first = paginateSectionRows(remaining, estimateSupplierRowHeight, {
              maxChunkHeight,
              chunkBaseHeight: firstChunkBaseHeight,
              safetyBuffer: CHUNK_SAFETY_BUFFER,
            })[0];
            if (!first || first.length === 0) return chunks;
            chunks.push(first);
            remaining = remaining.slice(first.length);
            if (remaining.length > 0) {
              chunks.push(
                ...paginateSectionRows(remaining, estimateSupplierRowHeight, {
                  maxChunkHeight,
                  chunkBaseHeight: continuedChunkBaseHeight,
                  safetyBuffer: CHUNK_SAFETY_BUFFER,
                }),
              );
            }
            return chunks;
          })();

          return (
            <View key={section.id}>
              {supplierChunks.map((chunkItems, chunkIdx) => (
                <View
                  key={`${section.id}-chunk-${chunkIdx}`}
                  style={styles.section}
                  minPresenceAhead={24}
                >
                  <View style={styles.sectionTitleWrap} minPresenceAhead={24}>
                    <Text style={styles.sectionTitle}>
                      {chunkIdx === 0 ? section.name : `${section.name} (continued)`}
                    </Text>
                  </View>

                  {chunkIdx === 0 && includeSectionNotes && section.notes?.trim() ? (
                    <View style={[styles.noteBlock, { marginTop: 0, marginBottom: 8 }]}>
                      <Text style={{ fontWeight: 700 }}>Section Notes</Text>
                      <Text style={styles.subtle}>{section.notes}</Text>
                    </View>
                  ) : null}

                  <View style={styles.table}>
                    <View style={styles.row} wrap={false}>
                      <Text style={[styles.th, styles.colName]}>Product</Text>
                      <Text style={[styles.th, styles.colMan]}>Manufacturer</Text>
                      <Text style={[styles.th, styles.colQty]}>Qty</Text>
                      <Text style={[styles.th, styles.colExtra]}>Notes</Text>
                    </View>

                    {chunkItems.map((item, idx) => {
                      const isLast = idx === chunkItems.length - 1;
                      const note = (
                        item.supplier_notes?.trim() ||
                        item.client_notes?.trim() ||
                        ""
                      ).trim();

                      return (
                        <View
                          key={item.id}
                          wrap={false}
                          style={isLast ? [styles.row, styles.rowLast] : styles.row}
                        >
                          <View style={[styles.td, styles.colName]}>
                            <Text style={{ fontWeight: 700 }}>{item.product_name}</Text>
                            <Text style={[styles.subtle, { fontSize: 9 }]}>{item.product_type || ""}</Text>
                          </View>
                          <Text style={[styles.td, styles.colMan]}>{item.manufacturer_name}</Text>
                          <Text style={[styles.td, styles.colQty]}>{String(item.quantity)}</Text>
                          <View style={[styles.td, styles.colExtra]}>
                            {note ? <Text style={styles.cellText}>{note}</Text> : <Text style={styles.subtle}>—</Text>}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {templateStyle === "Minimal" ? (
          <View style={styles.footerWrap} fixed>
            <Text
              style={styles.footerPage}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        ) : (
          <View style={styles.footerWrap} fixed>
            <Text style={styles.footerTitle}>NEO OFFICE Internal Platform</Text>
            <Text style={styles.footerText}>+44 1534 713240 • hello@neo.je</Text>
            <Text
              style={styles.footerPage}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        )}
      </Page>
    </Document>
  );
}

