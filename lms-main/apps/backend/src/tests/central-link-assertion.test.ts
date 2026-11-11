import { createSecretKey, generateKeyPairSync, verify as verifySignature } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  signSkilledCentralLinkAssertion, LinkAssertionDenied,
  type LinkAssertionRequest, type SkilledLocalLinkAuthority,
} from "../modules/auth/central-link-assertion";

type Fixture = {
  name: string;
  changes: {
    accountAllowed?: boolean; organisationAllowed?: boolean; memberAllowed?: boolean; invalidKey?: boolean;
    kid?: string; nonce?: string; ttlSeconds?: number; request?: Partial<LinkAssertionRequest>;
  };
  expectedAllowed: boolean;
};
const fixturesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/central-link-assertions");
const fixtures = readdirSync(fixturesRoot).filter(n => /^LA-\d{2}-.*\.json$/.test(n)).sort();
if (fixtures.length !== 26) throw new Error("Expected 26 signed-link regression fixtures");
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const now = new Date("2026-11-09T02:00:00Z");
const request: LinkAssertionRequest = {
  logtoSubject: "central-user-0001", logtoOrganisationId: "central-org-0001",
  localUserId: "skilled-user-0001", localAccountId: "skilled-account-0001",
  companyId: "skilled-company-0001",
};
const decode = (v: string) => JSON.parse(Buffer.from(v, "base64url").toString("utf8"));
describe("Skilled Ed25519 link assertion wire contract for Central", () => {
  for (const file of fixtures) {
    const { name, changes, expectedAllowed }: Fixture = JSON.parse(readFileSync(path.join(fixturesRoot, file), "utf8"));
    it(name, async () => {
      const checked = { organisation: vi.fn(), account: vi.fn(), member: vi.fn() };
      const authority: SkilledLocalLinkAuthority = {
        centralOrganisationMapsToCompany: checked.organisation.mockResolvedValue(changes.organisationAllowed !== false),
        localAccountBelongsToUser: checked.account.mockResolvedValue(changes.accountAllowed !== false),
        activeVerifiedMember: checked.member.mockResolvedValue(changes.memberAllowed !== false),
      };
      const opts = {
        key: changes.invalidKey ? createSecretKey(Buffer.alloc(32)) : privateKey,
        kid: changes.kid ?? "skilled-key-2026",
        ttlSeconds: changes.ttlSeconds ?? 120,
        clock: () => now,
        nonce: () => changes.nonce ?? "a".repeat(32),
      };
      const input = { ...request, ...changes.request };
      if (!expectedAllowed) {
        await expect(signSkilledCentralLinkAssertion(input, authority, opts)).rejects.toBeInstanceOf(LinkAssertionDenied);
        return;
      }
      const token = await signSkilledCentralLinkAssertion(input, authority, opts);
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
      const header = decode(parts[0]);
      const claims = decode(parts[1]);
      expect(header).toEqual({ alg: "EdDSA", typ: "titan-link+jwt", kid: opts.kid });
      expect(claims).toEqual({
        iss: "lms", aud: "titan-central",
        sub: input.logtoSubject, org: input.logtoOrganisationId,
        lu: input.localUserId, la: input.localAccountId,
        nonce: opts.nonce(), iat: Math.floor(now.getTime()/1000),
        exp: Math.floor(now.getTime()/1000) + opts.ttlSeconds,
      });
      expect(verifySignature(null, Buffer.from(parts.slice(0,2).join("."), "ascii"),
        publicKey, Buffer.from(parts[2], "base64url"))).toBe(true);
      expect(token).not.toContain(input.companyId);
      for (const forbidden of ["email","name","role","companyId","username","phone_number"]) {
        expect(claims).not.toHaveProperty(forbidden);
      }
      expect(checked.organisation).toHaveBeenCalledWith(input.logtoOrganisationId, input.companyId);
      expect(checked.account).toHaveBeenCalledWith(input.localAccountId, input.localUserId, input.companyId);
      expect(checked.member).toHaveBeenCalledWith(input.localUserId, input.companyId);
    });
  }
  it("does not sign if trusted organisation check throws", async () => {
    await expect(signSkilledCentralLinkAssertion(request, {
      centralOrganisationMapsToCompany: async () => { throw new Error("trusted registry unavailable"); },
      localAccountBelongsToUser: async () => true,
      activeVerifiedMember: async () => true,
    }, { key: privateKey, kid: "valid-key" })).rejects.toThrow("trusted registry unavailable");
  });
  it("uses distinct cryptographic nonces by default", async () => {
    const authority: SkilledLocalLinkAuthority = {
      centralOrganisationMapsToCompany: async () => true,
      localAccountBelongsToUser: async () => true,
      activeVerifiedMember: async () => true,
    };
    const opts = { key: privateKey, kid: "valid-key", clock: () => now };
    const a = decode((await signSkilledCentralLinkAssertion(request, authority, opts)).split(".")[1]);
    const b = decode((await signSkilledCentralLinkAssertion(request, authority, opts)).split(".")[1]);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.nonce).toMatch(/^[A-Za-z0-9_-]{22,128}$/);
  });
  it("tampering the payload invalidates the Ed25519 signature", async () => {
    const authority: SkilledLocalLinkAuthority = {
      centralOrganisationMapsToCompany: async () => true,
      localAccountBelongsToUser: async () => true,
      activeVerifiedMember: async () => true,
    };
    const parts = (await signSkilledCentralLinkAssertion(request, authority,
      { key: privateKey, kid: "valid-key" })).split(".");
    const changed = { ...decode(parts[1]), org: "central-org-9999" };
    const tampered = parts[0]+"."+Buffer.from(JSON.stringify(changed)).toString("base64url");
    expect(verifySignature(null, Buffer.from(tampered,"ascii"),
      publicKey,Buffer.from(parts[2],"base64url"))).toBe(false);
  });
});
