import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private organisation/teaching screen: excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Live classes", "View sessions for your enrolled Skilled course.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
