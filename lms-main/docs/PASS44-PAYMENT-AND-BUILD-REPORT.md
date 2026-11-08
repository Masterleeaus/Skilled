# Titan Academy — Pass 44 build and payment review

## What changed

- Checkout success/cancellation routes now exist. Success requires Academy to verify the Stripe session and does not grant access on the basis of the redirect alone.
- Browser payment confirmation and authenticated `/payments/verify/:providerReference` are scoped to the current student.
- Server-side Stripe verification compares course ID, student ID, USD currency and smallest-unit amount to the persisted Academy payment before enrollment.
- An optional Stripe signed webhook can fulfill paid sessions without reliance on the user's browser returning. The `/api/payments/stripe/webhook` raw request body must be received unmodified by Apache.
- Payment completion remains idempotent via the existing enrollment unique key. **Run real concurrent/retry tests before accepting money.**
- Frontend refresh waiters reject if refreshing the token fails rather than waiting indefinitely.
- Academy backend now defaults to loopback binding (`HOST=127.0.0.1`).
- MinIO startup no longer masks an authentication/network outage as a missing bucket.
- Frontend lint command updated to ESLint rather than the removed Next.js `next lint` entrypoint; backend TypeScript tsconfig excludes Prisma CLI scripts outside its build rootDir.

## Verification boundaries

- Offline source contract checks are not provider integration, payment-flow or web browser tests.
- Clean install, `prisma generate`, `prisma migrate deploy`, backend TypeScript build, frontend Next.js build and Vitest **must be executed** in a network-enabled isolated environment.
- No DB migration or external server modification was performed in this pass.
- The backend remains financially unsafe for a live payment launch until webhook/retry behavior, pricing, coupon usage limits, payment races and refund state transitions have real integration tests and professional review. Do not enable live Stripe keys by default.

## Runtime commands for isolated staging (NOT for Field or Desk)

Use the audited pinned pnpm version from `packageManager`. Do not run `pnpm install` as root, do not run the inherited default developer stack, and do not run any Prisma action until Academy database credentials/target have been verified.

```
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @lms/backend prisma:generate
corepack pnpm --filter @lms/backend build
corepack pnpm --filter @lms/frontend build
corepack pnpm test:source
```

Database migrations are deliberately excluded from this default build sequence. Deploy them against a dedicated Academy database only, after `prisma migrate status` and a reviewed backup/rollback plan.
