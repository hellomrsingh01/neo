"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type UserRole = "admin" | "internal" | "external";

type Section = {
  id: string;
  name: string;
  sort_order: number;
  notes: string | null;
};

type Item = {
  id: string;
  project_id: string;
  section_id: string;
  product_id: string;
  quantity: number;
  client_notes: string | null;
  supplier_notes: string | null;
  sort_order: number;
  product_name: string;
  manufacturer_name: string;
  product_type: string;
  product_is_archived: boolean;
  tags: string[];
};

type ProjectRow = {
  id: string;
  name: string;
  project_type: "internal" | "external";
  owner_user_id: string;
  client_name: string | null;
  internal_reference: string | null;
  projectnotes: string | null;
};

const tempId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function SortableSectionRow({
  section,
  activeSection,
  activeSectionId,
  onClick,
  children,
}: {
  section: Section;
  activeSection: Section | null | undefined;
  activeSectionId: string | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: section.id,
      data: { type: "section" },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        "group w-full flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all text-left cursor-pointer",
        activeSectionId === section.id ? "bg-emerald-50" : "hover:bg-gray-50",
        activeSection?.id === section.id
          ? "ring-2 ring-emerald-400 scale-[1.02]"
          : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SortableItemRow({
  item,
  sectionItems,
  activeItem,
  className,
  children,
}: {
  item: Item;
  sectionItems: Item[];
  activeItem: Item | null | undefined;
  className: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
      data: { type: "item" },
    });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-index={sectionItems.findIndex((i) => i.id === item.id)}
      className={`${className} ${activeItem?.id === item.id ? "ring-2 ring-emerald-400 scale-[1.02]" : ""}`}
    >
      {children}
    </tr>
  );
}

function normalizeItemsForSections(sections: Section[], items: Item[]): Item[] {
  const next: Item[] = [];
  for (const section of sections) {
    const inSection = items.filter((i) => i.section_id === section.id);
    inSection.forEach((item, idx) => {
      next.push({ ...item, section_id: section.id, sort_order: idx });
    });
  }
  return next;
}

function matchesSearch(item: Item, needle: string, sectionNotes: string = "") {
  if (!needle) return true;
  const haystack = [
    item.product_name,
    item.manufacturer_name,
    item.product_type,
    item.tags.join(" "),
    item.client_notes ?? "",
    item.supplier_notes ?? "",
    sectionNotes,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export default function ProjectBoardDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const fromExternalBoards = searchParams.get("source") === "external-boards";
  const backHref = fromExternalBoards
    ? "/dashboard/external-boards"
    : "/dashboard/project-board";
  const backLabel = fromExternalBoards
    ? "Back to External Boards"
    : "Back to Projects";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [projectName, setProjectName] = useState("Project");
  const [clientName, setClientName] = useState("");
  const [internalRef, setInternalRef] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [metaEditing, setMetaEditing] = useState<"client" | "internal" | null>(
    null,
  );

  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");

  const [dirty, _setDirty] = useState(false);
  const setDirty = (value: boolean) => {
    if (value) dirtyTickRef.current += 1;
    _setDirty(value);
  };
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const deletedSectionIds = useRef<string[]>([]);
  const deletedItemIds = useRef<string[]>([]);
  const dirtyTickRef = useRef(0);

  const [editingSectionNameId, setEditingSectionNameId] = useState<
    string | null
  >(null);
  const [expandedClient, setExpandedClient] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedSupplier, setExpandedSupplier] = useState<
    Record<string, boolean>
  >({});
  const [lastRfqSent, setLastRfqSent] = useState<string | null>(null);
  const [showAdminAccessBadge, setShowAdminAccessBadge] = useState(false);
  const [viewerRole, setViewerRole] = useState<UserRole | null>(null);
  const [duplicatingToInternal, setDuplicatingToInternal] = useState(false);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const searchNeedle = search.trim().toLowerCase();

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
      .maybeSingle<{ role: UserRole | null }>();

    if (profileError || !profile?.role) {
      setError("Failed to validate user role.");
      setLoading(false);
      return;
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, name, project_type, owner_user_id, client_name, internal_reference, projectnotes",
      )
      .eq("id", projectId)
      .is("archived_at", null)
      .maybeSingle<ProjectRow>();

    if (projectError || !project) {
      setError("Project not found.");
      setLoading(false);
      return;
    }

    const role = profile.role;
    setViewerRole(role);
    const isOwner = project.owner_user_id === currentUser.id;
    const canView =
      role === "admin" ||
      (role === "internal" &&
        (project.project_type === "internal"
          ? isOwner
          : project.project_type === "external")) ||
      (role === "external" && isOwner && project.project_type === "external");

    if (!canView) {
      setError("You do not have access to this project.");
      setLoading(false);
      return;
    }

    // Upsert last_viewed_at (fire and forget)
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? null;
    if (accessToken) {
      void fetch(`/api/projects/${projectId}/view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    const editable =
      role === "admin" ||
      (role === "internal" && isOwner && project.project_type === "internal") ||
      (role === "external" && isOwner && project.project_type === "external");

    setCanEdit(editable);
    setShowAdminAccessBadge(role === "admin" && !isOwner && fromExternalBoards);
    setProjectName(project.name);
    setClientName(project.client_name ?? "");
    setInternalRef(project.internal_reference ?? "");
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

    let resolvedSections = (sectionRows ?? []) as Section[];
    if (editable && resolvedSections.length === 0) {
      const { data: insertedSection, error: insertSectionError } =
        await supabase
          .from("project_sections")
          .insert({ project_id: projectId, name: "General", sort_order: 0 })
          .select("id, name, sort_order, notes")
          .single<Section>();
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

    const baseItems =
      (itemRows as Array<
        Omit<
          Item,
          | "product_name"
          | "manufacturer_name"
          | "product_type"
          | "product_is_archived"
          | "tags"
        >
      >) ?? [];
    const productIds = Array.from(
      new Set(baseItems.map((item) => item.product_id)),
    );

    const productsById = new Map<
      string,
      {
        name: string;
        manufacturer_id: string | null;
        product_type: string | null;
        is_archived: boolean | null;
      }
    >();
    const tagsByProductId = new Map<string, string[]>();
    const manufacturerById = new Map<string, string>();

    if (productIds.length > 0) {
      const { data: productRows } = await supabase
        .from("products")
        .select("id, name, manufacturer_id, product_type, is_archived")
        .in("id", productIds);

      for (const product of (productRows ?? []) as Array<{
        id: string;
        name: string;
        manufacturer_id: string | null;
        product_type: string | null;
        is_archived: boolean | null;
      }>) {
        productsById.set(product.id, {
          name: product.name,
          manufacturer_id: product.manufacturer_id,
          product_type: product.product_type,
          is_archived: product.is_archived,
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
        .in("product_id", productIds);
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

    const hydratedItems: Item[] = baseItems.map((item) => {
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
        product_is_archived: Boolean(product?.is_archived),
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

    const { data: rfqLog } = await supabase
      .from("project_email_logs")
      .select("sent_at")
      .eq("project_id", projectId)
      .eq("email_type", "rfq")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rfqLog)
      setLastRfqSent((rfqLog as { sent_at?: string | null }).sent_at ?? null);
    deletedItemIds.current = [];
    deletedSectionIds.current = [];
    setDirty(false);
    setSaving(false);
    setLastSavedAt(Date.now());
    setLoading(false);
  }, [fromExternalBoards, projectId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveAll = useCallback(async () => {
    if (!projectId || !canEdit || !dirty || saving) return;
    setSaving(true);
    setError("");
    const tickBeforeSave = dirtyTickRef.current;

    try {
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({
          client_name: clientName.trim() || null,
          internal_reference: internalRef.trim() || null,
          projectnotes: projectNotes.trim() || null,
        })
        .eq("id", projectId);
      if (projectUpdateError) throw new Error(projectUpdateError.message);

      const sectionMap = new Map<string, string>();

      for (let index = 0; index < sections.length; index += 1) {
        const section = sections[index];
        if (section.id.startsWith("tmp-section-")) {
          const { data: inserted, error: insertError } = await supabase
            .from("project_sections")
            .insert({
              project_id: projectId,
              name: section.name,
              sort_order: index,
              notes: section.notes,
            })
            .select("id")
            .single<{ id: string }>();
          if (insertError || !inserted)
            throw new Error(
              insertError?.message || "Failed to create section.",
            );
          sectionMap.set(section.id, inserted.id);
        } else {
          sectionMap.set(section.id, section.id);
        }
      }

      const resolvedSections = sections.map((section, index) => ({
        ...section,
        id: sectionMap.get(section.id) ?? section.id,
        sort_order: index,
      }));

      for (const section of resolvedSections) {
        const { error: sectionUpdateError } = await supabase
          .from("project_sections")
          .update({
            name: section.name,
            sort_order: section.sort_order,
            notes: section.notes,
          })
          .eq("id", section.id);
        if (sectionUpdateError) throw new Error(sectionUpdateError.message);
      }

      for (const sectionId of deletedSectionIds.current) {
        const { error: deleteSectionError } = await supabase
          .from("project_sections")
          .delete()
          .eq("id", sectionId);
        if (deleteSectionError) throw new Error(deleteSectionError.message);
      }
      deletedSectionIds.current = [];

      const itemsWithSections = normalizeItemsForSections(
        resolvedSections,
        items.map((item) => ({
          ...item,
          section_id: sectionMap.get(item.section_id) ?? item.section_id,
        })),
      );

      const itemIdMap = new Map<string, string>();

      for (const section of resolvedSections) {
        const sectionItems = itemsWithSections.filter(
          (i) => i.section_id === section.id,
        );
        for (let idx = 0; idx < sectionItems.length; idx += 1) {
          const item = sectionItems[idx];
          const payload = {
            section_id: section.id,
            quantity: Math.max(1, item.quantity),
            client_notes: item.client_notes || null,
            supplier_notes: item.supplier_notes || null,
            sort_order: idx,
          };
          if (item.id.startsWith("tmp-item-")) {
            const { data: insertedItem, error: insertItemError } =
              await supabase
                .from("project_items")
                .insert({
                  project_id: projectId,
                  product_id: item.product_id,
                  ...payload,
                })
                .select("id")
                .single<{ id: string }>();
            if (insertItemError || !insertedItem)
              throw new Error(
                insertItemError?.message ?? "Failed to insert item.",
              );
            itemIdMap.set(item.id, insertedItem.id);
          } else {
            const { error: updateItemError } = await supabase
              .from("project_items")
              .update(payload)
              .eq("id", item.id);
            if (updateItemError) throw new Error(updateItemError.message);
          }
        }
      }

      for (const itemId of deletedItemIds.current) {
        const { error: deleteItemError } = await supabase
          .from("project_items")
          .delete()
          .eq("id", itemId);
        if (deleteItemError) throw new Error(deleteItemError.message);
      }
      deletedItemIds.current = [];

      const { error: touchProjectError } = await supabase
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (touchProjectError) throw new Error(touchProjectError.message);

      // Update sections in-place: swap any tmp IDs → real DB IDs
      setSections(resolvedSections);

      // Update items in-place: swap tmp section IDs and tmp item IDs → real DB IDs
      setItems((prev) =>
        normalizeItemsForSections(
          resolvedSections,
          prev.map((item) => ({
            ...item,
            id: itemIdMap.get(item.id) ?? item.id,
            section_id: sectionMap.get(item.section_id) ?? item.section_id,
          })),
        ),
      );

      if (dirtyTickRef.current === tickBeforeSave) {
        setDirty(false);
      }
      setLastSavedAt(Date.now());
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save project changes.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [
    canEdit,
    clientName,
    dirty,
    internalRef,
    items,
    projectNotes,
    projectId,
    saving,
    sections,
  ]);

  useEffect(() => {
    if (!dirty || !canEdit || saving) return;
    const timer = setTimeout(() => {
      console.log("Auto-saving...");
      saveAll();
    }, 2000);
    return () => clearTimeout(timer);
  }, [dirty, canEdit, saving, saveAll]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty && !saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, saving]);

  const statusText = saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved";
  const canDuplicateToInternal =
    fromExternalBoards && viewerRole === "internal" && !canEdit;

  const handleDuplicateToInternal = useCallback(async () => {
    if (!projectId || !canDuplicateToInternal || duplicatingToInternal) return;

    setDuplicatingToInternal(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      if (!accessToken) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`/api/projects/${projectId}/duplicate-to-internal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await res.json().catch(() => ({}))) as {
        projectId?: string;
        error?: string;
      };

      if (!res.ok || !payload.projectId) {
        setError(payload.error ?? "Failed to duplicate project.");
        return;
      }

      router.push(`/dashboard/project-board/${payload.projectId}`);
    } finally {
      setDuplicatingToInternal(false);
    }
  }, [canDuplicateToInternal, duplicatingToInternal, projectId, router]);

  const addSection = () => {
    if (!canEdit) return;
    setSections((prev) => [
      ...prev,
      {
        id: tempId("tmp-section"),
        name: `Section ${prev.length + 1}`,
        sort_order: prev.length,
        notes: null,
      },
    ]);
    setDirty(true);
  };

  const renameSection = (id: string, name: string) => {
    if (!canEdit) return;
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    setDirty(true);
  };

  const deleteSection = (id: string) => {
    if (!canEdit) return;
    setSections((prev) => {
      if (prev.length <= 1) return prev;
      const generalSection = prev[0];
      if (!generalSection || id === generalSection.id) return prev;
      const target = prev.find((s) => s.id === id);
      if (target && !target.id.startsWith("tmp-section-"))
        deletedSectionIds.current.push(target.id);
      const nextSections = prev
        .filter((s) => s.id !== id)
        .map((s, order) => ({ ...s, sort_order: order }));
      setItems((it) =>
        normalizeItemsForSections(
          nextSections,
          it.map((item) =>
            item.section_id === id
              ? { ...item, section_id: generalSection.id }
              : item,
          ),
        ),
      );
      return nextSections;
    });
    setDirty(true);
  };

  const updateItem = (id: string, patch: Partial<Item>) => {
    if (!canEdit) return;
    setItems((prev) =>
      normalizeItemsForSections(
        sections,
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    );
    setDirty(true);
  };

  const removeItem = (id: string) => {
    if (!canEdit) return;
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && !target.id.startsWith("tmp-item-"))
        deletedItemIds.current.push(target.id);
      return normalizeItemsForSections(
        sections,
        prev.filter((item) => item.id !== id),
      );
    });
    setDirty(true);
  };

  const duplicateItem = (id: string) => {
    if (!canEdit) return;
    setItems((prev) => {
      const source = prev.find((item) => item.id === id);
      if (!source) return prev;
      const dup = { ...source, id: tempId("tmp-item") };
      const idx = prev.findIndex((i) => i.id === id);
      const next = [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)];
      return normalizeItemsForSections(sections, next);
    });
    setDirty(true);
  };

  const handleAddItem = (sectionId: string) => {
    if (!canEdit) return;
    router.push(
      `/dashboard/product-catalogue?projectId=${encodeURIComponent(projectId ?? "")}&sectionId=${encodeURIComponent(sectionId)}`,
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) {
      setActiveId(null);
      return;
    }
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === "section") {
      if (!sections.some((s) => s.id === String(over.id))) return;
      if (active.id !== over.id) {
        setSections((prev) => {
          const oldIndex = prev.findIndex((x) => x.id === active.id);
          const newIndex = prev.findIndex((x) => x.id === over.id);
          if (oldIndex < 0 || newIndex < 0) return prev;
          const next = arrayMove(prev, oldIndex, newIndex).map(
            (s: Section, i: number) => ({ ...s, sort_order: i }),
          );
          setItems((it) => normalizeItemsForSections(next, it));
          return next;
        });
        setDirty(true);
      }
      return;
    }

    if (activeType !== "item") return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    setItems((prev) => {
      const normalized = normalizeItemsForSections(sections, prev);
      const activeItem = normalized.find((i) => i.id === activeItemId);
      if (!activeItem) return prev;

      let targetSectionId: string;
      let targetIndexInSection: number;

      if (overId.startsWith("drop-")) {
        targetSectionId = overId.slice("drop-".length);
        const inTarget = normalized.filter(
          (i) => i.section_id === targetSectionId && i.id !== activeItemId,
        );
        targetIndexInSection = inTarget.length;
      } else {
        const overItem = normalized.find((i) => i.id === overId);
        if (!overItem) {
          const overSection = sections.find((s) => s.id === overId);
          if (!overSection) return prev;
          targetSectionId = overSection.id;
          const inTarget = normalized.filter(
            (i) => i.section_id === targetSectionId && i.id !== activeItemId,
          );
          targetIndexInSection = inTarget.length;
        } else {
          targetSectionId = overItem.section_id;
          const inTarget = normalized.filter(
            (i) => i.section_id === targetSectionId && i.id !== activeItemId,
          );
          targetIndexInSection = inTarget.findIndex((i) => i.id === overId);
          if (targetIndexInSection < 0) targetIndexInSection = inTarget.length;
        }
      }

      const without = normalized.filter((i) => i.id !== activeItemId);
      const inTarget = without.filter((i) => i.section_id === targetSectionId);
      const moved = { ...activeItem, section_id: targetSectionId };
      const newTarget = [...inTarget];
      newTarget.splice(targetIndexInSection, 0, moved);
      const bySection = new Map<string, Item[]>();
      for (const s of sections) {
        bySection.set(
          s.id,
          s.id === targetSectionId
            ? newTarget
            : without.filter((i) => i.section_id === s.id),
        );
      }
      const next: Item[] = [];
      for (const s of sections) {
        const list = bySection.get(s.id) ?? [];
        list.forEach((item, idx) =>
          next.push({ ...item, section_id: s.id, sort_order: idx }),
        );
      }
      return next;
    });
    setDirty(true);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;
  const activeSection = activeId
    ? sections.find((s) => s.id === activeId)
    : null;

  // ─── Loading & error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <main className="w-full max-w-[1240px] mx-auto px-4 pb-10 mt-6">
        <p className="text-sm font-medium text-emerald-100/80">
          Loading project…
        </p>
      </main>
    );
  }

  if (error && !canEdit) {
    return (
      <main className="w-full max-w-[1240px] mx-auto px-4 pb-10 mt-6 space-y-4">
        <p className="text-sm font-medium text-red-200">{error}</p>
        <Link
          href={backHref}
          className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {backLabel}
        </Link>
      </main>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const sectionNotesById = new Map(
    sections.map((section) => [section.id, section.notes ?? ""]),
  );

  const filteredItems = items.filter((item) => {
    const sectionMatch = activeSectionId
      ? item.section_id === activeSectionId
      : true;
    const sectionNotes = sectionNotesById.get(item.section_id) ?? "";
    const searchMatch = searchNeedle
      ? matchesSearch(item, searchNeedle, sectionNotes)
      : true;
    return sectionMatch && searchMatch;
  });

  if (loading) {
    return (
      <main className="mt-6">
        <p className="text-sm font-medium text-emerald-100/80">
          Loading project…
        </p>
      </main>
    );
  }

  if (error && !canEdit) {
    return (
      <main className="mt-6 space-y-4">
        <p className="text-sm font-medium text-red-200">{error}</p>
        <Link
          href={backHref}
          className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {backLabel}
        </Link>
      </main>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <main className="mt-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {projectName}
            </h1>
            {showAdminAccessBadge ? (
              <span className="mt-2 inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                Admin Access
              </span>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100/50">
                  Client Name
                </p>
                {metaEditing === "client" ? (
                  <input
                    autoFocus
                    value={clientName}
                    onChange={(e) => {
                      if (!canEdit) return;
                      setClientName(e.target.value);
                      setDirty(true);
                    }}
                    onBlur={() => setMetaEditing(null)}
                    disabled={!canEdit}
                    className="mt-1 h-8 w-52 rounded-lg border border-white/20 bg-white/10 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      setMetaEditing("client");
                    }}
                    className="mt-1 text-sm font-medium text-white/90 hover:underline"
                  >
                    {clientName.trim() || (canEdit ? "— Click to add" : "—")}
                  </button>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100/50">
                  Internal Reference
                </p>
                {metaEditing === "internal" ? (
                  <input
                    autoFocus
                    value={internalRef}
                    onChange={(e) => {
                      if (!canEdit) return;
                      setInternalRef(e.target.value);
                      setDirty(true);
                    }}
                    onBlur={() => setMetaEditing(null)}
                    disabled={!canEdit}
                    className="mt-1 h-8 w-52 rounded-lg border border-white/20 bg-white/10 px-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      setMetaEditing("internal");
                    }}
                    className="mt-1 text-sm font-medium text-white/90 hover:underline"
                  >
                    {internalRef.trim() || (canEdit ? "— Click to add" : "—")}
                  </button>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100/50">
                  Project Notes
                </p>
                <textarea
                  value={projectNotes}
                  onChange={(e) => {
                    if (!canEdit) return;
                    setProjectNotes(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Add project notes..."
                  rows={2}
                  maxLength={1000}
                  disabled={!canEdit}
                  className="mt-1 w-64 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            {canDuplicateToInternal ? (
              <button
                type="button"
                onClick={handleDuplicateToInternal}
                disabled={duplicatingToInternal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {duplicatingToInternal
                  ? "Duplicating..."
                  : "Duplicate to Internal Project"}
              </button>
            ) : null}
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-emerald-700"
            >
              {backLabel}
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200/80">
            <p className="text-sm font-medium text-gray-400">Total Items</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              {items.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200/80">
            <p className="text-sm font-medium text-gray-400">Total Units</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              {items.reduce((sum, i) => sum + i.quantity, 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200/80">
            <p className="text-sm font-medium text-gray-400">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <svg
                viewBox="0 0 20 20"
                className={`h-5 w-5 shrink-0 ${saving || dirty ? "text-amber-500" : "text-emerald-600"}`}
                fill="none"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M6.5 10.5l2.5 2.5 4.5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className={`text-base font-semibold ${saving || dirty ? "text-amber-600" : "text-emerald-700"}`}
              >
                {saving || dirty ? statusText : "All changes saved"}
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <p className="text-sm font-medium text-red-200">{error}</p>
        ) : null}

        {items.length >= 300 ? (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-medium text-amber-700">
            ⚠️ This project has {items.length} items. Large projects may affect
            performance.
          </div>
        ) : null}

        {/* ── Two-column layout ── */}
        <div className="flex gap-4 pb-10">
          {/* Left: Rooms / Sections sidebar */}
          <div className="w-[280px] shrink-0 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Rooms / Sections
              </h2>
            </div>
            <div className="p-3">
              {/* Add New Room — always visible, never scrolls */}
              <button
                type="button"
                onClick={addSection}
                disabled={!canEdit}
                className="mb-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center text-xl font-semibold leading-none text-emerald-700">
                  +
                </span>
                Add New Room
              </button>

              {/* Sections list — scrollable only when more than 5 */}
              <div
                className="space-y-1"
                style={{
                  maxHeight: sections.length > 5 ? "400px" : "none",
                  overflowY: sections.length > 5 ? "auto" : "visible",
                }}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sections.map((section) => (
                    <SortableSectionRow
                      key={section.id}
                      section={section}
                      activeSection={activeSection}
                      activeSectionId={activeSectionId}
                      onClick={() =>
                        setActiveSectionId(
                          section.id === activeSectionId ? null : section.id,
                        )
                      }
                    >
                      <div className="flex h-7 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 cursor-grab active:cursor-grabbing">
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3 w-3 text-gray-400"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <circle cx="5" cy="3.5" r="1.4" />
                          <circle cx="11" cy="3.5" r="1.4" />
                          <circle cx="5" cy="8" r="1.4" />
                          <circle cx="11" cy="8" r="1.4" />
                          <circle cx="5" cy="12.5" r="1.4" />
                          <circle cx="11" cy="12.5" r="1.4" />
                        </svg>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-emerald-700"
                          fill="none"
                          stroke="currentColor"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="8"
                            height="8"
                            rx="1.5"
                            strokeWidth="1.7"
                          />
                          <rect
                            x="13"
                            y="3"
                            width="8"
                            height="8"
                            rx="1.5"
                            strokeWidth="1.7"
                          />
                          <rect
                            x="3"
                            y="13"
                            width="8"
                            height="8"
                            rx="1.5"
                            strokeWidth="1.7"
                          />
                          <rect
                            x="13"
                            y="13"
                            width="8"
                            height="8"
                            rx="1.5"
                            strokeWidth="1.7"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        {editingSectionNameId === section.id ? (
                          <input
                            autoFocus
                            value={section.name}
                            onChange={(e) =>
                              renameSection(section.id, e.target.value)
                            }
                            onBlur={() => setEditingSectionNameId(null)}
                            onKeyDown={(e) => {
                              e.stopPropagation(); // prevent dnd-kit from eating space/arrow keys
                              if (e.key === "Enter" || e.key === "Escape")
                                setEditingSectionNameId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-lg border border-emerald-400 bg-white px-2 py-0.5 text-sm font-semibold text-gray-800 focus:outline-none"
                          />
                        ) : (
                          <p className="truncate text-sm font-semibold text-emerald-700 hover:text-emerald-600 transition-colors">
                            {section.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {
                            items.filter((i) => i.section_id === section.id)
                              .length
                          }{" "}
                          Items
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSectionNameId(section.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          aria-label="Rename section"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {sections.length > 1 &&
                          sections[0]?.id !== section.id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSection(section.id);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              aria-label="Delete section"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                      </div>
                    </SortableSectionRow>
                  ))}
                </SortableContext>
              </div>
            </div>
          </div>

          {/* Right: Content area */}
          <div className="flex-1 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 overflow-hidden flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, tags, notes..."
                className="h-9 w-64 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/pdf-export?projectId=${projectId}`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                >
                  Export
                </button>
                {lastRfqSent && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5 fill-amber-500"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    RFQ sent{" "}
                    {new Date(lastRfqSent).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleAddItem(activeSectionId ?? sections[0]?.id ?? "")
                  }
                  disabled={!canEdit}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600"
                >
                  <span className="text-lg font-bold leading-none">
                    +
                  </span>
                  Add Products
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px]">
              {/* Table */}
              {filteredItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center min-h-[300px] text-sm text-gray-400">
                  {activeSectionId
                    ? "No items in this section. Click Add Products to get started."
                    : "No items yet. Select a section or click Add Products."}
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      <th
                        className="sticky top-0 z-10 w-8 bg-gray-50 px-2 py-3"
                        aria-label="Drag"
                      />
                      <th className="sticky top-0 z-10 bg-gray-50 px-5 py-3 truncate text-sm text-emerald-700">
                        Product
                      </th>
                      <th className="sticky top-0 z-10 bg-gray-50 px-5 py-3 truncate text-sm text-emerald-700">
                        Manufacturer
                      </th>
                      <th className="sticky top-0 z-10 bg-gray-50 px-5 py-3 truncate text-sm text-emerald-700" >
                        Section
                      </th>
                      <th className="sticky top-0 z-10 w-32 bg-gray-50 px-5 py-3 truncate text-sm text-emerald-700">
                        Qty
                      </th>
                      <th className="sticky top-0 z-10 w-24 bg-gray-50 px-5 py-3 text-right truncate text-sm text-emerald-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeSectionId
                      ? sections.filter((s) => s.id === activeSectionId)
                      : sections
                    )
                      .filter((section) =>
                        filteredItems.some((i) => i.section_id === section.id),
                      )
                      .flatMap((section) => {
                        const sectionItems = filteredItems.filter(
                          (i) => i.section_id === section.id,
                        );

                        return [
                          <tr
                            key={`section-header-${section.id}`}
                            className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 border-t border-gray-100"
                          >
                            <td className="px-5 py-3 truncate text-sm font-semibold " colSpan={6} >
                              {section.name}
                            </td>
                          </tr>,
                          <tr
                            key={`section-notes-${section.id}`}
                            className="border-t border-gray-100"
                          >
                            <td className="px-5 py-2.5" colSpan={6}>
                              <textarea
                                rows={2}
                                placeholder="Add section notes..."
                                value={section.notes ?? ""}
                                onChange={(e) => {
                                  if (!canEdit) return;
                                  setSections((prev) =>
                                    prev.map((s) =>
                                      s.id === section.id
                                        ? { ...s, notes: e.target.value }
                                        : s,
                                    ),
                                  );
                                  setDirty(true);
                                }}
                                disabled={!canEdit}
                                className="w-full bg-transparent border-none px-0 py-0 text-xs text-gray-500 focus:outline-none focus:ring-0"
                              />
                            </td>
                          </tr>,
                          <SortableContext
                            key={`section-sort-${section.id}`}
                            items={sectionItems.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {sectionItems.flatMap((item) => [
                              <SortableItemRow
                                key={`item-${item.id}`}
                                item={item}
                                sectionItems={sectionItems}
                                activeItem={activeItem}
                                className="group border-t border-gray-100 hover:bg-gray-50/60 transition-colors transform"
                              >
                                <td className="px-2 py-3.5 w-8">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 cursor-grab active:cursor-grabbing">
                                    <svg
                                      viewBox="0 0 16 16"
                                      className="h-3.5 w-3.5 text-gray-400"
                                      fill="currentColor"
                                      aria-hidden="true"
                                    >
                                      <circle cx="5" cy="3.5" r="1.4" />
                                      <circle cx="11" cy="3.5" r="1.4" />
                                      <circle cx="5" cy="8" r="1.4" />
                                      <circle cx="11" cy="8" r="1.4" />
                                      <circle cx="5" cy="12.5" r="1.4" />
                                      <circle cx="11" cy="12.5" r="1.4" />
                                    </svg>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-emerald-700 hover:text-emerald-600 transition-colors">
                                      {item.product_name}
                                    </p>
                                    {item.product_is_archived ? (
                                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                                        Archived product
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-0.5 truncate text-xs text-gray-400">
                                    {item.product_type}
                                  </p>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-gray-600">
                                  {item.manufacturer_name}
                                </td>
                                <td className="px-5 py-3.5">
                                  <select
                                    value={item.section_id}
                                    onChange={(e) =>
                                      updateItem(item.id, {
                                        section_id: e.target.value,
                                      })
                                    }
                                    className="h-7 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600 px-2 focus:outline-none"
                                    aria-label="Section"
                                  >
                                    {sections.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateItem(item.id, {
                                          quantity: Math.max(
                                            1,
                                            item.quantity - 1,
                                          ),
                                        })
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
                                    >
                                      −
                                    </button>
                                    <span className="min-w-[28px] text-center text-sm font-bold text-gray-800">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateItem(item.id, {
                                          quantity: item.quantity + 1,
                                        })
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedClient((prev) => ({
                                          ...prev,
                                          [item.id]: !prev[item.id],
                                        }))
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                      aria-label="Toggle notes"
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        className={`h-4 w-4 transition-transform ${expandedClient[item.id] ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                      >
                                        <path
                                          d="M6 9l6 6 6-6"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => duplicateItem(item.id)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                      aria-label="Duplicate"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.id)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                                      aria-label="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </SortableItemRow>,
                              ...(expandedClient[item.id]
                                ? [
                                    <tr
                                      key={`item-notes-${item.id}`}
                                      className="border-t border-gray-100 bg-white"
                                    >
                                      <td className="px-5 py-4" colSpan={7}>
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                          <div>
                                            <div className="text-xs font-semibold text-gray-500">
                                              Client Notes
                                            </div>
                                            <textarea
                                              rows={3}
                                              placeholder="Add client notes..."
                                              value={item.client_notes ?? ""}
                                              onChange={(e) =>
                                                updateItem(item.id, {
                                                  client_notes: e.target.value,
                                                })
                                              }
                                              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            />
                                          </div>

                                          <div>
                                            <div className="flex items-center justify-between gap-3">
                                              <div className="text-xs font-semibold text-gray-500">
                                                Supplier Notes
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedSupplier(
                                                    (prev) => ({
                                                      ...prev,
                                                      [item.id]: !prev[item.id],
                                                    }),
                                                  )
                                                }
                                                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                                              >
                                                {expandedSupplier[item.id]
                                                  ? "Hide"
                                                  : "Show"}
                                              </button>
                                            </div>

                                            {expandedSupplier[item.id] ? (
                                              <textarea
                                                rows={3}
                                                placeholder="Add supplier notes..."
                                                value={
                                                  item.supplier_notes ?? ""
                                                }
                                                onChange={(e) =>
                                                  updateItem(item.id, {
                                                    supplier_notes:
                                                      e.target.value,
                                                  })
                                                }
                                                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                              />
                                            ) : null}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>,
                                  ]
                                : []),
                            ])}
                          </SortableContext>,
                        ];
                      })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-xs font-medium text-gray-400">
                Showing {filteredItems.length} of {items.length} items
              </p>
              <p className="text-xs font-medium text-gray-400">
                {lastSavedAt
                  ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </main>

      <DragOverlay>
        {activeItem ? (
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-2xl ring-1 ring-black/10">
            {activeItem.product_name}
          </div>
        ) : activeSection ? (
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-2xl ring-1 ring-black/10">
            {activeSection.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
