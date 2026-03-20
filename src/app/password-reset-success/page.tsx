"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

function SuccessIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-emerald-100 bg-emerald-50">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7 text-emerald-900"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 7 10.6 16.4 4.8 10.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function PasswordResetSuccessPage() {
  const router = useRouter();
  const handleContinue = () => {
    router.replace("/");
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

          <section className="mx-auto mt-10 w-full max-w-[410px] rounded-[14px] bg-white px-6 py-8 shadow-[0_14px_44px_rgba(0,0,0,0.2)] sm:px-7">
            <SuccessIcon />

            <h1 className="mt-5 text-center text-[22px] font-semibold text-[#0A0A0A]">
              Successfully
            </h1>
            <p className="mt-1.5 text-center text-[12px] font-medium text-[#6B7281]">
              Your password has been reset successfully
            </p>

            <button
              type="button"
              onClick={handleContinue}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-emerald-900 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Continue
            </button>
          </section>
        </div>
      </main>

      <footer className="pb-6 text-center text-[11px] text-emerald-100/70">
        © 2026 Neo Office. All rights reserved.
      </footer>
    </div>
  );
}

