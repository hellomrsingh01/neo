/* eslint-disable react/no-unknown-property */
"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ProjectRow = {
  id: string;
  name: string;
  client_name: string | null;
  internal_reference: string | null;
  project_notes: string | null;
  totalList: number;
  totalUnits: number;
  owner_user_id: string;
  owner_name: string | null;
  owner_email: string | null;
};

type ProjectsPayload = {
  projects: ProjectRow[];
  showingCount: number;
  totalCount: number;
  totalUnits: number;
  canViewAll: boolean;
};

type ProjectFormState = {
  name: string;
  client_name: string;
  internal_reference: string;
  project_notes: string;
};

const emptyForm: ProjectFormState = {
  name: "",
  client_name: "",
  internal_reference: "",
  project_notes: "",
};

function ActionIcon({
  name,
  className,
}: {
  name: "trash" | "edit";
  className?: string;
}) {
  const common = "stroke-current fill-none";

  if (name === "trash") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 7h16M9 7V5.6c0-.9.7-1.6 1.6-1.6h2.8c.9 0 1.6.7 1.6 1.6V7"
          className={common}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.2 7 8 19.2c.1 1 1 1.8 2 1.8h4c1 0 1.9-.8 2-1.8L16.8 7"
          className={common}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 11.2v5.6M14 11.2v5.6"
          className={common}
          strokeWidth="1.7"
          strokeLinecap="round"
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
        d="m4 16.8 9.8-9.8 3.4 3.4L7.4 20.2 4 21l.8-4.2Z"
        className={common}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12.8 8 3.4 3.4"
        className={common}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ProjectBoardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdminView, setIsAdminView] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showingCount = projects.length;
  const totalCount = projects.length;
  const totalUnits = useMemo(
    () => projects.reduce((sum, project) => sum + project.totalUnits, 0),
    [projects],
  );

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    const accessToken = await getAccessToken();

    if (!accessToken) {
      router.push("/");
      return;
    }

    const response = await fetch("/api/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response
      .json()
      .catch(() => ({}))) as Partial<ProjectsPayload> & {
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error || "Failed to load projects.");
      setLoading(false);
      return;
    }

    setProjects(payload.projects ?? []);
    setIsAdminView(Boolean(payload.canViewAll));
    setLoading(false);
  }, [getAccessToken, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadProjects();
    }, 0);
    return () => clearTimeout(t);
  }, [loadProjects]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (project: ProjectRow) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      client_name: project.client_name ?? "",
      internal_reference: project.internal_reference ?? "",
      project_notes: project.project_notes ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingProject(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      router.push("/");
      return;
    }

    setSaving(true);
    setError("");

    const body = JSON.stringify({
      name,
      client_name: form.client_name.trim(),
      internal_reference: form.internal_reference.trim(),
      project_notes: form.project_notes.trim(),
    });

    if (editingProject) {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setSaving(false);
        setError(payload.error || "Failed to update project.");
        return;
      }

      await loadProjects();
      setSaving(false);
      closeModal();
      return;
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      projectId?: string;
      error?: string;
    };

    setSaving(false);
    if (!response.ok || !payload.projectId) {
      setError(payload.error || "Failed to create project.");
      return;
    }

    closeModal();
    router.push(`/dashboard/project-board/${payload.projectId}`);
  };

  const handleDelete = async (project: ProjectRow) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      router.push("/");
      return;
    }

    setDeletingId(project.id);
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    setDeletingId(null);
    setProjectToDelete(null);

    if (!response.ok) {
      setError(payload.error || "Failed to delete project.");
      return;
    }

    await loadProjects();
  };

  return (
    <main className="mt-6">
      <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Project Board
          </h1>
          <p className="mt-1 text-sm font-medium text-emerald-100/75">
            Manage your project boards
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
        >
          <span className="text-lg font-bold leading-none">
            +
          </span>
          Add New Project
        </button>
      </section>

      <section className="mt-6 rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">
          Project List
        </h2>
        {error ? (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-[14px] bg-white ring-1 ring-gray-200/80">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Project Name</th>
                <th className="w-[140px] px-4 py-3">Total List</th>
                {isAdminView ? (
                  <th className="w-[220px] px-4 py-3">Owner</th>
                ) : null}
                <th className="w-[140px] px-4 py-3 text-right">Others</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-t border-gray-100 text-sm text-gray-700">
                  <td
                    colSpan={isAdminView ? 4 : 3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Loading projects...
                  </td>
                </tr>
              ) : null}
              {!loading && projects.length === 0 ? (
                <tr className="border-t border-gray-100 text-sm text-gray-700">
                  <td
                    colSpan={isAdminView ? 4 : 3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : null}
              {!loading
                ? projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-t border-gray-100 text-sm text-gray-700"
                    >
                      <td className="px-4 py-4 font-medium">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/project-board/${project.id}`,
                            )
                          }
                          className="text-left text-gray-700 underline-offset-2 hover:text-emerald-800 hover:underline"
                        >
                          {project.name}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {project.totalList}
                      </td>
                      {isAdminView ? (
                        <td className="px-4 py-4 text-gray-500">
                          {project.owner_name ||
                            project.owner_email ||
                            "Unknown owner"}
                        </td>
                      ) : null}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setProjectToDelete(project)}
                            disabled={deletingId === project.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-60"
                            aria-label="Delete project"
                          >
                            <ActionIcon name="trash" className="h-4.5 w-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(project)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Edit project"
                          >
                            <ActionIcon name="edit" className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-gray-500">
          <p>
            Showing {showingCount} of {totalCount} items
          </p>
          <p>Total Units: {totalUnits}</p>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-[18px] bg-white p-5 text-gray-900 shadow-2xl ring-1 ring-black/10">
            <h3 className="text-lg font-semibold text-emerald-950">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Project Name *
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                  className="mt-1 h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Client Name
                </label>
                <input
                  value={form.client_name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      client_name: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Internal Reference
                </label>
                <input
                  value={form.internal_reference}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      internal_reference: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-[12px] bg-gray-100 px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Project Notes
                </label>
                <textarea
                  value={form.project_notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      project_notes: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-[12px] bg-gray-100 px-3 py-2 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                />
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 rounded-[12px] bg-gray-100 px-4 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-[12px] bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {projectToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-[18px] bg-white p-5 text-gray-900 shadow-2xl ring-1 ring-black/10">
            <h3 className="text-lg font-semibold text-emerald-950">
              Delete project?
            </h3>
            <p className="mt-2 text-sm font-medium text-gray-600">
              This action will permanently delete the project and cannot be
              undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingId === projectToDelete.id}
                className="h-10 rounded-[12px] bg-gray-100 px-4 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(projectToDelete)}
                disabled={deletingId === projectToDelete.id}
                className="h-10 rounded-[12px] bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {deletingId === projectToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
