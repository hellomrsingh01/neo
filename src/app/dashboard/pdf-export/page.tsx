"use client";

import { Download, RefreshCcw, RotateCcw } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PdfExportSettingsCard,
  type PdfExportSettings,
} from "@/components/pdf-export/PdfExportSettingsCard";
import {
  PdfPreviewPanel,
  type PreviewTab,
} from "@/components/pdf-export/PdfPreviewPanel";
import { supabase } from "@/lib/supabaseClient";
import {
  ClientProjectPdfDocument,
  SupplierRfqPdfDocument,
  type ClientPdfSettings,
  type ExportItem,
  type ExportSection,
  type TemplateStyle,
} from "@/components/pdf-export/ProjectPdfDocuments";
import { EmailPdfModal } from "@/components/pdf-export/EmailPdfModal";

const getImageExtensionFromUrl = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    const pathname = parsed.pathname.toLowerCase();
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    return match?.[1] ?? "";
  } catch {
    const clean = url.split("?")[0].toLowerCase();
    const match = clean.match(/\.([a-z0-9]+)$/i);
    return match?.[1] ?? "";
  }
};

const blobToObjectUrlImage = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image blob"));
    };
    image.src = objectUrl;
  });

const convertImageUrlToPdfSafeSrc = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return url;

    const blob = await response.blob();
    const contentType = blob.type.toLowerCase();
    const ext = getImageExtensionFromUrl(url);
    const isWebp = contentType.includes("image/webp") || ext === "webp";
    if (!isWebp) return url;

    const image = await blobToObjectUrlImage(blob);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return url;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;

    // Use a solid white background because JPEG does not preserve transparency.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return url;
  }
};

export default function PdfExportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";

  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [userRole, setUserRole] = useState<"admin" | "internal" | "external">(
    "internal",
  );

  const [projectName, setProjectName] = useState("Project");
  const [clientName, setClientName] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [sections, setSections] = useState<ExportSection[]>([]);
  const [items, setItems] = useState<ExportItem[]>([]);

  const [activeTab, setActiveTab] = useState<PreviewTab>("client");

  const [clientSettings, setClientSettings] = useState<ClientPdfSettings>({
    includeProjectNotes: false,
    includeSectionNotes: true,
    includeItemNotes: true,
    includeProductImages: true,
    includeProductUrls: false,
  });
  const [urlEnabledByItemId, setUrlEnabledByItemId] = useState<
    Record<string, boolean>
  >({});

  const manufacturersInProject = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.manufacturer_name) set.add(item.manufacturer_name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const [supplierName, setSupplierName] = useState<string>("");
  const [includeRfqSectionNotes, setIncludeRfqSectionNotes] = useState(true);
  const [supplierNotes, setSupplierNotes] = useState("");
  const [savingSupplierNotes, setSavingSupplierNotes] = useState(false);
  const [rfqSentMap, setRfqSentMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supplierName && manufacturersInProject.length > 0) {
      setSupplierName(manufacturersInProject[0]);
    }
  }, [manufacturersInProject, supplierName]);

  const productIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.product_id))),
    [items],
  );

  const [imageByProductId, setImageByProductId] = useState<
    Map<string, string | null>
  >(() => new Map());
  const [urlByProductId, setUrlByProductId] = useState<
    Map<string, string | null>
  >(() => new Map());

  const [settings, setSettings] = useState<PdfExportSettings>({
    templateStyle: "Professional",
    pageSize: "A4",
    includeLogo: true,
    includeImages: true,
    includeProjectNotes: false,
    includeSectionNotes: true,
    includeItemNotes: true,
    includeProductUrls: false,
  });
  const lastBlobUrlRef = useRef<string | null>(null);

  const normalizeItemsForSections = useCallback(
    (secs: ExportSection[], its: ExportItem[]): ExportItem[] => {
      const next: ExportItem[] = [];
      for (const section of secs) {
        const inSection = its.filter((i) => i.section_id === section.id);
        inSection.forEach((item, idx) => {
          next.push({ ...item, section_id: section.id, sort_order: idx });
        });
      }
      return next;
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const currentUser = authData.user;
    if (authError || !currentUser) {
      router.replace("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle<{ role: "admin" | "internal" | "external" | null }>();

    if (profileError || !profile?.role) {
      setError("Failed to validate user role.");
      setLoading(false);
      return;
    }
    if (profile.role === "external") {
      setError("External users cannot export or email PDFs.");
      setLoading(false);
      router.replace("/dashboard");
      return;
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, name, project_type, owner_user_id, client_name, projectnotes",
      )
      .eq("id", projectId)
      .is("archived_at", null)
      .maybeSingle<{
        id: string;
        name: string;
        project_type: "internal" | "external";
        owner_user_id: string;
        client_name: string | null;
        projectnotes: string | null;
      }>();

    if (projectError || !project) {
      setError("Project not found.");
      setLoading(false);
      return;
    }

    // Fetch RFQ sent logs for this project
    const { data: rfqLogs, error: rfqLogsError } = await supabase
      .from("project_email_logs")
      .select("sent_at, manufacturer_id, manufacturers(name)")
      .eq("project_id", projectId)
      .eq("email_type", "supplier_rfq")
      .order("sent_at", { ascending: false });

    console.log("rfqLogs:", rfqLogs);
    console.log("rfqLogsError:", rfqLogsError);
    console.log("first log manufacturers:", JSON.stringify(rfqLogs?.[0]));

    if (rfqLogs) {
      const map: Record<string, string> = {};
      for (const log of rfqLogs as unknown as Array<{
        sent_at: string;
        manufacturer_id: string | null;
        manufacturers: { name: string } | null;
      }>) {
        const name = (log.manufacturers as { name: string } | null)?.name;
        if (name && !map[name]) {
          map[name] = log.sent_at;
        }
      }
      setRfqSentMap(map);
    }

    const role = profile.role;
    const isOwner = project.owner_user_id === currentUser.id;
    const editable =
      role === "admin" ||
      (role === "internal" && isOwner && project.project_type === "internal") ||
      false;

    if (!editable) {
      setError("You do not have access to this project.");
      setLoading(false);
      return;
    }

    setUserRole(profile.role);
    setProjectName(project.name);
    setClientName(project.client_name ?? "");
    setProjectNotes(project.projectnotes ?? "");

    const { data: sectionRows, error: sectionError } = await supabase
      .from("project_sections")
      .select("id, name, sort_order, notes")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (sectionError) {
      setError(sectionError.message);
      setLoading(false);
      return;
    }

    let resolvedSections = (sectionRows ?? []) as ExportSection[];
    if (resolvedSections.length === 0) {
      const { data: insertedSection, error: insertSectionError } =
        await supabase
          .from("project_sections")
          .insert({ project_id: projectId, name: "General", sort_order: 0 })
          .select("id, name, sort_order, notes")
          .single<ExportSection>();
      if (insertSectionError || !insertedSection) {
        setError(
          insertSectionError?.message || "Failed to create General section.",
        );
        setLoading(false);
        return;
      }
      resolvedSections = [insertedSection];
    }

    const { data: itemRows, error: itemError } = await supabase
      .from("project_items")
      .select(
        "id, project_id, section_id, product_id, quantity, client_notes, supplier_notes, sort_order",
      )
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (itemError) {
      setError(itemError.message);
      setLoading(false);
      return;
    }

    type BaseItem = Omit<
      ExportItem,
      "product_name" | "manufacturer_name" | "product_type" | "tags"
    >;
    const baseItems = ((itemRows ?? []) as BaseItem[]) ?? [];
    const productIdsLocal = Array.from(
      new Set(baseItems.map((item) => item.product_id)),
    );

    const productsById = new Map<
      string,
      {
        name: string;
        manufacturer_id: string | null;
        product_type: string | null;
      }
    >();
    const tagsByProductId = new Map<string, string[]>();
    const manufacturerById = new Map<string, string>();

    if (productIdsLocal.length > 0) {
      const { data: productRows } = await supabase
        .from("products")
        .select("id, name, manufacturer_id, product_type")
        .in("id", productIdsLocal);

      for (const product of (productRows ?? []) as Array<{
        id: string;
        name: string;
        manufacturer_id: string | null;
        product_type: string | null;
      }>) {
        productsById.set(product.id, {
          name: product.name,
          manufacturer_id: product.manufacturer_id,
          product_type: product.product_type,
        });
      }

      const manufacturerIds = Array.from(
        new Set(
          (productRows ?? [])
            .map((p) => p.manufacturer_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      if (manufacturerIds.length > 0) {
        const { data: manufacturerRows } = await supabase
          .from("manufacturers")
          .select("id, name")
          .in("id", manufacturerIds);
        for (const row of (manufacturerRows ?? []) as Array<{
          id: string;
          name: string;
        }>) {
          manufacturerById.set(row.id, row.name);
        }
      }

      const { data: productTagRows } = await supabase
        .from("product_tags")
        .select("product_id, tag_id")
        .in("product_id", productIdsLocal);
      const tagIds = Array.from(
        new Set(
          (productTagRows ?? [])
            .map((row) => row.tag_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const tagById = new Map<string, string>();

      if (tagIds.length > 0) {
        const { data: tagRows } = await supabase
          .from("tags")
          .select("id, name")
          .in("id", tagIds);
        for (const tag of (tagRows ?? []) as Array<{
          id: string;
          name: string;
        }>) {
          tagById.set(tag.id, tag.name);
        }
      }

      for (const row of (productTagRows ?? []) as Array<{
        product_id: string;
        tag_id: string;
      }>) {
        const list = tagsByProductId.get(row.product_id) ?? [];
        const tagName = tagById.get(row.tag_id);
        if (tagName) list.push(tagName);
        tagsByProductId.set(row.product_id, list);
      }
    }

    const hydratedItems: ExportItem[] = baseItems.map((item) => {
      const product = productsById.get(item.product_id);
      return {
        ...item,
        quantity: Math.max(1, item.quantity ?? 1),
        product_name: product?.name ?? "Unknown product",
        manufacturer_name: product?.manufacturer_id
          ? (manufacturerById.get(product.manufacturer_id) ??
            "Unknown manufacturer")
          : "Unknown manufacturer",
        product_type: product?.product_type ?? "",
        tags: tagsByProductId.get(item.product_id) ?? [],
      };
    });

    const orderedSections = resolvedSections.sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const normalizedItems = normalizeItemsForSections(
      orderedSections,
      hydratedItems,
    );

    setSections(orderedSections);
    setItems(normalizedItems);
    setLoading(false);
  }, [normalizeItemsForSections, projectId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const nextUrls = new Map<string, string | null>();
        if (productIds.length > 0) {
          const { data: prodRows } = await supabase
            .from("products")
            .select("id, product_url")
            .in("id", productIds);
          for (const row of (prodRows ?? []) as Array<{
            id: string;
            product_url: string | null;
          }>) {
            nextUrls.set(row.id, row.product_url);
          }
        }
        if (active) setUrlByProductId(nextUrls);
      } catch {
        if (active) setUrlByProductId(new Map());
      }
    })();
    return () => {
      active = false;
    };
  }, [productIds]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = new Map<string, string | null>();
        if (productIds.length > 0) {
          const { data: imgRows } = await supabase
            .from("product_images")
            .select("product_id, file_path, is_primary")
            .in("product_id", productIds);
          const byProduct = new Map<
            string,
            Array<{ file_path: string; is_primary: boolean }>
          >();
          for (const row of (imgRows ?? []) as Array<{
            product_id: string;
            file_path: string;
            is_primary: boolean;
          }>) {
            const list = byProduct.get(row.product_id) ?? [];
            list.push({ file_path: row.file_path, is_primary: row.is_primary });
            byProduct.set(row.product_id, list);
          }
          for (const pid of productIds) {
            const list = byProduct.get(pid) ?? [];
            const primary = list.find((x) => x.is_primary) ?? list[0] ?? null;
            if (!primary?.file_path) {
              next.set(pid, null);
            } else {
              const publicUrl = supabase.storage
                .from("product-images")
                .getPublicUrl(primary.file_path).data.publicUrl;
              if (!publicUrl) {
                next.set(pid, null);
                continue;
              }
              const pdfSafeImageSrc = await convertImageUrlToPdfSafeSrc(publicUrl);
              next.set(pid, pdfSafeImageSrc);
            }
          }
        }
        if (active) setImageByProductId(next);
      } catch {
        if (active) setImageByProductId(new Map());
      }
    })();
    return () => {
      active = false;
    };
  }, [productIds]);

  const resolveManufacturerId = useCallback(async (name: string) => {
    const { data, error: err } = await supabase
      .from("manufacturers")
      .select("id, name")
      .eq("name", name)
      .maybeSingle<{ id: string; name: string }>();
    if (err || !data?.id) return null;
    return data.id;
  }, []);

  const loadSupplierNotes = useCallback(
    async (name: string) => {
      if (!projectId || !name) return;
      const manufacturerId = await resolveManufacturerId(name);
      if (!manufacturerId) return;
      const { data } = await supabase
        .from("project_supplier_notes")
        .select("notes")
        .eq("project_id", projectId)
        .eq("manufacturer_id", manufacturerId)
        .maybeSingle<{ notes: string | null }>();
      setSupplierNotes(data?.notes ?? "");
    },
    [projectId, resolveManufacturerId],
  );

  useEffect(() => {
    void loadSupplierNotes(supplierName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierName]);

  const saveSupplierNotes = useCallback(async () => {
    if (!projectId || !supplierName) return;
    setSavingSupplierNotes(true);
    try {
      const manufacturerId = await resolveManufacturerId(supplierName);
      if (!manufacturerId) throw new Error("Could not resolve manufacturer");
      const { error: upsertError } = await supabase
        .from("project_supplier_notes")
        .upsert(
          {
            project_id: projectId,
            manufacturer_id: manufacturerId,
            notes: supplierNotes.trim() || null,
          },
          { onConflict: "project_id,manufacturer_id" },
        );
      if (upsertError) throw new Error(upsertError.message);
    } finally {
      setSavingSupplierNotes(false);
    }
  }, [projectId, resolveManufacturerId, supplierName, supplierNotes]);

  const formatDDMMYYYY = useCallback((date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd}${mm}${yyyy}`;
  }, []);

  const clientFileName = useMemo(() => {
    const date = formatDDMMYYYY(new Date());
    const safeProject =
      (projectName || "Project").replace(/[\\/:*?"<>|]/g, "").trim() ||
      "Project";
    return `Neo_${safeProject}_${date}.pdf`;
  }, [formatDDMMYYYY, projectName]);

  const supplierFileName = useMemo(() => {
    const date = formatDDMMYYYY(new Date());
    const safeProject =
      (projectName || "Project").replace(/[\\/:*?"<>|]/g, "").trim() ||
      "Project";
    const safeSupplier =
      (supplierName || "Supplier").replace(/[\\/:*?"<>|]/g, "").trim() ||
      "Supplier";
    return `Neo_${safeProject}_${safeSupplier}_${date}.pdf`;
  }, [formatDDMMYYYY, projectName, supplierName]);

  useEffect(() => {
    setClientSettings({
      includeProjectNotes: settings.includeProjectNotes,
      includeSectionNotes: settings.includeSectionNotes,
      includeItemNotes: settings.includeItemNotes,
      includeProductImages: settings.includeImages,
      includeProductUrls: settings.includeProductUrls,
    });
  }, [
    settings.includeImages,
    settings.includeItemNotes,
    settings.includeProductUrls,
    settings.includeProjectNotes,
    settings.includeSectionNotes,
  ]);

  const templateStyle = settings.templateStyle as TemplateStyle;

  const clientDoc = useMemo(() => {
    return (
      <ClientProjectPdfDocument
        projectName={projectName}
        clientName={clientName}
        dateLabel={new Date().toLocaleDateString("en-GB")}
        sections={sections}
        items={items}
        projectNotes={projectNotes}
        settings={clientSettings}
        templateStyle={templateStyle}
        includeLogo={settings.includeLogo}
        imageByProductId={imageByProductId}
        urlByProductId={urlByProductId}
        urlEnabledByItemId={urlEnabledByItemId}
      />
    );
  }, [
    clientName,
    clientSettings,
    imageByProductId,
    items,
    projectName,
    projectNotes,
    sections,
    settings.includeLogo,
    templateStyle,
    urlByProductId,
    urlEnabledByItemId,
  ]);

  const supplierDoc = useMemo(() => {
    const rfqItems = items.filter((i) => i.manufacturer_name === supplierName);
    const sectionsWithItems = sections.filter((s) =>
      rfqItems.some((i) => i.section_id === s.id),
    );
    return (
      <SupplierRfqPdfDocument
        projectName={projectName}
        clientName={clientName}
        dateLabel={new Date().toLocaleDateString("en-GB")}
        supplierName={supplierName}
        sections={sectionsWithItems}
        items={rfqItems}
        includeSectionNotes={includeRfqSectionNotes}
        supplierNotes={supplierNotes}
        templateStyle={templateStyle}
      />
    );
  }, [
    clientName,
    includeRfqSectionNotes,
    items,
    projectName,
    sections,
    supplierName,
    supplierNotes,
    templateStyle,
  ]);

  const buildClientPdfBlob = useCallback(async () => {
    return await pdf(clientDoc).toBlob();
  }, [clientDoc]);

  const buildSupplierPdfBlob = useCallback(async () => {
    return await pdf(supplierDoc).toBlob();
  }, [supplierDoc]);

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
    void (async () => {
      setRegenerating(true);
      try {
        await loadData();
      } finally {
        setTimeout(() => setRegenerating(false), 400);
      }
    })();
  }, [loadData]);

  const handleReset = useCallback(() => {
    setSettings((s) => ({
      ...s,
      templateStyle: "Professional",
      includeLogo: true,
      includeImages: true,
      includeProjectNotes: false,
      includeSectionNotes: true,
      includeItemNotes: true,
      includeProductUrls: false,
    }));
    setUrlEnabledByItemId({});
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const blob =
      activeTab === "supplier"
        ? await buildSupplierPdfBlob()
        : await buildClientPdfBlob();
    downloadBlob(
      blob,
      activeTab === "supplier" ? supplierFileName : clientFileName,
    );
  }, [
    activeTab,
    buildClientPdfBlob,
    buildSupplierPdfBlob,
    clientFileName,
    downloadBlob,
    supplierFileName,
  ]);

  const handleGeneratePdf = useCallback(async () => {
    const blob =
      activeTab === "supplier"
        ? await buildSupplierPdfBlob()
        : await buildClientPdfBlob();
    openBlobInNewTab(blob);
  }, [activeTab, buildClientPdfBlob, buildSupplierPdfBlob, openBlobInNewTab]);

  const handlePrint = useCallback(async () => {
    const blob =
      activeTab === "supplier"
        ? await buildSupplierPdfBlob()
        : await buildClientPdfBlob();
    openBlobInNewTab(blob);
  }, [activeTab, buildClientPdfBlob, buildSupplierPdfBlob, openBlobInNewTab]);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    const subj = `Neo – ${projectName} – ${clientName || ""}`.trim();
    setEmailSubject(subj);
    setEmailBody(
      `Hi,\n\nPlease find the attached PDF for ${projectName}${clientName ? ` (${clientName})` : ""}.\n\nRegards,`,
    );
  }, [clientName, projectName]);

  const blobToBase64 = useCallback(async (blob: Blob) => {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }, []);

  const sendEmail = useCallback(
    async ({
      to,
      cc,
      subject,
      body,
    }: {
      to: string;
      cc: string;
      subject: string;
      body: string;
    }) => {
      if (!to.trim()) {
        setEmailError("To is required.");
        return;
      }
      if (!subject.trim()) {
        setEmailError("Subject is required.");
        return;
      }
      setEmailError(null);
      setEmailSuccess(false);
      setEmailSending(true);
      try {
        const isRfq = activeTab === "supplier";
        const blob = isRfq
          ? await buildSupplierPdfBlob()
          : await buildClientPdfBlob();
        const filename = isRfq ? supplierFileName : clientFileName;
        const pdfBase64 = await blobToBase64(blob);

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? "";
        if (!accessToken) {
          throw new Error("Unauthorised");
        }

        // Get manufacturer id for RFQ logs
        let manufacturerId: string | null = null;
        if (isRfq && supplierName) {
          const { data: mfr } = await supabase
            .from("manufacturers")
            .select("id")
            .eq("name", supplierName)
            .single();
          manufacturerId = mfr?.id ?? null;
        }

        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to,
            cc: cc.trim() || null,
            subject,
            body,
            pdfBase64,
            filename,
            projectId,
            manufacturerId,
            emailType: isRfq ? "supplier_rfq" : "client_pdf",
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) throw new Error(payload.error || "Failed to send email");

        // Removed duplicate frontend logging block — backend handles it

        setEmailSuccess(true);
      } catch (e) {
        setEmailError(e instanceof Error ? e.message : "Failed to send email");
      } finally {
        setEmailSending(false);
      }
    },
    [
      activeTab,
      blobToBase64,
      buildClientPdfBlob,
      buildSupplierPdfBlob,
      clientFileName,
      projectId,
      supplierFileName,
      supplierName,
    ],
  );

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
          {loading ? (
            <p className="mt-1 text-[11px] font-medium text-emerald-100/70">
              Loading project…
            </p>
          ) : regenerating ? (
            <p className="mt-1 text-[11px] font-medium text-emerald-100/70">
              Regenerating…
            </p>
          ) : error ? (
            <p className="mt-1 text-[11px] font-medium text-red-200/90">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 sm:pt-1">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={loading || regenerating || !projectId}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={
              loading ||
              !projectId ||
              (activeTab === "supplier" && !supplierName)
            }
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <PdfPreviewPanel
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          document={activeTab === "supplier" ? supplierDoc : clientDoc}
          onRegenerate={handleRegenerate}
          onPrint={() => void handlePrint()}
          showEmail={userRole !== "external"}
          onEmail={() => {
            void (async () => {
              setEmailOpen(true);
              setEmailError(null);
              setEmailSuccess(false);
              setEmailCc("");

              // Prefill To + Subject from manufacturer profile for RFQ
              if (activeTab === "supplier" && supplierName) {
                const { data: mfr } = await supabase
                  .from("manufacturers")
                  .select("default_rfq_email, default_rfq_subject_template")
                  .eq("name", supplierName)
                  .single<{
                    default_rfq_email: string | null;
                    default_rfq_subject_template: string | null;
                  }>();

                setEmailTo(mfr?.default_rfq_email ?? "");
                setEmailSubject(
                  mfr?.default_rfq_subject_template
                    ? mfr.default_rfq_subject_template
                        .replace("{project_name}", projectName)
                        .replace("{client_name}", clientName)
                        .replace("{supplier_name}", supplierName)
                    : emailSubject, 
                );
              } else {
                // Client PDF - clear to, keep existing subject
                setEmailTo("");
              }
            })();
          }}
        />
        <PdfExportSettingsCard
          settings={settings}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onGenerate={handleGeneratePdf}
          onDownload={handleDownloadPdf}
          onPrint={handlePrint}
          activeTab={activeTab}
          manufacturers={manufacturersInProject}
          supplierName={supplierName}
          onSupplierNameChange={(name) => {
            setSupplierName(name);
            void loadSupplierNotes(name);
          }}
          includeRfqSectionNotes={includeRfqSectionNotes}
          onIncludeRfqSectionNotesChange={setIncludeRfqSectionNotes}
          supplierNotes={supplierNotes}
          onSupplierNotesChange={setSupplierNotes}
          onSaveSupplierNotes={() => void saveSupplierNotes()}
          savingSupplierNotes={savingSupplierNotes}
          rfqSentMap={rfqSentMap}
          onGenerateSupplier={() => {
            void (async () => {
              const blob = await buildSupplierPdfBlob();
              openBlobInNewTab(blob);
            })();
          }}
          itemsForUrlToggles={items.map((it) => ({
            id: it.id,
            name: it.product_name,
          }))}
          urlEnabledByItemId={urlEnabledByItemId}
          onToggleItemUrl={(itemId, next) =>
            setUrlEnabledByItemId((prev) => ({ ...prev, [itemId]: next }))
          }
        />
      </div>

      <EmailPdfModal
        open={emailOpen}
        onClose={() => {
          setEmailOpen(false);
          setEmailError(null);
          setEmailSuccess(false);
        }}
        to={emailTo}
        cc={emailCc}
        subject={emailSubject}
        body={emailBody}
        onToChange={setEmailTo}
        onCcChange={setEmailCc}
        onSubjectChange={setEmailSubject}
        onBodyChange={setEmailBody}
        onSend={({ to, cc, subject, body }) => {
          void sendEmail({ to, cc, subject, body });
        }}
        sending={emailSending}
        error={emailError}
        success={emailSuccess}
      />
    </div>
  );
}
