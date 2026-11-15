# Dependency pinning policy

This document records which dependency versions are pinned on purpose, why, and how they are updated. Dependabot is configured in `.github/dependabot.yml` for npm (root and every workspace package) and GitHub Actions.

## Runtime and toolchain

| Item | Pin | Reason |
| --- | --- | --- |
| Node.js (CI) | 22 (`node-version: 22` in workflows) | CI runtime. `engines.node` in the root `package.json` is `>=20`, so 20 is the supported floor. |
| pnpm | `pnpm@10.0.0` (`packageManager` in root `package.json`) | Keeps lockfile format and install behaviour identical locally and in CI. |

## Exact pins

| Package | Where | Version | Reason |
| --- | --- | --- | --- |
| `next` | `apps/frontend` | `15.5.20` | Next.js is pinned exactly. A floating `15` would let a minor upgrade land in any install that re-resolves. |
| `eslint-config-next` | `apps/frontend` | `15.5.20` | Kept in lockstep with `next`, so lint rules always match the framework version. |
| `typescript` | `apps/frontend`, `apps/backend`, `packages/shared` | `5.6.3` | Exact across all packages so typecheck results do not change between packages. Upgrade all three together. |
| `@types/node` | `apps/backend` | `22.20.5` | Matches the CI runtime (Node 22). Typings for a newer Node than the one that runs the code can hide missing APIs. |

## Ranges

| Package | Where | Range | Reason |
| --- | --- | --- | --- |
| `@types/node` | `apps/frontend` | `^22.20.5` | Same Node 22 typings as the backend; frontend uses ranges for dev typings. |
| Other dependencies | all packages | `^` or the exact version already in the manifest | Unchanged from before this policy. |

## Updating

- Dependabot opens grouped weekly PRs for minor and patch updates (npm) and for GitHub Actions. Major updates arrive as separate PRs.
- Do not upgrade a major version only to tidy the tree. Upgrade `next` and `eslint-config-next` together, and `@types/node` only when the CI Node version changes.
- After any dependency change, regenerate the lockfile with `pnpm install` and confirm `pnpm install --frozen-lockfile` passes before pushing.
- Backend builds need the generated Prisma client: run `pnpm --dir apps/backend prisma:generate` before `pnpm build` on a fresh install.

## Verification

```
pnpm install --frozen-lockfile
pnpm --dir apps/frontend typecheck
pnpm --dir apps/frontend build
pnpm --dir apps/backend prisma:generate
pnpm --dir apps/backend build
pnpm --dir apps/backend exec tsc --noEmit -p tsconfig.test.json
```
