# SkilledAt.Work

The canonical application workspace is [`lms-main/`](lms-main/), with the active frontend in `lms-main/apps/frontend/` and API/database code in `lms-main/apps/backend/`.

Course source and the reviewed publication process live in `lms-main/curriculum/`. Canonical images live in the repository-root [`brand/`](brand/) and [`library/`](library/) folders. Frontend `predev` and `prebuild` scripts copy those images into the Next.js public asset tree; that generated tree is not an independent source.

Start with [the workspace README](lms-main/README.md) and [canonical source and asset guidance](lms-main/docs/SKILLED-CANONICAL-SOURCE-AND-ASSETS.md). The [consolidation inventory](lms-main/docs/CONSOLIDATION-INVENTORY-2026-11-08.md) distinguishes active code from historical records, archived imports and unmounted prototypes.

**Status:** Not verified for production deployment. Root historical ZIP archives remain as provenance; do not treat them as the active source or deploy them instead of the workspace.
