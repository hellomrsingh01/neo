"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileForm, type ProfileFormData } from "@/components/profile/ProfileForm";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  role: string | null;
  is_active: boolean | null;
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

export default function AdminEditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
      if (!userId) {
        setLoadError("Invalid user id.");
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace("/");
        return;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      const profile = payload?.user as ProfileRow | undefined;

      if (!res.ok) {
        if (res.status === 403) {
          router.replace("/dashboard");
          return;
        }
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        console.error("Failed to load selected user profile:", payload);
        if (!cancelled) {
          setLoadError(payload?.error || "Failed to load user profile.");
          setLoading(false);
        }
        return;
      }

      if (!profile) {
        if (!cancelled) {
          setLoadError("User not found.");
          setLoading(false);
        }
        return;
      }
      if (cancelled) return;

      const { firstName, lastName } = splitFullName(profile.full_name);
      setForm({
        firstName,
        lastName,
        gender: profile.gender ?? "",
        email: profile.email ?? "",
        phoneNumber: profile.phone ?? "",
        address: profile.address ?? "",
      });
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router, userId]);

  const headerUser = useMemo(
    () => ({
      fullName:
        [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "Your name",
      email: form.email ?? "you@neooffice.com",
    }),
    [form],
  );

  const onToggleEdit = async () => {
    if (!userId || saving || loading) return;

    if (isEditing) {
      setSaving(true);
      setSaveError(null);

      const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ").trim();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setSaveError("You are not authenticated. Please sign in again.");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          full_name: fullName || null,
          gender: form.gender || null,
          phone: form.phoneNumber || null,
          address: form.address || null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(payload?.error || "Failed to save profile.");
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
          <Link
            href="/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Users
          </Link>

          <h1 className="text-[32px] font-semibold leading-tight text-white">
            Profile Setting
          </h1>

          <section className="mt-6 rounded-[18px] bg-white p-6 shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-8">
            {loading ? (
              <p className="text-sm text-gray-600">Loading user profile...</p>
            ) : loadError ? (
              <p className="text-sm text-red-600">{loadError}</p>
            ) : (
              <>
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
              </>
            )}
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
