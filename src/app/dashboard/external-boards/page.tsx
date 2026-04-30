"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ExternalProject = {
  id: string;
  name: string;
  client_name: string | null;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
  project_type: "internal" | "external" | null;
  can_edit: boolean;
  item_count: number;
  last_viewed_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ExternalBoardsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ExternalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      if (!accessToken) {
        router.push("/");
        return;
      }

      const res = await fetch("/api/projects/external", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const payload = (await res.json().catch(() => ({}))) as {
        projects?: ExternalProject[];
        error?: string;
      };

      if (!active) return;

      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        setError(payload.error ?? "Failed to load external project boards.");
        setLoading(false);
        return;
      }

      setProjects(payload.projects ?? []);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/");
    });

    void load();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="mt-6">
      <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            External Project Boards
          </h1>
          {/* <p className="mt-1 text-sm font-medium text-emerald-100/75">
            Read-only view of all external client boards
          </p> */}
        </div>
      </section>

      <section className="mt-6 rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">
          Project List
        </h2>

        {error ? (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-[14px] bg-white ring-1 ring-gray-200/80">
          <table className="min-w-[760px] w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2 sm:px-4 sm:py-3">Project Name</th>
                <th className="w-[120px] px-2 py-2 sm:px-4 sm:py-3">Client</th>
                <th className="w-[120px] px-2 py-2 sm:px-4 sm:py-3">Last updated</th>
                <th className="w-[120px] px-2 py-2 sm:px-4 sm:py-3">Last Viewed</th>
                <th className="w-[80px] px-2 py-2 text-center sm:px-4 sm:py-3">Items</th>
                <th className="w-[80px] px-2 py-2 text-right sm:px-4 sm:py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-6 text-center text-sm text-gray-500 sm:px-4"
                  >
                    Loading...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-6 text-center text-sm text-gray-500 sm:px-4"
                  >
                    No external project boards found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-gray-100 text-sm text-gray-700"
                  >
                    <td className="px-2 py-2 font-medium text-gray-900 sm:px-4 sm:py-4">
                      <span className="block max-w-[220px] truncate">
                        {project.name}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-gray-500 sm:px-4 sm:py-4">
                      <span className="block max-w-[120px] truncate">
                        {project.client_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-gray-500 sm:px-4 sm:py-4">
                      {formatDate(project.updated_at)}
                    </td>
                    <td className="px-2 py-2 text-gray-500 sm:px-4 sm:py-4">
                      {formatDate(project.last_viewed_at)}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-500 sm:px-4 sm:py-4">
                      {project.item_count}
                    </td>
                    <td className="px-2 py-2 text-right sm:px-4 sm:py-4">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/project-board/${project.id}?source=external-boards`,
                          )
                        }
                        className="inline-flex h-8 items-center rounded-lg bg-emerald-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs font-semibold text-gray-500">
          {projects.length} board{projects.length !== 1 ? "s" : ""}
        </p>
      </section>
    </main>
  );
}
