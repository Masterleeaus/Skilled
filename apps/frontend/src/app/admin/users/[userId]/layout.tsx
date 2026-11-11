import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private organisation/teaching screen: excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("User details", "Review a learner or staff member's account details.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
