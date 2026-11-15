/**
 * Central SSO settings (Logto via Titan Central). Pure validation: no environment access and no network I/O,
 * so env.ts and the auth modules can share it. The feature flag CENTRAL_SSO_ENABLED is OFF by default; when it
 * is off, no setting is required and nothing here affects the existing email/password login.
 */
// Exact route paths from Central's applications registry (packages/control-plane/src/applications.ts):
// oidcStartPath('academy') and oidcCallbackPath('academy'). The redirect URI registered in Central must end with the callback path.
export const CENTRAL_SSO_START_PATH = "/auth/titan/academy/start";
export const CENTRAL_SSO_CALLBACK_PATH = "/auth/titan/academy/callback";

export interface CentralSsoSettings {
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
  jwksUri: string;
  /** Exact redirect URI registered with the identity provider. Must end with CENTRAL_SSO_CALLBACK_PATH. */
  redirectUri: string;
  /** LMS audience from the Central operator (CENTRAL_LMS_AUDIENCE). Required when enabled. */
  audience?: string;
}

/** Exact audience value is operator-supplied. Printable, no whitespace, bounded length. */
export function isValidAudience(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200 && /^[\x21-\x7e]+$/.test(value);
}

/** https only, no userinfo, query or fragment. Local http is deliberately not accepted for this flow. */
export function isPlainHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

/** Returns human-readable problems. Empty when the flag is off or every required setting is valid. */
export function centralSsoProblems(settings: CentralSsoSettings): string[] {
  if (!settings.enabled) return [];
  const problems: string[] = [];
  if (!isPlainHttpsUrl(settings.issuer)) problems.push("CENTRAL_SSO_ISSUER must be an exact https URL");
  if (!isPlainHttpsUrl(settings.jwksUri)) problems.push("CENTRAL_SSO_JWKS_URI must be an exact https URL");
  if (!isPlainHttpsUrl(settings.redirectUri)) {
    problems.push("CENTRAL_SSO_REDIRECT_URI must be an exact https URL");
  } else if (new URL(settings.redirectUri).pathname !== CENTRAL_SSO_CALLBACK_PATH) {
    problems.push(`CENTRAL_SSO_REDIRECT_URI must end with ${CENTRAL_SSO_CALLBACK_PATH}`);
  }
  if (!settings.clientId || settings.clientId.length > 200) problems.push("CENTRAL_SSO_CLIENT_ID is required");
  if (!isValidAudience(settings.audience)) problems.push("CENTRAL_LMS_AUDIENCE is required (printable, no spaces, max 200)");
  if (settings.clientSecret.length < 16 || settings.clientSecret.length > 512) {
    problems.push("CENTRAL_SSO_CLIENT_SECRET must be 16 to 512 characters");
  }
  return problems;
}
