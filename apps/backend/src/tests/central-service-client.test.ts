import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createCentralServiceClient,
  loadCentralServiceConfig,
  CentralServiceError,
} from "../modules/central/central-service-client";

// Fakes only. Nothing here reaches a real Central, Logto or JWKS.
const ISSUER = "https://central.test";
const AUDIENCE = "urn:test:product:lms";
const CLIENT_ID = "skilled-service-test";
const CLIENT_SECRET = "service-secret-for-tests-only-0123456789";
const DISCOVERY = ISSUER + "/.well-known/openid-configuration";
const TOKEN_URL = ISSUER + "/oidc/token";

const b64u = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (claims: Record<string, unknown>) => `${b64u({ alg: "RS256", kid: "test" })}.${b64u(claims)}.c2lnbmF0dXJl`;
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

interface Script {
  nowMs: number;
  audience?: string;
  expiresIn?: number;
  /** Seconds from now until the token's exp claim. Negative values produce an already-expired token. */
  expOffsetSeconds?: number;
  tokenStatus?: number;
  opaqueToken?: boolean;
  omitExpiresIn?: boolean;
  apiStatus?: number;
}

function fakeCentral(script: Script, clock: { now: number }) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let issued = 0;
  const fetcher = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url === DISCOVERY) {
      return json({ issuer: ISSUER, authorization_endpoint: ISSUER + "/oidc/auth", token_endpoint: TOKEN_URL });
    }
    if (url === TOKEN_URL) {
      if (script.tokenStatus !== undefined && script.tokenStatus !== 200) return new Response("denied", { status: script.tokenStatus });
      issued += 1;
      const nowSeconds = Math.floor(clock.now / 1000);
      const expiresIn = script.expiresIn ?? 3600;
      const accessToken = script.opaqueToken
        ? "opaque-token-value-without-jwt-structure"
        : jwt({
            iss: ISSUER,
            aud: script.audience ?? AUDIENCE,
            sub: CLIENT_ID,
            exp: nowSeconds + (script.expOffsetSeconds ?? expiresIn),
          });
      const body: Record<string, unknown> = { access_token: accessToken, token_type: "Bearer" };
      if (!script.omitExpiresIn) body.expires_in = expiresIn;
      return json(body);
    }
    if (url.startsWith(ISSUER + "/v1/")) return json({ ok: true }, script.apiStatus ?? 200);
    return new Response("not found", { status: 404 });
  });
  return { fetcher, calls, issued: () => issued };
}

const config = {
  issuer: ISSUER,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  audience: AUDIENCE,
};

function clientFor(script: Script, clock: { now: number }) {
  const central = fakeCentral(script, clock);
  const client = createCentralServiceClient({
    config,
    fetcher: central.fetcher as unknown as typeof fetch,
    clock: () => clock.now,
    refreshSkewMs: 60_000,
  });
  return { client, central };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("central service configuration (#209)", () => {
  it("names every missing variable and never echoes a value", () => {
    let message = "";
    try {
      loadCentralServiceConfig({ CENTRAL_SERVICE_CLIENT_SECRET: "tiny-x" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("CENTRAL_SSO_ISSUER");
    expect(message).toContain("CENTRAL_SERVICE_CLIENT_ID");
    expect(message).toContain("CENTRAL_LMS_AUDIENCE");
    expect(message).toContain("CENTRAL_SERVICE_CLIENT_SECRET");
    expect(message).not.toContain("tiny-x");
  });

  it("loads a complete, valid configuration from the environment", () => {
    expect(
      loadCentralServiceConfig({
        CENTRAL_SSO_ISSUER: ISSUER,
        CENTRAL_SERVICE_CLIENT_ID: CLIENT_ID,
        CENTRAL_SERVICE_CLIENT_SECRET: CLIENT_SECRET,
        CENTRAL_LMS_AUDIENCE: AUDIENCE,
      }),
    ).toEqual(config);
  });

  it("refuses a non-https issuer", () => {
    expect(() =>
      loadCentralServiceConfig({
        CENTRAL_SSO_ISSUER: "http://central.test",
        CENTRAL_SERVICE_CLIENT_ID: CLIENT_ID,
        CENTRAL_SERVICE_CLIENT_SECRET: CLIENT_SECRET,
        CENTRAL_LMS_AUDIENCE: AUDIENCE,
      }),
    ).toThrow(/CENTRAL_SSO_ISSUER/);
  });
});

describe("central service client-credentials token (#209)", () => {
  it("requests a client-credentials token for the LMS audience with Basic client authentication", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now }, clock);
    const token = await client.getAccessToken();
    expect(token.split(".")).toHaveLength(3);
    const tokenCall = central.calls.find((c) => c.url === TOKEN_URL);
    expect(tokenCall).toBeDefined();
    const headers = tokenCall!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"));
    const form = new URLSearchParams(String(tokenCall!.init.body));
    expect(form.get("grant_type")).toBe("client_credentials");
    expect(form.get("audience")).toBe(AUDIENCE);
    expect(form.has("client_secret")).toBe(false);
    expect(tokenCall!.init.redirect).toBe("error");
  });

  it("takes the token endpoint from discovery and never hard-codes it", async () => {
    const clock = { now: 1_900_000_000_000 };
    const central = fakeCentral({ nowMs: clock.now }, clock);
    const alternate = ISSUER + "/custom/token-endpoint";
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === DISCOVERY) return json({ issuer: ISSUER, authorization_endpoint: ISSUER + "/a", token_endpoint: alternate });
      if (url === alternate) return central.fetcher(TOKEN_URL, init);
      return central.fetcher(url, init);
    });
    const client = createCentralServiceClient({ config, fetcher: fetcher as unknown as typeof fetch, clock: () => clock.now });
    await client.getAccessToken();
    expect(fetcher.mock.calls.map((c) => c[0])).toContain(alternate);
    expect(fetcher.mock.calls.map((c) => c[0])).not.toContain(TOKEN_URL);
  });

  it("caches the token and does not fetch again while it is fresh", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now, expiresIn: 3600 }, clock);
    const first = await client.getAccessToken();
    clock.now += 10_000;
    const second = await client.getAccessToken();
    expect(second).toBe(first);
    expect(central.issued()).toBe(1);
  });

  it("refreshes before expiry, keeping the skew window", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now, expiresIn: 3600 }, clock);
    await client.getAccessToken();
    clock.now += 3_539_000; // still outside the 60 second skew window
    await client.getAccessToken();
    expect(central.issued()).toBe(1);
    clock.now += 2_000; // inside the window: refresh now, before the token expires
    await client.getAccessToken();
    expect(central.issued()).toBe(2);
  });

  it("shares one token request between concurrent callers", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now }, clock);
    const tokens = await Promise.all([client.getAccessToken(), client.getAccessToken(), client.getAccessToken()]);
    expect(new Set(tokens).size).toBe(1);
    expect(central.issued()).toBe(1);
  });

  it("refuses a token for another product and does not cache it", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now, audience: "urn:titan-central:product:other" }, clock);
    await expect(client.getAccessToken()).rejects.toMatchObject({ reason: "audience_mismatch" });
    await expect(client.getAccessToken()).rejects.toBeInstanceOf(CentralServiceError);
    expect(central.issued()).toBe(2);
  });

  it("refuses an already expired token", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client } = clientFor({ nowMs: clock.now, expOffsetSeconds: -5 }, clock);
    await expect(client.getAccessToken()).rejects.toMatchObject({ reason: "token_expired" });
  });

  it("refuses an opaque token it cannot check", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client } = clientFor({ nowMs: clock.now, opaqueToken: true }, clock);
    await expect(client.getAccessToken()).rejects.toMatchObject({ reason: "invalid_token_response" });
  });

  it("refuses a response without expires_in", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client } = clientFor({ nowMs: clock.now, omitExpiresIn: true }, clock);
    await expect(client.getAccessToken()).rejects.toMatchObject({ reason: "invalid_token_response" });
  });

  it("does not cache a failed token request", async () => {
    const clock = { now: 1_900_000_000_000 };
    const script: Script = { nowMs: clock.now, tokenStatus: 500 };
    const { client, central } = clientFor(script, clock);
    await expect(client.getAccessToken()).rejects.toMatchObject({ reason: "token_rejected" });
    script.tokenStatus = 200;
    await expect(client.getAccessToken()).resolves.toEqual(expect.any(String));
    expect(central.issued()).toBe(1);
  });

  it("never writes token contents to the console", async () => {
    const spies = ["log", "info", "warn", "error", "debug"].map((level) =>
      vi.spyOn(console, level as "log").mockImplementation(() => undefined),
    );
    const clock = { now: 1_900_000_000_000 };
    const { client } = clientFor({ nowMs: clock.now }, clock);
    const token = await client.getAccessToken();
    await client.request({ method: "GET", path: "/v1/example" });
    for (const spy of spies) {
      for (const call of spy.mock.calls) expect(JSON.stringify(call)).not.toContain(token);
    }
  });
});

describe("central service API calls (#209)", () => {
  it("sends the bearer token on the Central origin with no tenant parameters", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now }, clock);
    const response = await client.request({ method: "GET", path: "/v1/example", query: { limit: "5" } });
    expect(response.status).toBe(200);
    const apiCall = central.calls.find((c) => c.url.startsWith(ISSUER + "/v1/example"));
    expect(apiCall!.url).toBe(ISSUER + "/v1/example?limit=5");
    const headers = apiCall!.init.headers as Record<string, string>;
    expect(headers.authorization).toMatch(/^Bearer [^ ]+$/);
    expect(apiCall!.init.redirect).toBe("error");
  });

  it("refuses organisation, tenant and cohort parameters in the query before any network call", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now }, clock);
    const refused: Array<Record<string, string>> = [{ organisation_id: "x" }, { organisationId: "x" }, { tenant: "x" }, { cohort_id: "x" }];
    for (const query of refused) {
      await expect(client.request({ method: "GET", path: "/v1/example", query })).rejects.toMatchObject({
        reason: "tenant_parameter_refused",
      });
    }
    expect(central.calls.some((c) => c.url.startsWith(ISSUER + "/v1/"))).toBe(false);
    expect(central.issued()).toBe(0);
  });

  it("refuses tenant parameters nested anywhere in the body", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now }, clock);
    await expect(
      client.request({ method: "POST", path: "/v1/example", body: { filter: { tenant: "x" } } }),
    ).rejects.toMatchObject({ reason: "tenant_parameter_refused" });
    await expect(
      client.request({ method: "POST", path: "/v1/example", body: [{ organisation_id: "x" }] }),
    ).rejects.toMatchObject({ reason: "tenant_parameter_refused" });
    expect(central.calls.some((c) => c.url.startsWith(ISSUER + "/v1/"))).toBe(false);
  });

  it("allows a POST body without tenant keys", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client, central } = clientFor({ nowMs: clock.now }, clock);
    await client.request({ method: "POST", path: "/v1/example", body: { learnerRef: "abc" } });
    const apiCall = central.calls.find((c) => c.url === ISSUER + "/v1/example");
    expect(apiCall!.init.body).toBe(JSON.stringify({ learnerRef: "abc" }));
  });

  it("rejects paths that are absolute, protocol-relative or carry a query", async () => {
    const clock = { now: 1_900_000_000_000 };
    const { client } = clientFor({ nowMs: clock.now }, clock);
    for (const path of ["https://evil.test/v1/x", "//evil.test/v1/x", "/v1/x?organisation_id=1"]) {
      await expect(client.request({ method: "GET", path })).rejects.toMatchObject({ reason: "invalid_request" });
    }
  });

  it("drops the cached token after a 401 so the next call fetches a new one", async () => {
    const clock = { now: 1_900_000_000_000 };
    const script: Script = { nowMs: clock.now, apiStatus: 401 };
    const { client, central } = clientFor(script, clock);
    await client.request({ method: "GET", path: "/v1/example" });
    script.apiStatus = 200;
    await client.request({ method: "GET", path: "/v1/example" });
    expect(central.issued()).toBe(2);
  });
});
