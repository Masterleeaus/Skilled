import { Role } from "@prisma/client";

// Central permission-to-role mapping. Add a new permission key here and list
// which roles hold it — no route code needs to change when roles evolve.
export const PERMISSIONS = {
  "course:create": ["ADMIN", "TEACHER"],
  "course:update:own": ["ADMIN", "TEACHER"],
  "course:update:any": ["ADMIN"],
  "course:delete": ["ADMIN"],
  "user:delete": ["ADMIN"],
  "user:manage": ["ADMIN"],
  "assignment:grade": ["ADMIN", "TEACHER"],
  "attendance:mark": ["ADMIN", "TEACHER"],
  "audit:view": ["ADMIN"],
  "discussion:moderate": ["ADMIN"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
