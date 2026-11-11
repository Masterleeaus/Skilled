import type { AuthUser } from "@/store/auth.store";

/** Public visitors must never be routed to a protected dashboard by default. */
export function dashboardHref(user: Pick<AuthUser, "role"> | null | undefined): string | null {
  if (!user) return null;
  switch (user.role) {
    case "ADMIN": return "/admin";
    case "TEACHER": return "/teacher";
    case "STUDENT": return "/student";
    default: return null;
  }
}
