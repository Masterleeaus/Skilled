# Pass 25 — historical business lesson context snapshots

Adds `GET /companies/:companyId/lesson-context-snapshots/:snapshotId` to the existing authenticated curriculum router.

The endpoint requires the requesting learner to be a current organisation member, restricts the snapshot query to the authenticated learner and organisation, reconstructs the displayed lesson from the **stored approved field values** and the referenced lesson revision, and verifies the SHA-256 content hash before returning the rendered lesson. It does not read the organisation's current business fields.

## Limitations

- Requires immutable lesson revision bodies for historical integrity; a changed revision fails closed on hash mismatch.
- Source-contract and hash regression checks are not live HTTP/database tests.
- Snapshot access is deliberately learner-only; manager/auditor access would need separately scoped authorisation and audit logging.
- Full TypeScript/Prisma compilation and PostgreSQL migration execution remain unverified.
