"use client";

import Footer from "@/components/dashboard/Footer";
import Header from "@/components/dashboard/Header";
import { AddUserModal, type AddUserFormData } from "@/components/users/AddUserModal";
import { UsersTable } from "@/components/users/UsersTable";
import { UsersToolbar } from "@/components/users/UsersToolbar";
import type { TableUser } from "@/components/users/UserRow";
import { useCallback, useState } from "react";

const SAMPLE_USERS: TableUser[] = [
  { id: "1", name: "John Doe", email: "JohnDoe@gmail.com", role: "Designer" },
  { id: "2", name: "Jane Smith", email: "jane.smith@neooffice.com", role: "Admin" },
  { id: "3", name: "Alex Johnson", email: "alex.j@example.com", role: "Developer" },
  { id: "4", name: "Sarah Williams", email: "sarah.w@neooffice.com", role: "Designer" },
  { id: "5", name: "Michael Brown", email: "m.brown@example.com", role: "Manager" },
  { id: "6", name: "Emily Davis", email: "emily.d@gmail.com", role: "Developer" },
  { id: "7", name: "Chris Wilson", email: "chris.w@neooffice.com", role: "Designer" },
  { id: "8", name: "Laura Martinez", email: "l.martinez@example.com", role: "Admin" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<TableUser[]>(SAMPLE_USERS);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

  const handleFilters = useCallback(() => {
    // Placeholder: open filters panel/modal when implemented
  }, []);

  const handleAddUser = useCallback(() => {
    setAddUserModalOpen(true);
  }, []);

  const handleAddUserSubmit = useCallback((data: AddUserFormData) => {
    // Placeholder: call API to create user, then optionally add to list
    const newUser: TableUser = {
      id: String(Date.now()),
      name: data.name || "New User",
      email: data.email || "",
      role: data.role || "Designer",
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const handleEdit = useCallback((user: TableUser) => {
    // Placeholder: open edit modal or navigate to edit page when implemented
  }, []);

  const handleDelete = useCallback((user: TableUser) => {
    // Placeholder: confirm and remove from list or call API when implemented
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }, []);

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
              totalUnits={28}
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
    </div>
  );
}
