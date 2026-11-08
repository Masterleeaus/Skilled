# Titan Academy Pass 4 — Shared curriculum learner player

The existing student course player now renders the published shared curriculum alongside legacy modules. Shared lessons are read from the canonical revision pinned to each placement. Learner reading acknowledgements are stored against lesson and revision IDs, allowing reuse across courses.

## Access controls
The outline API now requires active enrolment, course ownership as a teacher, or admin role. The existing completion API separately checks active enrolment and a published pinned revision. The new UI uses the existing bearer-token Axios client.

## Limits and follow-up
- This is a read-only lesson body renderer (text/content/blocks), not an HTML renderer. Rich media, assessment gating and practical evidence are still outstanding.
- Acknowledgement does not issue a credential or demonstrate competence.
- The existing course progress percentage remains the legacy percentage; shared curriculum shows its own required-lesson counter.
- Live PostgreSQL and browser end-to-end tests have not run.
