// Skilled link assertions against a recorded vector. The vector was signed by this signer and accepted by
// Central's LinkAssertionVerifier (packages/control-plane/src/link-assertion.ts) when it was recorded.
// The vector holds only the public key, so the private key never enters the repository.
import { createPublicKey, generateKeyPairSync, verify as verifySignature } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  CENTRAL_LINK_SIGNING_ENV, LinkAssertionDenied, loadCentralLinkSigningOptions, signSkilledCentralLinkAssertion,
  type LinkAssertionRequest, type SkilledLocalLinkAuthority,
} from "../modules/auth/central-link-assertion";

const vectorPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/central-link-assertion-vectors/LMS-LA-V01.json");
const vector = JSON.parse(readFileSync(vectorPath, "utf8")) as {
  kid: string; publicJwk: Record<string, string>; token: string; now: string; request: LinkAssertionRequest;
};
const decode = (segment: string) => JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
const allowAll: SkilledLocalLinkAuthority = {
  centralOrganisationMapsToCompany: vi.fn(async () => true),
  localAccountBelongsToUser: vi.fn(async () => true),
  activeVerifiedMember: vi.fn(async () => true),
};

describe("recorded Skilled link assertion vector", () => {
  it("has a signature that verifies with the recorded public key over the exact signing input", () => {
    const [h, p, s] = vector.token.split(".");
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: vector.publicJwk.x }, format: "jwk" });
    expect(verifySignature(null, Buffer.from(`${h}.${p}`, "ascii"), key, Buffer.from(s, "base64url"))).toBe(true);
  });

  it("has exactly the header and claims Central requires, with no forbidden fields", () => {
    const [h, p] = vector.token.split(".");
    expect(decode(h)).toEqual({ alg: "EdDSA", typ: "titan-link+jwt", kid: vector.kid });
    const claims = decode(p);
    expect(Object.keys(claims).sort()).toEqual(["aud", "exp", "iat", "iss", "la", "lu", "nonce", "org", "sub"]);
    expect(claims).toMatchObject({
      iss: "lms", aud: "titan-central", sub: vector.request.logtoSubject, org: vector.request.logtoOrganisationId,
      lu: vector.request.localUserId, la: vector.request.localAccountId,
    });
    expect(claims.exp - claims.iat).toBe(120);
    expect(JSON.stringify(claims)).not.toMatch(/email|name|company|role/i);
  });
});

describe("Skilled link assertion claim rules", () => {
  const key = generateKeyPairSync("ed25519").privateKey;
  const now = new Date("2026-11-10T12:00:00Z");
  const base = { key, kid: "lms-test-kid", clock: () => now, nonce: () => "n".repeat(32) };

  it("refuses a lifetime above the 300 second Central limit", async () => {
    await expect(signSkilledCentralLinkAssertion(vector.request, allowAll, { ...base, ttlSeconds: 301 }))
      .rejects.toBeInstanceOf(LinkAssertionDenied);
  });

  it("refuses a nonce shorter than 22 characters", async () => {
    await expect(signSkilledCentralLinkAssertion(vector.request, allowAll, { ...base, nonce: () => "short" }))
      .rejects.toBeInstanceOf(LinkAssertionDenied);
  });

  it("refuses an email-shaped or display-name identifier", async () => {
    await expect(signSkilledCentralLinkAssertion({ ...vector.request, localAccountId: "owner@example.test" }, allowAll, base))
      .rejects.toBeInstanceOf(LinkAssertionDenied);
    await expect(signSkilledCentralLinkAssertion({ ...vector.request, localUserId: "Jane Smith" }, allowAll, base))
      .rejects.toBeInstanceOf(LinkAssertionDenied);
  });

  it("refuses an RSA key where an Ed25519 key is required", async () => {
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    await expect(signSkilledCentralLinkAssertion(vector.request, allowAll, { ...base, key: rsa }))
      .rejects.toBeInstanceOf(LinkAssertionDenied);
  });
});

describe("Skilled link signing key configuration", () => {
  const pkcs8 = generateKeyPairSync("ed25519").privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");

  it("is absent by default, so signing stays unavailable", () => {
    expect(loadCentralLinkSigningOptions({})).toBeNull();
    expect(loadCentralLinkSigningOptions({ [CENTRAL_LINK_SIGNING_ENV.key]: "" })).toBeNull();
  });

  it("loads an Ed25519 PKCS#8 key and a key identifier from configuration", async () => {
    const options = loadCentralLinkSigningOptions({ [CENTRAL_LINK_SIGNING_ENV.key]: pkcs8, [CENTRAL_LINK_SIGNING_ENV.kid]: "lms-2026-11" });
    expect(options?.kid).toBe("lms-2026-11");
    const token = await signSkilledCentralLinkAssertion(vector.request, allowAll, { ...options!, nonce: () => "n".repeat(32) });
    expect(token.split(".")).toHaveLength(3);
  });

  it("refuses a non-Ed25519 key, a malformed key or a bad identifier without echoing the key", () => {
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
    expect(() => loadCentralLinkSigningOptions({ [CENTRAL_LINK_SIGNING_ENV.key]: rsa, [CENTRAL_LINK_SIGNING_ENV.kid]: "k1" })).toThrow(/Ed25519/);
    try {
      loadCentralLinkSigningOptions({ [CENTRAL_LINK_SIGNING_ENV.key]: "bm90LWEta2V5", [CENTRAL_LINK_SIGNING_ENV.kid]: "k1" });
      throw new Error("expected a rejection");
    } catch (error) {
      expect((error as Error).message).not.toContain("bm90LWEta2V5");
    }
    expect(() => loadCentralLinkSigningOptions({ [CENTRAL_LINK_SIGNING_ENV.key]: pkcs8, [CENTRAL_LINK_SIGNING_ENV.kid]: "bad kid!" })).toThrow(TypeError);
  });
});
