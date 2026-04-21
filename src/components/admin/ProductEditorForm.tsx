"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type ProductRow = {
  id: string;
  manufacturer_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  slug: string;
  product_url: string | null;
  product_type: string | null;
  short_description: string | null;
  priority_score: number | null;
  popular_flag: boolean | null;
  is_archived: boolean | null;
};

type ProductImageRow = {
  id: string;
  file_path: string;
  thumbnail_path: string | null;
  is_primary: boolean | null;
  sort_order?: number | null;
};

type Manufacturer = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type ProductFormState = {
  manufacturer_id: string;
  name: string;
  product_url: string;
  product_type: string;
  category_id: string;
  subcategory_id: string;
  short_description: string;
  priority_score: number;
  popular_flag: boolean;
  is_archived: boolean;
};

type ProductEditorFormProps = {
  productId?: string;
};

const MAX_DESCRIPTION = 150;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const emptyForm: ProductFormState = {
  manufacturer_id: "",
  name: "",
  product_url: "",
  product_type: "",
  category_id: "",
  subcategory_id: "",
  short_description: "",
  priority_score: 0,
  popular_flag: false,
  is_archived: false,
};

export default function ProductEditorForm({
  productId,
}: ProductEditorFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(productId);

  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<ProductImageRow[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>(
    [],
  );
  const [selectedPrimaryImageKey, setSelectedPrimaryImageKey] =
    useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    product_type?: string;
    images?: string;
  }>({});

  const filteredSubcategories = useMemo(
    () => subcategories.filter((sub) => sub.category_id === form.category_id),
    [form.category_id, subcategories],
  );

  const resetMessages = () => {
    setError("");
    setSuccess("");
    setFieldErrors({});
  };

  const ensureUniqueSlug = async (
    table: "products" | "tags",
    baseSlug: string,
    excludeId?: string,
  ) => {
    let slug = baseSlug || "item";
    let suffix = 1;

    while (true) {
      let query = supabase.from(table).select("id").eq("slug", slug);
      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      const { data, error: slugError } = await query.limit(1);

      if (slugError) {
        throw new Error(slugError.message);
      }

      if (!data || data.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  };

  const loadBaseData = useCallback(async () => {
    const [manufacturerRes, categoryRes, subcategoryRes, tagRes] =
      await Promise.all([
        supabase
          .from("manufacturers")
          .select("id, name")
          .eq("is_archived", false)
          .order("sort_order", { ascending: true }),
        supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("subcategories")
          .select("id, category_id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("tags")
          .select("id, name, slug")
          .order("name", { ascending: true }),
      ]);

    if (
      manufacturerRes.error ||
      categoryRes.error ||
      subcategoryRes.error ||
      tagRes.error
    ) {
      throw new Error(
        manufacturerRes.error?.message ??
          categoryRes.error?.message ??
          subcategoryRes.error?.message ??
          tagRes.error?.message ??
          "Failed to load form data.",
      );
    }

    setManufacturers((manufacturerRes.data ?? []) as Manufacturer[]);
    setCategories((categoryRes.data ?? []) as Category[]);
    setSubcategories((subcategoryRes.data ?? []) as Subcategory[]);
    setTags((tagRes.data ?? []) as Tag[]);
  }, []);

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        "id, manufacturer_id, category_id, subcategory_id, name, slug, product_url, product_type, short_description, priority_score, popular_flag, is_archived",
      )
      .eq("id", productId)
      .maybeSingle<ProductRow>();

    if (productError) {
      throw new Error(productError.message);
    }

    if (!productData) {
      throw new Error("Product not found.");
    }

    setForm({
      manufacturer_id: productData.manufacturer_id ?? "",
      name: productData.name ?? "",
      product_url: productData.product_url ?? "",
      product_type: productData.product_type ?? "",
      category_id: productData.category_id ?? "",
      subcategory_id: productData.subcategory_id ?? "",
      short_description: productData.short_description ?? "",
      priority_score: productData.priority_score ?? 0,
      popular_flag: Boolean(productData.popular_flag),
      is_archived: Boolean(productData.is_archived),
    });

    const [tagLinksRes, imageRes] = await Promise.all([
      supabase
        .from("product_tags")
        .select("tag_id")
        .eq("product_id", productId),
      supabase
        .from("product_images")
        .select("id, file_path, thumbnail_path, is_primary, sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true }),
    ]);

    if (tagLinksRes.error || imageRes.error) {
      throw new Error(
        tagLinksRes.error?.message ??
          imageRes.error?.message ??
          "Failed loading product.",
      );
    }

    const tagIds = ((tagLinksRes.data ?? []) as Array<{ tag_id: string }>).map(
      (row) => row.tag_id,
    );
    setSelectedTagIds(tagIds);
    const images = (imageRes.data ?? []) as ProductImageRow[];
    setProductImages(images);
    const currentPrimary =
      images.find((image) => image.is_primary) ?? images[0];
    setSelectedPrimaryImageKey(
      currentPrimary ? `existing:${currentPrimary.id}` : "",
    );
  }, [productId]);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
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
        setLoading(true);
        await loadBaseData();
        if (isEditMode) {
          await loadProduct();
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void checkAdminAndLoad();
  }, [isEditMode, loadBaseData, loadProduct, router]);

  useEffect(() => {
    const previews = selectedImageFiles.map((file) =>
      URL.createObjectURL(file),
    );
    setSelectedImagePreviews(previews);
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedImageFiles]);

  const toggleTag = (tagId: string) => {
    resetMessages();
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const uploadAndProcessImage = async (finalProductId: string, file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${finalProductId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    let processedFilePath = filePath;
    let thumbnailPath: string | null = null;

    const response = await fetch("/api/process-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: finalProductId,
        sourceBucket: "product-images",
        sourcePath: filePath,
        targetBucket: "product-images",
        thumbnailBucket: "product-thumbnails",
      }),
    });

    if (response.ok) {
      const payload = (await response.json().catch(() => null)) as Record<
        string,
        string | boolean | null | undefined
      > | null;
      if (payload && payload.success !== false) {
        processedFilePath =
          (typeof payload.processedPath === "string" &&
            payload.processedPath) ||
          (typeof payload.file_path === "string" && payload.file_path) ||
          (typeof payload.path === "string" && payload.path) ||
          processedFilePath;
        thumbnailPath =
          (typeof payload.thumbnailPath === "string" &&
            payload.thumbnailPath) ||
          (typeof payload.thumbnail_path === "string" &&
            payload.thumbnail_path) ||
          null;
      }
    }

    return {
      file_path: processedFilePath,
      thumbnail_path: thumbnailPath,
    };
  };

  const syncProductTags = async (finalProductId: string) => {
    const { error: deleteError } = await supabase
      .from("product_tags")
      .delete()
      .eq("product_id", finalProductId);
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (selectedTagIds.length === 0) return;

    const rows = selectedTagIds.map((tagId) => ({
      product_id: finalProductId,
      tag_id: tagId,
    }));
    const { error: insertError } = await supabase
      .from("product_tags")
      .insert(rows);
    if (insertError) {
      throw new Error(insertError.message);
    }
  };

  const upsertPrimaryImage = async (finalProductId: string) => {
    const uploadedRows = await Promise.all(
      selectedImageFiles.map(async (file, index) => {
        const uploadResult = await uploadAndProcessImage(finalProductId, file);
        return {
          key: `new:${index}`,
          file_path: uploadResult.file_path,
          thumbnail_path: uploadResult.thumbnail_path,
        };
      }),
    );

    const allKeys = [
      ...productImages.map((image) => `existing:${image.id}`),
      ...uploadedRows.map((row) => row.key),
    ];
    const primaryKey = allKeys.includes(selectedPrimaryImageKey)
      ? selectedPrimaryImageKey
      : (allKeys[0] ?? "");

    if (isEditMode) {
      const { error: unsetAllError } = await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", finalProductId);
      if (unsetAllError) {
        throw new Error(unsetAllError.message);
      }
    }

    const selectedExistingId = primaryKey.startsWith("existing:")
      ? primaryKey.replace("existing:", "")
      : null;
    if (selectedExistingId) {
      const { error: setExistingPrimaryError } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", selectedExistingId)
        .eq("product_id", finalProductId);
      if (setExistingPrimaryError) {
        throw new Error(setExistingPrimaryError.message);
      }
    }

    if (uploadedRows.length > 0) {
      const insertPayload = uploadedRows.map((row, index) => ({
        product_id: finalProductId,
        file_path: row.file_path,
        thumbnail_path: row.thumbnail_path,
        is_primary: row.key === primaryKey,
        sort_order: (productImages.length || 0) + index,
      }));
      const { error: imageInsertError } = await supabase
        .from("product_images")
        .insert(insertPayload);
      if (imageInsertError) {
        throw new Error(imageInsertError.message);
      }
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!form.manufacturer_id) {
      setError("Manufacturer is required.");
      return;
    }
    if (!form.category_id) {
      setError("Category is required.");
      return;
    }
    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (productImages.length + selectedImageFiles.length === 0) {
      setFieldErrors({ images: "At least one product image is required" });
      setError("At least one product image is required");
      return;
    }
    if (!form.product_type.trim()) {
      setFieldErrors({ product_type: "Product type is required." });
      setError("Product type is required.");
      return;
    }
    if (form.short_description.length > MAX_DESCRIPTION) {
      setError("Short description cannot exceed 150 characters.");
      return;
    }

    setSaving(true);
    try {
      const baseSlug = slugify(form.name);
      const slug = await ensureUniqueSlug("products", baseSlug, productId);

      const payload = {
        manufacturer_id: form.manufacturer_id,
        name: form.name.trim(),
        slug,
        product_url: form.product_url.trim() || null,
        product_type: form.product_type.trim() || null,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id || null,
        short_description: form.short_description.trim() || null,
        priority_score: Number.isFinite(form.priority_score)
          ? form.priority_score
          : 0,
        popular_flag: form.popular_flag,
        is_archived: isEditMode ? form.is_archived : false,
      };

      let finalProductId = productId;
      if (isEditMode && productId) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single<{ id: string }>();
        if (insertError || !inserted?.id) {
          throw new Error(insertError?.message ?? "Failed to create product.");
        }
        finalProductId = inserted.id;
      }

      if (!finalProductId) {
        throw new Error("Product ID missing after save.");
      }

      await syncProductTags(finalProductId);
      await upsertPrimaryImage(finalProductId);

      setSuccess(
        isEditMode
          ? "Product updated successfully."
          : "Product created successfully.",
      );
      router.push("/admin/products");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed saving product.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    resetMessages();

    if (!window.confirm("Delete this product permanently?")) {
      return;
    }

    setSaving(true);
    try {
      const { count, error: countError } = await supabase
        .from("project_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);

      if (countError) {
        throw new Error(countError.message);
      }

      if ((count ?? 0) > 0) {
        setError(
          "This product cannot be deleted because it exists in one or more project boards. Archive it instead.",
        );
        return;
      }

      const { error: deleteTagError } = await supabase
        .from("product_tags")
        .delete()
        .eq("product_id", productId);
      if (deleteTagError) {
        throw new Error(deleteTagError.message);
      }

      const { error: deleteImageError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);
      if (deleteImageError) {
        throw new Error(deleteImageError.message);
      }

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (deleteError) {
        throw new Error(deleteError.message);
      }

      router.push("/admin/products");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed deleting product.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedImageFiles(files);
    const firstNewKey = files.length > 0 ? "new:0" : "";
    if (firstNewKey && !selectedPrimaryImageKey) {
      setSelectedPrimaryImageKey(firstNewKey);
    }
  };

  if (!adminChecked || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#003c33] text-white">
        <Header />
        <main className="w-full flex-1 px-4 pt-6 sm:px-6">
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
      <main className="w-full flex-1 px-4 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <section className="rounded-[18px] bg-white p-6 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-emerald-950">
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/admin/products")}
                  className="h-9 rounded-[10px] bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                >
                  Back to Products
                </button>
                {isEditMode ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDelete}
                    className="h-9 rounded-[10px] bg-red-600 px-3 text-xs font-semibold text-white disabled:opacity-70"
                  >
                    Delete Product
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-gray-600">Loading...</p>
            ) : null}
            {error ? (
              <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
            ) : null}
            {success ? (
              <p className="mt-4 text-sm font-medium text-emerald-700">
                {success}
              </p>
            ) : null}
            {isEditMode && form.is_archived ? (
              <div className="mt-4 rounded-[12px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
                Archived product
              </div>
            ) : null}

            {!loading ? (
              <form onSubmit={handleSave} className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Manufacturer *
                    </label>
                    <select
                      value={form.manufacturer_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          manufacturer_id: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                    >
                      <option value="">Select manufacturer</option>
                      {manufacturers.map((manufacturer) => (
                        <option key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Product Name *
                    </label>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Product URL
                    </label>
                    <input
                      value={form.product_url}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          product_url: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                      placeholder="https://"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Product Type
                    </label>
                    <input
                      value={form.product_type}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          product_type: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                      placeholder="Office Chair"
                    />
                    {fieldErrors.product_type ? (
                      <p className="text-xs font-medium text-red-600">
                        {fieldErrors.product_type}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Category *
                    </label>
                    <select
                      value={form.category_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          category_id: event.target.value,
                          subcategory_id: "",
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Subcategory
                    </label>
                    <select
                      value={form.subcategory_id}
                      disabled={!form.category_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          subcategory_id: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                    >
                      <option value="">
                        {form.category_id
                          ? "Select subcategory"
                          : "Select category first"}
                      </option>
                      {filteredSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Priority Score
                    </label>
                    <input
                      type="number"
                      value={form.priority_score}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          priority_score:
                            Number.parseInt(event.target.value || "0", 10) || 0,
                        }))
                      }
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-6">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.popular_flag}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            popular_flag: event.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      Popular flag
                    </label>
                    {isEditMode ? (
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.is_archived}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              is_archived: event.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Archived
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Short Description ({form.short_description.length}/
                    {MAX_DESCRIPTION})
                  </label>
                  <textarea
                    value={form.short_description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        short_description: event.target.value.slice(
                          0,
                          MAX_DESCRIPTION,
                        ),
                      }))
                    }
                    rows={3}
                    className="w-full rounded-[12px] bg-gray-100 px-3 py-2 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const selected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={[
                            "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors",
                            selected
                              ? "bg-emerald-900 text-white ring-emerald-900"
                              : "bg-gray-100 text-gray-700 ring-gray-200",
                          ].join(" ")}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Images
                  </label>
                  {[
                    ...productImages.map((image) => ({
                      key: `existing:${image.id}`,
                      src: getImageUrl(image.file_path),
                      label: "Uploaded",
                    })),
                    ...selectedImagePreviews.map((preview, index) => ({
                      key: `new:${index}`,
                      src: preview,
                      label: "New",
                    })),
                  ].length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {[
                        ...productImages.map((image) => ({
                          key: `existing:${image.id}`,
                          src: getImageUrl(image.file_path),
                          label: "Uploaded",
                        })),
                        ...selectedImagePreviews.map((preview, index) => ({
                          key: `new:${index}`,
                          src: preview,
                          label: "New",
                        })),
                      ].map((preview) => {
                        const isPrimary =
                          preview.key === selectedPrimaryImageKey;
                        return (
                          <button
                            key={preview.key}
                            type="button"
                            onClick={() =>
                              setSelectedPrimaryImageKey(preview.key)
                            }
                            className={[
                              "relative overflow-hidden rounded-[12px] ring-2",
                              isPrimary ? "ring-emerald-700" : "ring-gray-200",
                            ].join(" ")}
                          >
                            <Image
                              src={preview.src}
                              alt="Product preview"
                              width={96}
                              height={96}
                              unoptimized
                              className="h-24 w-24 object-cover"
                            />
                            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              {isPrimary ? "Primary" : preview.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No images uploaded.</p>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={onImageChange}
                    className="block text-sm text-gray-700 file:mr-3 file:rounded-[10px] file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700"
                  />
                  {fieldErrors.images ? (
                    <p className="text-xs font-medium text-red-600">
                      {fieldErrors.images}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/products")}
                    className="h-10 rounded-[10px] bg-gray-100 px-4 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 rounded-[10px] bg-emerald-900 px-4 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            ) : null}
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
