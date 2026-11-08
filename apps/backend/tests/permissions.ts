import { describe, it, expect } from "vitest";
import { roleHasPermission } from "../config/permissions";

describe("Permission matrix", () => {
  it("allows ADMIN to delete courses", () => {
    expect(roleHasPermission("ADMIN", "course:delete")).toBe(true);
  });

  it("does not allow TEACHER to delete courses", () => {
    expect(roleHasPermission("TEACHER", "course:delete")).toBe(false);
  });

  it("does not allow STUDENT to grade assignments", () => {
    expect(roleHasPermission("STUDENT", "assignment:grade")).toBe(false);
  });

  it("allows TEACHER to grade assignments", () => {
    expect(roleHasPermission("TEACHER", "assignment:grade")).toBe(true);
  });

  it("only allows ADMIN to view the audit log", () => {
    expect(roleHasPermission("ADMIN", "audit:view")).toBe(true);
    expect(roleHasPermission("TEACHER", "audit:view")).toBe(false);
    expect(roleHasPermission("STUDENT", "audit:view")).toBe(false);
  });
});
