"use client";

import { supabase } from "@/lib/supabaseClient";
import { useHeaderUser } from "@/components/providers/HeaderUserProvider";
import { useRouter } from "next/navigation";
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";

type ProductListRow = {
  id: string;
  name: string;
  product_type: string | null;
  is_archived: boolean | null;
  created_at: string;
  manufacturer_id: string | null;
  category_id: string | null;
  manufacturers: { name: string } | null;
  categories: { name: string } | null;
};

type ProductRelationName = { name: string | null };

type ProductRowRaw = {
  id: string;
  name: string;
  product_type: string | null;
  is_archived: boolean | null;
  created_at: string;
  manufacturer_id: string | null;
  category_id: string | null;
  manufacturers: ProductRelationName | ProductRelationName[] | null;
  categories: ProductRelationName | ProductRelationName[] | null;
};

type ManufacturerOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type SubcategoryOption = {
  id: string;
  name: string;
  category_id: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, loading: headerUserLoading } = useHeaderUser();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const accessResolvedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductListRow[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);

  const [showArchived, setShowArchived] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!showArchived && product.is_archived) {
        return false;
      }
      if (selectedManufacturer && product.manufacturer_id !== selectedManufacturer) {
        return false;
      }
      if (selectedCategory && product.category_id !== selectedCategory) {
        return false;
      }
      const needle = searchQuery.trim().toLowerCase();
      if (needle) {
        const hayName = product.name.toLowerCase();
        const hayManufacturer = (product.manufacturers?.name ?? "").toLowerCase();
        if (!hayName.includes(needle) && !hayManufacturer.includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedManufacturer, showArchived]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [productsRes, manufacturersRes, categoriesRes, subcategoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, product_type, is_archived, created_at, manufacturer_id, category_id, manufacturers(name), categories(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("manufacturers")
        .select("id, name")
        .order("sort_order", { ascending: true }),
      supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
      supabase.from("subcategories").select("id, name, category_id").order("sort_order", { ascending: true }),
    ]);

    if (productsRes.error || manufacturersRes.error || categoriesRes.error || subcategoriesRes.error) {
      setError(
        productsRes.error?.message ??
          manufacturersRes.error?.message ??
          categoriesRes.error?.message ??
          subcategoriesRes.error?.message ??
          "Failed loading products.",
      );
      setLoading(false);
      return;
    }

    const normalizedProducts: ProductListRow[] = ((productsRes.data ?? []) as ProductRowRaw[]).map(
      (row) => {
        const manufacturerRelation = Array.isArray(row.manufacturers)
          ? row.manufacturers[0] ?? null
          : row.manufacturers;
        const categoryRelation = Array.isArray(row.categories) ? row.categories[0] ?? null : row.categories;

        return {
          id: row.id,
          name: row.name,
          product_type: row.product_type,
          is_archived: row.is_archived,
          created_at: row.created_at,
          manufacturer_id: row.manufacturer_id,
          category_id: row.category_id,
          manufacturers: manufacturerRelation?.name ? { name: manufacturerRelation.name } : null,
          categories: categoryRelation?.name ? { name: categoryRelation.name } : null,
        };
      },
    );

    setProducts(normalizedProducts);
    setManufacturers((manufacturersRes.data ?? []) as ManufacturerOption[]);
    setCategories((categoriesRes.data ?? []) as CategoryOption[]);
    setSubcategories((subcategoriesRes.data ?? []) as SubcategoryOption[]);
    setLoading(false);
  };

  useEffect(() => {
    if (accessResolvedRef.current || headerUserLoading) return;

    if (user.role && user.role !== "admin") {
      accessResolvedRef.current = true;
      router.replace("/dashboard");
      return;
    }

    if (user.role === "admin") {
      accessResolvedRef.current = true;
      setIsAdmin(true);
      setAdminChecked(true);
      void loadData();
      return;
    }

    const checkAdminAndLoad = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        accessResolvedRef.current = true;
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle<{ role: string | null }>();

      if (profile?.role !== "admin") {
        accessResolvedRef.current = true;
        router.replace("/dashboard");
        return;
      }

      accessResolvedRef.current = true;
      setIsAdmin(true);
      setAdminChecked(true);
      await loadData();
    };

    void checkAdminAndLoad();
  }, [headerUserLoading, router, user.role]);

  const toggleArchiveState = async (event: MouseEvent, product: ProductListRow) => {
    event.stopPropagation();
    setSaving(true);
    const { error: updateError } = await supabase
      .from("products")
      .update({ is_archived: !product.is_archived })
      .eq("id", product.id);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData();
  };

  const parseCsvLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current.trim());
    return result;
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImportFile(file);
    setImportSummary("");
    setError("");
  };

  const handleImportCsv = async () => {
    if (!importFile) {
      setError("Please choose a CSV file to import.");
      return;
    }
    setSaving(true);
    setError("");
    setImportSummary("");
    try {
      const csvText = await importFile.text();
      const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length < 2) {
        throw new Error("CSV must include header and at least one data row.");
      }

      const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const requiredHeaders = [
        "name",
        "product_type",
        "product_url",
        "short_description",
        "manufacturer_name",
        "category_name",
        "subcategory_name",
        "tags",
      ];
      const headerIndex: Record<string, number> = {};
      for (const key of requiredHeaders) {
        const idx = header.indexOf(key);
        if (idx === -1) {
          throw new Error(`Missing required CSV column: ${key}`);
        }
        headerIndex[key] = idx;
      }

      const manufacturerByName = new Map(
        manufacturers.map((m) => [m.name.trim().toLowerCase(), m.id]),
      );
      const categoryByName = new Map(
        categories.map((c) => [c.name.trim().toLowerCase(), c.id]),
      );
      const subcategoryByNameAndCategory = new Map(
        subcategories.map((s) => [`${s.category_id}::${s.name.trim().toLowerCase()}`, s.id]),
      );

      const rowsToInsert: Array<{
        manufacturer_id: string;
        category_id: string;
        subcategory_id: string | null;
        name: string;
        slug: string;
        product_url: string | null;
        product_type: string;
        short_description: string | null;
        is_archived: boolean;
        priority_score: number;
        popular_flag: boolean;
      }> = [];

      let skipped = 0;
      for (let i = 1; i < lines.length; i += 1) {
        const values = parseCsvLine(lines[i]);
        const get = (key: string) => values[headerIndex[key]]?.trim() ?? "";

        const name = get("name");
        const productType = get("product_type");
        const manufacturerName = get("manufacturer_name").toLowerCase();
        const categoryName = get("category_name").toLowerCase();
        const subcategoryName = get("subcategory_name").toLowerCase();

        if (!name || !productType || !manufacturerName || !categoryName) {
          skipped += 1;
          continue;
        }

        const manufacturerId = manufacturerByName.get(manufacturerName);
        const categoryId = categoryByName.get(categoryName);
        if (!manufacturerId || !categoryId) {
          skipped += 1;
          continue;
        }

        let subcategoryId: string | null = null;
        if (subcategoryName) {
          subcategoryId = subcategoryByNameAndCategory.get(`${categoryId}::${subcategoryName}`) ?? null;
          if (!subcategoryId) {
            skipped += 1;
            continue;
          }
        }

        rowsToInsert.push({
          manufacturer_id: manufacturerId,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          name,
          slug: name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-"),
          product_url: get("product_url") || null,
          product_type: productType,
          short_description: get("short_description") || null,
          is_archived: false,
          priority_score: 0,
          popular_flag: false,
        });
      }

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase.from("products").insert(rowsToInsert);
        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      setImportSummary(`${rowsToInsert.length} products imported, ${skipped} rows skipped`);
      setImportFile(null);
      await loadData();
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : "Import failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (!adminChecked || !isAdmin) {
    return (
      <div className="rounded-[18px] bg-white p-6 text-gray-900">
        Checking access...
      </div>
    );
  }

  return (
    <div>
          <section className="rounded-[18px] bg-white p-6 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-emerald-950">Product Management</h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="h-10 rounded-[12px] bg-gray-100 px-4 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  Import CSV
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/admin/products/new")}
                  className="h-10 rounded-[12px] bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Add New Product
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by product or manufacturer"
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
              <label className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                  className="h-4 w-4"
                />
                Show archived
              </label>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedManufacturer}
                onChange={(event) => setSelectedManufacturer(event.target.value)}
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
              >
                <option value="">All manufacturers</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowArchived(false);
                  setSelectedCategory("");
                  setSelectedManufacturer("");
                }}
                className="h-10 rounded-[12px] bg-gray-100 px-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"
              >
                Reset Filters
              </button>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
            {loading ? <p className="mt-4 text-sm text-gray-600">Loading products...</p> : null}
            {saving ? <p className="mt-2 text-xs font-semibold text-gray-500">Saving...</p> : null}

            {!loading ? (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="border-b border-gray-200 px-3 py-3">Name</th>
                      <th className="border-b border-gray-200 px-3 py-3">Manufacturer</th>
                      <th className="border-b border-gray-200 px-3 py-3">Category</th>
                      <th className="border-b border-gray-200 px-3 py-3">Product Type</th>
                      <th className="border-b border-gray-200 px-3 py-3">Archived</th>
                      <th className="border-b border-gray-200 px-3 py-3">Created</th>
                      <th className="border-b border-gray-200 px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-sm text-gray-500">
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          onClick={() => router.push(`/admin/products/${product.id}`)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="border-b border-gray-100 px-3 py-3 font-semibold text-gray-900">
                            {product.name}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-3 text-gray-700">
                            {product.manufacturers?.name ?? "—"}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-3 text-gray-700">
                            {product.categories?.name ?? "—"}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-3 text-gray-700">
                            {product.product_type ?? "—"}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-3 text-gray-700">
                            {product.is_archived ? "Yes" : "No"}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-3 text-gray-700">
                            {formatDate(product.created_at)}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={(event) => void toggleArchiveState(event, product)}
                              className={[
                                "h-8 rounded-[10px] px-3 text-xs font-semibold text-white",
                                product.is_archived ? "bg-emerald-700" : "bg-amber-600",
                              ].join(" ")}
                            >
                              {product.is_archived ? "Unarchive" : "Archive"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
      {showImportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[560px] rounded-[16px] bg-white p-5 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-950">Import Products CSV</h2>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportSummary("");
                  setImportFile(null);
                }}
                className="h-8 rounded-[10px] bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Upload a CSV with columns: name, product_type, product_url, short_description, manufacturer_name,
              category_name, subcategory_name, tags.
            </p>

            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                "name,product_type,product_url,short_description,manufacturer_name,category_name,subcategory_name,tags\nSample Product,Office Chair,https://example.com,Short description,Steelcase,Seating,Task Chairs,ergonomic,mesh"
              )}`}
              download="products-template.csv"
              className="mt-3 inline-flex text-sm font-semibold text-emerald-800 hover:text-emerald-700"
            >
              Download CSV template
            </a>

            <div className="mt-4">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportFileChange}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-[10px] file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700"
              />
            </div>

            {importSummary ? (
              <p className="mt-3 text-sm font-semibold text-emerald-700">{importSummary}</p>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={saving}
                className="h-9 rounded-[10px] bg-emerald-900 px-3 text-xs font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
