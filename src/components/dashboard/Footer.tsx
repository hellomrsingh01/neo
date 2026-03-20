export default function Footer() {
  return (
    <footer className="mt-4 border-t border-emerald-100/15 text-[11px] text-emerald-100/70">
      <div className="w-full px-4 py-3 md:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span className="text-emerald-100/65">
            © 2026 Neo Office. All rights reserved.
          </span>

          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Support"].map((label) => (
              <button
                key={label}
                type="button"
                className="font-semibold text-emerald-50/75 hover:text-emerald-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}