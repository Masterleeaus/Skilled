import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private organisation/teaching screen: excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Create course", "Create an instructor-led course in Skilled.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
