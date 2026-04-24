"use client";

import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Product = { id: string; name: string; product_type: string | null };

type Item = {
  id: string;
  section_id: string;
  quantity: number;
  client_notes: string | null;
  supplier_notes: string | null;
  sort_order: number | null;
  product: Product | null;
};

type Section = {
  id: string;
  name: string;
  notes: string | null;
  sort_order: number;
  items: Item[];
};

type ProjectDetail = {
  id: string;
  name: string;
  client_name: string | null;
  internal_reference: string | null;
  project_notes: string | null;
  project_type: "internal" | "external" | null;
  sections: Section[];
};

export default function ExternalBoardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? null;
    if (!accessToken) {
      router.push("/");
      return;
    }

    // Upsert last_viewed_at (fire and forget)
    void fetch(`/api/projects/${projectId}/view`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const currentUser = authData.user;
    if (authError || !currentUser) {
      router.push("/");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single<{ role: "admin" | "internal" | "external" }>();

    if (profileError || !profile || profile.role === "external") {
      setError("You do not have access to this project.");
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      router.replace(`/dashboard/project-board/${projectId}?source=external-boards`);
      return;
    }

    // Fetch project details
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, name, client_name, internal_reference, project_notes, project_type",
      )
      .eq("id", projectId)
      .maybeSingle<{
        id: string;
        name: string;
        client_name: string | null;
        internal_reference: string | null;
        project_notes: string | null;
        project_type: "internal" | "external" | null;
      }>();

    if (projectError || !projectData) {
      setError("External project not found.");
      setLoading(false);
      return;
    }

    if (projectData.project_type !== "external") {
      setError("You do not have access to this project.");
      setLoading(false);
      return;
    }

    // Fetch sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from("project_sections")
      .select("id, name, notes, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (sectionsError) {
      setError("Failed to load sections.");
      setLoading(false);
      return;
    }

    // Fetch items with product info
    const { data: itemsData, error: itemsError } = await supabase
      .from("project_items")
      .select(
        "id, section_id, quantity, client_notes, supplier_notes, sort_order, product:products(id, name, product_type)",
      )
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      setError("Failed to load items.");
      setLoading(false);
      return;
    }

    // Group items by section
    const itemsBySectionId = new Map<string, Item[]>();
    for (const item of (itemsData ?? []) as unknown as Item[]) {
      const list = itemsBySectionId.get(item.section_id) ?? [];
      list.push(item);
      itemsBySectionId.set(item.section_id, list);
    }

    const sections: Section[] = (
      (sectionsData ?? []) as Array<{
        id: string;
        name: string;
        notes: string | null;
        sort_order: number;
      }>
    ).map((s) => ({
      ...s,
      items: itemsBySectionId.get(s.id) ?? [],
    }));

    setProject({ ...projectData, sections });
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadProject();
    }, 0);
    return () => clearTimeout(t);
  }, [loadProject]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleDuplicate = async () => {
    setDuplicating(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? null;
    if (!accessToken) {
      router.push("/");
      return;
    }

    const res = await fetch(
      `/api/projects/${projectId}/duplicate-to-internal`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const payload = (await res.json().catch(() => ({}))) as {
      projectId?: string;
      error?: string;
    };

    if (!res.ok || !payload.projectId) {
      setError(payload.error ?? "Failed to duplicate project.");
      setDuplicating(false);
      return;
    }

    // Redirect to the new internal project board
    router.push(`/dashboard/project-board/${payload.projectId}`);
  };

  if (loading) {
    return (
      <main className="mt-6">
        <p className="text-sm text-emerald-100/75">Loading project...</p>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="mt-6">
        <p className="text-sm font-medium text-red-400">
          {error || "Project not found."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/external-boards")}
          className="mt-3 text-sm text-emerald-100/75 underline"
        >
          ← Back to External Boards
        </button>
      </main>
    );
  }

  return (
    <main className="mt-6">
      {/* Header */}
      <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/external-boards")}
            className="mb-2 text-xs text-emerald-100/70 hover:text-emerald-100 underline"
          >
            ← External Boards
          </button>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {project.name}
          </h1>
          {project.client_name ? (
            <p className="mt-1 text-sm font-medium text-emerald-100/75">
              {project.client_name}
            </p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-emerald-100/65">
            Internal Reference: {project.internal_reference ?? "—"}
          </p>
          <span className="mt-2 inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100 ring-1 ring-white/20">
            Read-only
          </span>
        </div>

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={duplicating}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {duplicating ? "Duplicating..." : "⊕ Duplicate to Internal Project"}
        </button>
      </section>

      {/* Project notes */}
      {project.project_notes ? (
        <div className="mt-4 rounded-[14px] bg-white/10 px-4 py-3 text-sm text-emerald-50/80 ring-1 ring-white/10">
          {project.project_notes}
        </div>
      ) : null}

      {/* Sections */}
      <div className="mt-6 space-y-5">
        {project.sections.map((section) => (
          <div
            key={section.id}
            className="rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5"
          >
            <h2 className="text-[18px] font-semibold text-gray-900">
              {section.name}
            </h2>
            {section.notes ? (
              <p className="mt-1 text-xs text-gray-500">{section.notes}</p>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-[14px] ring-1 ring-gray-200/80">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Product</th>
                    <th className="w-[120px] px-4 py-3">Type</th>
                    <th className="w-[80px] px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3">Client Notes</th>
                    <th className="px-4 py-3">Supplier Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-5 text-center text-sm text-gray-400"
                      >
                        No items in this section.
                      </td>
                    </tr>
                  ) : (
                    section.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 text-sm text-gray-700"
                      >
                        <td className="px-4 py-3 font-medium">
                          {item.product?.name ?? "Unknown product"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {item.product?.product_type ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {item.client_notes ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {item.supplier_notes ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
