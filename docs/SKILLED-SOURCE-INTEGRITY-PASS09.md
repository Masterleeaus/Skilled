# SkilledAt.Work source integrity and public assets — Pass 9

This pass reconciles compatible, tested portions of the older draft source-consolidation branch (PR #98) against the current canonical `main`. It does **not** merge that branch wholesale: its Central authentication changes, seed changes, unverified backend modifications and source deletions remain outside this integration.

## Audits integrated

- **Active compatibility:** checks the retained database models and migration anchors, JWT algorithm and refresh-token design, company membership and integration credential checks, published-revision access and review gates. It is a conservative source contract, not an execution proof.
- **Inactive source boundaries:** inventories legacy curriculum and historical helper folders, active imports and tutor feature-flag mounting, without deleting source or treating archived code as deployable.
- **Historical import provenance:** verifies canonical versus retired-ready lesson identities, paths and SHA-256 hashes; reports drift, duplicates and missing sources. The snapshot does not grant import authorization.
- **Course artwork provenance:** validates manifest URLs against repository-owned `brand/` and `library/` assets and rejects unsafe paths, symlinks and missing files.
- **Asset materialization:** provides an explicit `prepare-public-assets.mjs` command; it copies identical canonical assets into Next public folders without rewriting originals or overwriting divergent generated files. Never execute this command against a production installation without inspecting the destination.

All five have dependency-free negative tests. GitHub Actions runs their checks independently; the historical snapshot report is retained without making a false claim that old hashes are current.

## User-visible fixes

The shared top navigation now sends guests to the public home page instead of an unauthenticated student dashboard. It shows login and register links for guests, preserves role-aware dashboard links for authenticated users, and closes its account menu on Escape. A reusable pure email-template helper centralizes the SkilledAt.Work name, encodes tokens as URL query parameters and HTML-escapes links. Queue producers continue to own delivery, retries and worker dispatch. Automated tests verify these contracts; actual email delivery requires a separate integration check.

## Verification and release boundary

From `lms-main/`:

```sh
node --test scripts/test-audit-active-compatibility.mjs scripts/test-audit-inactive-source-boundaries.mjs
node --test scripts/test-audit-canonical-import-manifest.mjs scripts/test-audit-course-art-manifest.mjs
node --test scripts/test-prepare-public-assets.mjs scripts/test-public-topbar-navigation.mjs
node scripts/audit-active-compatibility.mjs --strict
node scripts/audit-inactive-source-boundaries.mjs --strict
node scripts/audit-course-art-manifest.mjs --strict
node scripts/audit-canonical-import-manifest.mjs --report build/import-provenance.json
```

The full curriculum publication workflow remains intentionally red until qualified review of 1,267 assessments. A passing integrity or frontend build workflow cannot grant publication approval, certify a backup, prove a live runtime or substitute for a security review of Central sign-in. Do not close #72 solely based on these contracts.
