# Skilled route metadata and brand verification — 2026-11-09

## Scope
This pass adds route-level titles and search-indexing hints on 22 account, learner, teacher, assessor and administrator routes. Private pages declare `robots: { index: false, follow: false, nocache: true }` and a `no-referrer` policy, centralised in `apps/frontend/src/lib/route-metadata.ts`. These are privacy and UX signals, **not access-control guarantees**. API authentication, tenant checks and session policies remain responsible for protecting data.

The public landing page, browser metadata, PWA manifest and email subject/body copy use **SkilledAt.Work / Skilled**. The public credits page is intentionally unchanged because it retains required historical origin and licence attribution. Internal API names, database identifiers, env keys and curriculum provenance are not renamed.

## Regression and review
Run `node scripts/test-skilled-route-metadata.mjs` from `lms-main/`, or run `node scripts/run-source-verification.mjs` for the wider source checks. The new contract test ensures each private route exports its metadata, the helper keeps privacy hints, the public branding surfaces have no old name, and password/verification tokens remain URL-encoded.

## Verification limits
Static source assertions are not equivalent to a Next.js production build or inspection of the actual generated HTML. Before merging, run frontend TypeScript/lint/build, test the generated robots and referrer meta tags, and check reset links still work. No live email, backend deployment or search-engine indexing test is claimed here.

Related open issue: #72. Curriculum copy issue #86 remains independent because canonical lessons and the 3.9 MB derived normalization index must be updated together and re-approved.
