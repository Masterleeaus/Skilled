# Skilled (LMS) to Titan Central: domain and runtime configuration (issue #161)

Status: configuration names and the Central mapping are documented here. **The production LMS domain is not decided.**
It is an owner decision and stays open until the owner confirms it. Every domain below is a placeholder.

Central references: `docs/LINKING.md`, `docs/SKILLED-SERVICE-DECISION-CONTRACT-PASS18.md`, Central issue #27 (LMS app, domain and adapter).
The example file is `lms-main/deploy/central/runtime.env.example`. It contains placeholders only.

## Owner decisions (open)

| Decision | Placeholder | Owner |
| --- | --- | --- |
| Public LMS origin (also the OIDC redirect host) | `<LMS_PUBLIC_ORIGIN>` | Open. Not decided by an agent. |
| Central origin for the decision endpoint | `<CENTRAL_ORIGIN>` | Open. Set from the live Central deployment. |
| Logto OIDC client for the LMS | `<LMS_OIDC_CLIENT_ID>` | Open. Created in Central's registry. |
| Live credentials (client secret, state key, decision bearer) | `<...>` | Open. Never placed in this repository. |

## Runtime configuration

| Name | Used by | Rule |
| --- | --- | --- |
| `SKILLED_CENTRAL_OIDC_ENABLED` | `central-oidc-config.ts` | Must be exactly `true` to enable. Off by default. |
| `SKILLED_CENTRAL_OIDC_ISSUER` | `central-oidc-config.ts` | HTTPS origin, no path, no credentials. |
| `SKILLED_CENTRAL_OIDC_CLIENT_ID` | `central-oidc-config.ts` | At most 256 characters. |
| `SKILLED_CENTRAL_OIDC_CLIENT_SECRET` | `central-oidc-config.ts` | At least 32 characters. Server-only. |
| `SKILLED_CENTRAL_OIDC_REDIRECT_URI` | `central-oidc-config.ts` | HTTPS, path exactly `/auth/titan/academy/callback`. |
| `SKILLED_CENTRAL_OIDC_STATE_KEY` | `central-oidc-config.ts` | Base64 of exactly 32 bytes. |
| `TITAN_SKILLED_DECISION_BEARER` (lands with #158, PR #184) | `central-decision-transport.ts` | Server-held Central service credential, 32 to 1024 characters. Empty means the decision client stays unmounted. |
| `TITAN_SKILLED_DECISION_ENDPOINT` (lands with #158, PR #184) | `central-decision-transport.ts` | Exact HTTPS URL ending in `/v1/integrations/academy/decision`. |
| `SKILLED_CENTRAL_SESSION_PG_TEST` | Test suite only | Set to `1` only against a disposable CI database. Never in runtime. |

The Central issuer and client ID used by the decision client are the same values as the OIDC settings above.

## Credential separation

- The LMS OIDC client secret, the LMS state key and the decision bearer are three separate secrets. None may be reused for another.
- Central holds its own copy of the decision bearer as a verifier. The LMS holds only the value it presents. Rotation is operator-managed.
- The LMS tenant allowlist is the operator-held registry of Logto organisation ID to Central internal organisation UUID (see the mapping below). It is kept in LMS configuration. It is not read from Central's registry, a request or a token.
- The link-assertion signing key (issue #163) is a further separate secret. It is named when #163 lands, and it is never placed in this repository.

## Account mapping

1. **Organisation to company.** `applyCentralLinkCommand` (`central-company-link-provisioning.ts`) maps a Central organisation ID to one LMS company. The link `centralOrganisationId` to `companyId` (the LMS companyRef) is one-to-one and unique on each side. A mapping conflict fails closed. The mapping is written only by an operator command, never by a browser request.
2. **User to verified LMS identity.** A Central identity (issuer and subject) reaches an LMS account only through a link that the LMS has proven, using the signed link assertion in `docs/LINKING.md`. An email address or display name never selects an account (`externalCentralRef` in `central-lms-contract.ts`).
3. **Tests with fakes.** `src/tests/central-company-provisioning.test.ts` runs 22 fixture scenarios against a fake Prisma client. `src/tests/central-lms-*.test.ts` covers the identity resolution.

## Checks

`src/tests/central-runtime-config-docs.test.ts` fails when the example file names a key that the code does not read, when a value is not a placeholder, or when the documented names drift from the code.
