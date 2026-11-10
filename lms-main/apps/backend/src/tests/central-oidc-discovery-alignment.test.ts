// Alignment with Central's OIDC login (apps/control-api/src/oidc-login.mjs): endpoints come from provider metadata,
// metadata is validated, and the token response and ID-token claims are checked as Central checks them.
import { describe, it, expect } from "vitest";
import { createCentralOidcClient } from "../modules/auth/central/central-oidc";
import { createMemoryCentralStateStore } from "../modules/auth/central/central-state";
import { CentralAuthError } from "../modules/auth/central/central-errors";
import {
  ISSUER, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, DISCOVERY_URI, TOKEN_URI, createFakeCentral, createSigningKey, discoveryMetadata,
} from "./support/central-sso-fixtures";

const BINDING = "b".repeat(43);
const settings = { issuer: ISSUER, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A fetcher that serves the given metadata at the discovery URL and counts discovery requests. */
function metadataFetcher(metadata: () => unknown, counter: { discovery: number }, status = 200) {
  return (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url !== DISCOVERY_URI) throw new Error(`unexpected request ${url}`);
    counter.discovery += 1;
    return status === 200 ? json(metadata()) : new Response("down", { status });
  }) as typeof fetch;
}

async function expectReason(promise: Promise<unknown>, reason: string) {
  await expect(promise).rejects.toBeInstanceOf(CentralAuthError);
  await expect(promise).rejects.toMatchObject({ reason });
}

describe("Central OIDC discovery alignment", () => {
  it("takes the authorization endpoint from provider metadata, not from the issuer path", async () => {
    const counter = { discovery: 0 };
    const metadata = { ...discoveryMetadata(), authorization_endpoint: `${ISSUER}/connect/authorize` };
    const oidc = createCentralOidcClient({ settings, store: createMemoryCentralStateStore(), fetcher: metadataFetcher(() => metadata, counter), verifyIdToken: async () => { throw new Error("unused"); } });
    const { authorizationUrl } = await oidc.begin(BINDING);
    expect(authorizationUrl.startsWith(`${ISSUER}/connect/authorize?`)).toBe(true);
    expect(authorizationUrl).not.toContain("/oidc/auth");
  });

  it("caches successful discovery and does not cache failures", async () => {
    const counter = { discovery: 0 };
    let up = false;
    const fetcher = (async (input: string | URL | Request) => {
      counter.discovery += 1;
      if (!up) return new Response("down", { status: 503 });
      return json(discoveryMetadata());
    }) as typeof fetch;
    const oidc = createCentralOidcClient({ settings, store: createMemoryCentralStateStore(), fetcher, verifyIdToken: async () => { throw new Error("unused"); } });
    await expectReason(oidc.begin(BINDING), "discovery_unavailable");
    up = true;
    await oidc.begin(BINDING);
    await oidc.begin(BINDING);
    expect(counter.discovery).toBe(2);
  });

  it.each([
    ["issuer that is not an exact match", () => ({ ...discoveryMetadata(), issuer: `${ISSUER}/` })],
    ["authorization endpoint on another origin", () => ({ ...discoveryMetadata(), authorization_endpoint: "https://evil.test/oidc/auth" })],
    ["token endpoint with a query string", () => ({ ...discoveryMetadata(), token_endpoint: `${TOKEN_URI}?x=1` })],
    ["token endpoint over http", () => ({ ...discoveryMetadata(), token_endpoint: TOKEN_URI.replace("https:", "http:") })],
    ["missing authorization endpoint", () => ({ issuer: ISSUER, token_endpoint: TOKEN_URI })],
  ])("refuses metadata with %s", async (_label, metadata) => {
    const counter = { discovery: 0 };
    const oidc = createCentralOidcClient({ settings, store: createMemoryCentralStateStore(), fetcher: metadataFetcher(metadata, counter), verifyIdToken: async () => { throw new Error("unused"); } });
    await expectReason(oidc.begin(BINDING), "discovery_invalid");
  });

  it("refuses oversized metadata", async () => {
    const counter = { discovery: 0 };
    const big = { ...discoveryMetadata(), padding: "x".repeat(70_000) };
    const oidc = createCentralOidcClient({ settings, store: createMemoryCentralStateStore(), fetcher: metadataFetcher(() => big, counter), verifyIdToken: async () => { throw new Error("unused"); } });
    await expectReason(oidc.begin(BINDING), "discovery_invalid");
  });

  it("refuses a token response without an access token", async () => {
    const central = createFakeCentral([createSigningKey("k")]);
    const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input) === TOKEN_URI) return json({ id_token: "x.y.z", token_type: "Bearer" });
      return central.fetcher(input, init);
    }) as typeof fetch;
    const store = createMemoryCentralStateStore();
    const oidc = createCentralOidcClient({ settings, store, fetcher, verifyIdToken: async () => { throw new Error("unused"); } });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const state = new URL(authorizationUrl).searchParams.get("state") as string;
    await expectReason(oidc.complete({ state, code: "code-123456", browserBinding: BINDING }), "invalid_token_response");
  });

  it("refuses verified ID-token claims that name another issuer or audience", async () => {
    const central = createFakeCentral([createSigningKey("k")]);
    const exp = Math.floor(Date.now() / 1000) + 300;
    for (const claims of [
      { iss: "https://other.test", aud: CLIENT_ID, exp },
      { iss: ISSUER, aud: "another-client", exp },
    ]) {
      let nonce = "";
      const oidc = createCentralOidcClient({
        settings, store: createMemoryCentralStateStore(), fetcher: central.fetcher,
        // The nonce check passes (same nonce as the login), so the rejection comes from the issuer or audience check.
        verifyIdToken: async () => ({ sub: "central-subject-1", nonce, iat: exp - 300, ...claims }),
      });
      const { authorizationUrl } = await oidc.begin(BINDING);
      nonce = new URL(authorizationUrl).searchParams.get("nonce") as string;
      const state = new URL(authorizationUrl).searchParams.get("state") as string;
      const code = central.issueCode(authorizationUrl);
      await expectReason(oidc.complete({ state, code, browserBinding: BINDING }), "invalid_identity_token");
    }
  });
});

describe("Central SSO route paths", () => {
  it("uses the academy start and callback paths that Central registers for the application", async () => {
    const { centralSsoProblems, CENTRAL_SSO_START_PATH, CENTRAL_SSO_CALLBACK_PATH } = await import("../config/central-sso");
    expect(CENTRAL_SSO_START_PATH).toBe("/auth/titan/academy/start");
    expect(CENTRAL_SSO_CALLBACK_PATH).toBe("/auth/titan/academy/callback");
    const problems = centralSsoProblems({
      enabled: true, issuer: ISSUER, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET,
      jwksUri: `${ISSUER}/oidc/jwks`, redirectUri: REDIRECT_URI,
    });
    expect(problems).toEqual([]);
    expect(centralSsoProblems({
      enabled: true, issuer: ISSUER, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET,
      jwksUri: `${ISSUER}/oidc/jwks`, redirectUri: "https://academy.test/api/auth/central/callback",
    })).toContain("CENTRAL_SSO_REDIRECT_URI must end with /auth/titan/academy/callback");
  });
});
