# Skilled Central SSO: contract alignment note (issue #155)

Scope: `lms-main/apps/backend/src/modules/auth/central/` compared with Central's OIDC login
(`apps/control-api/src/oidc-login.mjs`, `oidc-id-token.mjs`, `oidc-http-adapter.mjs`) and Central's route
registry (`packages/control-plane/src/applications.ts`). Central's link verifier
(`packages/control-plane/src/link-assertion.ts`) is covered by issue #163, not by this module.

## Aligned in this change

| Area | Central | Skilled before | Skilled now |
| --- | --- | --- | --- |
| Authorization and token endpoints | Read only from `{issuer}/.well-known/openid-configuration`; never derived from the issuer path | Derived as `oidc/auth` and `oidc/token` from the issuer | Read from discovery; exact issuer match; endpoints must share the issuer origin, be https, and carry no credentials, query or fragment; no redirects; body capped at 64 KiB; successes cached 5 minutes, failures not cached |
| Route paths | `/auth/titan/{app}/start` and `/callback` (`oidcStartPath`, `oidcCallbackPath`) | `config/central-sso.ts` used `/api/auth/central/*`, so the redirect URI check rejected the real callback | `/auth/titan/academy/start` and `/auth/titan/academy/callback` |
| Token response | Requires `id_token`, `access_token` and `token_type` `Bearer` | Did not require `access_token` | Requires all three |
| After ID-token verification | `nonce`, `iss`, `aud` and `exp` checked again in the login flow | Only `nonce` checked in the login flow (verifier checked the rest) | `nonce`, `iss`, `aud` and `exp` checked again |
| State consumed before network | Yes | Yes | Yes (unchanged) |
| Browser binding checked before token call | Yes | Yes | Yes (unchanged) |
| ID-token signing key source | Configured JWKS URI only, never the token or discovery | Configured JWKS URI | Unchanged |

Tests: `src/tests/central-oidc-discovery-alignment.test.ts`. The existing OIDC tests now serve discovery
from the fake provider (`src/tests/support/central-sso-fixtures.ts`).

## Deliberate differences (kept)

| Area | Central | Skilled | Reason |
| --- | --- | --- | --- |
| State key at rest | Raw state is the store key | SHA-256 digest of the state is the store key | The state is never stored in readable form. Lookup and one-use semantics are the same. |
| Browser binding format | Signed token, at least 32 characters | 43-character base64url value | Skilled generates its own binding cookie. Stricter, and only Skilled reads it. |
| `sub` and `nonce` length | No cap on `sub` | `sub` at most 255 characters, `nonce` at most 512 | Stricter input bounds. Central's real subjects are far shorter. |

## Open

- Central's shared test fixtures (Central issue #71) are not yet in Central's tree. Skilled's
  `src/tests/support/central-sso-fixtures.ts` is a hand-built stand-in. Replace it when the fixtures merge.
- Central's `oidc-login.mjs` accepts an `aud` array that contains the client ID. The ID-token verifier
  requires `azp` for that case. Skilled's verifier does the same, so the flow matches.
