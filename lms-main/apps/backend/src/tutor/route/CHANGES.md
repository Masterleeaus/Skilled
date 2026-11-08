# Tutor route (L2): changes and decisions

Files in this build:

- `src/tutor/route/tutor-route.ts`: `createTutorRouter()`, `mountTutorRouter()`, body and rate helpers.
- `src/tutor/route/tutor-wiring.ts`: real dependencies (Prisma store, runtime, learner-scoped retrieval, real auth). Loaded only when the flag is on.
- `src/tutor/access/accessible-lessons.ts`: which lesson revisions a learner may use (see "Access (fix 2026-11)" below).
- `src/app.ts`: one line, before the 404 handler.
- `tests/tutor/route/tutor-route.test.ts` (vitest, 25 tests), `tests/tutor/access/accessible-lessons.test.ts` (18 tests).
- This file.

## Access (fix 2026-11)

- Retrieval is learner-scoped. `TutorRouteOptions.retrieve` is required and receives `{ learnerId, role, companyId, text }` from auth. `createTutorRouter()` throws without it.
- The wiring builds each request's index from the database, not from the curriculum files. Only lessons the learner may open are indexed, using the revision body (`published-index.ts`).
- A lesson is usable only with an ACTIVE or COMPLETED enrolment on a published course, a placement whose revision is PUBLISHED, the saved selection (if any), the saved licence track, the level gate, and a body that matches its stored `contentHash`. These mirror the lesson-body route. The shared checks are the same services (`licenceTrackExcludes`, `lockForLesson`, `loadSavedSelection`). The lesson-body route was not changed and no helper was extracted into `curriculum/`, because that module is outside this change's scope.
- Any error while reading access data propagates. The route then returns a generic 503 and makes no model call.
- The raw-file index (`rag/curriculum-store.ts`) is refused unless `allowRawFileIndex: true` is passed. The route never passes it.

## Body size (fix 2026-11)

- Declared `content-length` above 4096 gives 413 (`sizeGate`).
- An undeclared (chunked) body above 4096 gives 413. The route's own parser reports `entity.too.large`, and that is mapped to 413. It used to be 400.
- After any parse, the re-serialised body is measured (`parsedSizeGate`). This covers the case the app-level parser (1 MB, `app.ts`) already read, and the route's own parser did not.
- Not fixed here: in production `app.ts` reads a body of up to 1 MB before the route runs. Reading only 4 KB needs the tutor mounted before the global `express.json`. That is an `app.ts` change, outside this scope.

## Decisions

1. **Flag.** `TUTOR_ENABLED` is read as the exact string `"true"`. Unset or any other value means off. It is read from `process.env` in `app.ts` and `tutor-wiring.ts`, not from `config/env.ts`, which this build does not own. The zod schema there does not know the flag, so it is not validated.
2. **Mount.** `app.ts` has one line: `if (process.env.TUTOR_ENABLED === "true") require("./tutor/route/tutor-wiring.ts").mountTutorRoute(app);`. When the flag is off, the tutor modules are never loaded and nothing is registered, so `/api/tutor` falls through to the app's 404. `mountTutorRouter()` checks `enabled` again.
3. **Limiter.** The codebase already uses `express-rate-limit` (auth and quiz routes), so it is reused. It is a fixed 60-second window, not a sliding window. The key is `learner:<learner id>`, taken from `res.locals` after authentication. The limit is `TUTOR_RATE_PER_MINUTE`, default 10, valid range 1 to 1000. Any other value throws when the router is built. The store is in memory and per process: counts reset on restart and are not shared across instances. The limiter runs after authentication and before the body is parsed, so rejected bodies still count.
4. **Body limit.** The route refuses a declared `content-length` above 4096 bytes with 413, and its own JSON parser also has a 4096-byte limit (malformed JSON gives 400). The app-level parser (1 MB, in `app.ts`) still runs first, so the route limit is a route-level cap, not a replacement for the app limit. The body must be exactly `{ message }`. Any other key gives 400. `message` is trimmed and must be 1 to 2000 characters.
5. **Company id.** The route reads `req.user.companyId` and never the body. `tutor-wiring.ts` wraps the existing `authenticate` middleware and sets that field from the learner's oldest `CompanyMember` row (Prisma delegate `companyMember`, table `academy_company_members`) with role `LEARNER`. No membership gives 403 `no_organisation`. No learner id gives 401.
6. **Auth errors.** An error from `authenticate` with `statusCode` 401 gives 401 `unauthenticated`. Any other error gives 503 `unavailable`, with no detail.
7. **Responses.** Success is `{ reply, citations }`. A policy refusal is 422 `{ error: "refused", reason: <reason code>, message: <learner text> }`. The message comes from `learnerMessageFor(reason)`, never from the learner's words, and there is no reply. Other errors: 400 `invalid_request`, 403 `no_organisation`, 413 `body_too_large`, 429 `rate_limited`, 503 `tutor_unavailable`. No stack traces, provider payloads or learner text are returned.
8. **Retrieval.** Retrieval runs in `options.retrieve`, with the learner's id and role, and searches with `PLATFORM_CURRICULUM_COMPANY_ID`. The learner's organisation is not used for search. The runtime's own retrieval stage is no longer used.
9. **Grounding and citations.** Only chunks that pass `checkGrounding()` reach the prompt or the citations. The pipeline's own citation stage is not used, because it would cite unfiltered chunks. If nothing usable remains, the route refuses with `no_curriculum_match` and makes no model call.
10. **Conversations.** The body has no conversation id, so each answered request creates a new conversation. No history is sent to the model. Refused messages are not stored. Answered messages are stored as the user message and the assistant reply, in one store call (`recordExchange`) that runs after the reply has passed the output rule.
11. **Logging.** Three events only: `tutor_refused` (reason), `tutor_provider_failed` (provider, status, retryable) and `tutor_error` (error class name). No learner text and no provider text. The policy's own refusal log has no text field.
12. **Curriculum folder.** No longer read by the route. The route's index comes from published revisions in the database (see "Access (fix 2026-11)"). `CURRICULUM_DIR` is ignored by the tutor.
13. **Import style.** Tutor and ai-runtime imports use `.ts` extensions, like the existing tutor modules, so the tests can run under Node type stripping. The existing `tsc` build does not accept `.ts` import extensions, and this build has not fixed that.
14. **Dependencies.** `express` 5.2.1 and `express-rate-limit` 8.6.0 were already declared in `package.json` but missing from the working copy. They were installed into `/tmp/tutor-route-deps` and linked as `apps/backend/node_modules`. `package.json` and the lockfile were not changed.

## Not verified

- `tsc` was not run, per instructions. The `.ts` imports and the `require` in `app.ts` have not been compiled.
- The real `authenticate` middleware was not run end to end. The membership lookup in `tutor-wiring.ts` is untested.
- The Prisma store is not checked against the real client, and its tables do not exist until the draft migration is applied. The cast in `tutor-wiring.ts` is unchecked.
- The app was not started, so the one-line mount in `app.ts` is not exercised. The flag-off test checks `mountTutorRouter()` directly, not `app.ts`.
- No real provider was called. Keys and models are unset in this environment.
- Malformed JSON on `/api/tutor` fails in the app-level parser before the route runs. What the app's error handler returns for it was not checked.

## Rename and fixes (build R2)

- `organisationId` in the route is now `companyId`. `AcademyOrganisation` is now `Company` (table `academy_companies`). The membership model is `CompanyMember`, delegate `companyMember`, table `academy_company_members`, and the lookup in `tutor-wiring.ts` selects `companyId` from `companyMember`.
- Refusals carry the learner-facing text. The log still carries only the reason code.
- Ordering: the store is called once, after the model has replied and the reply has passed the output rule. A provider failure, a grounding refusal or an output refusal writes nothing. The learner message and the reply go in one transaction (`PrismaTutorStore.recordExchange`).
- Not verified: the nested transaction and the `companyMember.companyId` select depend on the schema R1 produces. No database was used.
