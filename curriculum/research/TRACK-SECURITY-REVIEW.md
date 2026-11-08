# Licence track security review

Scope: apps/backend, endpoints added for licence tracks. Read-only review. No code was edited and nothing was committed. Each patch below is a proposal for the main session to review and apply.

Reference policy: curriculum/SCHEMA.md line 48 (required lessons are left out of the non-licensed track; the learner chooses one track clearly). Module policy: src/modules/curriculum/licence-track.ts lines 4-17 (saved track applies to learner requests; `?track=` is for previewing).

## Summary

| Severity | Count | IDs |
|---|---|---|
| High | 1 | H-1 |
| Medium | 3 | M-1, M-2, M-3 |
| Low | 3 | L-1, L-2, L-3 |
| Info / verified controls | 6 | I-1 to I-6 |

No IDOR was found in the PATCH, completions, verify or progress paths. The main defect is that the `?track=` preview override is honoured on learner endpoints, which lets an enrolled non-licensed learner read licence-required lesson bodies.

---

## H-1 (High): `?track=licensed` opens licence-required lesson bodies on the non-licensed track

File: `apps/backend/src/modules/curriculum/curriculum.routes.ts`, lines 143 and 152-153.

Scenario: a learner is enrolled with saved track `non-licensed`. A GET to `/api/curriculum/courses/:courseId/lessons/:lessonId/body?track=licensed` for a lesson with status `required` takes the override track. `assertLicenceTrackAllows("licensed", "required")` passes, and the body is returned. The policy says required lessons are left out of the non-licensed track, and the module comment says the override is for previewing. The body route is the learner's paywalled read path, so the override should not apply there. The existing test at `src/tests/academy-licence-track-saved.test.ts` line 155 only covers the refusal direction (`?track=non-licensed` for a learner saved as non-licensed). It does not cover `?track=licensed`, so this gap is untested.

Fix: learner body requests use the saved track only.

```diff
--- a/apps/backend/src/modules/curriculum/curriculum.routes.ts
+++ b/apps/backend/src/modules/curriculum/curriculum.routes.ts
@@ -140,7 +140,8 @@
   await assertEnrolled(learnerId, course.id);
   const activeEnrolment = await prisma.enrollment.findFirst({ where: { studentId: learnerId, courseId: course.id, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { id: true, licenceTrack: true } });
   if (!activeEnrolment) throw new ForbiddenError("Active course enrolment required");
-  const track = requestedLicenceTrack(req.query.track, activeEnrolment.licenceTrack);
+  // Body requests use the learner's saved track only. A ?track= preview does not open licence-required bodies.
+  const track = savedLicenceTrack(activeEnrolment.licenceTrack);
   const file = await getFileLesson(sourceId);
```

Add a test: enrolled learner saved as `non-licensed`, `GET .../body?track=licensed` on a `required` lesson returns 403 with `LICENCE_TRACK_EXCLUDED`.

Decision for the owner: if staff need a preview of licensed bodies, add a separate staff-only route gated by `requirePermission("course:create")` (as the editor routes do). Do not reuse the learner route.

---

## M-1 (Medium): `?track=licensed` on outline and progress exposes required lesson titles to a non-licensed learner

File: `apps/backend/src/modules/curriculum/curriculum.routes.ts`, line 108 (outline) and line 168 (progress/me).

Scenario: an enrolled non-licensed learner calls `/courses/:courseId/outline?track=licensed`. The response lists the titles, sourceIds and licence notices of required lessons. `/courses/:courseId/progress/me?track=licensed` returns the same excluded lessons with completion state. Bodies are not returned, so this is limited to titles and licence wording. It is still the same override problem as H-1.

Fix: use the saved track on learner endpoints.

```diff
--- a/apps/backend/src/modules/curriculum/curriculum.routes.ts
+++ b/apps/backend/src/modules/curriculum/curriculum.routes.ts
@@ -105,7 +105,8 @@
-  const track = requestedLicenceTrack(req.query.track, enrollment.licenceTrack);
+  // The learner's saved track. A ?track= preview is not honoured on learner endpoints.
+  const track = savedLicenceTrack(enrollment.licenceTrack);
@@ -166,7 +167,7 @@
   const enrolment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: learnerId, courseId } }, select: { licenceTrack: true } });
-  const track = requestedLicenceTrack(req.query.track, enrolment?.licenceTrack);
+  const track = savedLicenceTrack(enrolment?.licenceTrack);
```

After this, `requestedLicenceTrack` is used only by `course.routes.ts` line 57 (public course page). Check whether a preview needs to stay there. The public course page is unauthenticated for anonymous callers, so the override there only shows legacy modules, which have no sourceId (see I-5). Keep it, or narrow it the same way.

---

## M-2 (Medium): Knowledge-check attempts are not licence-track gated

File: `apps/backend/src/modules/curriculum/curriculum.routes.ts`, lines 237-265 (`POST /knowledge-checks/attempts`).

Scenario: a non-licensed learner posts attempts for the revision of a `required` lesson. The route checks only that the revision is published and assigned through an active course. It never checks the saved track. The attempt row is written to `academyKnowledgeAttempt`, and the response returns the score and pass result. That is a record of work on a lesson the track excludes, and it also gives an answer-key oracle (see I-6). Completions (line 191) and the body route (line 153) both refuse the lesson, so this route is inconsistent with them.

Fix: add a shared helper, placed near the top of the file after `const run = ...`, and call it from both this route and the practical-evidence route (M-3).

```ts
/** Refuses a learner action on a lesson when every enrolment that assigns it excludes it on that enrolment's saved track. Same rule as POST /completions. */
async function assertSavedTrackAllowsLesson(learnerId: string, lessonId: string): Promise<void> {
  const enrolments = await prisma.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true, licenceTrack: true } });
  const assigning = await prisma.academyCourseTrack.findMany({ where: { courseId: { in: enrolments.map(e => e.courseId) }, track: { status: "PUBLISHED", placements: { some: { lessonId } } } }, select: { courseId: true } });
  const assigningIds = new Set(assigning.map(a => a.courseId));
  const tracks = enrolments.filter(e => assigningIds.has(e.courseId)).map(e => savedLicenceTrack(e.licenceTrack));
  if (!tracks.length) return;
  const lesson = await prisma.academyContentLesson.findUnique({ where: { id: lessonId }, select: { sourceId: true } });
  if (!lesson) throw new NotFoundError("Lesson");
  const licence = await licenceIndexForTrack(tracks.includes("non-licensed") ? "non-licensed" : "licensed");
  const status = licenceStatusOf(licence, lesson.sourceId);
  if (!tracks.some(track => !licenceTrackExcludes(track, status))) throw licenceTrackExclusionError("non-licensed");
}
```

Then, in `POST /knowledge-checks/attempts`, after the `assertLessonOpen` line (currently line 243):

```diff
   await assertLessonOpen({ userId: learnerId, role: req.user?.role ?? "" }, input.lessonId);
+  await assertSavedTrackAllowsLesson(learnerId, input.lessonId);
   const enrollments = await prisma.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true } });
```

Behaviour note: the helper returns early when no enrolled course assigns the lesson, so the existing "not assigned" 403 that follows still decides that case.

---

## M-3 (Medium): Practical-evidence submission is not licence-track gated

File: `apps/backend/src/modules/curriculum/curriculum.routes.ts`, lines 274-294 (`POST /practical-evidence`).

Scenario: a learner submits practical evidence for a lesson the saved non-licensed track excludes. The route checks the revision, organisation assignment and membership, but not the track. Evidence is then queued for assessor review. Reviewer time is spent on work the track excludes, and the record can later be reviewed as a competency. Severity is Medium because it needs an organisation assignment, which limits who can reach it.

Fix: call the helper from M-2 after the revision check (current line 279).

```diff
   const revision = await prisma.academyLessonRevision.findFirst({ where: { id: input.revisionId, lessonId: input.lessonId, status: "PUBLISHED" } });
   if (!revision) throw new ForbiddenError("Published lesson revision required");
+  await assertSavedTrackAllowsLesson(learnerId, input.lessonId);
   const enrolled = await prisma.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true } });
```

---

## L-1 (Low): Two open checkouts on different tracks can both be paid, and the second track is silently dropped

File: `apps/backend/src/modules/payments/payment.service.ts`, lines 17-20 (checkout guard) and 107-111 (verify upsert, `update: {}`).

Scenario: a learner starts checkout as `licensed`, then starts a second checkout as `non-licensed` before paying. Checkout only refuses when an enrolment already exists, so both sessions are created. Pay both, and the first one creates the enrolment on its track. The second payment is marked SUCCEEDED with its own track, but the `update: {}` in the upsert leaves the enrolment on the first track. The learner has paid twice, and the record of what they paid for does not match the enrolment.

Fix: refuse a second open checkout on a different track.

```diff
--- a/apps/backend/src/modules/payments/payment.service.ts
+++ b/apps/backend/src/modules/payments/payment.service.ts
@@ -17,6 +17,11 @@
   const alreadyEnrolled = await prisma.enrollment.findUnique({
     where: { studentId_courseId: { studentId, courseId } },
   });
   if (alreadyEnrolled) throw new AppError("Already enrolled in this course", 409);
+  const openCheckout = await prisma.payment.findFirst({ where: { studentId, courseId, status: "PENDING" }, select: { licenceTrack: true } });
+  if (openCheckout && openCheckout.licenceTrack !== licenceTrack) {
+    throw new AppError("A checkout for this course is already open on the other licence track. Finish or cancel it first.", 409);
+  }
```

Decision for the owner: whether to allow reuse of the same open checkout instead. The patch above allows a second same-track checkout, which matches today's behaviour.

---

## L-2 (Low): Outline on the licensed track does not show the generic licence notice when the licence file is unavailable

File: `apps/backend/src/modules/curriculum/curriculum.routes.ts`, lines 109-114.

Scenario: the licence file cannot be read and the learner is on the licensed track. `filterLessonsForTrack` (licence-track.ts lines 233-236) gives such lessons the generic `required` notice. The outline does not use that function. It calls `licenceNoticeOf(licence, sourceId)`, which returns null when the index is empty, so the learner sees no licence notice for lessons that may need one. The licence-track.ts header (lines 13-14) says fail closed. The outline does not match that.

Fix: when the index is unavailable, use the generic notice.

```diff
-  sendSuccess(res, { courseId: course.id, licenceTrack: track, tracks: tracks.map(t => ({ ...t, track: { ...t.track, placements: t.track.placements.filter(visible).map(p => { const levelLock = lockFor(course.slug, p.lesson.sourceId); return { ...p, lesson: { id: p.lesson.id, sourceId: p.lesson.sourceId, title: p.lesson.title }, levelLock, licence: licenceNoticeOf(licence, p.lesson.sourceId), revision: p.revision ? outlineRevision(p.revision) : null }; }) } })) });
+  const noticeFor = (sourceId: string) => licence.available ? licenceNoticeOf(licence, sourceId) : { status: "required" as const, limit: null, reason: "A licence is required for this work." };
+  sendSuccess(res, { courseId: course.id, licenceTrack: track, tracks: tracks.map(t => ({ ...t, track: { ...t.track, placements: t.track.placements.filter(visible).map(p => { const levelLock = lockFor(course.slug, p.lesson.sourceId); return { ...p, lesson: { id: p.lesson.id, sourceId: p.lesson.sourceId, title: p.lesson.title }, levelLock, licence: noticeFor(p.lesson.sourceId), revision: p.revision ? outlineRevision(p.revision) : null }; }) } })) });
```

Use the exported `GENERIC_REQUIRED_REASON` if it is exported. It is currently a private constant in licence-track.ts (line 54), so either export it or keep the literal as shown.

---

## L-3 (Low, pre-existing): Anonymous course page returns lesson video URLs for every lesson

File: `apps/backend/src/modules/courses/course.service.ts`, lines 70-76 (`loadCourseBySlug` includes every lesson field). Exposed by `apps/backend/src/modules/courses/course.routes.ts` lines 46-63.

Scenario: an anonymous GET to `/api/courses/:slug` returns `videoUrl` and `duration` for every legacy lesson, not only `isFreePreview` lessons. The model has an `isFreePreview` flag (prisma/schema.prisma line 229), which the response does not use. This is not part of the licence change, and I did not confirm from history that it predates today's work, because the repo has no git metadata. It bears directly on the paywall. The optional-auth change makes this route the one the task asked about, so it is included.

Fix: strip `videoUrl` from lessons that are not free previews unless the caller is enrolled. Keep the enrolment lookup already in the route.

```diff
--- a/apps/backend/src/modules/courses/course.routes.ts
+++ b/apps/backend/src/modules/courses/course.routes.ts
@@ -57,7 +57,15 @@
     const track = requestedLicenceTrack(req.query.track, enrolment?.licenceTrack);
     const index = await getLicenceIndex();
-    return sendSuccess(res, { ...course, modules: filterModulesForTrack(course.modules, track, index), licenceTrack: track });
+    const modules = course.modules.map((mod) => ({
+      ...mod,
+      lessons: mod.lessons.map((lesson) => (enrolment || lesson.isFreePreview ? lesson : { ...lesson, videoUrl: null })),
+    }));
+    return sendSuccess(res, { ...course, modules: filterModulesForTrack(modules, track, index), licenceTrack: track });
```

Decision for the owner: whether `videoUrl` is meant to be public. If it is, drop this finding.

---

## Info and verified controls

- **I-1 PATCH `/enrollments/:courseId/licence-track` has no IDOR.** `setEnrolmentLicenceTrack` (enrollment.service.ts lines 31-42) finds the enrolment by `studentId` from the JWT and `courseId`, then updates by the found `id`. It refuses CANCELLED and missing enrolments. `requireRole("STUDENT")` applies. The body is validated by `z.enum(LICENCE_TRACKS)` (enrollment.validators.ts lines 11-13). The response contains only the learner's own fields.
- **I-2 Completions use the saved track only.** `POST /curriculum/completions` (curriculum.routes.ts lines 173-196) ignores `?track=` and refuses only when every assigning enrolment excludes the lesson. The test at academy-licence-track-saved.test.ts line 252 covers the override. Revision and lesson are matched (line 178).
- **I-3 Verify cannot change the track from Stripe metadata.** `verifyAndCompletePayment` (payment.service.ts lines 91-99) compares Stripe's `licenceTrack` with the stored `payment.licenceTrack`, and a mismatch returns 409. The enrolment is then created from `payment.licenceTrack` (line 109), which the server wrote at checkout. A missing metadata value reads as the default and is compared the same way. Metadata is set server-side (stripe.provider.ts line 38) and the session ID is matched to the payment (line 91). Verify is also limited to the payment's owner (line 81). The webhook (stripe.webhook.ts line 37) passes no student ID but requires a valid Stripe signature.
- **I-4 Optional auth cannot leak other learners' data.** `optionalAuthenticate` (course.routes.ts lines 22-25) swallows authentication failures and continues anonymously. The only learner-specific read is the caller's own enrolment `licenceTrack` (line 55). The response spreads the course and includes no enrolment list. A bad token gets the default track, which is the stricter one.
- **I-5 The public course page does not apply the track to legacy lessons.** Legacy `Lesson` rows have no `sourceId` (prisma/schema.prisma lines 222-239), so `filterLessonsForTrack` keeps them on both tracks. `?track=` on the public page therefore changes nothing for legacy content. The licence gate for academy content runs on the outline and body routes.
- **I-6 Knowledge-check answer oracle (pre-existing).** `POST /knowledge-checks/attempts` returns the score for any submitted answer vector (curriculum.routes.ts lines 263-264). A learner can search for correct answers one question at a time. This predates the licence change. Fix it separately by returning only pass or fail and withholding the per-question score, or by rate limiting. Addressing it is separate from the track work.

Other notes, not findings:
- `isLicenceOnly` (licence-track.ts lines 176-178, used in level.service.ts line 75) means required lessons never gate a level, on either track. That is a documented design choice. It is not a security defect, but the owner may want to confirm it on the licensed track.
- `PATCH /enrollments/lessons/:lessonId/progress` (enrollment.routes.ts line 118) has no licence check. Legacy `Lesson` has no `sourceId`, so the licence rules do not apply to it by construction.

## Tests to add with the patches

1. Body: non-licensed learner, `?track=licensed`, required lesson, expect 403 `LICENCE_TRACK_EXCLUDED` (covers H-1).
2. Outline and progress: non-licensed learner, `?track=licensed`, expect no required lessons (covers M-1).
3. Knowledge-check attempt and practical evidence: non-licensed learner on a required lesson, expect 403 `LICENCE_TRACK_EXCLUDED` (covers M-2, M-3).
4. Checkout: open a licensed checkout, then a non-licensed one, expect 409 (covers L-1).
