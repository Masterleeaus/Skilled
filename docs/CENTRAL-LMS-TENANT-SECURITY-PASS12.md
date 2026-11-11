# Skilled / Titan Central tenant-boundary verification — Pass 12

This branch extracts the **offline-only, server-side** Central/LMS account lookup and refresh-token composition functions from draft PR #122. They are *not* mounted as API routes and no Central sign-in switch has been enabled. No production Central endpoint, issuer key, org claim, or SSO callback is treated as verified.

## Implemented contracts

- `central-lms-contract.ts`: canonical HTTPS issuer and bounded subject key; exact operator-controlled identity binding fields; rejects role/email/tenant injection.
- `central-lms-link.ts`: requires fresh trusted identity evidence, trusted company binding, a live Central entitlement decision, company-scoped external identity, local membership, and an active, email-verified LMS account. It never grants an LMS role from Central or a membership role.
- `central-lms-session.ts`: prepares local native token sessions through an injected transactional refresh store, requiring previous-token revocation when rotating. It does not supply or verify an OIDC authorization-code exchange.
- Original tests are accompanied by separate regression families for input trust, replay timestamps, HTTPS issuer, company mapping, entitlement denials, external identity scoping, membership revocation, account status, role authority, service outages and identifier constraints.

The modules use dependency injection for verified decisions and database queries. **They are not an alternative to implementing/verifying a real OIDC/PKCE callback, token audience/nonce validation, JWKS rotation, Central authorization, logout or database-level isolation.**

## Integration deliberately excluded

- No modifications to `src/app.ts`, live auth routes, authentication environment defaults or frontend login.
- The old #107 OIDC route implementation remains draft. Its callback, live JWKS, organization claims, and logout responsibilities have not been reconciled.
- The #122 offline identity provisioning script remains unmerged until a dedicated migration, rollback, audit and operator authorization review; identity writes cannot be treated as safe solely because the read-only lookup tests pass.
- All existing username/password authentication remains intact; feature flag default behavior unchanged.

## Verification

From `lms-main/apps/backend` after `pnpm install --frozen-lockfile` and `pnpm exec prisma generate`:

```sh
pnpm exec vitest run src/tests/central-lms-contract.test.ts src/tests/central-lms-link.test.ts src/tests/central-lms-session.test.ts src/tests/central-lms-security-*.test.ts
pnpm exec tsc --noEmit
pnpm exec tsc --project tsconfig.central-lms.json
```

GitHub Actions performs the isolated test suite. The repository-wide `typecheck:tests` currently fails on five pre-existing `import.meta` uses in a CommonJS test-compiler configuration. That unrelated failure is not hidden or claimed fixed; the dedicated Central security suite uses its own scoped typecheck in addition to full backend source typechecking. The unrelated curriculum CI gate still blocks 1,267 assessments and 16 unresolved course mappings; never relax editorial approvals for authentication changes.

## Outstanding acceptance before issue #71 can be closed

A trusted, live Central test environment; signed OIDC code exchange and issuer/audience/nonce verification; unforgeable company binding and revalidation; tenant-ownership and account linking policy; replay/session-rotation proofs against real PostgreSQL; frontend entry point, callback and logout agreement; security review and staging E2E coverage. These are **not** complete or enabled here.
