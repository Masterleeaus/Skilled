# Accessibility audit: learner, assessor and manager interfaces (2026-11-08)

Tracking: issue #33 (ACA-023). Branch `claude/finish-a11y-audit`. Remaining items (light-theme contrast, login field errors, teacher labels, captions) were finished on `claude/finish-a11y-remaining` (S3); see "Remaining items (S3, issue #33)" below. The light-theme row in the results table is superseded by that section.

## Method

- Frontend served by `next dev`, with the API mocked in the browser (Playwright routing), so each page
  could be rendered in a state with data (lesson player with a knowledge check, quiz, assessor evidence
  queue, manager lesson configuration). The local database holds one course with no lessons, so the
  backend alone could not reach those states.
- Chromium 1243 from `/opt/pw-browsers/chromium`, viewport 1280 px (and 375 px for reflow), `deviceScaleFactor` 1.
- axe-core 4.12.1, installed outside the repo, injected with `addScriptTag`. Rule set: WCAG 2.0/2.1 A and AA,
  plus best-practice, run on the full document.
- Manual review of the markup of each in-scope component, for issues axe cannot see (ARIA state, names
  that repeat, groups, heading levels, reflow).
- Regression check: `apps/frontend/tests/browser/a11y-audit.mjs`. It covers 26 states (the 12 learner, assessor and
  manager states, and 14 teacher routes added in S3). It fails on any axe violation (WCAG and best practice), on any
  visible text below its WCAG contrast ratio, and on any render error. Run by hand, not in CI. It runs in the dark
  theme by default, or in the light theme with `A11Y_COLOR=light`.
- Contrast is measured directly, not only by axe. axe-core 4.12 cannot parse the `oklch(L C none)` colours that
  Tailwind v4 emits for the neutral and slate scales, so it reports that text as "incomplete" and does not check it.
  The earlier light-theme result (`color-contrast` only) therefore understated the problem. The script resolves each
  text colour against its effective background and reports failures as `color-contrast-measured`.

## Results after fixes

| Theme | Pages checked | axe violations |
|---|---|---|
| Dark (design target) | 14 states at 1280 px (axe, WCAG and best practice); 14 states at 375 px (axe WCAG, plus horizontal overflow) | 0 violations, 0 px overflow |
| Light (`prefers-color-scheme: light`) | same 14 states at 1280 px | 13 of 14 states with `color-contrast` only (open, see F-04); no other rule fails |

### Remaining items (S3, issue #33)

Audit run: 26 states at 1280 px (12 learner, assessor and manager, and 14 teacher), `a11y-audit.mjs` with
axe-core 4.12.1 (outside the repo) and the measured text-contrast check. Counts are violation nodes.

| Run | States clean | `color-contrast-measured` (text below AA) | axe `color-contrast` | axe `label`, `select-name` | axe `heading-order` |
|---|---|---|---|---|---|
| Light, before | 0 of 26 | 146 | 8 | 10, 2 | 3 |
| Light, after | 23 of 26 | 0 | 0 | 0, 0 | 3 |
| Dark, before | 20 of 26 | 0 | 0 | 10, 2 | 3 |
| Dark, after | 23 of 26 | 0 | 0 | 0, 0 | 3 |

The three states still reported are teacher home, student detail and live classes, each with one `heading-order`
(moderate, best practice). That is outside the labels-only scope of this item (see F-19).

Verification: `pnpm -C apps/frontend lint` exit 0 (`--max-warnings=0`); `tsc --noEmit` exit 0; `next build` exit 0;
backend `vitest run` 69 files, 1029 passed, 1 skipped (unchanged). No backend or schema change.

## Findings

Severity follows the issue scale: critical blocks use of the page, serious blocks a user group, moderate is a
best-practice or usability gap. "Found by" is `axe` (rule ID) or `manual`.

| ID | Severity | Route | Rule | Found by | Finding | Status |
|---|---|---|---|---|---|---|
| F-01 | critical | `/login`, `/register` | `label` (WCAG 1.3.1, 3.3.2, 4.1.2) | axe | Email, password, and full name inputs had visible labels that were not associated with the inputs. | Fixed: `htmlFor`/`id` pairs, `autocomplete` added. |
| F-02 | critical | `/profile` | `label` | axe | Full name, email and role inputs had no programmatic label. | Fixed: `htmlFor`/`id`. |
| F-03 | serious | Dark theme: course, player, profile, manager pages | `color-contrast` (WCAG 1.4.3) | axe | `text-neutral-500` (#737373) on #0a0a0a is 4.17:1 and on #171717 is 3.78:1. | Fixed: dark theme only, `:root:not(.light) .text-neutral-500` set to #8c8c8c (5.9:1 on #0a0a0a) in `globals.css`. Light theme unchanged. Note: this is a CSS rule, outside the markup-only scope; it is the only change that covers every use of the class. |
| F-04 | serious | Light theme: all in-scope pages (Topbar, login, register, course, player, quiz, assessor, manager) | `color-contrast` (WCAG 1.4.3, 1.4.11) | axe, plus measured | Text uses `neutral-300/400` and `slate-100/300/400`, chosen for dark surfaces. On the white light-theme background they fall to 2.58:1 (for example #a1a1a1 on #ffffff). Dark-styled surfaces (inputs, cards, selected rows) and `text-white` links were unreadable on white. Status text (`red-400`, `amber-300`, `green-400`) was too pale on white. | Fixed (S3): light theme token pass in `globals.css`, all rules under `:root.light`. Text greys, dark surfaces, borders (3:1), status text, focus rings and solid buttons are remapped. The dark theme and the component markup are unchanged. Result: 0 measured contrast failures in 26 states. |
| F-05 | serious | `/student/courses/[slug]` (player) | WCAG 1.2.2 (captions) | manual | Lesson videos have no caption track. The lesson schema has no track field. | Open (S3, not implemented). The lesson schema has no caption track field, so this is a schema change and needs content work (existing TODO ACA-023 item 5). S3 scope was frontend and markup only, with the schema frozen. |
| F-06 | serious | `/student/quizzes/[quizId]` | WCAG 1.3.1, 4.1.2 | manual | Free-text answer had no accessible name. Choice groups had no group name. | Fixed: question text is the textarea name; each option group is `role="group"` labelled by the question. |
| F-07 | serious | `/student/assignments/[assignmentId]` | WCAG 3.3.2, 4.1.2 | manual | Written submission had only a placeholder. File input had no name. | Fixed: `aria-label` on both controls. |
| F-08 | moderate | `/student/courses/[slug]` | WCAG 4.1.2 (role/name) | manual | Course progress bar was a plain div, so its value was not exposed. | Fixed: `role="progressbar"` with min, max and now values, and a name. |
| F-09 | minor | `/student/courses/[slug]` | WCAG 1.1.1 | manual | Decorative emoji in Live Classes and Discussions links were read as names. | Fixed: emoji wrapped in `aria-hidden`. |
| F-10 | moderate | Topbar (all authenticated pages) | WCAG 4.1.2 | manual | User menu button did not expose its open state. The theme toggle button relied on `title` for its name. | Fixed: `aria-expanded`; `aria-label` on the toggle. |
| F-11 | moderate | `AdminNav` (manager pages) | WCAG 4.1.2 | manual | The current page was not exposed. | Fixed: `aria-current="page"`. |
| F-12 | moderate | `/login`, `/register` | `landmark-one-main`, `region` (best practice) | axe | No `<main>` landmark. | Fixed: `<main>` on the form and success states. |
| F-13 | moderate | `/student/courses/[slug]` (licence track chooser) | `heading-order` (best practice) | axe | Heading jumped from the page heading to level 3. | Fixed: heading levels 2 and 3. Visual styles unchanged. |
| F-14 | serious | Topbar, manager pages at 375 px | WCAG 1.4.10 (reflow) | manual | Topbar and admin navigation overflowed horizontally (up to 124 px). | Fixed: `flex-wrap` on the Topbar header and the admin nav. No horizontal scroll at 375 px on any checked page. |
| F-15 | moderate | `/admin/business-context` | WCAG 2.4.4, 4.1.2 | manual | "Edit draft", "Approve for learners" and "Retire" repeated for each field with no field name. | Fixed: visually hidden field name added to each button. Visible text unchanged. |
| F-16 | moderate | `/academy/assessor` | WCAG 3.3.1, 3.3.3 | manual | Assessor notes textarea did not describe its error. | Fixed: `aria-describedby` includes the error when present. |
| F-17 | minor | Login and register | WCAG 3.3.1 | manual | Field validation messages from react-hook-form are not linked to their inputs. | Fixed (S3) on login: `aria-invalid` and `aria-describedby` on email and password, pointing at the error text. Checked in a browser after an empty submit. Register is not changed yet (see F-21). |
| F-18 | minor | Quiz, assignment | WCAG 3.3.4, 4.1.3 | manual | Submit errors are reported with `alert()`. | Open. Behaviour change, not a markup fix. Owned by the quiz and assignment work. |
| F-19 | serious (confirmed in render) | Teacher pages (`/teacher/...`) | `label` (WCAG 1.3.1, 3.3.2), `select-name` | axe, rendered | Rendered in S3 (14 teacher routes). Labels were not tied to their controls on course creation (5 controls), quiz builder (3), assignment builder (3). Live class start date/time had no name (1). Fixed (S3): `htmlFor`/`id` pairs on the existing labels, and `aria-label` on the live class date/time input, since it had no visible label. Visible text unchanged. Remaining: `heading-order` (moderate, best practice) on teacher home, student detail and live classes. Open: heading levels are not in the labels-only scope; the teacher owner should decide the level changes. |
| F-20 | minor (new, S3) | Light theme: primary buttons (`bg-white`) | WCAG 1.4.11 | manual, screenshot | In the light theme, the white primary buttons (for example "Log in", "Create course") have no visible boundary on the white page. The label text passes contrast. Open. A button style decision (outline or dark fill in light theme) is needed. It is not a token value change. |
| F-21 | minor (new, S3) | Register page, other forms | WCAG 3.3.1 | manual | The same `aria-invalid`/`aria-describedby` pattern from F-17 is not applied to register or other form pages. Open: out of the login-page scope of this item. |

## Not covered

- Admin pages outside the manager context pages. Teacher pages are now covered by the mocked render (S3, F-19), not
  by real data. Teacher routes with a different path (for example, quiz grading with real attempts) are only partly covered.
- Real backend data for quizzes, assignments, evidence queues and lesson revisions. The mocked states cover the
  same components, but not the server's responses.
- Screen-reader testing with NVDA, JAWS or VoiceOver. Results above are from axe and markup review only.
- Keyboard-only walk-through of every route. The existing player suite (`academy-browser-suite.mjs`) covers the
  player keyboard path.

## Files changed

- `apps/frontend/src/app/globals.css` (F-03)
- `apps/frontend/src/app/(auth)/login/page.tsx`, `apps/frontend/src/app/(auth)/register/page.tsx` (F-01, F-12)
- `apps/frontend/src/app/profile/page.tsx` (F-02)
- `apps/frontend/src/app/student/quizzes/[quizId]/page.tsx` (F-06)
- `apps/frontend/src/app/student/assignments/[assignmentId]/page.tsx` (F-07)
- `apps/frontend/src/app/student/courses/[slug]/page.tsx` (F-08, F-09)
- `apps/frontend/src/app/admin/business-context/page.tsx` (F-15)
- `apps/frontend/src/app/academy/assessor/page.tsx` (F-16)
- `apps/frontend/src/components/Topbar.tsx` (F-10, F-14)
- `apps/frontend/src/components/ThemeToggle.tsx` (F-10)
- `apps/frontend/src/components/AdminNav.tsx` (F-11, F-14)
- `apps/frontend/src/components/LicenceTrackChooser.tsx` (F-13)
- `apps/frontend/tests/browser/a11y-audit.mjs` (regression check, S3: teacher routes, both themes, measured contrast, page errors)

S3 additions:

- `apps/frontend/src/app/globals.css` (F-04, light theme token pass, `:root.light` only)
- `apps/frontend/src/app/(auth)/login/page.tsx` (F-17)
- `apps/frontend/src/app/teacher/courses/new/page.tsx`, `teacher/courses/[slug]/quizzes/new/page.tsx`,
  `teacher/courses/[slug]/assignments/new/page.tsx`, `teacher/courses/[slug]/live-classes/page.tsx` (F-19)

Verification (initial pass): `pnpm -C apps/frontend lint` exit 0 (`--max-warnings=0`); `pnpm -C apps/frontend exec next build` exit 0;
`tsc --noEmit` for the frontend exit 0; `a11y-audit.mjs` dark theme: 12 pages clean. S3 verification: see Remaining items.
