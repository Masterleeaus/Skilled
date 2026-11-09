import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveScopedIdentity, type ScopedIdentityQuery } from "../modules/curriculum/integration-identity-policy";

type Fixture = {
  case: string;
  query: ScopedIdentityQuery;
  rows: Array<{ service: string; companyId: string | null; externalUserRef: string; userId: string }>;
  expectedUserId: string | null;
};
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/scoped-identity");
const fixtures = readdirSync(fixturesDir).filter(name => /^SC-\d{2}-.*\.json$/.test(name)).sort();
if (fixtures.length !== 22) throw new Error("Exactly 22 identity-boundary scenarios are required");

describe("company-scoped external identity read policy", () => {
  for (const filename of fixtures) {
    const fixture: Fixture = JSON.parse(readFileSync(path.join(fixturesDir, filename), "utf8"));
    it(`${fixture.case}: ${fixture.expectedUserId ? "resolve scoped learner" : "deny identity"}`, async () => {
      let calls = 0;
      const actual = await resolveScopedIdentity(fixture.query, async (where) => {
        calls++;
        // A real Prisma query must select service, companyId AND externalUserRef,
        // not the global service/ref pair or a client-supplied company reference.
        expect(where).toEqual(fixture.query);
        return fixture.rows
          .filter(row => row.service === where.service && row.companyId === where.companyId &&
            row.externalUserRef === where.externalUserRef)
          .slice(0, 2)
          .map(({ userId }) => ({ userId }));
      });
      expect(actual).toEqual(fixture.expectedUserId);
      if (!fixture.query.companyId || !fixture.query.externalUserRef ||
          !["field-services", "ai-workforce"].includes(fixture.query.service)) {
        expect(calls).toBe(0); // Invalid scope must never hit the database.
      } else {
        expect(calls).toBe(1);
      }
    });
  }
  it("rejects a non-array lookup response instead of inferring a user", async () => {
    const result = await resolveScopedIdentity(
      { service: "field-services", companyId: "company-a", externalUserRef: "worker-1" },
      async () => null as unknown as Array<{ userId: string }>,
    );
    expect(result).toBeNull();
  });
  it("propagates database errors for operational handling rather than returning an unaudited success", async () => {
    await expect(resolveScopedIdentity(
      { service: "field-services", companyId: "company-a", externalUserRef: "worker-1" },
      async () => { throw new Error("database unavailable"); },
    )).rejects.toThrow("database unavailable");
  });
});
