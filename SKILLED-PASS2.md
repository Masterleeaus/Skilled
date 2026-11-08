# Skilled TypeScript upgrade — Pass 2

## Implemented API
Mounted at `/api/academy/curriculum`, authenticated reads and permission-gated editorial writes:

- `GET /lessons?layer=&serviceGroup=&take=&skip=` — browse canonical lesson inventory.
- `GET /lessons/:sourceId` — inspect a canonical lesson and its revisions.
- `POST /lessons/:sourceId/revisions` — create a draft content revision, optionally checking `expectedVersion`.
- `POST /revisions/:id/publish` — publish a revision and update canonical content status.
- `POST /tracks` — create universal, group or vertical curriculum tracks.
- `GET /tracks/:slug` — inspect track and ordered placements.
- `POST /tracks/:slug/placements` — add reusable canonical lesson placements with optional pinned published revision.
- `POST /tracks/:slug/publish` — require every placement to pin a published revision before publishing.

Existing course and learner APIs remain untouched. These new tracks are **not yet integrated with the legacy course player**, and no new learner completion logic is claimed. Write permission currently reuses `course:create` and needs dedicated curriculum roles in a subsequent pass. Draft revision bodies are JSON, not yet validated against a rich lesson block schema. No live PostgreSQL or application runtime testing was performed.

## Known follow-up work

- Enforce revision immutability and published-track immutability at database or service boundary.
- Add dedicated curriculum permissions, editorial ownership, auditing, rate limits and API tests.
- Build course/track associations and shared learner progress with version-aware competency checks.
- Run Prisma generate, typecheck, database migration and integration tests in a configured environment.
