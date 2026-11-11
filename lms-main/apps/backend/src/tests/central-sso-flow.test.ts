// Central SSO end-to-end on the Skilled HTTP surface: start, callback, refresh, logout, expiry, role change,
// unlink and relink, revocation, cross-organisation denial, ambiguous and unscoped links, and the flag-off path.
// Runs the real auth routes against the in-memory Prisma double, so it needs no PostgreSQL or Redis.
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

vi.mock("../config/prisma", async () => {
  const fake = await import("./support/fake-prisma");
  return { prisma: fake.fakePrisma };
});
vi.mock("../jobs/email.queue", () => ({
  sendVerificationEmail: async () => undefined,
  sendResetPasswordEmail: async () => undefined,
}));
// The mount module imports the shared Redis client. These tests never open a connection.
vi.mock("../config/redis", () => ({ redis: {} }));

import { fakePrisma, seed, rows, resetFakeDb } from "./support/fake-prisma";
import { env } from "../config/env";
import authRoutes from "../modules/auth/auth.routes";
import { createCentralSsoRouter, BINDING_COOKIE, SESSION_COOKIE } from "../modules/auth/central/central-routes";
import { createCentralOidcClient } from "../modules/auth/central/central-oidc";
import { createCentralIdTokenVerifier } from "../modules/auth/central/central-id-token";
import { createMemoryCentralStateStore } from "../modules/auth/central/central-state";
import { linkCentralIdentity, unlinkCentralIdentity, resolveCentralLogin, type CentralDb } from "../modules/auth/central/central-link";
import { CentralLinkError } from "../modules/auth/central/central-errors";
import { mountCentralSso } from "../modules/auth/central/central-sso.mount";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";
import { centralSsoProblems, CENTRAL_SSO_START_PATH, type CentralSsoSettings } from "../config/central-sso";
import {
  ISSUER, CLIENT_ID, CLIENT_SECRET, JWKS_URI, REDIRECT_URI, createSigningKey, createFakeCentral, idClaims,
  type SigningKey, type FakeCentral,
} from "./support/central-sso-fixtures";

const db = fakePrisma as unknown as CentralDb;
const SUBJECT = "central-subject-1";
const CLIENT_URL = "https://academy.test/";
let key: SigningKey;

beforeAll(() => {
  key = createSigningKey("kid-flow");
});

function cookieFrom(res: { headers: Record<string, unknown> }, name: string): string | undefined {
  const header = res.headers["set-cookie"];
  const list = Array.isArray(header) ? (header as string[]) : header ? [String(header)] : [];
  const match = list.find((item) => item.startsWith(`${name}=`));
  return match?.split(";")[0];
}

function setCookieFor(res: { headers: Record<string, unknown> }, name: string): string | undefined {
  const header = res.headers["set-cookie"];
  const list = Array.isArray(header) ? (header as string[]) : header ? [String(header)] : [];
  return list.find((item) => item.startsWith(`${name}=`));
}

async function seedTenant(): Promise<void> {
  await seed("user", [
    { id: "learner-a", email: "learner-a@skilled.test", passwordHash: "not-used-by-central", fullName: "Learner A", role: "STUDENT", isEmailVerified: true, isActive: true },
    { id: "learner-b", email: "learner-b@skilled.test", passwordHash: "not-used-by-central", fullName: "Learner B", role: "STUDENT", isEmailVerified: true, isActive: true },
  ]);
  await seed("company", [
    { id: "org-a", name: "Organisation A", externalRef: "central-org-a" },
    { id: "org-b", name: "Organisation B", externalRef: "central-org-b" },
  ]);
  await seed("companyMember", [
    { id: "member-a", companyId: "org-a", userId: "learner-a", role: "LEARNER" },
    { id: "member-b", companyId: "org-b", userId: "learner-b", role: "LEARNER" },
  ]);
  await linkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-a", userId: "learner-a" });
}

function buildApp(central: FakeCentral) {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  const verifyIdToken = createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher });
  const oidc = createCentralOidcClient({
    settings: { issuer: ISSUER, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI },
    store: createMemoryCentralStateStore(),
    fetcher: central.fetcher,
    verifyIdToken,
  });
  app.use(CENTRAL_SSO_START_PATH.slice(0, -"/start".length), createCentralSsoRouter({ db, oidc, afterLoginUrl: CLIENT_URL }));
  app.use("/api/auth", authRoutes);
  return app;
}

/** Runs the browser half of a Central sign-in and returns the callback response and the session cookie. */
async function signInThroughCentral(
  app: express.Express,
  central: FakeCentral,
  options: { overrides?: Record<string, unknown>; signWith?: SigningKey } = {},
) {
  const start = await request(app).get("/auth/titan/academy/start");
  expect(start.status).toBe(302);
  const location = String(start.headers.location);
  const binding = cookieFrom(start, BINDING_COOKIE);
  expect(binding).toBeDefined();
  const url = new URL(location);
  const state = url.searchParams.get("state") as string;
  // Claims carry the nonce of this login, so only the field under test is wrong.
  const idTokenClaims = options.overrides ? idClaims(url.searchParams.get("nonce") ?? "", options.overrides) : undefined;
  const code = central.issueCode(location, { idTokenClaims, signWith: options.signWith });
  const callback = await request(app)
    .get(`/auth/titan/academy/callback?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}`)
    .set("Cookie", binding as string);
  return { start, callback, session: cookieFrom(callback, SESSION_COOKIE), location, state, code, binding: binding as string };
}

describe("Central SSO configuration", () => {
  const valid: CentralSsoSettings = {
    enabled: true, issuer: ISSUER, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, jwksUri: JWKS_URI, redirectUri: REDIRECT_URI,
  };

  it("requires nothing while the flag is off, and reports every problem when it is on", () => {
    expect(centralSsoProblems({ ...valid, enabled: false, issuer: "", jwksUri: "", redirectUri: "", clientId: "" })).toEqual([]);
    expect(centralSsoProblems(valid)).toEqual([]);
    expect(centralSsoProblems({ ...valid, issuer: "http://id.central.test" }).length).toBeGreaterThan(0);
    expect(centralSsoProblems({ ...valid, redirectUri: "https://academy.test/auth/callback" })).toContain(
      "CENTRAL_SSO_REDIRECT_URI must end with /auth/titan/academy/callback",
    );
    expect(centralSsoProblems({ ...valid, redirectUri: "https://academy.test/auth/titan/academy/callback?x=1" })).not.toEqual([]);
    expect(centralSsoProblems({ ...valid, clientSecret: "short" })).not.toEqual([]);
  });

  it("is OFF by default and mounts nothing when the flag is off; the email/password login is unchanged", async () => {
    resetFakeDb();
    await seedTenant();
    expect(env.CENTRAL_SSO_ENABLED).toBe(false);
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    const mounted = mountCentralSso(app, { ...env, CENTRAL_SSO_ENABLED: false } as typeof env);
    expect(mounted).toBe(false);
    app.use("/api/auth", authRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
    expect((await request(app).get("/auth/titan/academy/start")).status).toBe(404);
    expect((await request(app).get("/auth/titan/academy/callback?state=x&code=y")).status).toBe(404);
    // Same answer as before this change: an unknown account gets the generic credentials error.
    const login = await request(app).post("/api/auth/login").send({ email: "nobody@skilled.test", password: "Password123!" });
    expect(login.status).toBe(401);
    expect(login.body.message).toBe("Invalid email or password");
    // The rollback path still signs a verified local account in.
    await fakePrisma.user.update({ where: { id: "learner-a" }, data: { passwordHash: bcrypt.hashSync("Password123!", 4) } });
    const local = await request(app).post("/api/auth/login").send({ email: "learner-a@skilled.test", password: "Password123!" });
    expect(local.status).toBe(200);
    expect(local.body.data.user.id).toBe("learner-a");
    expect(cookieFrom(local, SESSION_COOKIE)).toBeDefined();
  });

  it("refuses to mount an enabled but incomplete configuration, so the service never starts half-configured", () => {
    const app = express();
    const incomplete = { ...env, CENTRAL_SSO_ENABLED: true, CENTRAL_SSO_ISSUER: "http://id.central.test", CENTRAL_SSO_CLIENT_ID: "", CENTRAL_SSO_CLIENT_SECRET: "short", CENTRAL_SSO_JWKS_URI: "", CENTRAL_SSO_REDIRECT_URI: "" } as typeof env;
    expect(() => mountCentralSso(app, incomplete)).toThrow(/Central SSO is misconfigured/);
  });

  it("mounts the reconciled callback path through production wiring and keeps the old path absent", async () => {
    const app = express();
    app.use(cookieParser());
    expect(mountCentralSso(app, { ...env, CENTRAL_SSO_ENABLED: true,
      CENTRAL_SSO_ISSUER: ISSUER, CENTRAL_SSO_CLIENT_ID: CLIENT_ID,
      CENTRAL_SSO_CLIENT_SECRET: CLIENT_SECRET, CENTRAL_SSO_JWKS_URI: JWKS_URI,
      CENTRAL_SSO_REDIRECT_URI: REDIRECT_URI })).toBe(true);
    const callback = await request(app).get("/auth/titan/academy/callback");
    expect(callback.status).toBe(400);
    expect(callback.body).toEqual({ error: "invalid_callback" });
    expect((await request(app).get("/api/auth/central/callback")).status).toBe(404);
  });
});

describe("Central SSO sign-in with the flag on", () => {
  let central: FakeCentral;
  beforeEach(async () => {
    resetFakeDb();
    central = createFakeCentral([key]);
    await seedTenant();
  });

  it("signs a linked learner in, sets a secure HttpOnly session cookie, and refreshes into an access token", async () => {
    const app = buildApp(central);
    const { start, callback, session } = await signInThroughCentral(app, central);

    expect(start.headers.location).toMatch(new RegExp(`^${ISSUER}/oidc/auth\\?`));
    const bindingSet = setCookieFor(start, BINDING_COOKIE) ?? "";
    expect(bindingSet).toMatch(/HttpOnly/);
    expect(bindingSet).toMatch(/Secure/);
    expect(bindingSet).toMatch(/SameSite=Lax/);
    expect(bindingSet).toContain("Path=/auth/titan/academy/callback");

    expect(callback.status).toBe(303);
    expect(callback.headers.location).toBe(CLIENT_URL);
    const sessionSet = setCookieFor(callback, SESSION_COOKIE) ?? "";
    expect(sessionSet).toMatch(/HttpOnly/);
    expect(sessionSet).toMatch(/Secure/);
    expect(sessionSet).toMatch(/SameSite=Lax/);
    expect(sessionSet).toContain("Path=/api/auth;");
    expect(session).toBeDefined();
    // The session is an ordinary refresh session: only its hash is stored.
    const stored = rows("refreshToken");
    expect(stored).toHaveLength(1);
    expect(stored[0].tokenHash).not.toBe(session?.split("=")[1]);

    const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", session as string);
    expect(refreshed.status).toBe(200);
    const accessToken = refreshed.body.data.accessToken as string;
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe("learner-a");
    expect(me.body.data.role).toBe("STUDENT");

    const audit = rows("academyIntegrationAudit").map((row) => row.outcome);
    expect(audit).toContain("CENTRAL_LOGIN_SUCCEEDED");
  });

  it("logs out by revoking the session, so the old cookie can no longer refresh", async () => {
    const app = buildApp(central);
    const { session } = await signInThroughCentral(app, central);
    const out = await request(app).post("/api/auth/logout").set("Cookie", session as string);
    expect(out.status).toBe(200);
    const after = await request(app).post("/api/auth/refresh").set("Cookie", session as string);
    expect(after.status).toBe(401);
  });

  it("expires sessions: a refresh session past its expiry and an access token past its exp are both refused", async () => {
    const app = buildApp(central);
    const { session } = await signInThroughCentral(app, central);
    const refreshRow = rows("refreshToken")[0];
    await fakePrisma.refreshToken.update({ where: { id: refreshRow.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await request(app).post("/api/auth/refresh").set("Cookie", session as string);
    expect(expired.status).toBe(401);

    const staleAccess = jwt.sign({ userId: "learner-a", role: "STUDENT", exp: Math.floor(Date.now() / 1000) - 30 }, env.JWT_ACCESS_SECRET, { algorithm: "HS256" });
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${staleAccess}`);
    expect(me.status).toBe(401);
  });

  it("applies a role change at the next request, because Skilled reads the role from its own database", async () => {
    const app = buildApp(central);
    const { session } = await signInThroughCentral(app, central);
    const first = await request(app).post("/api/auth/refresh").set("Cookie", session as string);
    const token = first.body.data.accessToken as string;
    await fakePrisma.user.update({ where: { id: "learner-a" }, data: { role: "TEACHER" } });
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.role).toBe("TEACHER");

    // Organisation role is resolved fresh at each login, not carried from an earlier link.
    await fakePrisma.companyMember.updateMany({ where: { companyId: "org-a", userId: "learner-a" }, data: { role: "ASSESSOR" } });
    const resolved = await resolveCentralLogin(db, SUBJECT);
    expect(resolved).toMatchObject({ allowed: true, userId: "learner-a", memberRole: "ASSESSOR" });
  });

  it("unlinks an identity: its sessions are revoked, the next Central sign-in is refused, and relinking restores it", async () => {
    const app = buildApp(central);
    const { session } = await signInThroughCentral(app, central);

    const result = await unlinkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-a", userId: "learner-a" });
    expect(result.sessionsRevoked).toBe(1);
    expect((await request(app).post("/api/auth/refresh").set("Cookie", session as string)).status).toBe(401);

    const refused = await signInThroughCentral(app, central);
    expect(refused.callback.status).toBe(403);
    expect(refused.callback.body.error).toBe("account_not_authorised");
    expect(refused.session).toBeUndefined();

    expect(await linkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-a", userId: "learner-a" })).toBe("created");
    const restored = await signInThroughCentral(app, central);
    expect(restored.callback.status).toBe(303);
    expect(restored.session).toBeDefined();
  });

  it("refuses to unlink a subject from the wrong organisation or user", async () => {
    await expect(unlinkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-b", userId: "learner-a" })).rejects.toMatchObject({ reason: "not_linked" });
    await expect(unlinkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-a", userId: "learner-b" })).rejects.toMatchObject({ reason: "not_linked" });
    expect(rows("academyExternalIdentity")).toHaveLength(1);
  });

  it("revokes access when an account is deactivated, soft-deleted or left unverified", async () => {
    const app = buildApp(central);
    const { session } = await signInThroughCentral(app, central);

    await fakePrisma.user.update({ where: { id: "learner-a" }, data: { isActive: false } });
    expect((await request(app).post("/api/auth/refresh").set("Cookie", session as string)).status).toBe(401);
    const denied = await signInThroughCentral(app, central);
    expect(denied.callback.status).toBe(403);

    await fakePrisma.user.update({ where: { id: "learner-a" }, data: { isActive: true, deletedAt: new Date() } });
    expect((await signInThroughCentral(app, central)).callback.status).toBe(403);

    await fakePrisma.user.update({ where: { id: "learner-a" }, data: { deletedAt: null, isEmailVerified: false } });
    expect((await signInThroughCentral(app, central)).callback.status).toBe(403);
  });

  it("denies a link to an organisation the account does not belong to, and never resolves it", async () => {
    await expect(linkCentralIdentity(db, { subject: "central-subject-2", organisationRef: "central-org-b", userId: "learner-a" }))
      .rejects.toMatchObject({ reason: "membership_missing" });
    expect(rows("academyExternalIdentity").filter((row) => row.externalUserRef === "central-subject-2")).toHaveLength(0);

    // A link row that points at another organisation's account must not open a session in that organisation.
    await fakePrisma.academyExternalIdentity.create({ data: { service: "titan-central", externalUserRef: "central-subject-3", userId: "learner-b", companyId: "org-a" } });
    expect(await resolveCentralLogin(db, "central-subject-3")).toEqual({ allowed: false, reason: "membership_missing" });
  });

  it("never takes an organisation or account from the browser", async () => {
    const app = buildApp(central);
    const start = await request(app).get("/auth/titan/academy/start");
    const binding = cookieFrom(start, BINDING_COOKIE) as string;
    const location = String(start.headers.location);
    const state = new URL(location).searchParams.get("state") as string;
    const code = central.issueCode(location);
    const tampered = await request(app)
      .get(`/auth/titan/academy/callback?state=${state}&code=${code}&organisation=central-org-b&userId=learner-b`)
      .set("Cookie", binding);
    expect(tampered.status).toBe(400);
    expect(tampered.body.error).toBe("invalid_callback");
    expect(rows("refreshToken")).toHaveLength(0);
  });

  it("refuses an ambiguous or unscoped link and an organisation without a verified reference", async () => {
    const twoLinks = { academyExternalIdentity: { findMany: async () => [{ userId: "learner-a", companyId: "org-a" }, { userId: "learner-b", companyId: "org-b" }] } } as unknown as CentralDb;
    expect(await resolveCentralLogin(twoLinks, SUBJECT)).toEqual({ allowed: false, reason: "link_ambiguous" });

    await fakePrisma.academyExternalIdentity.create({ data: { service: "titan-central", externalUserRef: "central-subject-legacy", userId: "learner-b", companyId: null } });
    expect(await resolveCentralLogin(db, "central-subject-legacy")).toEqual({ allowed: false, reason: "link_unscoped" });

    await fakePrisma.company.create({ data: { id: "org-unref", name: "No reference" } });
    await fakePrisma.companyMember.create({ data: { id: "member-unref", companyId: "org-unref", userId: "learner-b", role: "LEARNER" } });
    await fakePrisma.academyExternalIdentity.create({ data: { service: "titan-central", externalUserRef: "central-subject-unref", userId: "learner-b", companyId: "org-unref" } });
    expect(await resolveCentralLogin(db, "central-subject-unref")).toEqual({ allowed: false, reason: "organisation_missing" });

    expect(await resolveCentralLogin(db, "central-subject-unknown")).toEqual({ allowed: false, reason: "not_linked" });
  });

  it("refuses a second link for the same subject and leaves the first intact", async () => {
    await expect(linkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-b", userId: "learner-b" }))
      .rejects.toBeInstanceOf(CentralLinkError);
    const link = rows("academyExternalIdentity").find((row) => row.externalUserRef === SUBJECT);
    expect(link?.userId).toBe("learner-a");
    expect(link?.companyId).toBe("org-a");
    expect(await linkCentralIdentity(db, { subject: SUBJECT, organisationRef: "central-org-a", userId: "learner-a" })).toBe("already_linked");
  });

  it("fails closed on callbacks that are replayed, missing their browser binding, or carry a provider error", async () => {
    const app = buildApp(central);
    const first = await signInThroughCentral(app, central);
    expect(first.callback.status).toBe(303);

    const replay = await request(app)
      .get(`/auth/titan/academy/callback?state=${first.state}&code=${first.code}`)
      .set("Cookie", first.binding);
    expect(replay.status).toBe(401);
    expect(replay.body.error).toBe("login_failed");

    const noBinding = await request(app).get(`/auth/titan/academy/callback?state=${first.state}&code=x`);
    expect(noBinding.status).toBe(400);

    const providerError = await request(app).get("/auth/titan/academy/callback?error=access_denied&state=abc").set("Cookie", first.binding);
    expect(providerError.status).toBe(401);
    expect(providerError.body.error).toBe("identity_provider_rejected");
    expect(setCookieFor(providerError, BINDING_COOKIE)).toMatch(/Max-Age=0|Expires=/);
  });

  it("refuses an ID token signed by a key that is not the identity provider's, or with the wrong audience", async () => {
    const app = buildApp(central);
    // The JWKS publishes only `key`, but this token claims the same key ID and is signed by a different key.
    const stranger = createSigningKey("kid-flow");
    const forged = await signInThroughCentral(app, central, { signWith: stranger });
    expect(forged.callback.status).toBe(401);
    expect(forged.callback.body.error).toBe("login_failed");
    const wrongAudience = await signInThroughCentral(app, central, { overrides: { aud: "another-app" } });
    expect(wrongAudience.callback.status).toBe(401);
    expect(wrongAudience.session).toBeUndefined();
    expect(rows("refreshToken")).toHaveLength(0);
  });
});
