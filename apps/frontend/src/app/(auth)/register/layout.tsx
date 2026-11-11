import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private learner/account screen: deliberately excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Create account", "Register for Skilled courses and workplace training.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
