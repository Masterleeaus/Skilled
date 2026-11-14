# Cookies and CSRF (issue #171)

## Where cookie settings live

Every cookie the backend sets through Express goes through `apps/backend/src/utils/cookie-options.ts`:

- `cookieOptions({ ... })` for `res.cookie`
- `clearCookieOptions({ ... })` for `res.clearCookie`

Callers pass only what differs: `path`, `sameSite`, `secure` (when a route is HTTPS-only), and `maxAgeMs`. Cookie names and lifetimes are set by each caller and are not changed by the helper.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| `httpOnly` | always `true` | No browser script may read a session credential. |
| `secure` | `true` when `NODE_ENV=production`, otherwise `false` | Keeps local http development working. HTTPS-only routes (Central SSO) pass `secure: true` explicitly. |
| `sameSite` | `"lax"` | `"strict"` only where the cookie is never needed on a cross-site navigation. |
| `path` | `"/"` | Narrowed only where a route family needs it. |
| `maxAge` | set by caller | Never passed to `clearCookie`. |

### Cookies in use

| Cookie | Set by | Path | SameSite | Secure | Lifetime |
| --- | --- | --- | --- | --- | --- |
| `refreshToken` (email/password login and refresh) | `auth.controller.ts` | `/` | lax | production only | 30 days (unchanged) |
| `refreshToken` (Central SSO session) | `central/central-routes.ts` | `/api/auth` | lax | always | token expiry (unchanged) |
| `titan_central_sso_binding` | `central/central-routes.ts` | `/auth/titan/academy/callback` | lax | always | 5 minutes (unchanged) |
| `academyPlayback` (video grant) | `courses/module.routes.ts` | per-lesson stream path | strict | production only | 1 hour (unchanged) |
| `academy_sid` (Central session), OIDC binding cookies (string-built) | `auth/central-session-cookie.ts`, `auth/central-oidc-browser-binding.ts`, `auth/central-browser-lifecycle.ts` | `/` or `/auth/titan/academy` | lax | always | unchanged |

The string-built Central cookies are not routed through the Express helper. They are serialized by hand and their exact format is pinned by regular-expression checks and tests, so they already match this policy (`HttpOnly; Secure; SameSite=Lax`).

## Known inconsistency (not changed here)

The email/password `refreshToken` cookie uses path `/`. The Central SSO `refreshToken` cookie uses path `/api/auth`. Both share a name, so a browser can hold two of them. Changing either path would invalidate existing sessions, so this is recorded as follow-up work and not changed in this PR.

## CSRF decision

**Decision: accepted, relying on `SameSite=Lax` and credentialed CORS. No CSRF token.**

Reasoning:

1. The only cookie-authenticated endpoints are `POST /api/auth/refresh`, `POST /api/auth/logout` and the Central browser endpoints that already validate a state/binding. All of them are POST or validated callbacks.
2. `authenticate` reads only the `Authorization` bearer header. A cookie alone cannot call any protected API, so a forged request cannot act as the user on course, payment or admin routes.
3. `SameSite=Lax` stops browsers from attaching the refresh cookie to cross-site `POST`, iframe and `fetch` requests. A cross-site page cannot refresh or log out the victim's session. Lax is kept (not strict) so the cookie survives the top-level redirect back from Central SSO.
4. No state-changing `GET` reads a cookie. The playback grant (`GET` stream) and the Central callback (`GET`, validated by state and binding) are read-only or validated. The Central session endpoint has no `GET` logout ("no GET logout/CSRF side effect" in `central-session-http.ts`).
5. CORS is `origin: CLIENT_URL` with `credentials: true`, with no wildcard. A cross-origin page cannot read responses even if a request were sent.

Residual risk: a same-site attacker (for example, a compromised sibling subdomain) bypasses SameSite. That is outside this decision and is covered by the subdomain and XSS controls, not by CSRF tokens.

Stronger check considered and not added: a double-submit or custom-header requirement on `/api/auth/refresh`. The code has none today. Adding one would break the Central SSO mount-time refresh unless the frontend is updated in step, and the SameSite control already covers the threat. Revisit this if the frontend and API move to different sites.

## Deployment requirement

SameSite=Lax cookies are sent on cross-site `fetch` only if the frontend and API are the same site (same registrable domain). If `CLIENT_URL` and the API are split across unrelated domains, the refresh cookie will not be sent and sessions will fail. Keep them on one site, or revisit this decision before splitting them.
