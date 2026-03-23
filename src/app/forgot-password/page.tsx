"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setError("Enter a valid email address.");
      setSuccessMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      {
        redirectTo: "http://localhost:3000/new-password",
      }
    );

    if (resetError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "If an account exists for this email, a password reset link has been sent."
    );
    setLoading(false);
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
          <p className="mt-1 text-sm font-medium text-emerald-50">
            Product Catalogue
          </p>

          <section className="mx-auto mt-10 w-full max-w-[410px] rounded-[14px] bg-white px-6 py-6 shadow-[0_14px_44px_rgba(0,0,0,0.2)] sm:px-7">
            <h1 className="text-left text-[33px] font-medium leading-none text-[#0A0A0A]">
              Forgot password
            </h1>
            <p className="mt-3 max-w-[320px] text-left text-[12px] leading-[1.35] text-[#6B7281]">
              Enter your email to receive a password reset link.
            </p>

            <form className="mt-6" onSubmit={handleContinue}>
              <label
                htmlFor="forgot-email"
                className="block text-left text-xs font-semibold text-gray-700"
              >
                Email address
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-[1.65] stroke-gray-400"
                  >
                    <rect
                      x="3.5"
                      y="5.5"
                      width="17"
                      height="13"
                      rx="2.3"
                      className="fill-none"
                    />
                    <path
                      d="M5 7L11.2 11.2C11.68 11.54 12.32 11.54 12.8 11.2L19 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@neooffice.com"
                  className="block h-11 w-full rounded-[11px] border border-gray-200 bg-[#F5F5F5] px-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
                  disabled={loading}
                />
              </div>
              {error ? (
                <p className="mt-2 text-left text-xs font-medium text-red-500">
                  {error}
                </p>
              ) : null}
              {successMessage ? (
                <p className="mt-2 text-left text-xs font-medium text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-emerald-900 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending..." : "Continue"}
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

