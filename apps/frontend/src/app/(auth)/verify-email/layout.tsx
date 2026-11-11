import type { Metadata } from "next";
import { privateRouteMetadata } from "@/lib/route-metadata";

/** Private learner/account screen: deliberately excluded from search indexing. */
export const metadata: Metadata = privateRouteMetadata("Verify email", "Complete email verification for your Skilled account.");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
