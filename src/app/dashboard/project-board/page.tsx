import Link from "next/link";

type ProjectRow = {
  id: string;
  name: string;
  totalList: number;
};

const projects: ProjectRow[] = [
  { id: "project-1", name: "Gesture Chair", totalList: 4 },
  { id: "project-2", name: "Gesture Chair", totalList: 4 },
  { id: "project-3", name: "Gesture Chair", totalList: 4 },
  { id: "project-4", name: "Gesture Chair", totalList: 4 },
];

function ActionIcon({ name, className }: { name: "trash" | "edit"; className?: string }) {
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
  const totalUnits = projects.reduce((sum, project) => sum + project.totalList, 0);

  return (
    <main className="mt-6">
      <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Project Board</h1>
          <p className="mt-1 text-sm font-medium text-emerald-100/75">Manage your project boards</p>
        </div>

        <Link
          href="/dashboard/add-to-project"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
            +
          </span>
          Add New Project
        </Link>
      </section>

      <section className="mt-6 rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">Project List</h2>

        <div className="mt-4 overflow-hidden rounded-[14px] bg-white ring-1 ring-gray-200/80">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Project Name</th>
                <th className="w-[140px] px-4 py-3">Total List</th>
                <th className="w-[140px] px-4 py-3 text-right">Others</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-gray-100 text-sm text-gray-700">
                  <td className="px-4 py-4 font-medium text-gray-700">{project.name}</td>
                  <td className="px-4 py-4 text-gray-500">{project.totalList}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Delete project"
                      >
                        <ActionIcon name="trash" className="h-4.5 w-4.5" />
                      </button>
                      <Link
                        href="/dashboard/add-to-project"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Edit project"
                      >
                        <ActionIcon name="edit" className="h-4.5 w-4.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-gray-500">
          <p>
            Showing {projects.length} of {projects.length} items
          </p>
          <p>Total Units: {totalUnits}</p>
        </div>
      </section>
    </main>
  );
}

