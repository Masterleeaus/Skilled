# Licence matrix: stale rows and conflict status

Checked 2026-11-03. Proposals only. No matrix row, lesson or other file was edited.

Sources:
- Matrix: `curriculum/research/trades/LICENCE-MATRIX.csv`. ACT-22 is not in this file. It is in `curriculum/research/trades/LICENCE-MATRIX-TAS-ACT-NT.csv`, so it is included here.
- Conflict record: `/home/claude/work/licence-conflicts-report.json` (outside the repo). Each conflict and its fetched official pages are in that file.

## 1. Stale rows

| Row id | What the row says now | What the evidence says now | Proposed change |
|---|---|---|---|
| ACT-22 (in LICENCE-MATRIX-TAS-ACT-NT.csv) | CONFIRMED. A boom-type elevating work platform needs a WP licence at a boom length of 11 m or more. Notes: "Page shows fees for 1 July 2025 to 30 June 2026." | No ACT page was read on 3 Nov 2026. The conflict record and the work files hold no ACT fetch. The fee period quoted ended on 30 June 2026, so the cited source is out of date. | Status CONFIRMED to PARTIAL. Note: "11 m threshold not re-read on 3 Nov 2026; quoted fee period has ended; re-read the Access Canberra page." |
| VIC-32 (asbestos, small non-friable removal) | CONFIRMED. Non-friable up to 10 m2 total and up to 1 hour in any 7 days; contaminated dust up to 10 minutes under the same 7-day cap. | The Victorian page (fetched 3 Nov, C3 official_page.supports) says the 1-hour limit is counted across all employees, and that friable asbestos has no exception. The 10-minute dust clause is not in that fetched text. | Add "counted across all employees" to the trigger text. Keep CONFIRMED for the 10 m2 and 1-hour limits. Mark the 10-minute dust clause as not re-verified. Set date_checked to 2026-11-03. |
| NSW-01 (painting) | CONFIRMED. Contractor licence for labour and materials over $5,000 (GST incl.). The row does not mention the internal-paintwork rule. | The NSW painting-work page (fetched 3 Nov, C1 official_page.supports) says that since 2015 stand-alone contracts for internal paintwork need no licence, unless the painting is part of other home building work. | Add that exception to the qualification column. Keep the $5,000 threshold. Residual: the page does not say how the exception meets the $5,000 test. |
| NSW-15 (asbestos removal licence) | PARTIAL. "Page does not describe the scope of each class or any area thresholds." | NSW Service page (fetched 3 Nov, C3 additional_official_page): no licence for less than 10 m2 of non-friable asbestos; Class B for non-friable above that; Class A for any friable. The page does not address exactly 10 m2. | Add these thresholds and cite the service.nsw.gov.au page as a second source. Keep PARTIAL for the exactly-10 m2 gap. |
| VIC-24 (PV installation is electrical installation work) | CONFIRMED, from the ESV PV installers guideline PDF (dated December 2018 in the document). | Not contradicted. The ESV web page that roof lesson L05 relies on was refused today (C6), so the page-level PV claim is not re-verified. | Keep CONFIRMED for the PDF as read on 2 Nov. Add note: "Web page version not re-read on 3 Nov; see C6." Flag for re-read. |
| VIC-26 (PV isolation procedure) | CONFIRMED. Isolate at the main switchboard, lock out and tag out; DC cables may stay live; refers to AS/NZS 4836. | Same position as VIC-24. The claim is attributed to the ESV page that was refused today. | As VIC-24. |

Verified today with no content change (set date_checked to 2026-11-03 where a re-fetch was made):
- VIC-01, VIC-03 and VIC-05 (BPC exemption list): the same Consumer Victoria page was fetched for C2 and C8. The list still names painting, plastering and wall and floor tiling, with no value cap.
- NSW-07 (electrical): the NSW electrical page was fetched for C6. It still covers repairing wiring and does not mention solar.

## 2. Conflicts C1 to C8

| Id | Status | Resolved today | Evidence |
|---|---|---|---|
| C1 | settled | Yes | licence-conflicts-report.json, C1 (NSW painting-work page, fetched 3 Nov). Residual: exception versus $5,000 test. |
| C2 | settled | Yes | licence-conflicts-report.json, C2 (Consumer Victoria BPC page, fetched 3 Nov). |
| C3 | open | No. The Victorian and NSW parts are settled. The roof lessons still use a national threshold, and Queensland was not fetched. | licence-conflicts-report.json, C3 (asbestos.vic.gov.au and service.nsw.gov.au, both fetched 3 Nov). |
| C4 | open | No. The wording difference ("more than 2 m" versus "2 m or more") is settled. Which rule applies in NSW and SA is not. | licence-conflicts-report.json, C4 (Safe Work Australia and WorkSafe Victoria pages, fetched 3 Nov). NSW roof code and SA page not fetched. |
| C5 | open | No. The 2006 code is replaced by the May 2026 code, and the low-voltage service-line distance is not confirmed. | licence-conflicts-report.json, C5 (NSW 2026 and 2006 codes, fetched 3 Nov). Chapter 8 of the 2006 code not read. |
| C6 | open | No. NSW settles only that repairing wiring is licensed work. Victoria's PV page was refused. | licence-conflicts-report.json, C6 (NSW electrical page, fetched 3 Nov). |
| C7 | open | No. Neither QBCC page was read. | licence-conflicts-report.json, C7 (not fetched). |
| C8 | settled | Yes | licence-conflicts-report.json, C8 (same Consumer Victoria page as C2). |

Totals: 8 conflicts. 3 resolved today (C1, C2, C8). 5 open (C3 to C7).

## 3. Unfetched sources

| Source | Conflict affected | Resolved today | Evidence |
|---|---|---|---|
| energysafe.vic.gov.au, safely-installing-PV page | C6 (Victorian PV licence and isolation) | No. Refused: not on the session allowlist. | licence-conflicts-report.json, not_fetched_or_blocked[0] |
| qbcc.qld.gov.au/painting-decorating | C7 (Queensland painting class) | No. Budget exhausted. | licence-conflicts-report.json, not_fetched_or_blocked[1] |
| worksafe.qld.gov.au, exclusion zones | Queensland 3 m overhead distance in L05 (no open conflict) | No. Budget exhausted. | licence-conflicts-report.json, not_fetched_or_blocked[2] |
| safework.nsw.gov.au, Work-on-roofs-COP.pdf | C4 (NSW 2 m line for roof work) | No. Budget exhausted. | licence-conflicts-report.json, not_fetched_or_blocked[3] |
| ACT planning and Access Canberra high-risk work licence pages (not on the report's list) | ACT-22 (row, not a conflict) | No. Not read today. | No fetch in licence-conflicts-report.json or the work files. |

## 4. Counts

- Stale rows: 6. Four need a content or status change (ACT-22, VIC-32, NSW-01, NSW-15). Two (VIC-24, VIC-26) are flagged for re-verification.
- Resolved conflicts: 3 of 8 (C1, C2, C8).
