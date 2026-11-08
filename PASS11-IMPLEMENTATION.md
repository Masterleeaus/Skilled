# Pass 11 — organisation-bound assessment eligibility and active skills

- Evidence submission now resolves eligible curriculum placements **only** through active enrolments AND assignments from the selected organisation. A learner with several organisations cannot use an assignment in one to submit evidence for a course belonging to another.
- Approvals reject past expiry dates; rejections cannot carry competency expiry.
- `GET /api/academy/curriculum/companies/:companyId/skills/:learnerId/active` returns only unexpired or non-expiring competencies, with an `asOf` timestamp. The existing historical passport endpoint is retained.
- This endpoint is not yet a machine-to-machine integration contract: Field Services and AI Workforce must use authenticated service identity, scoped permissions, and explicit external ID mapping before integration.
- No live PostgreSQL or TypeScript build verified in this pass.
