# SkilledAt.Work — deployment entrypoint

**Status: NOT production verified.** This is the canonical navigation and release gate for SkilledAt.Work issue #72, not evidence of a successful live deploy. **No production commands should be executed based solely on this page.**

## Which document is authoritative?

| Task | Current reference | Rule |
| --- | --- | --- |
| Install prerequisites, environments and dependencies | [INSTALL.md](INSTALL.md) | Follow the workspace-specific installer, not archived bootstrap scripts |
| Release qualification, rollback and deployment record | [runbooks/deployment.md](runbooks/deployment.md) | Every release gate is blocking until independently verified |
| Secrets and credential rotation | [runbooks/secrets-handling.md](runbooks/secrets-handling.md) | Keep actual secrets out of Git and logs |
| Backup, restore and rollback | [runbooks/recovery.md](runbooks/recovery.md) | Rehearse against isolated staging; no automated down-migration |
| Host-specific historical server proposal | [research/DEPLOY-RUNBOOK.md](../curriculum/research/DEPLOY-RUNBOOK.md) | **Historical, not verified**; example ports and paths are not authority for a live host |
| Canonical source, retired modules and copied images | [SKILLED-CANONICAL-SOURCE-AND-ASSETS.md](SKILLED-CANONICAL-SOURCE-AND-ASSETS.md) | Use active source and current file counts; preserve provenance |

The old server checklist must not override later code, verified platform configuration or the current release gates. The compatibility-sensitive database and environment identifiers still contain historical Academy names; do not rename them by search-and-replace.

## Mandatory preflight — in this order

1. **Host isolation.** Prove the target host, isolated database, Redis instance, object storage, SMTP and secrets belong to the intended environment. Do not touch another installed product or existing database. The historical proposal's port numbers are not evidence of current provisioned services.
2. **Frozen source and dependencies.** Record the exact Git commit and run `pnpm install --frozen-lockfile` from `lms-main/`. Preserve lockfile and third-party licences.
3. **Database safeguards.** Obtain a recoverable backup and verify restore on staging. Use the dedicated database-target preflight and Prisma `validate`/`migrate status`. Apply migrations **only on an approved target** using `prisma migrate deploy`; never use `prisma migrate dev` or run the demo seed on shared infrastructure.
4. **Build inputs.** Generate Prisma Client; check backend and frontend TypeScript, unit tests and browser smoke tests. Production frontend builds require the correct `NEXT_PUBLIC_API_URL` and public site origin before build, since these values may be baked into output.
5. **Public image assets.** The tracked `brand/` and `library/` folders must be present at repository root. Frontend `prebuild` copies their **1,495 current tracked assets** to `apps/frontend/public/academy/`. Verify the copy with `node scripts/prepare-public-assets.mjs --check`; package those assets with the deployed Next.js output.
6. **Publication holds.** `pnpm curriculum:ci` must pass and must not be bypassed because of outstanding drafts, assessment approvals or mappings. No historical `canonical-import-manifest.json` may be used for new imports; its stored hashes are stale. The brief-import `--validate-only` command is read-only; a real import is a separate approved database operation.
7. **Authorisation and integration.** Confirm enrolment checks, organisation boundaries, evidence approvals, Stripe webhook signature validation, and that the tutor is disabled unless explicitly approved and tested. Run staging smoke tests including learner, assessor and manager roles.
8. **Deployment and rollback record.** Record migration names, release commit, verified checks and their evidence, backups, operator, post-deploy health checks and the rollback decision in an external controlled record.

## Local read-only verification commands

Run only from `lms-main/`, on a complete source checkout:

```sh
node scripts/prepare-public-assets.mjs --check
node scripts/audit-canonical-import-manifest.mjs
node scripts/audit-inactive-source-boundaries.mjs --strict
node --test scripts/test-deployment-doc-contract.mjs
```

The image check fails when images have not yet been materialised; that is expected before the frontend prebuild/copy. The historical import audit reports stale findings even when the scanner runs correctly. These commands are **preflight diagnostics**, not a production readiness certificate.

## Blockers and ownership

Current outstanding categories include human editorial curriculum approval, assessment publication approval, staging/live infrastructure rehearsal and the central sign-in/company-scoping decisions in issues #71 and #68. They are not waived by passing source-unit or static-document tests.

**Do not auto-publish, delete a historical migration, drop a tutor table, or change a tenant identity based on document consolidation.**
