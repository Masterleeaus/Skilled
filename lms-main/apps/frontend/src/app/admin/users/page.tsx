"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchUsers, updateUserRole, toggleUserActive, deleteUser, type AdminUser } from "@/lib/admin.api";
import { Topbar } from "@/components/Topbar";
import { AdminNav } from "@/components/AdminNav";

function UserRow({ u }: { u: AdminUser }) {
  const { user: me } = useRequireAuth(["ADMIN"]);
  const queryClient = useQueryClient();
  const isSelf = me?.id === u.id;

  const roleMutation = useMutation({
    mutationFn: (role: AdminUser["role"]) => updateUserRole(u.id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to update role"),
  });

  const activeMutation = useMutation({
    mutationFn: () => toggleUserActive(u.id, !u.isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(u.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to delete user"),
  });

  function handleDelete() {
    if (confirm(`Delete ${u.fullName}? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  }

  return (
    <tr className="border-b border-neutral-800">
      <td className="py-3 pr-4">
        <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
          {u.fullName}
        </Link>
        <p className="text-xs text-neutral-500">{u.email}</p>
      </td>
      <td className="py-3 pr-4">
        <select
          value={u.role}
          disabled={isSelf || roleMutation.isPending}
          onChange={(e) => roleMutation.mutate(e.target.value as AdminUser["role"])}
          className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm disabled:opacity-50"
        >
          <option value="STUDENT">Learner</option>
          <option value="TEACHER">Teacher</option>
          {u.role === "ADMIN" && <option value="ADMIN">Admin</option>}
        </select>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            u.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}
        >
          {u.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeMutation.mutate()}
            disabled={isSelf || activeMutation.isPending}
            className="text-sm text-neutral-300 underline underline-offset-2 disabled:opacity-50"
          >
            {u.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isSelf || deleteMutation.isPending}
            className="text-sm text-red-400 underline underline-offset-2 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => fetchUsers({ search: search || undefined, limit: "50" }),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="Users" />
      <AdminNav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="mb-4 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />

        {isLoading && <p className="text-neutral-400">Loading...</p>}

        {data && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="pb-2 font-normal">User</th>
                <th className="pb-2 font-normal">Role</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <UserRow key={u.id} u={u} />
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
