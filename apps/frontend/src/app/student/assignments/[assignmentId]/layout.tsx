import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private learner/account screen: deliberately excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Submit assignment", "Prepare and submit evidence for an assigned course.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
