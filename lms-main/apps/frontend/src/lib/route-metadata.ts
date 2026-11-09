import type { Metadata } from "next";

/** Search-engine hints, not authorization; access is still enforced by the app and API. */
export function privateRouteMetadata(title: string, description: string): Metadata {
  if (!title.trim() || !description.trim()) throw new Error("Route metadata must be descriptive");
  return {
    title: `${title} | SkilledAt.Work`,
    description,
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}
