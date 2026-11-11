# Pass 12 — Learner course-outline access control

The published curriculum outline includes full instructional lesson bodies. Previously, any authenticated user could request any published course outline, regardless of enrolment. The outline route now checks the authenticated user ID and requires an ACTIVE enrolment in the requested course before fetching or returning track content. The check does not change the editor-only authoring endpoints.

## Verification
Static regression checks validate that the access gate occurs before curriculum content is fetched. No live database or browser integration test has been performed. Further review is required for organisation-scoped course entitlement, course visibility, and staff training administration.
