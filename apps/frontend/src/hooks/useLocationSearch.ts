"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The current query string (for example "?token=abc"), read from the browser after hydration.
 * Returns null on the server and during hydration, so server and client markup match. Re-renders on
 * back/forward navigation and on the optional custom event, for pages that change the URL themselves.
 */
export function useLocationSearch(changeEvent?: string): string | null {
  const subscribe = useCallback(
    (notify: () => void) => {
      window.addEventListener("popstate", notify);
      if (changeEvent) window.addEventListener(changeEvent, notify);
      return () => {
        window.removeEventListener("popstate", notify);
        if (changeEvent) window.removeEventListener(changeEvent, notify);
      };
    },
    [changeEvent],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => null,
  );
}
