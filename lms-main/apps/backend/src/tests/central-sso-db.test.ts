// Central SSO identity links against real PostgreSQL: link, relink, conflict, unlink with session revocation,
// and cross-organisation denial. Runs only when DATABASE_URL and REDIS_URL name configured services (see harness).
import { it, expect, beforeAll, afterAll } from "vitest";
import { configureTestEnvironment, describeWithServices, uniquePrefix, type Db } from "./integration/harness";
import { linkCentralIdentity, unlinkCentralIdentity, resolveCentralLogin, CENTRAL_LINK_SERVICE } from "../modules/auth/central/central-link";
import { CentralLinkError } from "../modules/auth/central/central-errors";

configureTestEnvironment();

let db: Db;
let prefix: string;
let orgA: { id: string; externalRef: string };
let orgB: { id: string; externalRef: string };
let learner: { id: string };
let outsider: { id: string };
const subject = () => `${prefix}-central-subject`;

beforeAll(async () => {
  ({ prisma: db } = await import("../config/prisma"));
  prefix = uniquePrefix();
  const companyA = await db.company.create({ data: { name: `${prefix} A`, externalRef: `${prefix}-org-a` }, select: { id: true, externalRef: true } });
  const companyB = await db.company.create({ data: { name: `${prefix} B`, externalRef: `${prefix}-org-b` }, select: { id: true, externalRef: true } });
  orgA = { id: companyA.id, externalRef: companyA.externalRef as string };
  orgB = { id: companyB.id, externalRef: companyB.externalRef as string };
  const make = (tag: string) => db.user.create({
    data: { email: `${prefix}-${tag}@example.test`, passwordHash: "central-test-not-a-login", fullName: `${prefix} ${tag}`, isEmailVerified: true, isActive: true },
    select: { id: true },
  });
  learner = await make("learner");
  outsider = await make("outsider");
  await db.companyMember.create({ data: { companyId: orgA.id, userId: learner.id, role: "LEARNER" } });
  await db.companyMember.create({ data: { companyId: orgB.id, userId: outsider.id, role: "LEARNER" } });
}, 120000);

afterAll(async () => {
  if (!db) return;
  const userIds = [learner?.id, outsider?.id].filter(Boolean) as string[];
  await db.academyIntegrationAudit.deleteMany({ where: { service: CENTRAL_LINK_SERVICE, externalUserRef: { startsWith: prefix } } });
  await db.academyExternalIdentity.deleteMany({ where: { service: CENTRAL_LINK_SERVICE, externalUserRef: { startsWith: prefix } } });
  await db.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.companyMember.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.company.deleteMany({ where: { externalRef: { startsWith: prefix } } });
  await db?.$disconnect?.();
}, 120000);

describeWithServices("Central SSO identity links on PostgreSQL", () => {
  it("links a subject to a member of the verified organisation, is idempotent, and refuses a conflicting link", async () => {
    expect(await linkCentralIdentity(db, { subject: subject(), organisationRef: orgA.externalRef, userId: learner.id })).toBe("created");
    expect(await linkCentralIdentity(db, { subject: subject(), organisationRef: orgA.externalRef, userId: learner.id })).toBe("already_linked");
    await expect(linkCentralIdentity(db, { subject: subject(), organisationRef: orgB.externalRef, userId: outsider.id }))
      .rejects.toBeInstanceOf(CentralLinkError);
    await expect(linkCentralIdentity(db, { subject: `${prefix}-other`, organisationRef: orgA.externalRef, userId: outsider.id }))
      .rejects.toMatchObject({ reason: "membership_missing" });
    const rows = await db.academyExternalIdentity.findMany({ where: { service: CENTRAL_LINK_SERVICE, externalUserRef: subject() } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: learner.id, companyId: orgA.id });
  });

  it("resolves the verified link only to the linked organisation's member", async () => {
    expect(await resolveCentralLogin(db, subject())).toMatchObject({ allowed: true, userId: learner.id, organisationRef: orgA.externalRef });
    expect(await resolveCentralLogin(db, `${prefix}-unknown`)).toEqual({ allowed: false, reason: "not_linked" });
  });

  it("unlink revokes every Skilled session of the account, and relink restores sign-in", async () => {
    await db.refreshToken.create({ data: { userId: learner.id, tokenHash: `${prefix}-hash-1`, expiresAt: new Date(Date.now() + 86_400_000) } });
    const result = await unlinkCentralIdentity(db, { subject: subject(), organisationRef: orgA.externalRef, userId: learner.id });
    expect(result.sessionsRevoked).toBeGreaterThanOrEqual(1);
    const session = await db.refreshToken.findFirst({ where: { userId: learner.id, tokenHash: `${prefix}-hash-1` } });
    expect(session?.isRevoked).toBe(true);
    expect(await resolveCentralLogin(db, subject())).toEqual({ allowed: false, reason: "not_linked" });

    expect(await linkCentralIdentity(db, { subject: subject(), organisationRef: orgA.externalRef, userId: learner.id })).toBe("created");
    expect(await resolveCentralLogin(db, subject())).toMatchObject({ allowed: true, userId: learner.id });
  });
});
