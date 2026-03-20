"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileForm, type ProfileFormData } from "@/components/profile/ProfileForm";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function pickString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function buildFormFromAuthUser(user: AuthUserLike | null): ProfileFormData {
  const meta = user?.user_metadata ?? {};
  return {
    firstName: pickString((meta as any)?.first_name) ?? null,
    lastName: pickString((meta as any)?.last_name) ?? null,
    gender: pickString((meta as any)?.gender) ?? null,
    email: user?.email ?? null,
    phoneNumber: pickString((meta as any)?.phone) ?? null,
    address: pickString((meta as any)?.address) ?? null,
  };
}

function buildHeaderUser(form: ProfileFormData, authUser: AuthUserLike | null) {
  const fullName =
    [form.firstName, form.lastName].filter(Boolean).join(" ").trim() ||
    pickString((authUser?.user_metadata as any)?.full_name) ||
    "Alexa Rawles";

  return {
    fullName,
    email: form.email ?? authUser?.email ?? "alexarawles@gmail.com",
  };
}

export default function ProfileSettingsPage() {
  const [authUser, setAuthUser] = useState<AuthUserLike | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const u = (data?.user as any) as AuthUserLike | null;
        setAuthUser(u);
        setForm((prev) => {
          const fromAuth = buildFormFromAuthUser(u);
          return {
            firstName: fromAuth.firstName ?? prev.firstName ?? "",
            lastName: fromAuth.lastName ?? prev.lastName ?? "",
            gender: fromAuth.gender ?? prev.gender ?? "",
            email: fromAuth.email ?? prev.email ?? "",
            phoneNumber: fromAuth.phoneNumber ?? prev.phoneNumber ?? "",
            address: fromAuth.address ?? prev.address ?? "",
          };
        });
      } catch {
        // No-op: page still renders with fallbacks
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const headerUser = useMemo(() => buildHeaderUser(form, authUser), [authUser, form]);

  const onToggleEdit = () => {
    if (isEditing) {
      // Placeholder save behavior; integrate with your DB/user profile table later
      setIsEditing(false);
      return;
    }
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-[#003c33] text-white flex flex-col">
      <Header />

      <main className="w-full px-4 pt-6 sm:px-6 flex-1">
        <div className="mx-auto w-full max-w-[1240px]">
          <h1 className="text-[32px] font-semibold leading-tight text-white">
            Profile Setting
          </h1>

          <section className="mt-6 rounded-[18px] bg-white p-6 shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-8">
            <ProfileHeaderCard
              user={headerUser}
              isEditing={isEditing}
              onToggleEdit={onToggleEdit}
            />

            <ProfileForm
              data={form}
              disabled={!isEditing}
              onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
            />
          </section>
        </div>
      </main>

      <div className="w-full px-4 pb-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

