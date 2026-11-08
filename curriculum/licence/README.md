# Licence data: files and fields

Updated 2026-11-09. This folder holds the licence register and the cost checks. No voice layer is built here.

## Files

| File | What it is | Source of truth? |
|---|---|---|
| `lesson-licence.json` | The register: one entry per lesson. | Yes |
| `licence-index.json` | AI-readable view of the register, by lesson and by course. Generated from the register. | No, derived |
| `cost-checks.json` | Dollar figures from licence and insurance rules, each with a dated, linked record. | Yes, for cost figures |
| `official-source-checks-2026-11-09.json` | Log of each official page fetched on 2026-11-09, with the page date and the quote, or the reason it was blocked. | Yes, for the 2026-11-09 checks |
| `COMPLETION-RULE-PROPOSAL.md` | Proposed rule for courses without a licence rule. Not applied. | Proposal |

The older files in this folder (boom, note cleanup, register sync and so on) are records of earlier passes. They were not changed in this pass.

## Status vocabulary (lessons)

- `required`: a licence is needed for the lesson's work.
- `threshold`: a licence is needed above a stated value, size or other limit (stated in `limit`).
- `not_required`: no licence is needed. Only used with an official URL and page date. None are used at present.
- `not_checked`: no licence rule has been confirmed. The lesson is a coverage entry, not a finding that no licence applies.

## Fields in `lesson-licence.json`

- `lessonId`: the lesson ID used in the course structure file.
- `status`: one of the four values above.
- `limit`: the trigger, as stated by the source, or null.
- `officialWording`: quotes or summaries from the official source. Some are marked "WebFetch summary; not verbatim".
- `officialUrl`: the official page or pages, as a string or a list.
- `pageDate`: the date the page shows, as text. "No date shown" means the page has no date.
- `states`: jurisdictions, as recorded. "not checked" or "not confirmed" means none recorded.
- `note`: review notes, including the 2026-11-09 changes.
- `prior_status`, `prior_basis`: only on entries demoted on 2026-11-09 (from `not_required` with no official URL).
- `basis`: how the status was reached.

## Fields in `licence-index.json`

Top level: `schemaVersion`, `generated`, `scope`, `statusCounts`, `courseCount`, `coursesLicenceComplete`, `lessons`, `courses`, and the paths to the other two files.

Each lesson:
- `lessonId`, `title` (from the course structure file), `courses` (slugs that place the lesson).
- `status`, `priorStatus`, `limit`.
- `jurisdictions`: as recorded in the register. Empty means not recorded, not "none".
- `sourceUrls`, `sourceHosts`, `pageDateShown`.
- `hasDatedSource`: true if there is at least one official URL and the page date is recorded as a date (not "No date shown"). This does not mean the page was re-read.
- `verifiedOn20261109`: true only if one of the lesson's URLs was fetched and its page was checked on 2026-11-09 (see the checks log).
- `licenceComplete`: true if the status is `required` or `threshold` and `hasDatedSource` is true. Under the proposal this is the lesson-level test. Not all of these have been re-read.
- `plainSummary`: one plain sentence a chatbot may read out. For `not_checked` it says the status is not checked.

Each course: `slug`, `title`, `group`, `placedLessons`, `byStatus`, `licenceComplete` (true only if every placed lesson is complete), `lessonIds`.

## Fields in `cost-checks.json`

- `checks[].id`: CC-01 to CC-15.
- `figure`, `rule`, `jurisdiction`, `regulator`.
- `status`: `verified` (fetched 2026-11-09, page dated within a year), `verified_page_old` (fetched, but the page date is more than a year old), `verified_no_date` (fetched, no page date), `conflict` (sources disagree), `not_checked` (not fetched).
- `sourceUrl`, `pageDateShown`, `fetchedOn`, `quoted`, `lessonsAffected`, `note`.
- `statusVocabulary` at the top explains each status.

## Known gaps

- 624 lessons are `not_checked`. Their licence position is unknown.
- 23 `threshold` entries still have no page date. The 2026-11-09 fetch dated four of them.
- Eight official URLs were not on the session allowlist and were not fetched (listed in the checks log).
- The QBCC figures ($3,300, $1,100, $11,000) come from a page last reviewed in 2021.
- The dog-walking public liability figures conflict ($20 million in CC-13, $10,000,000 in CC-14).
