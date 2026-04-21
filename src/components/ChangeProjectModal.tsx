"use client";
 
 import { useEffect, useMemo, useState } from "react";
 import { supabase } from "@/lib/supabaseClient";
 
 type ProjectRow = { id: string; name: string; created_at: string };
 type SectionRow = { id: string; name: string; sort_order: number | null };
 
 export default function ChangeProjectModal({
   open,
   productId,
   projectItemId,
   onClose,
   onSuccess,
 }: {
   open: boolean;
   productId: string;
   projectItemId: string | null;
   onClose: () => void;
   onSuccess: (result: { productId: string; projectItemId: string; projectName: string }) => void;
 }) {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const [projects, setProjects] = useState<ProjectRow[]>([]);
   const [sections, setSections] = useState<SectionRow[]>([]);
 
   const [selectedProjectId, setSelectedProjectId] = useState<string>("");
   const [selectedSectionId, setSelectedSectionId] = useState<string>("");
 
   const [creating, setCreating] = useState(false);
   const [newProjectName, setNewProjectName] = useState("");
 
   const selectedProjectName = useMemo(() => {
     return projects.find((p) => p.id === selectedProjectId)?.name ?? "";
   }, [projects, selectedProjectId]);
 
   const getAccessToken = async () => {
     const { data } = await supabase.auth.getSession();
     return data.session?.access_token ?? null;
   };
 
   const loadProjects = async () => {
     const { data: auth } = await supabase.auth.getUser();
     const userId = auth.user?.id ?? null;
     if (!userId) {
       setProjects([]);
       return;
     }
 
     const { data, error: err } = await supabase
       .from("projects")
       .select("id, name, created_at")
       .eq("owner_user_id", userId)
       .is("archived_at", null)
       .order("created_at", { ascending: false });
 
     if (err) throw err;
     setProjects((data ?? []) as ProjectRow[]);
   };
 
   const loadSections = async (projectId: string) => {
     if (!projectId) {
       setSections([]);
       return;
     }
 
     const { data, error: err } = await supabase
       .from("project_sections")
       .select("id, name, sort_order")
       .eq("project_id", projectId)
       .order("sort_order", { ascending: true });
 
     if (err) throw err;
     const rows = (data ?? []) as SectionRow[];
     setSections(rows);
     if (!rows.some((s) => s.id === selectedSectionId)) {
       const general = rows.find((s) => s.name === "General") ?? rows[0] ?? null;
       setSelectedSectionId(general?.id ?? "");
     }
   };
 
   useEffect(() => {
     if (!open) return;
     let active = true;
     setError(null);
     setLoading(true);
     setCreating(projectItemId === null);
     setNewProjectName("");
 
     (async () => {
       try {
         await loadProjects();
       } catch {
         if (!active) return;
         setProjects([]);
       } finally {
         if (!active) return;
         setLoading(false);
       }
     })();
 
     return () => {
       active = false;
     };
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open]);
 
   useEffect(() => {
     if (!open) return;
     if (projects.length === 0) {
       setSelectedProjectId("");
       setSections([]);
       setSelectedSectionId("");
       return;
     }
     if (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId)) {
       setSelectedProjectId(projects[0].id);
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open, projects]);
 
   useEffect(() => {
     if (!open) return;
     void loadSections(selectedProjectId).catch(() => {
       setSections([]);
       setSelectedSectionId("");
     });
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open, selectedProjectId]);
 
   const createProjectInline = async () => {
     const name = newProjectName.trim();
     if (!name) {
       setError("Project name is required");
       return;
     }
 
     const token = await getAccessToken();
     if (!token) {
       setError("Unauthorized");
       return;
     }
 
     setLoading(true);
     setError(null);
     try {
       const res = await fetch("/api/projects", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ name }),
       });
       const payload = (await res.json().catch(() => null)) as
         | { ok: true; projectId: string }
         | { error?: string }
         | null;
 
       if (!payload || !("ok" in payload) || !payload.ok) {
         throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "Failed to create project");
       }
 
       await loadProjects();
       setSelectedProjectId(payload.projectId);
       setCreating(false);
       setNewProjectName("");
     } catch (e) {
       setError(e instanceof Error ? e.message : "Failed to create project");
     } finally {
       setLoading(false);
     }
   };
 
   const confirm = async () => {
     setError(null);
 
     const token = await getAccessToken();
     if (!token) {
       setError("Unauthorized");
       return;
     }
 
     if (!selectedProjectId) {
       setError("Select a project");
       return;
     }
     if (!selectedSectionId) {
       setError("Select a section");
       return;
     }
 
     setLoading(true);
     try {
       const res = await fetch("/api/project-items", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify(
           projectItemId
             ? { action: "move", projectItemId, projectId: selectedProjectId, sectionId: selectedSectionId }
             : { action: "add_to_project", productId, projectId: selectedProjectId, sectionId: selectedSectionId },
         ),
       });
 
       const payload = (await res.json().catch(() => null)) as
         | { ok: true; projectItemId: string; project: { id: string; name: string } }
         | { ok: false; error?: string }
         | null;
 
       if (!payload || !payload.ok) {
         throw new Error(payload?.error || "Request failed");
       }
 
       onSuccess({ productId, projectItemId: payload.projectItemId, projectName: payload.project.name });
     } catch (e) {
       setError(e instanceof Error ? e.message : "Request failed");
     } finally {
       setLoading(false);
     }
   };
 
   if (!open) return null;
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
       <button
         type="button"
         className="absolute inset-0 bg-black/50"
         aria-label="Close modal"
         onClick={onClose}
       />
 
       <div className="relative w-full max-w-xl rounded-[22px] bg-white p-5 text-gray-900 shadow-[0_22px_70px_rgba(0,0,0,0.35)] ring-1 ring-black/10 sm:p-6">
         <div className="flex items-start justify-between gap-4">
           <div>
             <div className="text-lg font-semibold text-emerald-950">Add to project</div>
             <div className="mt-1 text-sm font-medium text-gray-500">
               Select a project and section, or create a new project.
             </div>
           </div>
           <button
             type="button"
             onClick={onClose}
             className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
             aria-label="Close"
           >
             <span className="text-lg leading-none">×</span>
           </button>
         </div>
 
         <div className="mt-5 space-y-4">
           {projects.length === 0 ? (
             <div className="rounded-[16px] bg-emerald-50 p-4 ring-1 ring-emerald-900/10">
               <div className="text-sm font-semibold text-emerald-950">No projects yet</div>
               <div className="mt-1 text-xs font-semibold text-emerald-900/70">
                 Create your first project to start adding products.
               </div>
             </div>
           ) : null}
 
           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
             <label className="block">
               <div className="text-xs font-semibold text-gray-700">Project</div>
               <select
                 value={selectedProjectId}
                 onChange={(e) => setSelectedProjectId(e.target.value)}
                 disabled={projects.length === 0 || loading || creating}
                 className="mt-1 h-10 w-full rounded-[14px] bg-gray-100 px-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35 disabled:opacity-60"
               >
                 {projects.map((p) => (
                   <option key={p.id} value={p.id}>
                     {p.name}
                   </option>
                 ))}
               </select>
             </label>
 
             <label className="block">
               <div className="text-xs font-semibold text-gray-700">Section</div>
               <select
                 value={selectedSectionId}
                 onChange={(e) => setSelectedSectionId(e.target.value)}
                 disabled={!selectedProjectId || sections.length === 0 || loading || creating}
                 className="mt-1 h-10 w-full rounded-[14px] bg-gray-100 px-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35 disabled:opacity-60"
               >
                 {sections.map((s) => (
                   <option key={s.id} value={s.id}>
                     {s.name}
                   </option>
                 ))}
               </select>
             </label>
           </div>
 
           <div className="rounded-[16px] bg-[#f3f6f5] p-4 ring-1 ring-emerald-900/10">
             <div className="flex items-start justify-between gap-3">
               <div>
                 <div className="text-sm font-semibold text-emerald-950">Create New Project</div>
                 <div className="mt-1 text-xs font-semibold text-gray-500">
                   A default “General” section will be created automatically.
                 </div>
               </div>
               <button
                 type="button"
                 onClick={() => {
                   setCreating((prev) => !prev);
                   setError(null);
                 }}
                 className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white ring-1 ring-emerald-900/10 hover:bg-emerald-800"
               >
                 {creating ? "Cancel" : "Create"}
               </button>
             </div>
 
             {creating ? (
               <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                 <input
                   type="text"
                   value={newProjectName}
                   onChange={(e) => setNewProjectName(e.target.value)}
                   placeholder="Project name"
                   className="h-10 w-full rounded-[14px] bg-white px-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                 />
                 <button
                   type="button"
                   onClick={() => void createProjectInline()}
                   disabled={loading}
                   className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-900/10 hover:bg-emerald-50 disabled:opacity-60"
                 >
                   Save Project
                 </button>
               </div>
             ) : null}
           </div>
 
           {error ? <div className="text-sm font-semibold text-rose-600">{error}</div> : null}
         </div>
 
         <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
           <button
             type="button"
             onClick={onClose}
             className="inline-flex h-10 items-center justify-center rounded-full bg-gray-100 px-4 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
           >
             Cancel
           </button>
           <button
             type="button"
             onClick={() => void confirm()}
             disabled={loading || (!selectedProjectId && projects.length > 0) || creating}
             className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-900 px-5 text-sm font-semibold text-white ring-1 ring-emerald-900/10 hover:bg-emerald-800 disabled:opacity-60"
           >
             {projectItemId ? "Move item" : projects.length === 0 ? "Add" : `Add to ${selectedProjectName || "project"}`}
           </button>
         </div>
       </div>
     </div>
   );
 }

