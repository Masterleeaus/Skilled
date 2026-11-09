import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private organisation/teaching screen: excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Review lesson revision", "Check a particular curriculum revision and approval.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
