"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function IconLock({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="6"
        y="11"
        width="12"
        height="10"
        rx="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 11V8.7C8.5 6.65 10.17 5 12.2 5c2.03 0 3.7 1.65 3.7 3.7V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3l18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.3 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.4 8.2C3.9 10.2 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.8-.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.2 10.2a2.8 2.8 0 0 0 3.6 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-left text-xs font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <IconLock className="h-4 w-4" />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block h-11 w-full rounded-[11px] border border-gray-200 bg-[#F5F5F5] px-10 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
          autoComplete={label.toLowerCase().includes("confirm") ? "new-password" : "new-password"}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-2 inline-flex w-9 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => password.length > 0 && confirm.length > 0, [password, confirm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      setError("Both fields are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    // Placeholder: update password with backend.
    router.push("/password-reset-success");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#003c33]">
      <main className="flex flex-1 flex-col items-center px-4 pt-14">
        <div className="w-full max-w-[640px] text-center">
          <Image
            src="/logo.png"
            alt="Neo Office"
            width={250}
            height={58}
            priority
            className="mx-auto h-auto w-[220px] object-contain sm:w-[250px]"
          />
          <p className="mt-1 text-sm font-medium text-emerald-50">Product Catalogue</p>

          <section className="mx-auto mt-10 w-full max-w-[410px] rounded-[14px] bg-white px-6 py-6 shadow-[0_14px_44px_rgba(0,0,0,0.2)] sm:px-7">
            <h1 className="text-left text-[33px] font-medium leading-none text-[#0A0A0A]">
              New Password
            </h1>
            <p className="mt-3 max-w-[330px] text-left text-[12px] leading-[1.35] text-[#6B7281]">
              Set the new password for your account so you can login and access
              all featuress.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <PasswordField
                label="Enter new password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                placeholder="Enter your password"
              />

              <PasswordField
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((v) => !v)}
                placeholder="Enter your password"
              />

              {error ? (
                <p className="text-left text-xs font-medium text-red-500">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "mt-1 inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-emerald-900 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  !canSubmit ? "opacity-70" : "",
                ].join(" ")}
              >
                Update Password
              </button>
            </form>
          </section>
        </div>
      </main>

      <footer className="pb-6 text-center text-[11px] text-emerald-100/70">
        © 2026 Neo Office. All rights reserved.
      </footer>
    </div>
  );
}

