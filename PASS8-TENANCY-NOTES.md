# Pass 8: Organisation-scoped training assignments

New organisations, memberships and course assignments are additive and use existing LMS users/courses. Only a manager or owner may manage members or assignments for that organisation; learners may read only their own assignments. Assignment creation does not automatically enrol a learner or certify a competency.

**Security blockers before production:** The pre-existing global `/practical-evidence/pending` and `/practical-evidence/:id/review` endpoints are not tenant-scoped. They must be redesigned to bind evidence to an organisation and verify an assessor membership. Existing global editorial routes also require tenant ownership policies. No live identity federation or workforce integrations are implemented. Database migration and TypeScript compilation remain unverified.
