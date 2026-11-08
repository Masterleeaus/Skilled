# Curriculum brief import: identity and conflict policy

Closes ACA-009. Applies to `apps/backend/prisma/import-titan-curriculum.ts` (CLI) and `apps/backend/prisma/curriculum-brief-import.ts` (logic).

## Source and identity

- Source: `apps/backend/prisma/curriculum/titan-three-layer-lessons.json`, 221 briefs, with a top-level `version` (currently `draft-1`).
- **Source identity** is the brief `id` (for example `U01-01`). It is stored in `AcademyContentLesson.sourceId`, which is unique. IDs must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` and must be unique within one inventory. Anything else is refused before any write.
- Renaming an ID creates a new lesson, and the old lesson is retired by the rules below. IDs are never matched by title.
- **Content identity**: `contentHash` (the shared canonical-JSON SHA-256 in `src/utils/content-hash.ts`) of the revision body. The body holds the content fields (`layer`, `serviceGroup`, `unit`, `title`, `objective`, `assessment`), `sourceId`, `sourceVersion` and `sourceInventory` (`titan-three-layer-lessons`). This is the same hash the review gate recomputes, so import revisions are reviewed like any other draft.
- The lesson row's `sourceHash` is the hash of the content fields only, so a version bump with the same content does not change it.

## Write rules

Every write runs in one Serializable transaction. Every decision reads the state inside that transaction. If anything fails, nothing is written, and a retry makes the same decisions again.

| Situation | Lesson row | Revisions |
|---|---|---|
| New `sourceId` | Created as `BRIEF` | Revision v1 written as `DRAFT` |
| Content equals the newest revision's content (including an exact repeat, or a version bump with the same content) | Unreviewed rows refresh `sourceVersion` only. Reviewed rows are unchanged. | None |
| Content differs from the newest revision | Unreviewed (`BRIEF` or `RETIRED`): row set to the source content, status `BRIEF`. Reviewed or published: row unchanged. | Next version written as `DRAFT`. Older revisions are never edited or deleted. |
| Reviewed or published lesson, source changed | Unchanged, including `contentStatus` | A `DRAFT` revision is written for review. The published revision stays as it is. |
| `sourceId` left the source, lesson was written by this inventory, and it is unreviewed (`BRIEF`) | Set to `RETIRED`. No rows are deleted. | None |
| Same, but the lesson has reviewed or published content | Status unchanged. Listed in `retiredNeedsReview` for a human decision. | None |
| Retired lesson returns to the source | Back to `BRIEF` with the source content | Only if the content differs from its newest revision |
| Lesson not written by this inventory (no `sourceInventory` marker in its newest revision) | Never touched or retired | Never touched |

Other rules:

- Approval state is never changed by the importer. Only the review path sets `PUBLISHED` on a lesson or revision.
- Revision bodies and content hashes are never rewritten. Lineage is the revision sequence, with `sourceVersion` in each body.
- The importer creates no track, placement or course-track rows, and it never deletes any row.
- Reading the inventory and validating it happen before the transaction. An invalid inventory writes nothing.
- The importer does not write audit-log entries. Revision provenance for review therefore comes from the review path only.

## Retry

Retrying after a failure is always safe. The state is compared with the inventory, not with the previous run, so an interrupted import is completed by running it again. Tests cover a failure on the Nth write (everything rolls back, then a retry matches a clean run) and a failure in the middle of a changed-revision import.

## Running

```
pnpm -C apps/backend curriculum:import                                  # default inventory
pnpm -C apps/backend exec tsx prisma/import-titan-curriculum.ts --source <copy.json>
```

The CLI prints one JSON line with `total`, `lessonsCreated`, `lessonsUpdated`, `lessonsUnchanged`, `revisionsCreated`, `reviewedRevisionsDrafted`, `retired`, `restored` and `retiredNeedsReview`.

## Verification

- Unit and contract tests (`src/tests/import-titan-curriculum.test.ts`, 18 cases) use the schema-aware in-memory Prisma double with inline inventories. They do not read or write curriculum files.
- Database run on a scratch database (`lms_m`, PostgreSQL 16): first import created 221 lessons and 221 revisions. An exact repeat wrote nothing. A scratch copy at `draft-2` (one title changed, one removed, one reviewed lesson changed) gave `lessonsUpdated 219`, `revisionsCreated 2`, `reviewedRevisionsDrafted 1`, `retired 1`. A repeat wrote nothing. The reviewed lesson kept its `PUBLISHED` revision and gained one `DRAFT` revision.
- Not verified on a live database: an injected failure inside a real PostgreSQL transaction. Rollback there relies on Prisma's interactive-transaction behaviour, and the tests cover the same rule through the double.

## Limits

- Brief content is still `PLANNED`. The importer does not promote anything to reviewed content.
- Drafts produced from briefs are not checked against the assessment files. That is covered by `scripts/assessment-coverage.mjs` (ACA-012).
