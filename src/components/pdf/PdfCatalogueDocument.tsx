"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { PdfCatalogueSection } from "./pdfMockData";

export type PdfCatalogueSettings = {
  templateStyle?: "Professional" | "Minimal";
  includeLogo?: boolean;
  includeImages?: boolean;
};

export type PdfCatalogueDocumentProps = {
  clientName?: string;
  subtitle?: string;
  generatedLabel?: string;
  generatedDateText?: string;
  sections: PdfCatalogueSection[];
  settings?: PdfCatalogueSettings;

  /**
   * For browser generation, pass `window.location.origin` so images from `/public`
   * can be resolved (e.g. `/logo2.png` -> `https://site/logo2.png`).
   */
  assetBaseUrl?: string;
  /**
   * Path within `/public` (or absolute URL) to the logo used in the PDF header.
   * Default uses `logo2.png` which is dark-on-light and matches the design.
   */
  logoSrc?: string;
};

function joinUrl(base: string | undefined, src: string | undefined) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  const b = (base ?? "").replace(/\/$/, "");
  if (!b) return src;
  return `${b}${src.startsWith("/") ? "" : "/"}${src}`;
}

const styles = StyleSheet.create({
  page: {
    size: "A4",
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 28,
    backgroundColor: "#FFFFFF",
    color: "#111827",
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tabs: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 2,
  },
  tabActive: {
    fontSize: 9,
    fontWeight: 700,
    color: "#6B7280",
    textDecoration: "underline",
  },
  tabInactive: {
    fontSize: 9,
    fontWeight: 700,
    color: "#D1D5DB",
  },
  generated: {
    alignItems: "flex-end",
  },
  generatedLabel: {
    fontSize: 8,
    color: "#9CA3AF",
  },
  generatedDate: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: 700,
    color: "#6B7280",
  },
  logoWrap: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logo: {
    width: 138,
    height: 28,
  },
  divider: {
    marginTop: 10,
    height: 2,
    backgroundColor: "#0E5C4E",
  },
  titleBlock: {
    marginTop: 26,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 600,
    color: "#6B7280",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: "#111827",
  },
  productRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  productBody: {
    marginLeft: 10,
    flexGrow: 1,
    flexShrink: 1,
  },
  productName: {
    fontSize: 10,
    fontWeight: 800,
    color: "#111827",
  },
  productManufacturer: {
    marginTop: 1,
    fontSize: 8.5,
    fontWeight: 700,
    color: "#9CA3AF",
  },
  productDesc: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#6B7280",
  },
  productMeta: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#9CA3AF",
    flexDirection: "row",
  },
  metaStrong: {
    color: "#6B7280",
    fontWeight: 700,
  },
  qtyBox: {
    width: 44,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  qtyText: {
    fontSize: 9,
    fontWeight: 800,
    color: "#6B7280",
  },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    alignItems: "center",
    color: "#9CA3AF",
  },
  footerTitle: {
    fontSize: 8.5,
    fontWeight: 800,
    color: "#6B7280",
  },
  footerText: {
    marginTop: 4,
    fontSize: 8,
  },
  footerPage: {
    marginTop: 4,
    fontSize: 8,
  },
});

function ProductRow({
  product,
  includeImages,
  assetBaseUrl,
}: {
  product: PdfCatalogueSection["products"][number];
  includeImages: boolean;
  assetBaseUrl?: string;
}) {
  const src = includeImages ? joinUrl(assetBaseUrl, product.imageSrc ?? undefined) : undefined;

  return (
    <View style={styles.productRow}>
      {includeImages ? (
        src ? (
          <Image style={styles.productThumb} src={src} />
        ) : (
          <View style={styles.productThumb} />
        )
      ) : (
        <View style={styles.productThumb} />
      )}

      <View style={styles.productBody}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productManufacturer}>{product.manufacturer}</Text>
        <Text style={styles.productDesc}>{product.description}</Text>
        <Text style={styles.productMeta}>
          {product.locationLabel}{"  "}
          <Text style={styles.metaStrong}>{product.locationValue}</Text>
        </Text>
      </View>

      <View style={styles.qtyBox}>
        <Text style={styles.qtyText}>{product.quantity}</Text>
      </View>
    </View>
  );
}

export function PdfCatalogueDocument({
  clientName = "HSBC Bank",
  subtitle = "Premium Office Furniture Selection",
  generatedLabel = "Generated",
  generatedDateText = "3/2/2026",
  sections,
  settings,
  assetBaseUrl,
  logoSrc = "/logo2.png",
}: PdfCatalogueDocumentProps) {
  const includeLogo = settings?.includeLogo ?? true;
  const includeImages = settings?.includeImages ?? true;
  const resolvedLogo = includeLogo ? joinUrl(assetBaseUrl, logoSrc) : undefined;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: tabs + generated */}
        <View style={styles.headerRow}>
          <View style={styles.tabs}>
            <Text style={styles.tabActive}>Suppliers</Text>
            <Text style={styles.tabInactive}>Client</Text>
          </View>

          <View style={styles.generated}>
            <Text style={styles.generatedLabel}>{generatedLabel}</Text>
            <Text style={styles.generatedDate}>{generatedDateText}</Text>
          </View>
        </View>

        {/* Logo row (below tabs) */}
        <View style={styles.logoWrap}>
          {includeLogo && resolvedLogo ? (
            <Image src={resolvedLogo} style={styles.logo} />
          ) : (
            <View style={{ height: styles.logo.height as number }} />
          )}
        </View>

        <View style={styles.divider} />

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{clientName}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                includeImages={includeImages}
                assetBaseUrl={assetBaseUrl}
              />
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTitle}>NEO OFFICE Internal Platform</Text>
          <Text style={styles.footerText}>+44 1534 713240 • hello@neo.je</Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

