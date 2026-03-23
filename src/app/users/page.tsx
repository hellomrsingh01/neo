"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { AddUserModal, type AddUserFormData } from "@/components/users/AddUserModal";
import { DeleteUserConfirmModal } from "@/components/users/DeleteUserConfirmModal";
import { UsersTable } from "@/components/users/UsersTable";
import { UsersToolbar } from "@/components/users/UsersToolbar";
import type { TableUser } from "@/components/users/UserRow";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<TableUser[]>([]);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [showCreateToast, setShowCreateToast] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableUser | null>(null);
  const router = useRouter();

  const loadUsers = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      console.error("Failed to load users: missing access token");
      return;
    }

    const res = await fetch("/api/admin/users/list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Failed to load users:", payload);
      return;
    }

    const rows = (payload?.users ?? []) as ProfileRow[];

    const mapped: TableUser[] = rows.map((row) => ({
      id: row.id,
      name: row.full_name?.trim() || "Unnamed User",
      email: row.email ?? "",
      role: row.role ?? "",
    }));

    setUsers(mapped);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await loadUsers();
      if (cancelled) return;
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loadUsers]);

  useEffect(() => {
    if (!showCreateToast) return;
    const timer = setTimeout(() => setShowCreateToast(false), 2500);
    return () => clearTimeout(timer);
  }, [showCreateToast]);

  const handleFilters = useCallback(() => {
    // Placeholder: open filters panel/modal when implemented
  }, []);

  const handleAddUser = useCallback(() => {
    setAddUserModalOpen(true);
  }, []);

  const handleAddUserSubmit = useCallback(
    async (data: AddUserFormData) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        alert("You are not authenticated. Please sign in again.");
        return false;
      }

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: data.password,
          role: data.role,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("CREATE USER ERROR:", payload);
        alert(payload?.error || "Failed to create user.");
        return false;
      }

      await loadUsers();
      setShowCreateToast(true);
      return true;
    },
    [loadUsers],
  );

  const handleEdit = useCallback((user: TableUser) => {
    router.push(`/users/${user.id}`);
  }, [router]);

  const handleDelete = useCallback((user: TableUser) => {
    setDeleteTarget(user);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      alert("You are not authenticated. Please sign in again.");
      return;
    }

    const res = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(payload?.error || "Failed to delete user.");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  return (
    <div className="flex min-h-screen flex-col bg-[#003c33] text-white">
      <Header />

      <main className="flex-1 w-full px-4 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <UsersToolbar onFilters={handleFilters} onAddUser={handleAddUser} />

          <section className="mt-6">
            <UsersTable
              users={users}
              showingCount={users.length}
              totalUnits={users.length}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </section>
        </div>
      </main>

      <div className="w-full px-4 pb-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <Footer />
        </div>
      </div>

      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onSubmit={handleAddUserSubmit}
      />

      <DeleteUserConfirmModal
        open={Boolean(deleteTarget)}
        userName={deleteTarget?.name ?? "this user"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {showCreateToast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-black/10">
          User created successfully
        </div>
      ) : null}
    </div>
  );
}
