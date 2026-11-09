import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private organisation/teaching screen: excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Business training context", "Review organisation-specific learning context.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
