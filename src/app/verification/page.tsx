"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const OTP_LENGTH = 4;

export default function VerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => otp.join(""), [otp]);

  const handleChange = (index: number, value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    if (!onlyDigits) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    const digit = onlyDigits[0];
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return;

    if (otp[index]) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      setOtp((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setOtp(next);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = () => {
    // Placeholder: trigger resend OTP API call.
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== OTP_LENGTH) {
      setError("Enter the 4-digit code.");
      return;
    }

    setError("");
    router.push("/new-password");
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
              Verification
            </h1>
            <p className="mt-3 max-w-[320px] text-left text-[12px] leading-[1.35] text-[#6B7281]">
              Enter your 4 digits code that you received on your email.
            </p>

            <form className="mt-6" onSubmit={handleContinue}>
              <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
                {otp.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-12 rounded-[4px] border border-gray-300 bg-white text-center text-lg font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
                    aria-label={`Verification digit ${index + 1}`}
                  />
                ))}
              </div>

              <p className="mt-4 text-center text-[12px] text-[#6B7281]">
                If you didn&apos;t receive a code!{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-[#344054] hover:underline"
                >
                  Resend
                </button>
              </p>

              {error ? (
                <p className="mt-2 text-center text-xs font-medium text-red-500">{error}</p>
              ) : null}

              <button
                type="submit"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-emerald-900 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Continue
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

