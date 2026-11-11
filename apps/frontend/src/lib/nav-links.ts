/** Minimal shapes so this module has no runtime imports and can be tested directly. */
export interface NavUser {
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

export interface NavMembership {
  role?: string;
}

export interface NavLink {
  href: string;
  label: string;
}

/** Organisation roles that may open the assessor review screen (mirrors the page's own check). */
const ASSESSOR_ORG_ROLES = ["OWNER", "MANAGER", "ASSESSOR"];

/**
 * Role-specific header links. Visibility only: the pages still enforce their own access checks.
 * - Pathways are learner enrolments, so they are offered to students.
 * - Assessor review is offered to anyone holding an assessor-capable organisation role.
 */
export function roleNavLinks(user: NavUser | null | undefined, memberships: NavMembership[] = []): NavLink[] {
  if (!user) return [];
  const links: NavLink[] = [];
  if (user.role === "STUDENT") {
    links.push({ href: "/pathways", label: "Pathways" });
  }
  if (memberships.some((m) => m.role !== undefined && ASSESSOR_ORG_ROLES.includes(m.role))) {
    links.push({ href: "/academy/assessor", label: "Assessor review" });
  }
  return links;
}
