"use client";

export function EmailAddressSection({
  email,
}: {
  email?: string | null;
}) {
  const shownEmail = email || "you@neooffice.com";

  return (
    <div className="mt-8">
      <div className="text-sm font-semibold text-gray-900">My email Address</div>

      <div className="mt-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M6 8l6 4 6-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">
              {shownEmail}
            </div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              1 month ago
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-blue-50 px-4 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          +Add Email Address
        </button>
      </div>
    </div>
  );
}

