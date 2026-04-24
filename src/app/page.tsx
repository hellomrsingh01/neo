// import React from "react";
// import Image from "next/image";
// import Link from "next/link";

// const HomePage: React.FC = () => {
//   return (
//     <div className="h-screen bg-[#003c33] flex flex-col overflow-hidden">
//       <main className="flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-3">
//         <div className="w-full max-w-[560px] flex flex-col items-center">
//           <div className="mb-4 flex flex-col items-center text-center text-white">
//             <div className="mb-2 flex justify-center">
//               <Image
//                 src="/logo.png"
//                 alt="Neo Office"
//                 width={260}
//                 height={60}
//                 priority
//                 className="h-auto w-[260px] object-contain"
//               />
//             </div>
//             <p className="mt-1 text-[16px] font-medium text-white text-center">
//               Product Catalogue
//             </p>
//           </div>

//           <section className="w-full flex justify-center">
//             <div className="w-full max-w-[485px] bg-white rounded-[20px] shadow-[0_16px_44px_rgba(0,0,0,0.18)] px-8 py-6">
//               <header className="mb-5">
//                 <h1 className="text-[32px] leading-[100%] font-medium text-[#0A0A0A]">
//                   Welcome back
//                 </h1>
//                 <p className="mt-2 text-sm font-medium text-[#6B7281]">
//                   Sign in to access the catalogue
//                 </p>
//               </header>

//               <form className="space-y-4">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="email"
//                     className="block text-xs font-medium text-gray-700"
//                   >
//                     Email address
//                   </label>
//                   <div className="relative">
//                     <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
//                       <svg
//                         aria-hidden="true"
//                         width="18"
//                         height="18"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="stroke-[1.6] stroke-gray-400"
//                       >
//                         <rect
//                           x="3.5"
//                           y="5.5"
//                           width="17"
//                           height="13"
//                           rx="2.3"
//                           className="fill-none"
//                         />
//                         <path
//                           d="M5 7L11.2 11.2C11.68 11.54 12.32 11.54 12.8 11.2L19 7"
//                           stroke="currentColor"
//                           strokeLinecap="round"
//                         />
//                       </svg>
//                     </span>
//                     <input
//                       id="email"
//                       type="email"
//                       placeholder="you@neooffice.com"
//                       className="block w-full rounded-[999px] border border-gray-200 bg-[#F5F5F5] px-10 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1.5">
//                   <div className="flex items-center justify-between gap-2">
//                     <label
//                       htmlFor="password"
//                       className="block text-xs font-medium text-gray-700"
//                     >
//                       Password
//                     </label>
//                     <Link
//                       href="/forgot-password"
//                       className="text-[11px] font-medium text-emerald-700 hover:underline hover:underline-offset-2"
//                     >
//                       Forgot password?
//                     </Link>
//                   </div>
//                   <div className="relative">
//                     <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
//                       <svg
//                         aria-hidden="true"
//                         width="18"
//                         height="18"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="stroke-[1.7] stroke-gray-400"
//                       >
//                         <rect
//                           x="5"
//                           y="9"
//                           width="14"
//                           height="10"
//                           rx="2.3"
//                           className="fill-none"
//                         />
//                         <path
//                           d="M9 9V7.5C9 5.57 10.57 4 12.5 4C14.43 4 16 5.57 16 7.5V9"
//                           stroke="currentColor"
//                           strokeLinecap="round"
//                         />
//                       </svg>
//                     </span>
//                     <input
//                       id="password"
//                       type="password"
//                       placeholder="Enter your password"
//                       className="block w-full rounded-[999px] border border-gray-200 bg-[#F5F5F5] px-10 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
//                     />
//                   </div>
//                   <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
//                     *Minimum requirement for password and for it to be reset
//                     every 6 months
//                   </p>
//                 </div>

//                 <div className="flex items-center">
//                   <label className="inline-flex items-center space-x-2">
//                     <input
//                       id="remember"
//                       type="checkbox"
//                       className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
//                     />
//                     <span className="text-xs font-normal text-gray-600">
//                       Remember me for 30 days
//                     </span>
//                   </label>
//                 </div>

//                 <button
//                   type="button"
//                   className="mt-0.5 inline-flex w-full items-center justify-center rounded-full bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
//                 >
//                   Sign in to dashboard
//                 </button>
//               </form>
//             </div>
//           </section>
//         </div>
//       </main>

//       <footer className="pb-3 text-center text-[11px] text-emerald-100/70">
//         © 2026 Neo Office. All rights reserved.
//       </footer>
//     </div>
//   );
// };

// export default HomePage;


"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const HomePage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("LOGIN RESULT:", { data, error });

    if (error) {
      setErrorMessage("Invalid email or password.");
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMessage("Unable to sign in.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    console.log("PROFILE RESULT:", { profile, profileError });

    if (profileError || !profile) {
      setErrorMessage("Profile not found for this user.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (!profile.is_active) {
      setErrorMessage("This account is disabled.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (
      profile.role === "admin" ||
      profile.role === "internal" ||
      profile.role === "external"
    ) {
      router.push("/dashboard");
      return;
    }

    setErrorMessage("Invalid account role.");
    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <div className="h-screen bg-[#003c33] flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-3">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          <div className="mb-4 flex flex-col items-center text-center text-white">
            <div className="mb-2 flex justify-center">
              <Image
                src="/logo.png"
                alt="Neo Office"
                width={260}
                height={60}
                priority
                unoptimized
                className="h-auto w-[260px] object-contain"
              />
            </div>
            <p className="mt-1 text-[16px] font-medium text-white text-center">
              Product Catalogue
            </p>
          </div>

          <section className="w-full flex justify-center">
            <div className="w-full max-w-[485px] bg-white rounded-[20px] shadow-[0_16px_44px_rgba(0,0,0,0.18)] px-8 py-6">
              <header className="mb-5">
                <h1 className="text-[32px] leading-[100%] font-medium text-[#0A0A0A]">
                  Welcome back
                </h1>
                <p className="mt-2 text-sm font-medium text-[#6B7281]">
                  Sign in to access the catalogue
                </p>
              </header>

              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-[1.6] stroke-gray-400"
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
                      id="email"
                      type="email"
                      placeholder="you@neooffice.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 bg-[#F5F5F5] px-10 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-medium text-emerald-700 hover:underline hover:underline-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-[1.7] stroke-gray-400"
                      >
                        <rect
                          x="5"
                          y="9"
                          width="14"
                          height="10"
                          rx="2.3"
                          className="fill-none"
                        />
                        <path
                          d="M9 9V7.5C9 5.57 10.57 4 12.5 4C14.43 4 16 5.57 16 7.5V9"
                          stroke="currentColor"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 bg-[#F5F5F5] px-10 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-2 inline-flex w-9 items-center justify-center text-gray-400"
                    >
                      {showPassword ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 3l18 18"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10.6 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.3 4.2"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6.4 8.2C3.9 10.2 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.8-.8"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10.2 10.2a2.8 2.8 0 0 0 3.6 3.6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
                    *Minimum requirement for password and for it to be reset
                    every 6 months
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500/70"
                    />
                    <span className="text-xs font-normal text-gray-600">
                      Remember me for 30 days
                    </span>
                  </label>
                </div>

                {errorMessage ? (
                  <p className="text-sm font-medium text-red-600">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-0.5 inline-flex w-full items-center justify-center rounded-full bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Sign in to dashboard"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <footer className="pb-3 text-center text-[11px] text-emerald-100/70">
        © 2026 Neo Office. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;