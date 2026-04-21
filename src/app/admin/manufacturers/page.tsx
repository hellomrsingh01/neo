"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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
import { useCallback, useEffect, useState } from "react";

type Manufacturer = {
  id: string;
  name: string;
  slug: string;
  default_rfq_email: string | null;
  default_rfq_subject_template: string | null;
  sort_order: number;
  is_archived: boolean;
};

type ManufacturerForm = {
  name: string;
  default_rfq_email: string;
  default_rfq_subject_template: string;
};

const emptyForm: ManufacturerForm = {
  name: "",
  default_rfq_email: "",
  default_rfq_subject_template: "",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className ?? "h-4 w-4 text-gray-400"}
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
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (handleProps: any) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners ?? {})}
    </div>
  );
}

export default function AdminManufacturersPage() {
  const router = useRouter();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newManufacturer, setNewManufacturer] =
    useState<ManufacturerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingManufacturer, setEditingManufacturer] =
    useState<ManufacturerForm>(emptyForm);

  const [activeManufacturerId, setActiveManufacturerId] =
    useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadManufacturers = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("manufacturers")
      .select(
        "id, name, slug, default_rfq_email, default_rfq_subject_template, sort_order, is_archived",
      )
      .order("sort_order", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setManufacturers((data ?? []) as Manufacturer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle<{ role: string | null }>();

      if (profile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setIsAdmin(true);
      setAdminChecked(true);
      void loadManufacturers();
    };

    void checkAdmin();
  }, [loadManufacturers, router]);

  const persistOrder = useCallback(
    async (nextManufacturers: Manufacturer[]) => {
      setSaving(true);
      const updates = nextManufacturers.map((item, index) =>
        supabase
          .from("manufacturers")
          .update({ sort_order: index })
          .eq("id", item.id),
      );
      const results = await Promise.all(updates);
      const hasError = results.some((res) => res.error);
      setSaving(false);
      if (hasError) {
        alert("Failed to reorder manufacturers.");
        await loadManufacturers();
        return;
      }
      setManufacturers(
        nextManufacturers.map((item, index) => ({
          ...item,
          sort_order: index,
        })),
      );
    },
    [loadManufacturers],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveManufacturerId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = manufacturers.findIndex((m) => m.id === String(active.id));
    const newIndex = manufacturers.findIndex((m) => m.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void persistOrder(arrayMove(manufacturers, oldIndex, newIndex));
  };

  const activeManufacturer = activeManufacturerId
    ? manufacturers.find((m) => m.id === String(activeManufacturerId))
    : null;

  const addManufacturer = async () => {
    const name = newManufacturer.name.trim();
    if (!name) return;
    setSaving(true);

    const maxSort = manufacturers.reduce(
      (max, item) => Math.max(max, item.sort_order),
      -1,
    );
    const { error: insertError } = await supabase.from("manufacturers").insert({
      name,
      slug: slugify(name),
      default_rfq_email: newManufacturer.default_rfq_email.trim() || null,
      default_rfq_subject_template:
        newManufacturer.default_rfq_subject_template.trim() || null,
      is_archived: false,
      sort_order: maxSort + 1,
    });

    setSaving(false);
    if (insertError) {
      alert(insertError.message);
      return;
    }

    setNewManufacturer(emptyForm);
    await loadManufacturers();
  };

  const startEdit = (manufacturer: Manufacturer) => {
    setEditingId(manufacturer.id);
    setEditingManufacturer({
      name: manufacturer.name,
      default_rfq_email: manufacturer.default_rfq_email ?? "",
      default_rfq_subject_template:
        manufacturer.default_rfq_subject_template ?? "",
    });
  };

  const saveManufacturer = async () => {
    if (!editingId) return;
    const name = editingManufacturer.name.trim();
    if (!name) return;
    setSaving(true);

    const { error: updateError } = await supabase
      .from("manufacturers")
      .update({
        name,
        slug: slugify(name),
        default_rfq_email: editingManufacturer.default_rfq_email.trim() || null,
        default_rfq_subject_template:
          editingManufacturer.default_rfq_subject_template.trim() || null,
      })
      .eq("id", editingId);

    setSaving(false);
    if (updateError) {
      alert(updateError.message);
      return;
    }

    setEditingId(null);
    await loadManufacturers();
  };

  const setArchived = async (
    manufacturer: Manufacturer,
    isArchived: boolean,
  ) => {
    if (
      isArchived &&
      !window.confirm(
        "Archiving will also archive all products by this manufacturer. Continue?",
      )
    ) {
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("manufacturers")
      .update({ is_archived: isArchived })
      .eq("id", manufacturer.id);
    setSaving(false);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    if (isArchived) {
      const { error: productsArchiveError } = await supabase
        .from("products")
        .update({ is_archived: true })
        .eq("manufacturer_id", manufacturer.id);

      if (productsArchiveError) {
        alert(
          `Manufacturer archived, but product archiving failed. Products may need manual archiving. Error: ${productsArchiveError.message}`,
        );
      }
    }

    await loadManufacturers();
  };

  if (!adminChecked || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#003c33] text-white">
        <Header />
        <main className="flex-1 w-full px-4 pt-6 sm:px-6">
          <div className="mx-auto w-full max-w-[1240px] rounded-[18px] bg-white p-6 text-gray-900">
            Checking access...
          </div>
        </main>
        <div className="w-full px-4 pb-6 sm:px-6">
          <div className="mx-auto w-full max-w-[1240px]">
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#003c33] text-white">
      <Header />
      <main className="flex-1 w-full px-4 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <section className="rounded-[18px] bg-white p-6 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-emerald-950">
                Manufacturer Management
              </h1>
              {saving ? (
                <span className="text-xs font-semibold text-gray-500">
                  Saving...
                </span>
              ) : null}
            </div>
            {error ? (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            ) : null}
            {loading ? (
              <p className="mt-3 text-sm text-gray-600">
                Loading manufacturers...
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input
                value={newManufacturer.name}
                onChange={(e) =>
                  setNewManufacturer((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Manufacturer name"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <input
                value={newManufacturer.default_rfq_email}
                onChange={(e) =>
                  setNewManufacturer((prev) => ({
                    ...prev,
                    default_rfq_email: e.target.value,
                  }))
                }
                placeholder="Default RFQ email"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <input
                value={newManufacturer.default_rfq_subject_template}
                onChange={(e) =>
                  setNewManufacturer((prev) => ({
                    ...prev,
                    default_rfq_subject_template: e.target.value,
                  }))
                }
                placeholder="Default RFQ subject template"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <button
                type="button"
                onClick={addManufacturer}
                className="h-10 rounded-[12px] bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Add Manufacturer
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(e: DragStartEvent) =>
                setActiveManufacturerId(e.active.id)
              }
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveManufacturerId(null)}
            >
              <div className="mt-5 space-y-3">
                <SortableContext
                  items={manufacturers.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {manufacturers.map((manufacturer) => (
                    <SortableItem key={manufacturer.id} id={manufacturer.id}>
                      {(handleProps) => (
                        <div className="grid gap-3 rounded-[14px] bg-gray-50 p-3 ring-1 ring-gray-200 items-center md:grid-cols-[auto_1fr_auto]">
                          {/* Drag handle */}
                          <div
                            {...handleProps}
                            className="flex items-center justify-center self-stretch cursor-grab active:cursor-grabbing rounded-lg px-2 hover:bg-gray-200 transition-colors"
                          >
                            <DragHandleIcon className="h-4 w-4 text-gray-400" />
                          </div>

                          {/* Name / edit inputs */}
                          {editingId === manufacturer.id ? (
                            <div className="grid gap-2 md:grid-cols-3">
                              <input
                                value={editingManufacturer.name}
                                onChange={(e) =>
                                  setEditingManufacturer((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="h-9 rounded-[10px] bg-white px-3 text-sm ring-1 ring-gray-200"
                              />
                              <input
                                value={editingManufacturer.default_rfq_email}
                                onChange={(e) =>
                                  setEditingManufacturer((prev) => ({
                                    ...prev,
                                    default_rfq_email: e.target.value,
                                  }))
                                }
                                className="h-9 rounded-[10px] bg-white px-3 text-sm ring-1 ring-gray-200"
                              />
                              <input
                                value={
                                  editingManufacturer.default_rfq_subject_template
                                }
                                onChange={(e) =>
                                  setEditingManufacturer((prev) => ({
                                    ...prev,
                                    default_rfq_subject_template:
                                      e.target.value,
                                  }))
                                }
                                className="h-9 rounded-[10px] bg-white px-3 text-sm ring-1 ring-gray-200"
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-gray-800">
                              <div className="font-semibold text-gray-900">
                                {manufacturer.name}
                                <span className="ml-2 text-xs font-medium text-gray-500">
                                  ({manufacturer.slug})
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                Email: {manufacturer.default_rfq_email || "—"} ·
                                Subject:{" "}
                                {manufacturer.default_rfq_subject_template ||
                                  "—"}{" "}
                                · sort: {manufacturer.sort_order} ·{" "}
                                {manufacturer.is_archived
                                  ? "Archived"
                                  : "Active"}
                              </div>
                            </div>
                          )}

                          {/* Actions — Edit / Archive / Unarchive unchanged */}
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {editingId === manufacturer.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveManufacturer}
                                  className="h-8 rounded-lg bg-emerald-900 px-3 text-xs font-semibold text-white"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(manufacturer)}
                                  className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                                >
                                  Edit
                                </button>
                                {manufacturer.is_archived ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setArchived(manufacturer, false)
                                    }
                                    className="h-8 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white"
                                  >
                                    Unarchive
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setArchived(manufacturer, true)
                                    }
                                    className="h-8 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white"
                                  >
                                    Archive
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </SortableContext>
              </div>

              <DragOverlay>
                {activeManufacturer ? (
                  <div className="rounded-[14px] bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-2xl ring-1 ring-black/10 opacity-90">
                    {activeManufacturer.name}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </section>
        </div>
      </main>
      <div className="w-full px-4 pb-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <Footer />
        </div>
      </div>
    </div>
  );
}
