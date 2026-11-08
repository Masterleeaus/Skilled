# Product copy audit: Titan Academy (2026-11-08)

Issue: ACA-021 (P2), "Finish Titan Academy productisation and remove inherited LMS user-facing remnants".
Register status after this audit: IN PROGRESS. Only user-facing text was changed. Routes, identifiers, API fields, roles, values, emails, slugs, configuration keys and behaviour are unchanged.

## Scope and method

Searched for generic or inherited wording (`LMS`, `learning management`, `portfolio`, `student`, `teacher`, `Moodle`, `free`, `Titan`, `SkilledAt`, `Academy`) and inventoried:

- `apps/frontend/src`: `<title>` and metadata, landing page, credits page, role labels, visible headings and placeholders.
- `apps/backend/src`: user-facing error messages, email subjects and bodies (`jobs/email.queue.ts`), worker and server start-up logs.
- `apps/backend/prisma/seed.ts`: seeded display names, demo course and lesson text.
- Package names (`package.json`): checked. No package name (`lms`, `@lms/frontend`, `@lms/backend`, `@lms/shared`) is rendered in any UI, so none was changed. Renaming them would also require changes to `pnpm-lock.yaml`, which is out of scope.
- Legal text: `LICENSE` and the README "Origin and licence" section. Unchanged. The MIT copyright notice is preserved in `LICENSE`.

## Brand decision (no change made)

- The learning system is named **SkilledAt.Work**. `curriculum/research/OWNER-DECISIONS.md` (2026-11-04, "product names") records the owner's choice: "SkilledAt.Work is the learning system (LMS). SuperchargedAt.Work is the AI workforce."
- The Academy is named **Titan Academy** in the README, the register, the backend email subjects and the worker logs.
- The frontend keeps the SkilledAt.Work brand in the header and `<title>`, as the owner decided. The Titan Academy name is used in the body copy and the metadata description.
- Owner to confirm: whether the email subjects should say "SkilledAt.Work" as well as, or instead of, "Titan Academy".

## Changes by file

| File | Change |
|---|---|
| `apps/frontend/src/app/page.tsx` | Hero heading changed from "Learn, teach, and track progress — all in one place" to "Practical training for field and home-service teams". Hero paragraph replaced the generic "complete learning management platform … live classes, and certificates" with a description of the Academy's curriculum lessons, knowledge checks, assessor-reviewed evidence and organisation training. Primary button "Create free account" changed to "Create account" (no basis in the repo for a free-registration claim). Six feature cards replaced with Academy capabilities from the README: Curriculum lessons, Knowledge checks (80% pass mark, answer keys not sent), Practical evidence (acknowledgement is not a competency), Organisation training, Business-specific context (immutable snapshots), Completion reports. The old cards were Structured Courses, Quizzes & Assignments, Live Classes, Certificates, Discussions and Progress Tracking; those modules remain in the app and are unchanged. |
| `apps/frontend/src/app/layout.tsx` | Metadata `description` changed from "SkilledAt.Work training platform for field and home-service businesses" to "SkilledAt.Work learning system: Titan Academy training for field and home-service businesses". `title` unchanged. |
| `apps/frontend/src/app/credits/page.tsx` | Added an "Origin and licence" section stating that Titan Academy began from an inherited MIT-licensed LMS by Farrukh Ali Khan, that the copyright notice is kept in the LICENSE file, and that some inherited modules are not verified for Titan Academy. Existing artwork and icon disclosures unchanged. |
| `apps/frontend/src/app/admin/users/page.tsx` | Role option label "Student" changed to "Learner" (the value `STUDENT` is unchanged). |
| `apps/backend/src/modules/enrollment/enrollment.service.ts` | API not-found message "Student enrollment not found" changed to "Learner enrollment not found". |
| `apps/backend/src/modules/payments/payment.service.ts` | API not-found message "Student not found" changed to "Learner not found". |
| `apps/backend/prisma/seed.ts` | Demo display names: "Admin User" to "Demo Admin", "Teacher One" to "Demo Teacher", "Student One" to "Demo Learner". Demo course title "Node.js Masterclass" to "Demo course: Node.js basics", with description "Local demo fixture for the legacy course model. It is not Titan Academy curriculum." Demo lessons "Welcome to the course" to "Welcome to the demo course" and "Setting up your environment" to "Demo setup notes". Emails, the course slug and the category are unchanged. |

No changes were made to: `LICENSE`, `README.md`, `package.json` files, `pnpm-lock.yaml`, email subjects or bodies, routes, the `STUDENT` and `TEACHER` role values, or the course slug `nodejs-masterclass`.

## Reviewed and kept

| Item | Location | Reason kept |
|---|---|---|
| Email subjects "Verify your Titan Academy account" and "Reset your Titan Academy password" | `apps/backend/src/jobs/email.queue.ts` | Already Academy wording. Owner to confirm the brand question above. |
| `SMTP_FROM` default `no-reply@lms.local` | `apps/backend/src/config/env.ts` | A configuration default, and the visible sender of every email. Changing the default changes behaviour. Set `SMTP_FROM` to a real Academy sender in each environment (deployment item, ACA-022). |
| "Teacher" role label, "My Courses", "Assessments & grading", "Live classes", "Discussions" pages | `apps/frontend/src/app/teacher`, `student`, `admin` | Inherited modules that remain in use. Their labels describe the feature accurately. Behaviour is not re-verified for Academy (README). |
| Academy library and brand manifest keys (`"origin": "portfolio"`, `portfolio` brand entries) | `apps/frontend/src/lib/academy-library.json`, `academy-brand.manifest.json` | Internal media source keys. Not rendered as text (checked: no `.origin` usage in the frontend). |
| Unverified course slug `real-estate-portfolio-management` | `apps/backend/src/modules/curriculum/unverified-courses-hold-list.ts` | Identifier. |
| "Built with Next.js, Express, PostgreSQL, and Redis." footer | `apps/frontend/src/app/page.tsx` | Accurate technology statement. |

## Found outside scope (not changed)

These are recorded for the owner or a follow-up pull request. They are not in this change's file scope.

- `README.md`, "Testing and Quality Gates": states "33 test files passed, 7 skipped" and "532 tests passed, 75 skipped". The 2026-11-08 run on main reports 41 files passed, 7 skipped, and 623 tests passed, 75 skipped.
- Static contract scripts that currently fail on main (not caused by this change): `scripts/test-auth-route-contracts.mjs`, `test-course-publication-access.mjs`, `test-payment-security-contract.mjs`, `test-session-lifecycle-contract.mjs`, `test-video-upload-safety.mjs`. They are recorded in the register.

## Verification (2026-11-08, this branch)

- `pnpm -C apps/backend exec tsc --noEmit`: exit 0.
- `pnpm -C apps/backend exec tsc -p tsconfig.test.json --noEmit`: exit 0.
- `pnpm -C apps/backend lint`: exit 0.
- `pnpm -C apps/backend exec vitest run`: 41 files passed, 7 skipped; 623 tests passed, 75 skipped (baseline unchanged).
- `pnpm -C apps/frontend lint` (max-warnings 0): exit 0.
- `pnpm -C apps/frontend exec tsc --noEmit`: exit 0.
- `node apps/frontend/scripts/verify-academy-progress-ui.mjs`, `verify-business-context-ui.mjs`, `verify-manager-context-ui.mjs`, `verify-template-lesson.mjs`: all exit 0.
- Playwright browser suite (`apps/frontend/tests/browser/academy-browser-suite.mjs`): not run in this change. It is not wired into CI and needs Playwright and axe.

## Open follow-ups for ACA-021

1. Owner decision on the brand in email subjects (see above).
2. Set `SMTP_FROM` per environment (ACA-022).
3. Update the README test counts and product description in the next documentation pass (out of scope here).
4. Run the browser suite once CI wiring exists (ACA-019) to confirm the new landing page copy.
