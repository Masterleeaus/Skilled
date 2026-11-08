"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, Role } from "@/store/auth.store";

export function useRequireAuth(allowedRoles?: Role[]) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/login");
    }
  }, [user, accessToken, allowedRoles, router]);

  return { user };
}
