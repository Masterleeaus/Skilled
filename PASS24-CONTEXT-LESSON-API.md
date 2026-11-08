# Pass 24 — Context-aware lesson API

Routes are mounted under the existing curriculum router prefix.

- GET `/business-fields/registry` — approved key catalogue (authenticated).
- GET `/companies/:companyId/business-fields` — manager-only configuration listing.
- PUT `/companies/:companyId/business-fields/:fieldKey` — manager draft/upsert, resets approval on edits.
- POST `/companies/:companyId/business-fields/:fieldKey/approve` — manager approval of draft.
- POST `/companies/:companyId/business-fields/:fieldKey/retire` — manager retirement.
- POST `/companies/:companyId/lessons/:revisionId/context` — authenticated learner, organisation member, assigned course, active enrolment and published revision required; produces sanitised, context-rendered lesson and immutable snapshot.

Only approved organisation values resolve. No Field Services sync or UI is implemented. Values must be reviewed by business managers. Knowledge-check answer keys are stripped before context rendering. Snapshot ID and hash are returned to the learner. Migration and runtime integration remain unverified.
