import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private learner/account screen: deliberately excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("My course", "Review course lessons, checks and progress in Skilled.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
