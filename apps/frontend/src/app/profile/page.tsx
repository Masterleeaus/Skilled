"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { fetchMe, updateProfile } from "@/lib/auth.api";
import { Topbar } from "@/components/Topbar";

export default function ProfilePage() {
  const { user, setAuth, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) setFullName(profile.fullName);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => updateProfile({ fullName }),
    onSuccess: (updated) => {
      if (accessToken && user) setAuth({ ...user, fullName: updated.fullName }, accessToken);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to update profile"),
  });

  const homeHref = user?.role === "ADMIN" ? "/admin" : user?.role === "TEACHER" ? "/teacher" : "/student";

  if (!user) return null;

  return (
    <div>
      <Topbar title="My Profile" backHref={homeHref} backLabel="Dashboard" />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-md px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading...</p>}

        {profile && (
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-full-name" className="mb-1 block text-sm text-neutral-300">Full name</label>
              <input
                id="profile-full-name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-1 block text-sm text-neutral-300">Email</label>
              <input
                id="profile-email"
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-500"
              />
            </div>

            <div>
              <label htmlFor="profile-role" className="mb-1 block text-sm text-neutral-300">Role</label>
              <input
                id="profile-role"
                value={profile.role}
                disabled
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-500"
              />
            </div>

            <p className="text-xs text-neutral-500">
              Member since {new Date(profile.createdAt).toLocaleDateString()} ·{" "}
              {profile.isEmailVerified ? "Email verified" : "Email not verified"}
            </p>

            <button
              onClick={() => mutation.mutate()}
              disabled={!fullName || mutation.isPending}
              className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
