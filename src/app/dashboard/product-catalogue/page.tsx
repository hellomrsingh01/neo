"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AddToProjectToast from "../../../components/AddToProjectToast";
import ChangeProjectModal from "../../../components/ChangeProjectModal";

type Category = {
  id: string;
  label: string;
  slug?: string;
};

type Supplier = {
  id: string;
  label: string;
};

type Tag = {
  id: string;
  label: string;
  slug?: string;
};

type Product = {
  id: string;
  name: string;
  subtext: string;
  productType: string | null;
  description: string | null;
  image: string | null;
  galleryImages?: string[];
  productUrl: string | null;
  createdAt: string;
  isWishlisted?: boolean;
};

type SortKey = "az" | "za" | "newest" | "oldest" | "popular";
type ProductImageRow = { file_path: string; is_primary: boolean };
type ProductRow = {
  id: string;
  name: string;
  product_type: string | null;
  short_description: string | null;
  product_url: string | null;
  created_at: string;
  manufacturers: { name: string | null }[] | null;
  product_images: ProductImageRow[] | null;
};

const getSafeDescription = (description: string | null) =>
  description ? description.slice(0, 150) : null;

function getPageModel(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (current >= total - 2)
    [total - 1, total - 2, total - 3].forEach((p) => set.add(p));

  const pages = Array.from(set)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out: Array<number | "..."> = [];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const prev = pages[i - 1];
    if (i > 0 && p - prev > 1) out.push("...");
    out.push(p);
  }
  return out;
}

function Icon({
  name,
  className,
}: {
  name:
    | "search"
    | "plus"
    | "heart"
    | "sliders"
    | "grid"
    | "list"
    | "chevronDown"
    | "chevronLeft"
    | "chevronRight";
  className?: string;
}) {
  const common = "stroke-current fill-none";

  if (name === "search") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          className={common}
          strokeWidth="1.8"
        />
        <path
          d="M16.2 16.2 21 21"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5v14M5 12h14"
          className={common}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
  d="M12 20.5c-.3 0-.6-.1-.8-.3C7.2 17 4 14.2 2.7 11.7c-1.4-2.6-.6-5.6 2.2-6.9 2.1-1 4.4-.3 5.7 1.3 1.3-1.6 3.6-2.3 5.7-1.3 2.8 1.3 3.6 4.3 2.2 6.9-1.3 2.5-4.5 5.3-8.5 8.5-.2.2-.5.3-.8.3z"
  className={common}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "sliders") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6h9M17 6h3M10 6v0"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 12h3M11 12h9M7 12v0"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 18h13M21 18h-3M16 18v0"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="10" cy="6" r="2.1" className={common} strokeWidth="1.6" />
        <circle cx="7" cy="12" r="2.1" className={common} strokeWidth="1.6" />
        <circle cx="16" cy="18" r="2.1" className={common} strokeWidth="1.6" />
      </svg>
    );
  }

  if (name === "grid") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.5 4.5h6.5v6.5H4.5V4.5Zm8 0h7v6.5h-7V4.5ZM4.5 13h6.5v7H4.5v-7Zm8 0h7v7h-7v-7Z"
          className={common}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "list") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 6h13M8 12h13M8 18h13"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"
          className={common}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "chevronDown") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.5 9.5 12 15l5.5-5.5"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "chevronLeft") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.5 6.5 9 12l5.5 5.5"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.5 6.5 15 12l-5.5 5.5"
        className={common}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductCataloguePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ctxProjectId = searchParams.get("projectId");
  const ctxSectionId = searchParams.get("sectionId");
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [addingProductIds, setAddingProductIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [toast, setToast] = useState<{
    open: boolean;
    projectName: string;
    productId: string;
    projectItemId: string;
  } | null>(null);

  const [changeModal, setChangeModal] = useState<{
    open: boolean;
    productId: string;
    projectItemId: string | null;
  } | null>(null);

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<
    { id: string; label: string; slug?: string }[]
  >([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("az");
  const [isListView, setIsListView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [sortOpen, setSortOpen] = useState(false);
  const [ctxProjectName, setCtxProjectName] = useState<string | null>(null);
  const [ctxSectionName, setCtxSectionName] = useState<string | null>(null);

  useEffect(() => {
    if (!ctxProjectId) return;
    let active = true;
    const fetchContext = async () => {
      const [{ data: project }, { data: section }] = await Promise.all([
        supabase
          .from("projects")
          .select("name")
          .eq("id", ctxProjectId)
          .single<{ name: string }>(),
        ctxSectionId
          ? supabase
              .from("project_sections")
              .select("name")
              .eq("id", ctxSectionId)
              .single<{ name: string }>()
          : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      setCtxProjectName(project?.name ?? null);
      setCtxSectionName(section?.name ?? null);
    };
    void fetchContext();
    return () => {
      active = false;
    };
  }, [ctxProjectId, ctxSectionId]);

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    return token;
  };

  const addProductToDefaultProject = async (productId: string) => {
    const token = await getAccessToken();
    if (!token) {
      router.replace("/");
      return;
    }

    const res = await fetch("/api/project-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        ctxProjectId && ctxSectionId
          ? {
              action: "add_to_project",
              productId,
              projectId: ctxProjectId,
              sectionId: ctxSectionId,
            }
          : { action: "add_default", productId },
      ),
    });

    const payload = (await res.json().catch(() => null)) as
      | {
          ok: true;
          projectItemId: string;
          project: { id: string; name: string };
        }
      | { ok: false; needsProject?: boolean; error?: string }
      | null;

    if (!payload) {
      throw new Error("Unexpected response");
    }
    if ("ok" in payload && payload.ok) {
      setAddedProductIds((prev) => new Set(prev.add(productId)));
      setToast({
        open: true,
        projectName: payload.project?.name ?? ctxProjectName ?? "",
        productId,
        projectItemId: payload.projectItemId,
      });
      return;
    }

    if (payload.needsProject) {
      setChangeModal({ open: true, productId, projectItemId: null });
      return;
    }

    throw new Error(payload.error || "Failed to add product");
  };

  const handleHeartClick = async (productId: string) => {
    if (addingProductIds.has(productId)) return;
    setAddingProductIds((prev) => new Set(prev).add(productId));
    try {
      await addProductToDefaultProject(productId);
    } catch {
      // Silent fail to avoid leaking auth/project state; UI stays unchanged.
    } finally {
      setAddingProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const toggleSelection = (
    value: string,
    selectedValues: string[],
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setSelectedTags([]);
    setSearchInput("");
    setSearchTerm("");
    setSortKey("az");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const pageModel = useMemo(
    () => getPageModel(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const showingStart =
    totalProducts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd =
    totalProducts === 0 ? 0 : Math.min(currentPage * pageSize, totalProducts);

  const Pagination = ({ className = "" }: { className?: string }) => (
    <div
      className={[
        "flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="text-xs font-semibold text-gray-500">
        Showing {showingStart}-{showingEnd} of {totalProducts} results
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          aria-label="Previous page"
          disabled={currentPage <= 1}
        >
          <Icon name="chevronLeft" className="h-4.5 w-4.5" />
        </button>

        {pageModel.map((entry, idx) =>
          entry === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-xs font-semibold text-gray-500"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => setCurrentPage(entry)}
              className={[
                "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-semibold ring-1 transition-colors",
                entry === currentPage
                  ? "bg-emerald-900 text-white ring-emerald-900/20"
                  : "bg-gray-100 text-gray-700 ring-gray-200 hover:bg-gray-50",
              ].join(" ")}
              aria-current={entry === currentPage ? "page" : undefined}
            >
              {entry}
            </button>
          ),
        )}

        <span className="text-xs font-semibold text-gray-500">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          aria-label="Next page"
          disabled={currentPage >= totalPages}
        >
          <Icon name="chevronRight" className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );

  const openGallery = (images: string[], startIndex = 0) => {
    setGalleryImages(images);
    setGalleryIndex(Math.max(0, Math.min(startIndex, images.length - 1)));
    setGalleryOpen(true);
  };
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setPageSize(12);
      } else if (window.innerWidth < 1024) {
        setPageSize(18);
      } else {
        setPageSize(24);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    const activeCategoryKey = searchParams.get("category");
    const loadFilters = async () => {
      setFiltersLoading(true);
      setFiltersError(false);
      if (activeCategoryKey) {
        setIsLoadingSubcategories(true);
        setSubcategories([]);
      } else {
        setIsLoadingSubcategories(false);
        setSubcategories([]);
      }
      try {
        const [
          { data: cats, error: catsErr },
          { data: mans, error: mansErr },
          { data: tagRows, error: tagsErr },
        ] = await Promise.all([
          supabase
            .from("categories")
            .select("id, name, slug")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("manufacturers")
            .select("id, name")
            .eq("is_archived", false)
            .order("sort_order", { ascending: true }),
          supabase
            .from("tags")
            .select("id, name, slug")
            .order("name", { ascending: true }),
        ]);

        if (activeCategoryKey) {
          const matchedCat = cats?.find(
            (c) => c.slug === activeCategoryKey || c.id === activeCategoryKey,
          );
          if (matchedCat) {
            const { data: subRows } = await supabase
              .from("subcategories")
              .select("id, name, slug")
              .eq("category_id", matchedCat.id)
              .eq("is_active", true)
              .order("sort_order", { ascending: true });
            if (active) {
              setSubcategories(
                subRows?.map((s) => ({
                  id: s.id,
                  label: s.name,
                  slug: s.slug,
                })) ?? [],
              );
            }
          }
          if (active) setIsLoadingSubcategories(false);
        }

        if (catsErr || mansErr || tagsErr) {
          throw catsErr || mansErr || tagsErr;
        }

        if (!active) return;
        setCategories(
          (cats ?? []).map((c) => ({ id: c.id, label: c.name, slug: c.slug })),
        );
        setSuppliers((mans ?? []).map((m) => ({ id: m.id, label: m.name })));
        setTags(
          (tagRows ?? []).map((t) => ({
            id: t.id,
            label: t.name,
            slug: t.slug,
          })),
        );

        const categoryKey = searchParams.get("category");
        if (categoryKey) {
          const matched = (cats ?? []).find(
            (c) => c.slug === categoryKey || c.id === categoryKey,
          );
          setSelectedCategories(matched ? [matched.id] : []);
        } else {
          // Clicking "All" removes category query param; clear any previous filter.
          setSelectedCategories([]);
          setIsLoadingSubcategories(false);
        }
        const searchFromUrl = searchParams.get("search")?.trim() ?? "";
        if (searchFromUrl) {
          setSearchInput(searchFromUrl);
          setSearchTerm(searchFromUrl);
          setCurrentPage(1);
        }
      } catch {
        if (!active) return;
        setFiltersError(true);
        setIsLoadingSubcategories(false);
      } finally {
        if (active) {
          setFiltersLoading(false);
          setIsLoadingSubcategories(false);
        }
      }
    };
    loadFilters();
    return () => {
      active = false;
    };
  }, [searchParams]);

  // ✅ Single auth call — no lock contention
  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      setRoleLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser(); // only call
        const user = authData.user;

        if (!active) return;

        if (!user) {
          router.replace("/");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!active) return;
        setIsAdmin(profile?.role === "admin");
      } finally {
        if (active) setRoleLoading(false);
      }
    };

    void initAuth();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(false);

      try {
        let productIdsByTags: string[] | null = null;
        let manufacturerIdsBySearch: string[] | null = null;
        let productIdsBySearchTags: string[] | null = null;

        if (selectedTags.length > 0) {
          const { data: tagJoinRows, error: tagJoinErr } = await supabase
            .from("product_tags")
            .select("product_id")
            .in("tag_id", selectedTags);
          if (tagJoinErr) throw tagJoinErr;
          productIdsByTags = Array.from(
            new Set((tagJoinRows ?? []).map((row) => row.product_id)),
          );
        }

        if (searchTerm) {
          const {
            data: matchingManufacturers,
            error: matchingManufacturersError,
          } = await supabase
            .from("manufacturers")
            .select("id")
            .ilike("name", `%${searchTerm}%`);
          if (matchingManufacturersError) throw matchingManufacturersError;
          manufacturerIdsBySearch = (matchingManufacturers ?? []).map(
            (manufacturer) => manufacturer.id,
          );

          const { data: matchingTags, error: matchingTagsError } =
            await supabase
              .from("tags")
              .select("id")
              .ilike("name", `%${searchTerm}%`);
          if (matchingTagsError) throw matchingTagsError;
          const matchingTagIds = (matchingTags ?? []).map((tag) => tag.id);
          if (matchingTagIds.length > 0) {
            const { data: searchTagJoinRows, error: searchTagJoinError } =
              await supabase
                .from("product_tags")
                .select("product_id")
                .in("tag_id", matchingTagIds);
            if (searchTagJoinError) throw searchTagJoinError;
            productIdsBySearchTags = Array.from(
              new Set((searchTagJoinRows ?? []).map((row) => row.product_id)),
            );
          }
        }

        // ── COUNT QUERY ──────────────────────────────────────────────
        let countQuery = supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_archived", false);

        if (selectedCategories.length > 0) {
          countQuery = countQuery.in("category_id", selectedCategories);
        }
        if (selectedSuppliers.length > 0) {
          countQuery = countQuery.in("manufacturer_id", selectedSuppliers);
        }

        const activeSubcategorySlug = searchParams.get("subcategory");
        if (activeSubcategorySlug) {
          const matchedSub = subcategories.find(
            (s) => (s.slug ?? s.id) === activeSubcategorySlug,
          );
          if (matchedSub) {
            countQuery = countQuery.eq("subcategory_id", matchedSub.id); // ✅ countQuery only
          }
        }

        if (productIdsByTags) {
          countQuery =
            productIdsByTags.length > 0
              ? countQuery.in("id", productIdsByTags)
              : countQuery.in("id", ["__none__"]);
        }
        if (searchTerm) {
          const escaped = searchTerm.replace(/,/g, " ");
          const orClauses = [
            `name.ilike.%${escaped}%`,
            `product_type.ilike.%${escaped}%`,
            `short_description.ilike.%${escaped}%`,
          ];
          if (manufacturerIdsBySearch && manufacturerIdsBySearch.length > 0) {
            orClauses.push(
              `manufacturer_id.in.(${manufacturerIdsBySearch.join(",")})`,
            );
          }
          if (productIdsBySearchTags && productIdsBySearchTags.length > 0) {
            orClauses.push(`id.in.(${productIdsBySearchTags.join(",")})`);
          }
          countQuery = countQuery.or(orClauses.join(","));
        }

        const { count, error: countErr } = await countQuery;
        if (countErr) throw countErr;

        // ── DATA QUERY ───────────────────────────────────────────────
        let dataQuery = supabase
          .from("products")
          .select(
            "id, name, product_type, short_description, product_url, slug, created_at, manufacturers(name), product_images(file_path, is_primary)",
          )
          .eq("is_archived", false);

        if (selectedCategories.length > 0) {
          dataQuery = dataQuery.in("category_id", selectedCategories);
        }
        if (selectedSuppliers.length > 0) {
          dataQuery = dataQuery.in("manufacturer_id", selectedSuppliers);
        }

        const activeSubSlug = searchParams.get("subcategory"); // different const name
        if (activeSubSlug) {
          const matchedSub = subcategories.find(
            (s) => (s.slug ?? s.id) === activeSubSlug,
          );
          if (matchedSub) {
            dataQuery = dataQuery.eq("subcategory_id", matchedSub.id); // ✅ dataQuery only
          }
        }

        if (productIdsByTags) {
          dataQuery =
            productIdsByTags.length > 0
              ? dataQuery.in("id", productIdsByTags)
              : dataQuery.in("id", ["__none__"]);
        }
        if (searchTerm) {
          const escaped = searchTerm.replace(/,/g, " ");
          const orClauses = [
            `name.ilike.%${escaped}%`,
            `product_type.ilike.%${escaped}%`,
            `short_description.ilike.%${escaped}%`,
          ];
          if (manufacturerIdsBySearch && manufacturerIdsBySearch.length > 0) {
            orClauses.push(
              `manufacturer_id.in.(${manufacturerIdsBySearch.join(",")})`,
            );
          }
          if (productIdsBySearchTags && productIdsBySearchTags.length > 0) {
            orClauses.push(`id.in.(${productIdsBySearchTags.join(",")})`);
          }
          dataQuery = dataQuery.or(orClauses.join(","));
        }

        // ── SORT + FETCH ─────────────────────────────────────────────
        if (sortKey === "popular") {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token ?? null;
          if (!accessToken) throw new Error("Unauthorized");
          const activePopularSubSlug = searchParams.get("subcategory");
          const matchedPopularSub = activePopularSubSlug
            ? subcategories.find((s) => (s.slug ?? s.id) === activePopularSubSlug)
            : null;

          const popularRes = await fetch("/api/products/popular", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              page: currentPage,
              pageSize,
              searchTerm,
              selectedCategories,
              selectedSuppliers,
              selectedTags,
              selectedSubcategoryId: matchedPopularSub?.id ?? null,
            }),
          });

          const popularPayload = (await popularRes.json().catch(() => null)) as
            | { productIds: string[]; total: number }
            | { error: string };
          if (!popularRes.ok || !popularPayload || "error" in popularPayload) {
            throw new Error(
              (popularPayload && "error" in popularPayload
                ? popularPayload.error
                : "Failed to load popular products") as string,
            );
          }

          const ids = popularPayload.productIds ?? [];
          setTotalProducts(popularPayload.total ?? 0);
          if (ids.length === 0) {
            setProducts([]);
            return;
          }

          const { data: productRows, error: productsErr } = await dataQuery.in(
            "id",
            ids,
          );
          if (productsErr) throw productsErr;

          const rowMap = new Map(
            ((productRows ?? []) as unknown as ProductRow[]).map((r) => [
              r.id,
              r,
            ]),
          );
          const orderedRows = ids
            .map((id) => rowMap.get(id))
            .filter(Boolean) as ProductRow[];

          if (!active) return;

          const mappedProducts: Product[] = orderedRows.map((row, idx) => {
            const imageUrls = (row.product_images ?? [])
              .map((img) =>
                img.file_path
                  ? supabase.storage
                      .from("product-images")
                      .getPublicUrl(img.file_path).data.publicUrl
                  : null,
              )
              .filter((u): u is string => Boolean(u));
            const primary =
              (row.product_images ?? []).find((img) => img.is_primary) ?? null;
            const image = primary?.file_path
              ? supabase.storage
                  .from("product-images")
                  .getPublicUrl(primary.file_path).data.publicUrl
              : (imageUrls[0] ?? null);
            return {
              id: row.id,
              name: row.name,
              subtext: row.manufacturers?.[0]?.name || "",
              productType: row.product_type,
              description: row.short_description,
              image,
              galleryImages: imageUrls,
              productUrl: row.product_url,
              createdAt: row.created_at,
              isWishlisted: idx % 2 === 0,
            };
          });

          setProducts(mappedProducts);
          const newTotalPages = Math.max(
            1,
            Math.ceil((popularPayload.total ?? 0) / pageSize),
          );
          if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
          return;
        }

        if (sortKey === "az") {
          dataQuery = dataQuery.order("name", { ascending: true });
        } else if (sortKey === "za") {
          dataQuery = dataQuery.order("name", { ascending: false });
        } else if (sortKey === "newest") {
          dataQuery = dataQuery.order("created_at", { ascending: false });
        } else {
          dataQuery = dataQuery.order("created_at", { ascending: true });
        }

        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data: productRows, error: productsErr } = await dataQuery.range(
          from,
          to,
        );
        if (productsErr) throw productsErr;

        if (!active) return;

        const mappedProducts: Product[] = (
          (productRows ?? []) as unknown as ProductRow[]
        ).map((row, idx) => {
          const primary =
            (row.product_images ?? []).find((img) => img.is_primary) ?? null;
          const imageUrls = (row.product_images ?? [])
            .map((img) =>
              img.file_path
                ? supabase.storage
                    .from("product-images")
                    .getPublicUrl(img.file_path).data.publicUrl
                : null,
            )
            .filter((u): u is string => Boolean(u));
          const image = primary?.file_path
            ? supabase.storage
                .from("product-images")
                .getPublicUrl(primary.file_path).data.publicUrl
            : (imageUrls[0] ?? null);
          return {
            id: row.id,
            name: row.name,
            subtext: row.manufacturers?.[0]?.name || "",
            productType: row.product_type,
            description: row.short_description,
            image,
            galleryImages: imageUrls,
            productUrl: row.product_url,
            createdAt: row.created_at,
            isWishlisted: idx % 2 === 0,
          };
        });

        setTotalProducts(count ?? 0);
        setProducts(mappedProducts);

        const newTotalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
        if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
      } catch {
        if (!active) return;
        setProductsError(true);
        setProducts([]);
        setTotalProducts(0);
      } finally {
        if (active) setProductsLoading(false);
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [
    currentPage,
    pageSize,
    searchTerm,
    selectedCategories,
    selectedSuppliers,
    selectedTags,
    sortKey,
    subcategories,
    searchParams,
  ]);

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "az", label: "Product name A-Z" },
    { value: "za", label: "Product name Z-A" },
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "popular", label: "Most Popular" },
  ];

  return (
    <>
      {/* Context bar — only shown when arriving from a project board */}
      {ctxProjectId && (
        <div className="sticky top-0 z-40 -mx-4 mb-0 flex items-center justify-between gap-3 border-b border-emerald-950/20 bg-emerald-900 px-5 py-3 shadow-sm sm:-mx-6">
          <div className="flex items-center gap-2 min-w-0 text-sm text-white">
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 shrink-0 text-emerald-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="3" y="2" width="14" height="16" rx="2" />
              <path
                d="M7 2v4h6V2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M7 9h6M7 13h4" strokeLinecap="round" />
            </svg>
            <span className="font-semibold shrink-0">Adding to:</span>
            <span className="truncate font-medium text-emerald-100">
              {ctxProjectName ?? "…"}
            </span>
            {ctxSectionName && (
              <>
                <span className="text-emerald-400 shrink-0">›</span>
                <span className="truncate text-emerald-200">
                  {ctxSectionName}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/project-board/${ctxProjectId}`)
            }
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/25"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4L6 10l6 6" />
            </svg>
            Back to Project
          </button>
        </div>
      )}
      {/* Product Catalogue Content */}
      <main className="mt-6">
        <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Product Catalogue
            </h1>
            <p className="mt-1 text-sm font-medium text-emerald-100/75">
              {totalProducts} products available
            </p>
          </div>
          {!roleLoading && isAdmin ? (
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
            >
              <span className="text-lg font-bold leading-none">
                    +
                  </span>
              Add New Product
            </Link>
          ) : null}
        </section>

        {/* ── Row 1: Category chips ── */}
        <div className="mt-5 -mx-1">
          <div className="flex items-center gap-4 overflow-x-auto rounded-2xl bg-gray-100 px-4 py-3 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                const base = ctxProjectId
                  ? `/dashboard/product-catalogue?projectId=${ctxProjectId}&sectionId=${ctxSectionId}`
                  : `/dashboard/product-catalogue`;
                router.push(base);
              }}
              className={[
                "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                !searchParams.get("category")
                  ? "bg-emerald-700 text-white ring-1 ring-emerald-900/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              All
            </button>

            {categories.map((cat) => {
              const isActive =
                searchParams.get("category") === (cat.slug ?? cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    const params = new URLSearchParams();
                    params.set("category", cat.slug ?? cat.id);
                    if (ctxProjectId) params.set("projectId", ctxProjectId);
                    if (ctxSectionId) params.set("sectionId", ctxSectionId);
                    router.push(
                      `/dashboard/product-catalogue?${params.toString()}`,
                    );
                  }}
                  className={[
                    "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-emerald-700 text-white ring-1 ring-emerald-900/20"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Row 2: Subcategory chips — shown only when a category is selected ── */}
        {searchParams.get("category") && (
          <div className="mt-3 -mx-1">
            <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-gray-100 px-4 py-3 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  const params = new URLSearchParams();
                  params.set("category", searchParams.get("category")!);
                  if (ctxProjectId) params.set("projectId", ctxProjectId);
                  if (ctxSectionId) params.set("sectionId", ctxSectionId);
                  router.push(
                    `/dashboard/product-catalogue?${params.toString()}`,
                  );
                }}
                className={[
                  "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  !searchParams.get("subcategory")
                    ? "bg-emerald-700 text-white ring-1 ring-emerald-900/20"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                All
              </button>

              {isLoadingSubcategories ? (
                <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-500 ring-1 ring-gray-200 whitespace-nowrap">
                  Loading...
                </span>
              ) : subcategories.length === 0 ? (
                <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-gray-200 whitespace-nowrap">
                  No subcategories
                </span>
              ) : (
                subcategories.map((sub) => {
                  const isActive =
                    searchParams.get("subcategory") === (sub.slug ?? sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setCurrentPage(1);
                        const params = new URLSearchParams();
                        params.set("category", searchParams.get("category")!);
                        params.set("subcategory", sub.slug ?? sub.id);
                        if (ctxProjectId) params.set("projectId", ctxProjectId);
                        if (ctxSectionId) params.set("sectionId", ctxSectionId);
                        router.push(
                          `/dashboard/product-catalogue?${params.toString()}`,
                        );
                      }}
                      className={[
                        "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-emerald-700 text-white ring-1 ring-emerald-900/20"
                          : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {sub.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          {/* FiltersSidebar (future refactor) */}
          <aside className="h-fit rounded-[18px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-900/10">
                  <Icon name="sliders" className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-emerald-950">
                    Filters
                  </div>
                  <div className="text-xs font-semibold text-gray-500">
                    Refine results
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[14px] bg-[#f3f6f5] p-3 ring-1 ring-emerald-900/10">
                <div className="text-xs font-semibold text-emerald-950">
                  Supplier
                </div>
                <div className="mt-2 space-y-2">
                  {filtersLoading ? (
                    <div className="text-[12px] font-medium text-gray-500">
                      Loading...
                    </div>
                  ) : null}
                  {suppliers.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSuppliers.includes(s.id)}
                        onChange={() => {
                          setCurrentPage(1);
                          toggleSelection(
                            s.id,
                            selectedSuppliers,
                            setSelectedSuppliers,
                          );
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[14px] bg-[#f3f6f5] p-3 ring-1 ring-emerald-900/10">
                <div className="text-xs font-semibold text-emerald-950">
                  Tags
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filtersLoading ? (
                    <div className="text-[12px] font-medium text-gray-500">
                      Loading...
                    </div>
                  ) : null}
                  {tags.map((t) => (
                    <label
                      key={t.id}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(t.id)}
                        onChange={() => {
                          setCurrentPage(1);
                          toggleSelection(t.id, selectedTags, setSelectedTags);
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              >
                Clear All Filters
              </button>
              {filtersError ? (
                <div className="text-[12px] font-medium text-gray-500">
                  Could not load data
                </div>
              ) : null}
            </div>
          </aside>

          <section className="rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5 flex flex-col min-h-[600px]">
            {/* CatalogueToolbar (future refactor) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[520px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <Icon name="search" className="h-4.5 w-4.5" />
                </span>
                <input
                  type="search"
                  placeholder="Search products by name or manufacturer..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="h-10 w-full rounded-full bg-gray-100 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <div className="inline-flex items-center rounded-full bg-gray-100 p-1 ring-1 ring-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsListView(false)}
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full",
                      isListView
                        ? "text-gray-500 hover:text-gray-700"
                        : "bg-white text-emerald-900 shadow-sm ring-1 ring-black/5",
                    ].join(" ")}
                    aria-label="Grid view"
                  >
                    <Icon name="grid" className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsListView(true)}
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full",
                      isListView
                        ? "bg-white text-emerald-900 shadow-sm ring-1 ring-black/5"
                        : "text-gray-500 hover:text-gray-700",
                    ].join(" ")}
                    aria-label="List view"
                  >
                    <Icon name="list" className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen((prev) => !prev)}
                    onBlur={() => setTimeout(() => setSortOpen(false), 150)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-gray-100 px-3.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none"
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <span>
                      {sortOptions.find((o) => o.value === sortKey)?.label}
                    </span>
                    <Icon
                      name="chevronDown"
                      className={[
                        "h-4 w-4 transition-transform duration-200",
                        sortOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/10">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onMouseDown={() => {
                            setSortKey(option.value);
                            setCurrentPage(1);
                            setSortOpen(false);
                          }}
                          className={[
                            "flex w-full items-center px-4 py-2.5 text-xs font-semibold transition-colors",
                            sortKey === option.value
                              ? "bg-emerald-900 text-white"
                              : "text-gray-700 hover:bg-gray-100",
                          ].join(" ")}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ProductGrid (future refactor) */}
            <Pagination className="mt-4" />
            <div className="mt-4 flex-1 min-h-0">
              <div
                className={[
                  isListView
                    ? "grid grid-cols-1 gap-3"
                    : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
                  productsLoading ? "opacity-50" : "",
                ].join(" ")}
              >
                {!productsLoading && !productsError && products.length === 0 ? (
                  <div className="text-sm font-medium text-gray-500">
                    No products found
                  </div>
                ) : null}
                {productsError ? (
                  <div className="text-sm font-medium text-gray-500">
                    Could not load data
                  </div>
                ) : null}
                {products.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-[18px] bg-white ring-1 ring-gray-200/80 shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
                  >
                    {isListView ? (
                      <div className="flex items-start gap-3 p-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-[#eef3f2] ring-1 ring-black/5">
                          {p.productUrl ? (
                            <a
                              href={p.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0"
                            >
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gray-200" />
                              )}
                            </a>
                          ) : p.image ? (
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gray-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {p.productUrl ? (
                            <h3 className="text-sm font-semibold text-emerald-950">
                              <a
                                href={p.productUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {p.name}
                              </a>
                            </h3>
                          ) : (
                            <h3 className="text-sm font-semibold text-emerald-950">
                              {p.name}
                            </h3>
                          )}
                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {p.subtext}
                          </p>
                          {p.productType ? (
                            <p className="mt-1 text-xs font-medium text-gray-500">
                              {p.productType}
                            </p>
                          ) : null}
                          {p.description ? (
                            <p className="mt-2 text-xs leading-relaxed text-gray-500">
                              {getSafeDescription(p.description)}
                            </p>
                          ) : null}
                        </div>
                        {(p.galleryImages?.length ?? 0) > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              openGallery(p.galleryImages ?? [], 0)
                            }
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white"
                            aria-label="Open gallery"
                            title="Gallery"
                          >
                            <Icon name="grid" className="h-4.5 w-4.5" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleHeartClick(p.id)}
                          disabled={addingProductIds.has(p.id)}
                          className={[
                            "inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold ring-1 transition-colors",
                            addedProductIds.has(p.id)
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-emerald-900 text-white ring-emerald-900/20 hover:bg-emerald-800",
                            addingProductIds.has(p.id) ? "opacity-60" : "",
                          ].join(" ")}
                          aria-label="Add to project"
                        >
                          {addedProductIds.has(p.id) ? (
                            <>
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 fill-none stroke-current"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                              Added
                            </>
                          ) : (
                            <>
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 fill-none stroke-current"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col p-4">
                        <div className="relative overflow-hidden rounded-[14px] bg-[#eef3f2] ring-1 ring-black/5">
                          <div className="relative aspect-square w-full">
                            {p.productUrl ? (
                              <a
                                href={p.productUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {p.image ? (
                                  <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gray-200" />
                                )}
                              </a>
                            ) : p.image ? (
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gray-200" />
                            )}
                          </div>

                          {(p.galleryImages?.length ?? 0) > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                openGallery(p.galleryImages ?? [], 0)
                              }
                              className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white"
                              aria-label="Open gallery"
                              title="Gallery"
                            >
                              <Icon name="grid" className="h-4.5 w-4.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void handleHeartClick(p.id)}
                            className={[
                              "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white",
                              addedProductIds.has(p.id)
                                ? "text-emerald-700"
                                : "",
                              addingProductIds.has(p.id) ? "opacity-60" : "",
                            ].join(" ")}
                            aria-label="Add to project"
                            disabled={addingProductIds.has(p.id)}
                          >
                            <Icon
                              name="heart"
                              className={[
                                "h-4.5 w-4.5",
                                addedProductIds.has(p.id)
                                  ? "fill-emerald-700/15"
                                  : "",
                              ].join(" ")}
                            />
                          </button>
                        </div>

                        <div className="mt-4 flex-1">
                          {p.productUrl ? (
                            <h3 className="text-sm font-semibold text-emerald-950">
                              <a
                                href={p.productUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {p.name}
                              </a>
                            </h3>
                          ) : (
                            <h3 className="text-sm font-semibold text-emerald-950">
                              {p.name}
                            </h3>
                          )}
                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {p.subtext}
                          </p>
                          {p.productType ? (
                            <p className="mt-1 text-xs font-medium text-gray-500">
                              {p.productType}
                            </p>
                          ) : null}
                          {p.description ? (
                            <p className="mt-2 text-xs leading-relaxed text-gray-500">
                              {getSafeDescription(p.description)}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleHeartClick(p.id)}
                          disabled={addingProductIds.has(p.id)}
                          className={[
                            "mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold transition-colors",
                            addedProductIds.has(p.id)
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-emerald-900 text-white hover:bg-emerald-800",
                            addingProductIds.has(p.id) ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          {addedProductIds.has(p.id) ? (
                            <>
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 fill-none stroke-current"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                              Added to Project
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-bold leading-none">
                                +
                              </span>
                              Add to Project
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {productsLoading ? (
                <div className="mt-3 text-xs font-semibold text-gray-500">
                  Loading products...
                </div>
              ) : null}
            </div>
            {/* Pagination (future refactor) */}
            <Pagination className="mt-4" />
          </section>
        </section>
      </main>

      <AddToProjectToast
        open={!!toast?.open}
        projectName={toast?.projectName ?? ""}
        onClose={() => setToast(null)}
        onChange={() => {
          if (!toast) return;
          setChangeModal({
            open: true,
            productId: toast.productId,
            projectItemId: toast.projectItemId,
          });
          setToast(null);
        }}
      />

      <ChangeProjectModal
        open={!!changeModal?.open}
        productId={changeModal?.productId ?? ""}
        projectItemId={changeModal?.projectItemId ?? null}
        onClose={() => setChangeModal(null)}
        onSuccess={(result: {
          productId: string;
          projectItemId: string;
          projectName: string;
        }) => {
          setAddedProductIds((prev) => new Set(prev).add(result.productId));
          setToast({
            open: true,
            projectName: result.projectName,
            productId: result.productId,
            projectItemId: result.projectItemId,
          });
          setChangeModal(null);
        }}
      />

      {galleryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div className="text-sm font-semibold text-gray-900">
                Gallery ({galleryIndex + 1}/{galleryImages.length})
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white ring-1 ring-emerald-900/20 hover:bg-emerald-800"
                >
                Close
              </button>
            </div>

            <div className="relative bg-gray-50">
              <div className="relative aspect-video w-full">
                {galleryImages[galleryIndex] ? (
                  <Image
                    src={galleryImages[galleryIndex]}
                    alt="Gallery image"
                    fill
                    sizes="(min-width: 1024px) 896px, 100vw"
                    className="object-contain"
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={() =>
                  setGalleryIndex((i) =>
                    Math.max(0, Math.min(i - 1, galleryImages.length - 1)),
                  )
                }
                disabled={galleryIndex <= 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm hover:bg-white disabled:opacity-50"
                aria-label="Previous image"
              >
                <Icon name="chevronLeft" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setGalleryIndex((i) =>
                    Math.max(0, Math.min(i + 1, galleryImages.length - 1)),
                  )
                }
                disabled={galleryIndex >= galleryImages.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 ring-1 ring-black/10 shadow-sm hover:bg-white disabled:opacity-50"
                aria-label="Next image"
              >
                <Icon name="chevronRight" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
