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
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

type CategoryForm = {
  name: string;
  icon_name: string;
  is_active: boolean;
};

type SubcategoryForm = {
  category_id: string;
  name: string;
  is_active: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const emptyCategoryForm: CategoryForm = {
  name: "",
  icon_name: "",
  is_active: true,
};

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

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeCategoryId, setActiveCategoryId] =
    useState<UniqueIdentifier | null>(null);
  const [activeSubcategoryId, setActiveSubcategoryId] =
    useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [newCategory, setNewCategory] =
    useState<CategoryForm>(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategory, setEditingCategory] =
    useState<CategoryForm>(emptyCategoryForm);

  const [newSubcategory, setNewSubcategory] = useState<SubcategoryForm>({
    category_id: "",
    name: "",
    is_active: true,
  });
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<
    string | null
  >(null);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryForm>(
    {
      category_id: "",
      name: "",
      is_active: true,
    },
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [categoriesRes, subcategoriesRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, icon_name, sort_order, is_active")
        .order("sort_order", { ascending: true }),
      supabase
        .from("subcategories")
        .select("id, category_id, name, slug, sort_order, is_active")
        .order("sort_order", { ascending: true }),
    ]);

    if (categoriesRes.error || subcategoriesRes.error) {
      setError(
        categoriesRes.error?.message ??
          subcategoriesRes.error?.message ??
          "Failed loading data.",
      );
      setLoading(false);
      return;
    }

    setCategories((categoriesRes.data ?? []) as Category[]);
    setSubcategories((subcategoriesRes.data ?? []) as Subcategory[]);
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
      void loadData();
    };

    void checkAdmin();
  }, [loadData, router]);

  const groupedSubcategories = useMemo(() => {
    const map = new Map<string, Subcategory[]>();
    for (const sub of subcategories) {
      const existing = map.get(sub.category_id) ?? [];
      existing.push(sub);
      map.set(sub.category_id, existing);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [subcategories]);

  const persistCategoryOrder = useCallback(
    async (nextCategories: Category[]) => {
      setSaving(true);
      const updates = nextCategories.map((item, index) =>
        supabase
          .from("categories")
          .update({ sort_order: index })
          .eq("id", item.id),
      );
      const results = await Promise.all(updates);
      const hasError = results.some((res) => res.error);
      setSaving(false);
      if (hasError) {
        alert("Failed to reorder categories.");
        await loadData();
      } else {
        setCategories(
          nextCategories.map((item, index) => ({ ...item, sort_order: index })),
        );
      }
    },
    [loadData],
  );

  const addCategory = async () => {
    const name = newCategory.name.trim();
    if (!name) return;
    setSaving(true);

    const maxSort = categories.reduce(
      (max, item) => Math.max(max, item.sort_order),
      -1,
    );
    const { error: insertError } = await supabase.from("categories").insert({
      name,
      slug: slugify(name),
      icon_name: newCategory.icon_name.trim() || null,
      is_active: newCategory.is_active,
      sort_order: maxSort + 1,
    });

    setSaving(false);
    if (insertError) {
      alert(insertError.message);
      return;
    }

    setNewCategory(emptyCategoryForm);
    await loadData();
  };

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategory({
      name: category.name,
      icon_name: category.icon_name ?? "",
      is_active: category.is_active,
    });
  };

  const saveCategory = async () => {
    if (!editingCategoryId) return;
    const name = editingCategory.name.trim();
    if (!name) return;
    setSaving(true);

    const { error: updateError } = await supabase
      .from("categories")
      .update({
        name,
        slug: slugify(name),
        icon_name: editingCategory.icon_name.trim() || null,
        is_active: editingCategory.is_active,
      })
      .eq("id", editingCategoryId);

    setSaving(false);
    if (updateError) {
      alert(updateError.message);
      return;
    }

    setEditingCategoryId(null);
    await loadData();
  };

  const deleteCategory = async (category: Category) => {
    const [
      { count: subCount, error: subCountError },
      { count: prodCount, error: prodCountError },
    ] = await Promise.all([
      supabase
        .from("subcategories")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category.id),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category.id),
    ]);

    if (subCountError || prodCountError) {
      alert(subCountError?.message ?? prodCountError?.message);
      return;
    }

    // Standard safety: do not delete categories that still have products assigned.
    // (Many schemas/RLS policies disallow nulling category_id; deleting would orphan products.)
    if ((prodCount ?? 0) > 0) {
      alert(
        `Cannot delete "${category.name}" because it still has ${prodCount} product${prodCount === 1 ? "" : "s"} assigned.\n\nMove/reassign those products to another category first, then try again.`,
      );
      return;
    }

    const confirmMessage =
      (subCount ?? 0) > 0
        ? `Delete category "${category.name}"?\n\n⚠️ This category contains ${subCount} subcategor${subCount === 1 ? "y" : "ies"}. Deleting it will also delete those subcategories.\n\nThis cannot be undone.`
        : `Delete category "${category.name}"?\n\nThis cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    setSaving(true);

    try {
      // Step 1 — delete subcategories (if any)
      if ((subCount ?? 0) > 0) {
        const { error: subDeleteError } = await supabase
          .from("subcategories")
          .delete()
          .eq("category_id", category.id);
        if (subDeleteError) throw subDeleteError;
      }

      // Step 2 — delete category
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);
      if (deleteError) throw deleteError;

      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setSaving(false);
    }
  };

  const persistSubcategoryOrder = useCallback(
    async (categoryId: string, nextSubcategories: Subcategory[]) => {
      setSaving(true);
      const updates = nextSubcategories.map((item, index) =>
        supabase
          .from("subcategories")
          .update({ sort_order: index })
          .eq("id", item.id),
      );
      const results = await Promise.all(updates);
      const hasError = results.some((res) => res.error);
      setSaving(false);
      if (hasError) {
        alert("Failed to reorder subcategories.");
        await loadData();
        return;
      }

      setSubcategories((prev) =>
        prev.map((item) => {
          if (item.category_id !== categoryId) return item;
          const idx = nextSubcategories.findIndex((x) => x.id === item.id);
          return idx === -1 ? item : { ...item, sort_order: idx };
        }),
      );
    },
    [loadData],
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCategoryId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === String(active.id));
    const newIndex = categories.findIndex((c) => c.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    void persistCategoryOrder(arrayMove(categories, oldIndex, newIndex));
  };

  const handleSubcategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSubcategoryId(null);
    if (!over || active.id === over.id) return;

    const activeSub = subcategories.find((s) => s.id === String(active.id));
    const overSub = subcategories.find((s) => s.id === String(over.id));

    if (!activeSub || !overSub || activeSub.category_id !== overSub.category_id)
      return;

    const list = groupedSubcategories.get(activeSub.category_id) ?? [];
    const oldIndex = list.findIndex((s) => s.id === String(active.id));
    const newIndex = list.findIndex((s) => s.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    void persistSubcategoryOrder(
      activeSub.category_id,
      arrayMove(list, oldIndex, newIndex),
    );
  };

  const activeCategory = activeCategoryId
    ? categories.find((c) => c.id === String(activeCategoryId))
    : null;

  const activeSubcategory = activeSubcategoryId
    ? subcategories.find((s) => s.id === String(activeSubcategoryId))
    : null;

  const addSubcategory = async () => {
    const name = newSubcategory.name.trim();
    if (!newSubcategory.category_id || !name) return;
    setSaving(true);

    const siblings = subcategories.filter(
      (item) => item.category_id === newSubcategory.category_id,
    );
    const maxSort = siblings.reduce(
      (max, item) => Math.max(max, item.sort_order),
      -1,
    );

    const { error: insertError } = await supabase.from("subcategories").insert({
      category_id: newSubcategory.category_id,
      name,
      slug: slugify(name),
      is_active: newSubcategory.is_active,
      sort_order: maxSort + 1,
    });

    setSaving(false);
    if (insertError) {
      alert(insertError.message);
      return;
    }

    setNewSubcategory({ category_id: "", name: "", is_active: true });
    await loadData();
  };

  const startEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditingSubcategory({
      category_id: subcategory.category_id,
      name: subcategory.name,
      is_active: subcategory.is_active,
    });
  };

  const saveSubcategory = async () => {
    if (!editingSubcategoryId) return;
    const name = editingSubcategory.name.trim();
    if (!editingSubcategory.category_id || !name) return;

    setSaving(true);
    const { error: updateError } = await supabase
      .from("subcategories")
      .update({
        category_id: editingSubcategory.category_id,
        name,
        slug: slugify(name),
        is_active: editingSubcategory.is_active,
      })
      .eq("id", editingSubcategoryId);
    setSaving(false);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    setEditingSubcategoryId(null);
    await loadData();
  };

  const deleteSubcategory = async (subcategory: Subcategory) => {
    if (!window.confirm(`Delete subcategory "${subcategory.name}"?`)) return;

    setSaving(true);
    const { error: deleteError } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", subcategory.id);
    setSaving(false);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }
    await loadData();
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
        <div className="mx-auto w-full max-w-[1240px] space-y-6">
          <section className="rounded-[18px] bg-white p-6 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-emerald-950">
                Category Management
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
                Loading categories...
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Category name"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <input
                value={newCategory.icon_name}
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    icon_name: e.target.value,
                  }))
                }
                placeholder="Icon name"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <label className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200">
                <input
                  type="checkbox"
                  checked={newCategory.is_active}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                Active
              </label>
              <button
                type="button"
                onClick={addCategory}
                className="h-10 rounded-[12px] bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Add Category
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(e: DragStartEvent) =>
                setActiveCategoryId(e.active.id)
              }
              onDragEnd={handleCategoryDragEnd}
              onDragCancel={() => setActiveCategoryId(null)}
            >
              <div className="mt-5 space-y-3">
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => (
                    <SortableItem key={category.id} id={category.id}>
                      {(handleProps) => (
                        <div className="grid gap-3 rounded-[14px] bg-gray-50 p-3 ring-1 ring-gray-200 items-center md:grid-cols-[auto_1fr_1fr_auto_auto]">
                          {/* Drag handle */}
                          <div
                            {...handleProps}
                            className="flex items-center justify-center self-stretch cursor-grab active:cursor-grabbing rounded-lg px-2 hover:bg-gray-200 transition-colors"
                          >
                            <DragHandleIcon className="h-4 w-4 text-gray-400" />
                          </div>

                          {/* Name col */}
                          {editingCategoryId === category.id ? (
                            <input
                              value={editingCategory.name}
                              onChange={(e) =>
                                setEditingCategory((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="h-9 rounded-[10px] bg-white px-3 text-sm ring-1 ring-gray-200 focus:outline-none"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-gray-900">
                              {category.name}
                              <span className="ml-2 text-xs font-medium text-gray-500">
                                ({category.slug})
                              </span>
                            </div>
                          )}

                          {/* Icon / meta col */}
                          {editingCategoryId === category.id ? (
                            <input
                              value={editingCategory.icon_name}
                              onChange={(e) =>
                                setEditingCategory((prev) => ({
                                  ...prev,
                                  icon_name: e.target.value,
                                }))
                              }
                              className="h-9 rounded-[10px] bg-white px-3 text-sm ring-1 ring-gray-200 focus:outline-none"
                            />
                          ) : (
                            <div className="text-sm text-gray-700">
                              icon: {category.icon_name || "—"} · sort:{" "}
                              {category.sort_order} ·{" "}
                              {category.is_active ? "Active" : "Inactive"}
                            </div>
                          )}

                          {/* Active checkbox (edit mode only) */}
                          <div className="flex items-center gap-2">
                            {editingCategoryId === category.id ? (
                              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={editingCategory.is_active}
                                  onChange={(e) =>
                                    setEditingCategory((prev) => ({
                                      ...prev,
                                      is_active: e.target.checked,
                                    }))
                                  }
                                />
                                Active
                              </label>
                            ) : null}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {editingCategoryId === category.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveCategory}
                                  className="h-8 rounded-lg bg-emerald-900 px-3 text-xs font-semibold text-white"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategoryId(null)}
                                  className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditCategory(category)}
                                  className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCategory(category)}
                                  className="h-8 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white"
                                >
                                  Delete
                                </button>
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
                {activeCategory ? (
                  <div className="rounded-[14px] bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-2xl ring-1 ring-black/10 opacity-90">
                    {activeCategory.name}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </section>

          <section className="rounded-[18px] bg-white p-6 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <h2 className="text-xl font-semibold text-emerald-950">
              Subcategory Management
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <select
                value={newSubcategory.category_id}
                onChange={(e) =>
                  setNewSubcategory((prev) => ({
                    ...prev,
                    category_id: e.target.value,
                  }))
                }
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              >
                <option value="">Select parent category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={newSubcategory.name}
                onChange={(e) =>
                  setNewSubcategory((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Subcategory name"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <label className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200">
                <input
                  type="checkbox"
                  checked={newSubcategory.is_active}
                  onChange={(e) =>
                    setNewSubcategory((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                Active
              </label>
              <button
                type="button"
                onClick={addSubcategory}
                className="h-10 rounded-[12px] bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Add Subcategory
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(e: DragStartEvent) =>
                setActiveSubcategoryId(e.active.id)
              }
              onDragEnd={handleSubcategoryDragEnd}
              onDragCancel={() => setActiveSubcategoryId(null)}
            >
              <div className="mt-5 space-y-5">
                {categories.map((category) => {
                  const list = groupedSubcategories.get(category.id) ?? [];
                  return (
                    <div
                      key={category.id}
                      className="rounded-[14px] bg-gray-50 p-4 ring-1 ring-gray-200"
                    >
                      <h3 className="text-sm font-semibold text-emerald-950">
                        {category.name}
                      </h3>

                      {list.length === 0 ? (
                        <p className="mt-2 text-xs text-gray-500">
                          No subcategories
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <SortableContext
                            items={list.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {list.map((sub) => (
                              <SortableItem key={sub.id} id={sub.id}>
                                {(handleProps) => (
                                  <div className="grid gap-3 rounded-[12px] bg-white p-3 ring-1 ring-gray-200 items-center md:grid-cols-[auto_1fr_auto]">
                                    {/* Drag handle */}
                                    <div
                                      {...handleProps}
                                      className="flex items-center justify-center self-stretch cursor-grab active:cursor-grabbing rounded-lg px-2 hover:bg-gray-100 transition-colors"
                                    >
                                      <DragHandleIcon className="h-4 w-4 text-gray-400" />
                                    </div>

                                    {/* Name / edit form */}
                                    {editingSubcategoryId === sub.id ? (
                                      <div className="grid gap-2 md:grid-cols-3">
                                        <select
                                          value={editingSubcategory.category_id}
                                          onChange={(e) =>
                                            setEditingSubcategory((prev) => ({
                                              ...prev,
                                              category_id: e.target.value,
                                            }))
                                          }
                                          className="h-9 rounded-[10px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200"
                                        >
                                          {categories.map((item) => (
                                            <option
                                              key={item.id}
                                              value={item.id}
                                            >
                                              {item.name}
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          value={editingSubcategory.name}
                                          onChange={(e) =>
                                            setEditingSubcategory((prev) => ({
                                              ...prev,
                                              name: e.target.value,
                                            }))
                                          }
                                          className="h-9 rounded-[10px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200"
                                        />
                                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                          <input
                                            type="checkbox"
                                            checked={
                                              editingSubcategory.is_active
                                            }
                                            onChange={(e) =>
                                              setEditingSubcategory((prev) => ({
                                                ...prev,
                                                is_active: e.target.checked,
                                              }))
                                            }
                                          />
                                          Active
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-800">
                                        <span className="font-semibold">
                                          {sub.name}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({sub.slug}) · sort: {sub.sort_order}{" "}
                                          ·{" "}
                                          {sub.is_active
                                            ? "Active"
                                            : "Inactive"}
                                        </span>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                      {editingSubcategoryId === sub.id ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={saveSubcategory}
                                            className="h-8 rounded-lg bg-emerald-900 px-3 text-xs font-semibold text-white"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditingSubcategoryId(null)
                                            }
                                            className="h-8 rounded-lg bg-gray-100 px-3 text-xs font-semibold text-gray-700"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              startEditSubcategory(sub)
                                            }
                                            className="h-8 rounded-lg bg-gray-100 px-3 text-xs font-semibold text-gray-700"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteSubcategory(sub)
                                            }
                                            className="h-8 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </SortableItem>
                            ))}
                          </SortableContext>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <DragOverlay>
                {activeSubcategory ? (
                  <div className="rounded-[12px] bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-2xl ring-1 ring-black/10 opacity-90">
                    {activeSubcategory.name}
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
