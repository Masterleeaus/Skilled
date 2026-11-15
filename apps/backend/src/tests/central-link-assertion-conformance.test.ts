// Conformance of Skilled's Central link assertions with docs/LINKING.md (Central repo).
// Two directions are checked:
//  1. Central's canonical vectors (central-canonical-lms.json, copied from Central's
//     skilled-link-assertions fixtures) are read with a wire-rule checker that mirrors LINKING.md's
//     verification order. Each vector's expected wire outcome must match what the checker reports.
//  2. Skilled's signer is run with a fixed Ed25519 key and clock, and its output must pass the same
//     checker, with exact header and claim bytes and boundary values for lifetime, nonce, identifiers and kid.
// Time-based checks (future-dated, expired, key windows) are Central verifier concerns and are not repeated here.
import { createPrivateKey, createPublicKey, verify as verifySignature, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  CENTRAL_LEGACY_APPLICATION_ID, CENTRAL_LINK_ASSERTION_AUDIENCE, CENTRAL_LINK_ASSERTION_ISSUER,
  CENTRAL_LINK_ASSERTION_TYPE, LinkAssertionDenied, signSkilledCentralLinkAssertion,
  type LinkAssertionRequest, type SkilledLocalLinkAuthority,
} from "../modules/auth/central-link-assertion";

const here = path.dirname(fileURLToPath(import.meta.url));
const canonical = JSON.parse(readFileSync(
  path.join(here, "fixtures/central-link-assertion-vectors/central-canonical-lms.json"), "utf8")) as {
  productId: string; kid: string; jwk: { kty: string; crv: string; x: string };
  cases: { name: string; token: string; expected: string }[];
};

// Wire rules from docs/LINKING.md. Returns the first failing rule, or null when the wire shape is conformant.
// Account, organisation and membership checks are Central records and Skilled authority, so they are not here.
const B64URL = /^[A-Za-z0-9_-]+$/;
const KID = /^[A-Za-z0-9._-]{1,64}$/;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const NONCE = /^[A-Za-z0-9_-]{22,128}$/;
const FORBIDDEN = ["email", "email_verified", "name", "given_name", "family_name", "display_name", "displayName",
  "preferred_username", "username", "nickname", "phone_number"];
type Code = "malformed" | "bad_algorithm" | "unknown_product" | "wrong_audience" | "bad_signature" | "forbidden_claim"
  | "missing_claim" | "identifier_not_permitted" | "bad_lifetime";

function wireViolation(token: string, publicJwk: { kty: string; crv: string; x: string }): Code | null {
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) return "malformed";
  const parts = token.split(".");
  if (parts.length !== 3 || !parts.every(p => B64URL.test(p))) return "malformed";
  const [h, p, s] = parts as [string, string, string];
  const decode = (seg: string): unknown => JSON.parse(Buffer.from(seg, "base64url").toString("utf8"));
  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try { header = decode(h) as Record<string, unknown>; claims = decode(p) as Record<string, unknown>; }
  catch { return "malformed"; }
  if (header.alg !== "EdDSA" || header.typ !== CENTRAL_LINK_ASSERTION_TYPE) return "bad_algorithm";
  if (Object.keys(header).some(f => !["alg", "typ", "kid"].includes(f)) || typeof header.kid !== "string" || !KID.test(header.kid)) return "malformed";
  if (FORBIDDEN.some(f => Object.hasOwn(claims, f))) return "forbidden_claim";
  if (claims.iss !== CENTRAL_LINK_ASSERTION_ISSUER) return "unknown_product";
  if (claims.aud !== CENTRAL_LINK_ASSERTION_AUDIENCE) return "wrong_audience";
  const key: KeyObject = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: publicJwk.x }, format: "jwk" });
  const sig = Buffer.from(s, "base64url");
  if (sig.length !== 64 || !verifySignature(null, Buffer.from(`${h}.${p}`, "ascii"), key, sig)) return "bad_signature";
  for (const name of ["iss", "aud", "sub", "org", "lu", "la", "nonce", "iat", "exp"]) if (!Object.hasOwn(claims, name)) return "missing_claim";
  const { iat, exp } = claims as { iat: unknown; exp: unknown };
  if (!Number.isSafeInteger(iat) || !Number.isSafeInteger(exp) || (exp as number) <= (iat as number) || (exp as number) - (iat as number) > 300) return "bad_lifetime";
  for (const f of ["sub", "org", "lu", "la"]) if (typeof claims[f] !== "string" || !OPAQUE_ID.test(claims[f] as string)) return "identifier_not_permitted";
  if (typeof claims.nonce !== "string" || !NONCE.test(claims.nonce)) return "malformed";
  return null;
}

describe("Central canonical link vectors against the LINKING.md wire rules", () => {
  it("pins the Central product and audience values Skilled signs with", () => {
    expect(canonical.productId).toBe("lms");
    expect(canonical.kid).toBe("skilled-key-2026");
    expect(CENTRAL_LINK_ASSERTION_ISSUER).toBe("lms");
    expect(CENTRAL_LINK_ASSERTION_ISSUER).not.toBe("skilled");
    expect(CENTRAL_LINK_ASSERTION_AUDIENCE).toBe("titan-central");
    expect(CENTRAL_LINK_ASSERTION_TYPE).toBe("titan-link+jwt");
    expect(CENTRAL_LEGACY_APPLICATION_ID).toBe("academy");
  });

  it("has 26 cases, one per LA fixture", () => {
    expect(canonical.cases).toHaveLength(26);
  });

  for (const c of canonical.cases) {
    it(`${c.name}: expected ${c.expected}`, () => {
      // Central records decide account_mismatch, so the wire shape itself is conformant for that case.
      const wireExpected = c.expected === "accept" || c.expected === "account_mismatch" ? null : c.expected;
      expect(wireViolation(c.token, canonical.jwk)).toBe(wireExpected);
    });
  }
});

describe("Skilled signer output conforms to the LINKING.md wire rules", () => {
  // Fixed test-only Ed25519 seed. It is not a secret and signs nothing outside this file.
  const seed = Buffer.alloc(32, 7);
  const key = createPrivateKey({
    key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]), format: "der", type: "pkcs8",
  });
  const jwk = createPublicKey(key).export({ format: "jwk" }) as { kty: string; crv: string; x: string };
  const now = new Date("2026-11-10T12:00:00Z");
  const iat = Math.floor(now.getTime() / 1000);
  const request: LinkAssertionRequest = {
    logtoSubject: "usr_conform0001", logtoOrganisationId: "org_conform0001",
    localUserId: "lms-user-0001", localAccountId: "lms-acct-0001", companyId: "lms-company-0001",
  };
  const allowAll: SkilledLocalLinkAuthority = {
    centralOrganisationMapsToCompany: vi.fn(async () => true),
    localAccountBelongsToUser: vi.fn(async () => true),
    activeVerifiedMember: vi.fn(async () => true),
  };
  const sign = (over: Partial<LinkAssertionRequest> = {}, opts: { ttlSeconds?: number; nonce?: string; kid?: string } = {}) =>
    signSkilledCentralLinkAssertion({ ...request, ...over }, allowAll, {
      key, kid: opts.kid ?? "skilled-key-2026", ttlSeconds: opts.ttlSeconds, clock: () => now,
      nonce: () => opts.nonce ?? "A".repeat(32),
    });
  const denied = (p: Promise<string>) => expect(p).rejects.toBeInstanceOf(LinkAssertionDenied);
  const base64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

  it("emits exact header and claim bytes with the fixed clock", async () => {
    const token = await sign();
    const [h, p] = token.split(".");
    expect(h).toBe(base64({ alg: "EdDSA", typ: "titan-link+jwt", kid: "skilled-key-2026" }));
    expect(p).toBe(base64({
      iss: "lms", aud: "titan-central", sub: request.logtoSubject, org: request.logtoOrganisationId,
      lu: request.localUserId, la: request.localAccountId, nonce: "A".repeat(32), iat, exp: iat + 120,
    }));
    expect(wireViolation(token, jwk)).toBeNull();
  });

  it("verifies under the public key derived from the fixed seed", async () => {
    const [h, p, s] = (await sign()).split(".");
    const publicKey = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: jwk.x }, format: "jwk" });
    expect(verifySignature(null, Buffer.from(`${h}.${p}`, "ascii"), publicKey, Buffer.from(s, "base64url"))).toBe(true);
  });

  it("accepts lifetimes of 1 and 300 seconds and refuses 0, 301, fractional, NaN and string values", async () => {
    for (const ttl of [1, 300]) {
      const token = await sign({}, { ttlSeconds: ttl });
      expect(JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp - iat).toBe(ttl);
      expect(wireViolation(token, jwk)).toBeNull();
    }
    for (const ttl of [0, 301, 1.5, Number.NaN, "120" as unknown as number, -1]) {
      await denied(sign({}, { ttlSeconds: ttl }));
    }
  });

  it("accepts nonces of 22 and 128 base64url characters and refuses 21, 129 and non-base64url characters", async () => {
    for (const nonce of ["n".repeat(22), "N-_".repeat(43).slice(0, 128)]) {
      const token = await sign({}, { nonce });
      expect(wireViolation(token, jwk)).toBeNull();
    }
    for (const nonce of ["n".repeat(21), "n".repeat(129), "abc+def/ghi=jkl0123456789abcd", "abc def ghi jkl 0123456789", ""]) {
      await denied(sign({}, { nonce }));
    }
  });

  it("accepts identifiers of 8 and 128 characters and refuses 7, 129, email, whitespace and leading punctuation", async () => {
    for (const id of ["abcdefgh", `a${"b".repeat(127)}`, "usr.a_b:c-d", "org_0001abc"]) {
      const token = await sign({ logtoSubject: id });
      expect(wireViolation(token, jwk)).toBeNull();
    }
    const bad = ["abcdefg", `a${"b".repeat(128)}`, "a@example.test", "Jane Smith", ".abcdefgh", "-abcdefgh", "_abcdefgh", "abc/defghi", ""];
    for (const id of bad) {
      await denied(sign({ logtoSubject: id }));
      await denied(sign({ logtoOrganisationId: id }));
      await denied(sign({ localUserId: id }));
      await denied(sign({ localAccountId: id }));
    }
  });

  it("accepts kid of 1 to 64 characters and refuses longer or spaced identifiers", async () => {
    expect(wireViolation(await sign({}, { kid: "k".repeat(64) }), jwk)).toBeNull();
    expect(wireViolation(await sign({}, { kid: "k" }), jwk)).toBeNull();
    await denied(sign({}, { kid: "k".repeat(65) }));
    await denied(sign({}, { kid: "bad kid" }));
    await denied(sign({}, { kid: "" }));
  });

  it("never emits a forbidden display or contact claim", async () => {
    const claims = JSON.parse(Buffer.from((await sign()).split(".")[1], "base64url").toString());
    expect(Object.keys(claims).sort()).toEqual(["aud", "exp", "iat", "iss", "la", "lu", "nonce", "org", "sub"]);
  });
});
