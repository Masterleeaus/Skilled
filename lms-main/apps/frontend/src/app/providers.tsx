"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api-client";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.post("/auth/refresh");
        const accessToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(accessToken);

        const me = await api.get("/auth/me");
        if (!cancelled) setAuth(me.data.data, accessToken);
      } catch {
        // no valid session — that's fine, user just isn't logged in
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  // Avoid rendering protected content before we know the auth state —
  // prevents a flash of "logged out" UI on hard refresh.
  if (!ready) return null;
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
