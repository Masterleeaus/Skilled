# Central SSO adapter (Skilled / Titan Academy side)

Issue #71. Skilled can accept a Titan Central (Logto) sign-in and open a Skilled-local session for an
existing, linked account. This is source-complete and tested against fakes. It is **not** a live cutover.

## Status

- Feature flag `CENTRAL_SSO_ENABLED` is **OFF by default**. With the flag off, no Central code is mounted or
  reachable, and the email/password login is unchanged (covered by `src/tests/central-sso-flow.test.ts`).
- The existing email/password login stays available and is the rollback path.
- No live Logto, Titan Central database or three-app journey was exercised from this repository. See
  "Verified and unverified" below.

## How it fits together

| Piece | Location (under `apps/backend/src`) | Role |
|---|---|---|
| Settings and validation | `config/central-sso.ts`, `config/env.ts` | Flag and required settings. Refuses to start when enabled and incomplete. |
| ID token verification | `modules/auth/central/central-id-token.ts` | RS256 only, fixed issuer and audience, JWKS from config. |
| Authorization Code + PKCE | `modules/auth/central/central-oidc.ts` | Per-login state, nonce and S256 verifier. One-use state. Token exchange with client credentials. |
| One-use state store | `modules/auth/central/central-state.ts` | Redis `SET NX PX` and `GETDEL`. In-memory double for tests only. |
| Identity link and resolution | `modules/auth/central/central-link.ts` | Verified link between a Central subject and a Skilled account. |
| Browser routes | `modules/auth/central/central-routes.ts` | `GET /api/auth/central/start` and `GET /api/auth/central/callback`. |
| Mount | `modules/auth/central/central-sso.mount.ts`, called from `app.ts` | Mounts only when the flag is on. |

### Mapping model (no migration)

The verified mapping uses the existing `AcademyExternalIdentity` model (`academy_external_identities`) and `Company.externalRef` (`academy_companies`):

- `service` = `titan-central`
- `externalUserRef` = the Logto `sub` of the individual
- `userId` = the Skilled `users.id` of the learner, assessor, manager or owner
- `companyId` = the Skilled company whose `externalRef` is the verified Central organisation reference

The table is unique on `(service, externalUserRef)`, so one Central subject links to one Skilled account
in one organisation. Unlink deletes the row. Relink creates a new row.

No migration was added. The existing model already expresses the mapping, so the drift check was not run
(`prisma validate` passes with the unchanged schema).

Login never grants a role. It resolves the subject and then Skilled's own checks apply: `User.role` is read
from the database on every authenticated request, and `CompanyMember.role` is read at each use.

## Login flow

1. `GET /api/auth/central/start` creates a random binding, stores `{nonce, verifier, bindingHash}` under the
   SHA-256 digest of a random `state` with a 5 minute TTL, sets the binding cookie, and redirects (302) to the
   Central authorize endpoint with `response_type=code`, `scope=openid profile email`, `code_challenge_method=S256`.
2. Central redirects to `GET /api/auth/central/callback?state=…&code=…`.
3. The callback accepts only `state`, `code`, `error` and `error_description`, each once. It requires the binding
   cookie. It consumes the state atomically (one use) and checks expiry and the binding hash. It makes no network
   call before that.
4. Token exchange: `POST {issuer}/oidc/token` with HTTP Basic client credentials, `redirect_uri` and `code_verifier`.
5. The ID token is verified (signature from JWKS, `iss`, `aud`, `azp`, `iat`, `exp`, `nbf`, `sub`, and `nonce` equal
   to the stored nonce).
6. `resolveCentralLogin` finds exactly one link for the subject, requires a scoped link, the company's `externalRef`,
   an active `CompanyMember` row for that company and user, and an eligible account (active, email verified,
   not deleted). Any other result denies.
7. On success the callback creates an ordinary refresh session (`refresh_tokens`, hashed), sets the `refreshToken`
   cookie (`HttpOnly; Secure; SameSite=Lax; Path=/api/auth`), clears the binding cookie, and redirects (303) to
   `CLIENT_URL`. The frontend's existing mount-time `POST /auth/refresh` turns the cookie into an access token. No
   token appears in a URL.

Denied decisions return `403 account_not_authorised` and write an audit row. Protocol failures return `401 login_failed`.
Neither response reveals whether a Skilled account exists.

## Callback configuration

| Setting | Value |
|---|---|
| Registered redirect URI | `https://<academy-api-origin>/api/auth/central/callback` (exact string, https, no query) |
| Path in code | `/api/auth/central/callback`. Validation refuses any redirect URI that does not end with this path. |
| Client type | Confidential (client secret, Basic authentication at the token endpoint) |
| Grant and PKCE | `authorization_code` with `S256` |
| Scopes | `openid profile email` |
| Post-logout | Not implemented. Logout is local only (see Limitations). |

**Conflict to resolve before registration.** The Central documents disagree with each other and with the Central
adapter code:

- `PASS05_APPLICATION_REGISTRATION.md`, `PASS06_SSO_REGISTRATION_GATE.md` and `PASS08` name
  `https://academy.titanzero.io/auth/callback`.
- `apps/control-api/src/oidc-http-adapter.mjs` uses `/auth/titan/academy/callback`.
- `packages/control-plane/src/applications.ts` records `/auth/callback`.

Skilled implements `/api/auth/central/callback`, which matches none of them. The owner must choose one path, and
the Central registration and this code must then agree. Changing the path means changing
`CENTRAL_SSO_CALLBACK_PATH` in `config/central-sso.ts`.

## Configuration

| Variable | Required when enabled | Notes |
|---|---|---|
| `CENTRAL_SSO_ENABLED` | - | `true` to enable. Default `false`. |
| `CENTRAL_SSO_ISSUER` | yes | Exact https issuer URL. No query, fragment or credentials. |
| `CENTRAL_SSO_CLIENT_ID` | yes | Skilled's OIDC application ID. |
| `CENTRAL_SSO_CLIENT_SECRET` | yes | 16 to 512 characters. Secret store only. Never in a ZIP, repository or browser. |
| `CENTRAL_SSO_JWKS_URI` | yes | Exact https JWKS URL. Set explicitly; the JWKS path is not assumed. |
| `CENTRAL_SSO_REDIRECT_URI` | yes | Exact registered callback URI (see above). |

With the flag on and any value invalid, the service fails at startup. It does not start half-configured.

Also required and already present: `CLIENT_URL` (post-login destination), `DATABASE_URL`, `REDIS_URL` (state
store), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

## Creating and removing links

Links are written only by trusted operator code. No HTTP route writes them.

- `linkCentralIdentity(db, { subject, organisationRef, userId })` returns `created` or `already_linked`. It refuses
  an unknown organisation, a user with no membership in it, and any conflicting link (`conflicting_link`).
- `unlinkCentralIdentity(db, { subject, organisationRef, userId })` deletes the link, revokes **every** refresh
  session of that user in the same transaction, and returns `sessionsRevoked`.

Each operation writes an `academy_integration_audit` row (`CENTRAL_LINK_CREATED`, `CENTRAL_LINK_CONFIRMED`,
`CENTRAL_LINK_REVOKED`). How operators invoke these functions (a reviewed wrapper, or none) is an owner decision.

## Monitoring

Audit rows (`academy_integration_audit`, `service = 'titan-central'`):

| Outcome | Meaning |
|---|---|
| `CENTRAL_LOGIN_SUCCEEDED` | Session created. `companyRef` = organisation reference. |
| `CENTRAL_LOGIN_DENIED_<REASON>` | Verified identity, denied. Reasons: `NOT_LINKED`, `LINK_AMBIGUOUS`, `LINK_UNSCOPED`, `ORGANISATION_MISSING`, `MEMBERSHIP_MISSING`, `ACCOUNT_INACTIVE`. |
| `CENTRAL_LINK_CREATED` / `CENTRAL_LINK_CONFIRMED` / `CENTRAL_LINK_REVOKED` | Link lifecycle. |

Structured logs (`component: central-sso`): `central_login_rejected`, `central_login_failed`, `central_login_denied`,
`central_login_succeeded`, `central_login_begin_failed`. Each carries only a reason or outcome, never a token, code
or state. The audit rows do record the Central subject (`externalUserRef`), as the existing provisioning audit does.

Suggested alerts: a sustained rise in `CENTRAL_LOGIN_DENIED_*` or `central_login_failed` (possible misconfigured
client or JWKS), any `LINK_AMBIGUOUS` or `LINK_UNSCOPED` row (should never occur), and any 503 from `/start` (state store down).

## Rollback

1. Set `CENTRAL_SSO_ENABLED=false` and restart the API. The Central routes stop mounting and return 404. The
   email/password login was never changed.
2. Optional: revoke Central-origin sessions. Sessions are not tagged by origin, so either unlink each linked
   subject with `unlinkCentralIdentity` (revokes that user's sessions) or let them expire (`JWT_REFRESH_EXPIRES`).
3. Links are kept by default. Remove them only with a reviewed plan.
4. No schema change to reverse. No migration was added.

Access tokens already issued remain valid until `JWT_ACCESS_EXPIRES` (15 minutes by default). Revoking the
refresh session is what ends a session. This is existing behaviour of the email/password login.

## Verified and unverified

Verified against the read-only Central repository (commit `be6544f`), in source only:

- Authorization Code + PKCE S256, exact redirect URI, state and nonce, backend sessions, HttpOnly cookies (`PASS06`, `PASS08`).
- Issuer and audience validation, RS256, JWKS from configuration, `azp` rules (`apps/control-api/src/oidc.mjs`, `oidc-id-token.mjs`).
- Endpoint paths `oidc/auth` and `oidc/token`, client Basic authentication, `openid profile email` scope (`oidc-login.mjs`).
- Session cookie attributes and the no-GET-logout rule (`oidc-app-session.mjs`).
- Central membership role vocabulary (`migrations/0001_control_plane_draft.sql`) and the academy actions list (`packages/control-plane/src/applications.ts`). Central's access decision is described in `access.ts`.
- Skilled behaviour is covered by tests against the in-memory Prisma double and generated RSA keys. The real-PostgreSQL suite
  `src/tests/central-sso-db.test.ts` is written but was **skipped** here, because PostgreSQL and Redis are not running in this session.

**Unverified against Central (do not treat as confirmed):**

- Any live Logto endpoint, discovery document, JWKS path, key rotation behaviour, or token format.
- Whether Logto's ID token contains organisation claims. Skilled does not read any, and it does not trust one.
- Central's `CentralAccessService.authorise` decision. Skilled does not call it, because no service-to-service endpoint is verified.
  Skilled's organisation scope therefore comes from its own verified link table, not from a live Central check at login.
- Central's `titan.local_account_links` ledger. Central keeps its own per-application local account IDs. Skilled
  keeps its own identity table. Whether these are reconciled is unverified.
- Central global (RP-initiated) logout. Central's source has `oidc-global-logout.mjs`, but its own deployment runbook says global logout is not implemented.

## Limitations (owner decisions before any cutover)

1. **Callback path conflict** (see above).
2. **One organisation per Central subject.** The unique key means a subject cannot link to two Skilled companies.
   Choosing an organisation needs verified organisation claims from Central, which are unverified.
3. **Organisation membership is not re-checked against Central at login.** It is checked against Skilled's own
   membership and link tables. Removing a Central membership takes effect only when an operator unlinks the subject.
4. **Login state is one-use through Redis (`SET NX` plus `GETDEL`).** Central's own adapter requires a durable,
   shared store, which Redis is. A Redis outage fails sign-in closed. Start and callback share a per-IP limit of
   60 requests per 15 minutes. Existing logout is not rate-limited, as before.
8. **Role vocabularies differ.** Central membership roles (`owner`, `admin`, `manager`, `member`, `learner`, from
   `migrations/0001_control_plane_draft.sql`) are not mapped. Skilled uses its own roles (`User.role`:
   `ADMIN`, `TEACHER`, `STUDENT`; `CompanyMember.role`: `OWNER`, `MANAGER`, `ASSESSOR`, `LEARNER`). Central's
   role never grants Skilled access, as the Pass 06 rule requires.
5. **Unlink revokes all of the user's sessions**, including email/password sessions. This is deliberately conservative.
6. **Frontend**: no "Sign in with Titan" entry point was added. The backend routes are ready for one.
7. **Test coverage**: the real-PostgreSQL link suite is unexecuted in this session. Run it with
   `DATABASE_URL=postgresql://titan:titan@localhost:5432/lms_<tag>_test` and Redis running. A bare run skips it.

## Tests

- `src/tests/central-sso-oidc.test.ts`: ID token rules, key rotation and cooldown, PKCE, state one-use and expiry, binding, nonce, token failure reasons, Redis state semantics.
- `src/tests/central-sso-flow.test.ts`: login, logout, expiry (refresh and access), role change, unlink and relink, revocation (inactive, soft-deleted, unverified), cross-organisation denial, ambiguous and unscoped links, unverified organisation, replay, missing binding, provider error, forged signature, wrong audience, configuration validation, and the flag-off path.
- `src/tests/central-sso-db.test.ts`: the same link lifecycle on PostgreSQL (skipped unless services are configured).
