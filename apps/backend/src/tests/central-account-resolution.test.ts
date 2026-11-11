import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import {
  resolveSkilledCentralAccount,
  type CentralDecision,
  type SkilledCentralReaders,
  type LocalCentralMapping,
  type LocalUserState,
} from "../modules/auth/central-account-resolution";

type Changes = {
  decision?: unknown; role?: string; centralRole?: string; centralCurrent?: boolean;
  mappings?: LocalCentralMapping[]; mapping?: Partial<LocalCentralMapping>;
  duplicateMapping?: boolean; extraOtherOrgMapping?: boolean;
  user?: null | Partial<LocalUserState> & { deletedAt?: string | Date | null };
  member?: boolean;
};
type Fixture = { name: string; changes: Changes; expectedAllowed: boolean };
const fixturesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/central-account-resolution");
const fixtures = readdirSync(fixturesPath).filter(n => /^CA-\d{2}-.*\.json$/.test(n)).sort();
if (fixtures.length !== 30) throw new Error("Missing Central account-resolution fixtures");

const baseDecision: CentralDecision = {
  allowed: true, applicationId: "academy", organisationId: "central-org-a",
  localUserId: "skilled-user-a", localAccountId: "skilled-account-a",
  membershipRevision: 1, entitlementRevision: 1, linkRevision: 1,
};
const baseMapping: LocalCentralMapping = {
  centralOrganisationId: "central-org-a", companyId: "skilled-company-a",
  localUserId: "skilled-user-a", localAccountId: "skilled-account-a", status: "verified",
};
const baseUser: LocalUserState = {
  id: "skilled-user-a", role: "STUDENT", isActive: true,
  isEmailVerified: true, deletedAt: null,
};

describe("Skilled Central account resolution: trusted organisation and current local authorization", () => {
  for (const filename of fixtures) {
    const fixture: Fixture = JSON.parse(readFileSync(path.join(fixturesPath, filename), "utf8"));
    it(fixture.name, async () => {
      const changes = fixture.changes;
      let decision: unknown = { ...baseDecision, role: changes.centralRole ?? "owner" };
      if (Object.prototype.hasOwnProperty.call(changes, "decision")) {
        decision = changes.decision && !Array.isArray(changes.decision) &&
          typeof changes.decision === "object" ? { ...(decision as object), ...changes.decision } : changes.decision;
      }
      let mappings = changes.mappings ??
        [{ ...baseMapping, ...changes.mapping }];
      if (changes.duplicateMapping) mappings = [...mappings, { ...baseMapping }];
      if (changes.extraOtherOrgMapping) {
        mappings = [...mappings, { ...baseMapping, centralOrganisationId: "central-org-b", companyId: "skilled-company-b" }];
      }
      const user: LocalUserState | null = changes.user === null ? null :
        { ...baseUser, role: (changes.role ?? "STUDENT") as LocalUserState["role"],
          ...changes.user, deletedAt: typeof changes.user?.deletedAt === "string" ?
            new Date(changes.user.deletedAt) : changes.user?.deletedAt ?? null } as LocalUserState;
      let checkedScope: string | null = null;
      const readers: SkilledCentralReaders = {
        isCentralAccessCurrent: vi.fn(async () => changes.centralCurrent !== false),
        findMappings: vi.fn(async (org, localUser, localAccount) => {
          checkedScope = org;
          return mappings.filter(m => m.centralOrganisationId === org &&
            m.localUserId === localUser && m.localAccountId === localAccount);
        }),
        findUser: vi.fn(async () => user),
        isMember: vi.fn(async () => changes.member !== false),
      };
      const result = await resolveSkilledCentralAccount(decision, readers);
      if (fixture.expectedAllowed) {
        expect(result).toEqual({
          userId: "skilled-user-a", companyId: "skilled-company-a",
          role: changes.role ?? "STUDENT",
        });
        expect(checkedScope).toBe("central-org-a");
        expect(readers.isMember).toHaveBeenCalledWith("skilled-company-a", "skilled-user-a");
      } else {
        expect(result).toBeNull();
        expect(readers.isMember).not.toHaveBeenCalledWith("skilled-company-b", expect.anything());
      }
      if (changes.centralCurrent === false) {
        expect(readers.findMappings).not.toHaveBeenCalled();
        expect(readers.findUser).not.toHaveBeenCalled();
      }
    });
  }
  it("never converts an offline Central verification exception into successful login", async () => {
    const readers: SkilledCentralReaders = {
      isCentralAccessCurrent: async () => { throw new Error("Central unavailable"); },
      findMappings: async () => [baseMapping],
      findUser: async () => baseUser,
      isMember: async () => true,
    };
    await expect(resolveSkilledCentralAccount(baseDecision, readers))
      .rejects.toThrow("Central unavailable");
  });
  it("rejects multiple matching mappings even if the accounts are identical", async () => {
    const readers: SkilledCentralReaders = {
      isCentralAccessCurrent: async () => true,
      findMappings: async () => [baseMapping, baseMapping],
      findUser: async () => baseUser,
      isMember: async () => true,
    };
    expect(await resolveSkilledCentralAccount(baseDecision, readers)).toBeNull();
  });
});
