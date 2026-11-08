# Field service concepts to Titan Zero Field entities (DRAFT)

Status: DRAFT. Reviewer status: NOT REVIEWED.
Lessons that use this map: SFS-01 to SFS-16 in curriculum/shared/app/.

## Basis and limits

- Source: Salesforce field service implementation guide (Spring '22, last updated 1 March 2022). Rights: not held by user. Concepts are reworded here, with no phrases copied from the guide.
- Page numbers come from the guide's contents and printed page markers. A row marked "approximate" has no confirmed page.
- The ai-fsm project was not found in the workspace. The search covered the home, mnt, workspace and root folders for ai-fsm, Titan Zero Field and related names. No Titan Zero Field entity could be checked against code.
- Every entity below is PROPOSED. Each needs checking against the Titan Zero Field code before any build work relies on it. Entity names are not confirmed.
- The guide describes a Salesforce product. Only the concepts are used, not its setup steps.

## Mapping

| # | Concept from the guide (own words) | Guide pages | Proposed Titan Zero Field entity | One-line app need | Lessons |
|---|---|---|---|---|---|
| 1 | Region a team covers, with a boundary and an optional parent | pp. 22-28 | Service area | Boundary text, map point, parent link, size warnings | SFS-02 |
| 2 | Worker's link to an area as main base, backup or temporary cover | pp. 22-28 | Area membership | Role, from and to dates, home base map point | SFS-02 |
| 3 | Hours a worker or area can take visits, with time blocks | pp. 22-28 | Working hours | Weekly pattern per area and per worker, plus time blocks | SFS-03 |
| 4 | Irregular or on-call cover | pp. 96-101 | Shift | Status (tentative, published, confirmed), optional area and worker | SFS-03 |
| 5 | Reusable definition of a repeat service | pp. 29-39 | Job template (work type) | Duration, skills, parts, reference link, automatic visit flag | SFS-04 |
| 6 | Skill a worker needs for a job | pp. 29-39 | Required skill | Setting for hard rule or suggestion (enforcement UNCONFIRMED) | SFS-04 |
| 7 | Customer request header | pp. 82-95 | Job (work order) | Customer, site, template, status, price | SFS-01, SFS-05 |
| 8 | Step within a job that carries a price and a tick | pp. 82-95 | Job task line (the guide's term: child item of a job) | Per-task status, price, discount | SFS-05 |
| 9 | Follow-up job created after a cancellation | pp. 83-88 | Linked follow-up job (child job) | Parent link and cancellation reason | SFS-05 |
| 10 | Equipment at a site with its own service history | pp. 4-9 and 91-95 | Asset | Site link and parent-child hierarchy | SFS-01, SFS-06 |
| 11 | Recurring preventive visits generated in batches | pp. 91-95 | Maintenance plan | Repeat interval, generation window, end date, template | SFS-06 |
| 12 | Scheduled trip to a site for a job | pp. 115-118 | Visit (service appointment) | Window, duration, parent link, assigned worker | SFS-01, SFS-07 |
| 13 | Stages a visit passes through | pp. 62-63 | Visit status | Stage list and a reason for each unable-to-finish outcome | SFS-07 |
| 14 | Ranking of urgency on jobs and visits | pp. 118-132 | Priority | Written scale; visit priority falls back to job priority | SFS-08 |
| 15 | One visit held until another finishes | pp. 118-132 | Visit dependency | Link that blocks the second visit | SFS-08 |
| 16 | Urgent booking that shows nearby workers | pp. 118-132 | Emergency visit flag | Nearby-worker view (UNCONFIRMED: not built) | SFS-08 |
| 17 | Overlap between a visit and another visit or absence | pp. 133-134 | Clash check and at-risk flag | Rules for moves to original or any suitable worker | SFS-09 |
| 18 | Gathering nearby visits on one day | pp. 135-136 | Grouping suggestion | Customer window check before any move | SFS-09 |
| 19 | Filling free time with suitable work | pp. 137-138 | Gap-filler candidates | Candidate list and confirmation before booking | SFS-09 |
| 20 | Sending a scheduled visit to a worker's device | pp. 139-140 | Dispatch action | Notification to worker and a dispatch log | SFS-10 |
| 21 | Releasing visits one at a time | pp. 139-140 | Drip-feed release setting | Release only after the prior visit finishes (support UNCONFIRMED) | SFS-10 |
| 22 | Person or contractor who does the work | pp. 42-47 | Worker (service resource) | Skills, home base, status, contact | SFS-11 |
| 23 | Limit on work per period | pp. 42-43 | Capacity record | Hours or visit count per period, with a date range | SFS-11 |
| 24 | Pace factor that changes planned visit length | pp. 43-44 (approximate) | Efficiency factor | Adjusts planned visit length per worker | SFS-11 |
| 25 | Favoured, mandatory or barred worker for a job | pp. 88-89 | Worker preference | Inherits from asset, then site, then customer | SFS-11 |
| 26 | Group of workers attending one visit | pp. 48-49 and 110-114 | Crew | Leader, minimum headcount, date range | SFS-12 |
| 27 | A worker's place within a crew | pp. 110-114 | Crew membership | Non-overlapping dates inside the area membership | SFS-12 |
| 28 | Logged hours with approval | pp. 102-105 | Time sheet | Entry, submission, approval | SFS-13 |
| 29 | Period a worker cannot take work | pp. 106-107 | Absence | Type and dates feeding the scheduler | SFS-13 |
| 30 | Planned path and recorded path for a day | pp. 107-108 | Daily route | Planned and recorded paths (location consent UNCONFIRMED) | SFS-13 |
| 31 | Parts needed for a template or job | pp. 55-60 and 141-151 | Required parts | Stock check before dispatch | SFS-14 |
| 32 | Request for stock to be sent to a job | pp. 146 | Stock request | Job link, date, quantity | SFS-14 |
| 33 | Movement of stock between two places | pp. 147 | Stock transfer | From-location, to-location, level update | SFS-14 |
| 34 | Stock used on a job | pp. 150 | Used-parts record | Job link, quantity, cost | SFS-14 |
| 35 | Stock in transit between places | pp. 151 | Stock shipment | Need for small teams (UNCONFIRMED) | SFS-14 |
| 36 | Item sent back by a customer or worker | pp. 151-152 (approximate) | Stock return | Reason and repair link | SFS-14 |
| 37 | Data stored on the device before going offline | pp. 290-335 | Offline data pack (priming) | Date window and defaults (Titan window UNCONFIRMED) | SFS-15 |
| 38 | Queue of changes waiting to upload, with conflicts | pp. 290-335 | Sync queue | Order, pause on conflict, delete or edit | SFS-15 |
| 39 | Summary document of a visit, built from a template | pp. 76-81 | Service report template | Fallback order and a default that stays active | SFS-16 |
| 40 | Customer or site contact signing a summary | pp. 76-81 | Customer sign-off | Signer role and date | SFS-16 |
| 41 | Bill issued for completed work | not in the sections read | Invoice | Link from job task lines to invoice (UNCONFIRMED) | none |

## Entities not covered by the guide

- Invoice, quote and payment records are not covered by the sections read. Row 41 is a placeholder link only.
- Job card: the app may show job task lines as a job card. This is a view choice, not an entity from the guide. UNCONFIRMED.
- Titan-specific rules for skills, drip-feed, emergency view, location consent, and offline windows are all UNCONFIRMED until the app is checked.

## Decisions for review

1. Course slugs: no existing folder in curriculum/courses/ fits a field-service concept. All SFS lessons use an empty courseSlugs list.
2. Module title: the proposed module "App: Field service operations" is not in curriculum/structure. It needs adding by the owner.
3. Lesson type RH is used for lessons with a hands-on app procedure. The meaning of RH is not defined in SCHEMA.md and is UNCONFIRMED.
