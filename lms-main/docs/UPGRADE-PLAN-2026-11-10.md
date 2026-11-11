# Upgrade plan: finish the site and reach fifty verticals

Date: 2026-11-10. Source: three read-only scans of origin/main (curriculum structure; app gaps; CI and operations), plus the open issues.
Status: plan only. Nothing here is implemented until the owner decisions in Phase 0 are answered.

## Phase 0: owner decisions (blocking)

1. **Hold list.** `apps/backend/src/modules/curriculum/unverified-courses-hold-list.ts` holds beauty, dogwalk, groom, hair, petsit, pt and yoga. Cloned verticals from those templates (makeup, nails, dog training, tutoring, nutrition) inherit the risk. Decide: keep the new courses unpublished until the hold is lifted, or lift it per course after review.
2. **Draft-only.** Confirm the six new courses ship as drafts, invisible to learners, until content is written and approved.
3. **Regulated content.** Nutrition needs a qualified dietitian or nutritionist reviewer and scope-of-practice wording. Tutoring needs child-safety rules (screening, supervision, reporting) per jurisdiction. Name the reviewers, or defer those two.
4. **Central sign-in (#71, #68).** Keep deferred until the company binding is verified against a live provider.

## Phase 1: release blockers (parallel)

- **Learner certificate page.** Backend exists (`/api/certificates/my-certificates`, `/verify/:code`). No frontend page or API call. Add a page that lists and downloads certificates.
- **CI gates.** The five contract scripts, `pnpm test:academy:backend`, and the full backend vitest run are in no workflow. Add a workflow that runs them on PRs and main.
- **Stripe fallback.** `payments/stripe.provider.ts` falls back to `sk_test_placeholder`. In production, fail startup when Stripe is partly configured or missing when checkout is enabled.
- **Env template.** Add `NEXT_PUBLIC_SITE_URL` to `lms-main/.env.production.example`. Fix the PostgreSQL port (5433 in the template, 5432 in the preflight).
- **Migration prefix.** Two migrations share `20261102000100_*`. Confirm order and dependencies (issue #38 covers this; re-check after later migrations).
- **Database version.** The preflight says the host runs PostgreSQL 13. The targets are 16. Needs a server check (issue #35).

## Phase 2: six new verticals (six parallel agents, one per vertical)

Each agent: clone the template structure, create shells as NEEDS REWRITE drafts, add the course to every mapping file, and leave the hold and review states unchanged.

| Vertical | Slug | Template | Prefix | Shells | Risk |
|---|---|---|---|---|---|
| Tutoring | tutoring | pt | NEW-TUT | 5 | Child safety |
| Makeup artistry | makeup-artistry | beauty | NEW-MUA | 5 | Product and patch-test rules |
| Mobile nails | mobile-nails | beauty | NEW-NAI | 5 | Chemicals, UV lamps, infection control |
| Dog training | dog-training | dogwalk | NEW-DTR | 6 | Animal welfare, bite liability |
| Short-stay host management | shortstay-host | portfolio | NEW-HST | 4 + 5 existing | Registration, permits, insurance |
| Nutrition, weight loss and dieting consultant | nutrition-consult | pt | NEW-NUT | 5 | Highest: protected titles, claims, eating-disorder screening |

Mapping files each course must join: `curriculum/structure/COURSES-MODULES.json`, `COURSE-MODULE-LESSON-MAP.csv`, `SLUG-MAP.json`, `curriculum/levels/<slug>.csv`, `apps/backend/src/modules/levels/course-level-map.json`, `apps/frontend/src/lib/academy-brand.manifest.json`, and `curriculum/assessments/<id>-<slug>.assessment.json`. The term "tutor" is used by the AI tutor module, so avoid it in tutoring code names.

## Phase 3: site finishing (parallel)

- Landing page: list the courses (currently static copy with emoji icons).
- Navigation: link the assessor page (`academy/assessor`) and pathways page from the Topbar or AdminNav.
- Brand assets: replace the placeholder icons and share image with the real Skilled mark (owner supplies the file; issue #85).
- Field-services sync: implement the route, or keep its contract test skipped with a documented reason (issue status to confirm).
- Tutor (AI): leave off by default; the RetrievalStore port is unfinished.

## Phase 4: engineering upgrades (parallel)

- **Toolchain.** Align the host to Node 22 and pnpm 10.0.0 (host has Node 20 and pnpm 9.12.0). Update docs.
- **ESLint.** Unify the backend (flat config, v10) and the frontend (`eslint ^9`, `@eslint/eslintrc`) on one approach.
- **Pinning.** `next` is unpinned (`"15"`); `@types/node` 26 against `engines` node >=20; `typescript` is pinned while most else uses `^`. Pin deliberately, and add Dependabot.
- **Compose.** Pin `minio:latest` to a digest in both compose files; keep the local-dev file out of any server path.
- **Secrets.** Enforce the JWT minimum in every environment, or document the dev exception. Stop embedding the Redis password in the URL template.
- **Cookies and CSRF.** Make the refresh cookie's sameSite and secure settings consistent. Decide on CSRF handling beyond SameSite.
- **Rate limits.** Add a global limiter in addition to the per-route ones.
- **Workflows.** Consolidate the 32 near-duplicate workflows into a shared setup.

## Phase 5: verification

- Run every suite in Phase 1 in CI, not only locally.
- Migrations against a real PostgreSQL 16 (issue #18 covers the rehearsal; re-run after new migrations).
- Full-stack smoke after Phase 1 and Phase 3 (issue #9 owns this).
- Deployment rehearsal needs a server (issue #35).

## Agent allocation

About 12 agents: 6 vertical agents (Phase 2), 2 release-blocker agents (certificate page; CI gates and Stripe), 2 site agents (landing and navigation; brand assets once supplied), 2 engineering agents (toolchain and pinning; cookies, secrets and rate limits).
