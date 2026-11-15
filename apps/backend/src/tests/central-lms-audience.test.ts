import { describe, it, expect } from "vitest";
import { centralSsoProblems, type CentralSsoSettings } from "../config/central-sso";
import { createCentralOidcClient, type CentralStateRecord, type CentralStateStore } from "../modules/auth/central/central-oidc";

// Fakes only. The discovery document and token endpoint are local fixtures; no Central is contacted.
const ISSUER = "https://central.test";
const REDIRECT = "https://academy.test/auth/titan/academy/callback";
const AUDIENCE = "urn:test:product:lms";
const BINDING = "a".repeat(43);

const valid: CentralSsoSettings = {
  enabled: true,
  issuer: ISSUER,
  clientId: "skilled-academy-test",
  clientSecret: "client-secret-for-tests-only-0123456789",
  jwksUri: ISSUER + "/jwks",
  redirectUri: REDIRECT,
  audience: AUDIENCE,
};

describe("CENTRAL_LMS_AUDIENCE configuration (#205)", () => {
  it("is required when Central SSO is enabled", () => {
    const problems = centralSsoProblems({ ...valid, audience: undefined });
    expect(problems.some((p) => p.includes("CENTRAL_LMS_AUDIENCE"))).toBe(true);
  });

  it("refuses an audience with whitespace or control characters", () => {
    expect(centralSsoProblems({ ...valid, audience: "urn:test product" }).length).toBeGreaterThan(0);
    expect(centralSsoProblems({ ...valid, audience: "urn:test\nproduct" }).length).toBeGreaterThan(0);
  });

  it("accepts a valid audience and does not require it when the flag is off", () => {
    expect(centralSsoProblems(valid)).toEqual([]);
    expect(centralSsoProblems({ ...valid, enabled: false, audience: undefined })).toEqual([]);
  });
});

function memoryStore(): CentralStateStore {
  const records = new Map<string, CentralStateRecord>();
  return {
    async save(digest, record) {
      records.set(digest, record);
    },
    async consume(digest) {
      const record = records.get(digest) ?? null;
      records.delete(digest);
      return record;
    },
  };
}

function discoveryFetcher() {
  return (async (url: string) => {
    if (url === ISSUER + "/.well-known/openid-configuration") {
      return new Response(
        JSON.stringify({ issuer: ISSUER, authorization_endpoint: ISSUER + "/oidc/auth", token_endpoint: ISSUER + "/oidc/token" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

describe("sign-in authorization request carries the LMS audience (#205)", () => {
  it("adds the configured audience and keeps the PKCE S256 challenge and discovered endpoint", async () => {
    const client = createCentralOidcClient({
      settings: valid,
      store: memoryStore(),
      verifyIdToken: async () => {
        throw new Error("not used");
      },
      fetcher: discoveryFetcher(),
    });
    const { authorizationUrl } = await client.begin(BINDING);
    const url = new URL(authorizationUrl);
    expect(url.origin + url.pathname).toBe(ISSUER + "/oidc/auth");
    expect(url.searchParams.get("audience")).toBe(AUDIENCE);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("client_id")).toBe(valid.clientId);
  });

  it("omits the audience parameter when no audience is configured", async () => {
    const client = createCentralOidcClient({
      settings: { ...valid, audience: undefined },
      store: memoryStore(),
      verifyIdToken: async () => {
        throw new Error("not used");
      },
      fetcher: discoveryFetcher(),
    });
    const { authorizationUrl } = await client.begin(BINDING);
    expect(new URL(authorizationUrl).searchParams.has("audience")).toBe(false);
  });
});
