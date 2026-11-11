import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private organisation/teaching screen: excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Lesson review queue", "Review lesson revisions before publication.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
