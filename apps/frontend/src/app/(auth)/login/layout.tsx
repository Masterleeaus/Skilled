import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private learner/account screen: deliberately excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Log in", "Sign in securely to your Skilled learning account.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
