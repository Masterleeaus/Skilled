# Skilled repository consolidation

## Canonical source layout

The repository root is the single pnpm workspace and application base. Backend, frontend, shared packages, curriculum, operations scripts, and project documentation live together at the root. The former `lms-main/` wrapper directory is removed.

Course artwork and lesson media are served from `apps/frontend/public/academy/brand/` and `apps/frontend/public/academy/library/`. Canonical sources remain in repository-root `brand/` and `library/`; the frontend predev/prebuild asset preparation verifies and copies them to public/academy. This matches the existing `/academy/brand/...` and `/academy/library/...` URLs in the frontend and makes those assets available through Next.js static serving. The app's manifests continue to identify the same 1,495 asset files.

## Archive reconciliation

The original consolidation branch recorded these archive comparisons. The current reconciliation retains the six original ZIPs as provenance:

| Archive | SHA-256 | Reconciliation |
|---|---|---|
| `11c64ccc-part-03-images.zip` | `9338f9e93f337e1fbaa853d68f22104f73c0b6408e36327a93e882b02264e45f` | All 227 files match the extracted assets byte-for-byte. |
| `127f77ce-part-06-images.zip` | `274fe8b6d016cd1570c921fdd77dc0d8148a2cfbbf9c089910e377494bc8ef09` | All 169 files match the extracted assets byte-for-byte. |
| `17b4e877-part-04-images.zip` | `03287bfdd5a0ddfecf5cd757d85bdca3e6e62580ce37ef1c46a1b3011c5c196b` | All 60 files match the extracted assets byte-for-byte. |
| `724d989d-part-02-images.zip` | `662e26f9bcfe1e82df37e0ac6beddc758046e50ed73afcc0970da188ab3e8deb` | All 533 files match the extracted assets byte-for-byte. |
| `9d7e2a65-part-05-images.zip` | `30ab7b4f3b30e0e6075efead9b426ba5b401102be7c3bb841b8c0570c6706284` | All 506 files match the extracted assets byte-for-byte. |
| `2037e4b8-part-01-code-and-curriculum.zip` | `786d5fc654e3a193108879ca32ea4a8f5e6bad698b542c7b9701aa83e032c0fb` | Older source snapshot. Of 3,419 files, 3,405 paths were already present; 50 existing files differ and the current repository versions are retained. Fourteen archive-only entries include generated dependency/build output, an unused npm lockfile, guarded bootstrap scripts, and an obsolete development Compose file. |

The image archives contained 1,495 files in total and contributed no unique asset files. The older code archive was not extracted over the current workspace: doing so would replace newer code and deployment safeguards. Its guarded bootstrap originals are retained under `docs/legacy-bootstrap/`, and the supported local development Compose file remains in the source tree. The current reconciliation retains these original ZIPs and canonical assets. Generated public media is not a separate editable source.

## Brand and compatibility

**SkilledAt.Work** is the full product name; **Skilled** is the normal short name. Current application chrome, browser metadata, public landing copy, account emails, and operator-facing documentation use the Skilled identity.

The existing `titan_academy` database, `/api/titan/integration` endpoint, video token issuer, upload prefix, and legacy curriculum/source identifiers remain compatibility-sensitive implementation details. This consolidation does not rename databases, alter migrations, invalidate stored links or tokens, or require an existing deployment to move data. Historical pass reports and original licence attribution remain as provenance.

## Local commands

Run workspace commands from the repository root, for example `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm build`, and `pnpm curriculum:ci`. Existing deployment and database safeguards in the runbooks still apply.


## Reconciliation verification

The current Main workspace was moved without replacing newer code with the older branch snapshot. Stable `@lms/*` package identities remain for dependency compatibility. Current shared ESLint configuration, transactional email builders, cleanup workers, authentication and publication protections are retained.

Local verification: frozen pnpm install, Prisma generation, backend/frontend/test TypeScript checks, lint on changed TypeScript, production frontend build, all 11 built metadata checks, 130 source checks, and 1,589 backend tests passed. Backend runs skipped 122 service-dependent cases; PostgreSQL CI remains required. A checksum comparison covered 2,908 curriculum/migration files; only the import-builder script and historical deployment document changed. Assessment data and applied migration SQL are unchanged.

Local Chromium cannot create its required Unix socket in the task sandbox. The required public browser CI uses a pinned Playwright container and verifies six public desktop/mobile page renders, no horizontal overflow, manifest identity and install-icon delivery. Browser verification is pending on the final GitHub head. Curriculum publication approvals are not inferred from code or build success.
