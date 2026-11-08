# Titan Academy — Pass 42 stabilisation and account recovery

## Source and scope
- Input cumulative ZIP: `Titan-Academy-LMS-cumulative-20261102-1837.zip`.
- Output is a new cumulative ZIP; original input is retained unchanged.
- This pass changes backend authentication, frontend account recovery and offline source-validation tooling, with existing curriculum preserved.
- Includes a DELTA archive with file-level checksums and a full change manifest.

## Implemented
- Reject public registration for elevated roles and enforce `STUDENT` at service layer.
- Deny refresh for disabled or unverified users.
- Add `/forgot-password`, `/reset-password` and `/verify-email` frontend pages linked from existing auth flows.
- Align frontend auth API and outbound email verification/reset links with the backend routes.
- Update assessment test expectations to discover the actual inventory instead of assuming the historical 357-item count.
- Test publication approval gate without creating fake approvals in the production curriculum. Unit-test only approvals are temporary fixtures.
- Introduce `pnpm test:source` to run eight deterministic offline regression scripts.

## Executed verification
- `node scripts/run-source-verification.mjs`: **PASS 8/8 scripts** (offline checks, source contracts and curriculum checks).
- `node --check` for all 15 `.mjs` scripts: **PASS 15/15**.
- Original input ZIP CRC integrity: **PASS**.
- Full `pnpm install`, `pnpm build`, Prisma generate/migrate, Vitest, browser/SMTP/Redis/PostgreSQL/Stripe integration: **NOT VERIFIED**. Dependencies unavailable in this execution environment; no claim of deployment readiness.

## Assessment and approval boundaries
- Current test inventory: **841** canonical assessment files.
- Human approvals may be maintained separately; their absence from the archived approval JSON must not be interpreted as proof reviews never happened.
- No assessment records or external human approval evidence were invented, edited or removed in this pass.
- Technical blockers remain (including question mapping and passing rules); publication is not automatically cleared by an editorial approval alone.

## Security and deployment limitations
- User-role restrictions are a targeted mitigation, not a full security audit. Live API checks must verify authorization and rate limiting.
- UI routes were statically verified; complete SMTP account-verification/reset journeys are not yet validated.
- The inherited default Compose configuration should not be used unchanged on the Field/Desk server.
- Multi-business isolation, dependency compatibility, migration execution and TLS remain unverified.

## Release inventory
- Added source files before this report: 5
- Modified source files: 11
- Deleted source files: 0
- Changes were measured against the extracted input cumulative source, not fabricated commit statistics.

## Next pass
- Dependency installation and genuine clean build against pinned versions.
- Prisma migration validation in a dedicated database, tenant/permission regression tests and complete course-to-certificate integration journey.
