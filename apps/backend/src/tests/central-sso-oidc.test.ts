// Central SSO protocol tests: ID token verification, Authorization Code + PKCE, one-use state. No database needed.
import { describe, it, expect, beforeAll } from "vitest";
import { createCentralIdTokenVerifier } from "../modules/auth/central/central-id-token";
import { createCentralOidcClient, sha256Base64url, digestState } from "../modules/auth/central/central-oidc";
import { createMemoryCentralStateStore, createRedisCentralStateStore, type CentralRedisLike } from "../modules/auth/central/central-state";
import { CentralAuthError } from "../modules/auth/central/central-errors";
import {
  ISSUER, CLIENT_ID, CLIENT_SECRET, JWKS_URI, REDIRECT_URI, createSigningKey, createFakeCentral, fetchWithDiscovery, idClaims, signToken,
  type SigningKey, type FakeCentral,
} from "./support/central-sso-fixtures";

const BINDING = "b".repeat(43);
const OTHER_BINDING = "c".repeat(43);
const settings = { issuer: ISSUER, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI };

let key: SigningKey;
beforeAll(() => {
  key = createSigningKey("kid-main");
});

function verifierWith(central: FakeCentral, clock: () => number = Date.now) {
  return createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher, clock });
}

describe("Central ID token verification", () => {
  it("accepts a correctly signed token whose issuer, audience and expiry match", async () => {
    const central = createFakeCentral([key]);
    const claims = await verifierWith(central)(signToken(key, idClaims("n-1")));
    expect(claims.sub).toBe("central-subject-1");
    expect(claims.nonce).toBe("n-1");
  });

  it("rejects algorithms other than RS256, including none and HS256", async () => {
    const verify = verifierWith(createFakeCentral([key]));
    const payload = Buffer.from(JSON.stringify(idClaims("n"))).toString("base64url");
    const none = `${Buffer.from(JSON.stringify({ alg: "none", kid: key.kid })).toString("base64url")}.${payload}.`;
    const hs = signToken(key, idClaims("n"), { alg: "HS256" });
    await expect(verify(none)).rejects.toThrow(CentralAuthError);
    await expect(verify(hs)).rejects.toThrow(CentralAuthError);
  });

  it.each([
    ["wrong issuer", { iss: "https://evil.test" }],
    ["wrong audience", { aud: "another-app" }],
    ["expired", { exp: Math.floor(Date.now() / 1000) - 10 }],
    ["issued in the future", { iat: Math.floor(Date.now() / 1000) + 3600 }],
    ["missing subject", { sub: undefined }],
    ["missing nonce", { nonce: undefined }],
    ["azp naming another client", { azp: "another-app" }],
    ["multiple audiences without this client's azp", { aud: [CLIENT_ID, "other"], azp: "other" }],
  ])("rejects a token with %s", async (_label, overrides) => {
    const verify = verifierWith(createFakeCentral([key]));
    await expect(verify(signToken(key, idClaims("n", overrides)))).rejects.toThrow(CentralAuthError);
  });

  it("rejects a token whose payload was altered after signing", async () => {
    const token = signToken(key, idClaims("n"));
    const [h, , s] = token.split(".");
    const forged = `${h}.${Buffer.from(JSON.stringify(idClaims("n", { sub: "someone-else" }))).toString("base64url")}.${s}`;
    await expect(verifierWith(createFakeCentral([key]))(forged)).rejects.toThrow(CentralAuthError);
  });

  it("rejects an unknown key and refreshes the JWKS at most once per cooldown", async () => {
    let now = 1_000_000;
    const central = createFakeCentral([key]);
    const verify = verifierWith(central, () => now);
    const stranger = createSigningKey("kid-unknown");
    await expect(verify(signToken(stranger, idClaims("n")))).rejects.toThrow(CentralAuthError);
    const afterFirst = central.jwksRequests;
    await expect(verify(signToken(stranger, idClaims("n")))).rejects.toThrow(CentralAuthError);
    expect(central.jwksRequests).toBe(afterFirst);
    now += 31_000;
    await expect(verify(signToken(stranger, idClaims("n")))).rejects.toThrow(CentralAuthError);
    expect(central.jwksRequests).toBeGreaterThan(afterFirst);
  });

  it("accepts a new signing key after rotation once the JWKS publishes it", async () => {
    // Real time, because the signed iat/exp claims are built from the wall clock.
    let now = Date.now();
    const central = createFakeCentral([key]);
    const verify = verifierWith(central, () => now);
    const rotated = createSigningKey("kid-rotated");
    central.setKeys([key, rotated]);
    now += 31_000;
    await expect(verify(signToken(rotated, idClaims("n")))).resolves.toMatchObject({ nonce: "n" });
  });

  it("fails closed when the JWKS endpoint is unavailable or malformed", async () => {
    const failing = (async () => new Response("down", { status: 503 })) as typeof fetch;
    const verify = createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: failing });
    await expect(verify(signToken(key, idClaims("n")))).rejects.toThrow(CentralAuthError);
    const malformed = (async () => new Response(JSON.stringify({ keys: "nope" }), { status: 200 })) as typeof fetch;
    const verify2 = createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: malformed });
    await expect(verify2(signToken(key, idClaims("n")))).rejects.toThrow(CentralAuthError);
  });
});

describe("Central Authorization Code + PKCE client", () => {
  it("builds an authorization request with exact redirect URI, S256 challenge, state and nonce", async () => {
    const store = createMemoryCentralStateStore();
    const oidc = createCentralOidcClient({ settings, store, fetcher: fetchWithDiscovery(async () => { throw new Error("unused"); }), verifyIdToken: async () => { throw new Error("unused"); } });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const url = new URL(authorizationUrl);
    expect(url.origin + url.pathname).toBe(`${ISSUER}/oidc/auth`);
    expect(url.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid profile email");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")?.length).toBe(43);
    expect(url.searchParams.get("nonce")?.length).toBe(43);
    expect(url.searchParams.get("code_challenge")?.length).toBe(43);
    // Only the digest of the state is stored, never the state itself.
    expect(store.size()).toBe(1);
  });

  it("completes a login once: exchanges the code with client credentials and the PKCE verifier", async () => {
    const central = createFakeCentral([key]);
    const store = createMemoryCentralStateStore();
    const oidc = createCentralOidcClient({ settings, store, fetcher: central.fetcher, verifyIdToken: createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher }) });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const state = new URL(authorizationUrl).searchParams.get("state") as string;
    const code = central.issueCode(authorizationUrl);
    await expect(oidc.complete({ state, code, browserBinding: BINDING })).resolves.toEqual({ subject: "central-subject-1", issuer: ISSUER });
    expect(central.tokenRequests).toHaveLength(1);
    expect(central.tokenRequests[0].params.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(central.tokenRequests[0].params.get("grant_type")).toBe("authorization_code");
    // A second use of the same state never reaches the token endpoint.
    await expect(oidc.complete({ state, code, browserBinding: BINDING })).rejects.toMatchObject({ reason: "state_invalid" });
    expect(central.tokenRequests).toHaveLength(1);
  });

  it("refuses a callback from a different browser than the one that started the login", async () => {
    const central = createFakeCentral([key]);
    const store = createMemoryCentralStateStore();
    const oidc = createCentralOidcClient({ settings, store, fetcher: central.fetcher, verifyIdToken: createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher }) });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const state = new URL(authorizationUrl).searchParams.get("state") as string;
    const code = central.issueCode(authorizationUrl);
    await expect(oidc.complete({ state, code, browserBinding: OTHER_BINDING })).rejects.toMatchObject({ reason: "state_invalid" });
    expect(central.tokenRequests).toHaveLength(0);
  });

  it("refuses an expired state without exchanging the code", async () => {
    let now = 5_000_000;
    const central = createFakeCentral([key]);
    const store = createMemoryCentralStateStore(() => now);
    const oidc = createCentralOidcClient({ settings, store, clock: () => now, stateTtlMs: 60_000, fetcher: central.fetcher, verifyIdToken: createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher, clock: () => now }) });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const state = new URL(authorizationUrl).searchParams.get("state") as string;
    const code = central.issueCode(authorizationUrl);
    now += 61_000;
    await expect(oidc.complete({ state, code, browserBinding: BINDING })).rejects.toMatchObject({ reason: "state_invalid" });
    expect(central.tokenRequests).toHaveLength(0);
  });

  it("maps token endpoint failures to distinct, non-sensitive reasons", async () => {
    const central = createFakeCentral([key]);
    const store = createMemoryCentralStateStore();
    const verifyIdToken = createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher });
    const oidc = createCentralOidcClient({ settings, store, fetcher: central.fetcher, verifyIdToken });
    const attempt = async () => {
      const { authorizationUrl } = await oidc.begin(BINDING);
      const state = new URL(authorizationUrl).searchParams.get("state") as string;
      return { state, code: central.issueCode(authorizationUrl) };
    };
    central.tokenStatus = 400;
    await expect(oidc.complete({ ...(await attempt()), browserBinding: BINDING })).rejects.toMatchObject({ reason: "token_exchange_rejected" });
    central.tokenStatus = 200;
    const unreachable = createCentralOidcClient({ settings, store, verifyIdToken, fetcher: fetchWithDiscovery(async () => { throw new Error("socket reset"); }) });
    await expect(unreachable.complete({ ...(await attempt()), browserBinding: BINDING })).rejects.toMatchObject({ reason: "token_exchange_unavailable" });
  });

  it("refuses a token response that is not a Bearer token with an ID token", async () => {
    const central = createFakeCentral([key]);
    const store = createMemoryCentralStateStore();
    const verifyIdToken = createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher });
    const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/oidc/token")) return new Response(JSON.stringify({ id_token: "x.y.z", token_type: "mac" }), { status: 200 });
      return central.fetcher(input, init);
    }) as typeof fetch;
    const oidc = createCentralOidcClient({ settings, store, fetcher, verifyIdToken });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const state = new URL(authorizationUrl).searchParams.get("state") as string;
    await expect(oidc.complete({ state, code: "anything", browserBinding: BINDING })).rejects.toMatchObject({ reason: "invalid_token_response" });
  });

  it("refuses an ID token whose nonce belongs to another login", async () => {
    const central = createFakeCentral([key]);
    const store = createMemoryCentralStateStore();
    const oidc = createCentralOidcClient({ settings, store, fetcher: central.fetcher, verifyIdToken: createCentralIdTokenVerifier({ issuer: ISSUER, clientId: CLIENT_ID, jwksUri: JWKS_URI, fetcher: central.fetcher }) });
    const { authorizationUrl } = await oidc.begin(BINDING);
    const state = new URL(authorizationUrl).searchParams.get("state") as string;
    const code = central.issueCode(authorizationUrl, { idTokenClaims: idClaims("someone-elses-nonce") });
    await expect(oidc.complete({ state, code, browserBinding: BINDING })).rejects.toMatchObject({ reason: "nonce_mismatch" });
  });

  it("rejects malformed state, binding and code values before touching the store", async () => {
    const store = createMemoryCentralStateStore();
    const oidc = createCentralOidcClient({ settings, store, fetcher: fetchWithDiscovery(async () => { throw new Error("unused"); }), verifyIdToken: async () => { throw new Error("unused"); } });
    await expect(oidc.complete({ state: "short", code: "c", browserBinding: BINDING })).rejects.toMatchObject({ reason: "state_invalid" });
    await expect(oidc.begin("too-short")).rejects.toMatchObject({ reason: "binding_invalid" });
  });
});

describe("Central login state stores", () => {
  it("memory store consumes a state exactly once and expires it", async () => {
    let now = 0;
    const store = createMemoryCentralStateStore(() => now);
    const record = { nonce: "n", verifier: "v", bindingHash: "h", expiresAt: 100 };
    await store.save(digestState("s1"), record, 100);
    await expect(store.consume(digestState("s1"))).resolves.toEqual(record);
    await expect(store.consume(digestState("s1"))).resolves.toBeNull();
    await store.save(digestState("s2"), record, 100);
    now = 101;
    await expect(store.consume(digestState("s2"))).resolves.toBeNull();
  });

  it("redis store writes with NX and reads with GETDEL, so a state is single use across instances", async () => {
    const data = new Map<string, string>();
    const redis: CentralRedisLike = {
      set: async (k, v) => (data.has(k) ? null : (data.set(k, v), "OK")),
      getdel: async (k) => {
        const v = data.get(k) ?? null;
        data.delete(k);
        return v;
      },
    };
    const store = createRedisCentralStateStore(redis);
    const record = { nonce: "n", verifier: "v", bindingHash: sha256Base64url("b"), expiresAt: Date.now() + 60_000 };
    await store.save("d1", record, 60_000);
    await expect(store.save("d1", record, 60_000)).rejects.toThrow(/collision/);
    await expect(store.consume("d1")).resolves.toEqual(record);
    await expect(store.consume("d1")).resolves.toBeNull();
  });
});
