"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileForm, type ProfileFormData } from "@/components/profile/ProfileForm";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type AuthUserLike = {
  id: string;
  email?: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
};

function splitFullName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildHeaderUser(form: ProfileFormData, authUser: AuthUserLike | null) {
  const fullName =
    [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "Your name";

  return {
    fullName: fullName,
    email: form.email ?? authUser?.email ?? "you@neooffice.com",
  };
}

export default function ProfileSettingsPage() {
  const [authUser, setAuthUser] = useState<AuthUserLike | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
        const user = data?.user;
        if (!user?.id) return;

        const currentUser: AuthUserLike = {
          id: user.id,
          email: user.email ?? null,
        };
        setAuthUser(currentUser);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, gender, phone, address")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (cancelled) return;
        const { firstName, lastName } = splitFullName(profile?.full_name);
        setForm({
          firstName,
          lastName,
          gender: profile?.gender ?? "",
          email: profile?.email ?? user.email ?? "",
          phoneNumber: profile?.phone ?? "",
          address: profile?.address ?? "",
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

  const onToggleEdit = async () => {
    if (saving) return;

    if (isEditing) {
      if (!authUser?.id) return;
      setSaving(true);
      setSaveError(null);

      const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ").trim();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          gender: form.gender || null,
          phone: form.phoneNumber || null,
          address: form.address || null,
        })
        .eq("id", authUser.id);

      if (error) {
        setSaveError(error.message || "Failed to save profile.");
        setSaving(false);
        return;
      }

      setSaving(false);
      setIsEditing(false);
      return;
    }

    setSaveError(null);
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
            {saveError ? (
              <p className="mt-4 text-sm text-red-600">{saveError}</p>
            ) : null}
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

