# ACT boom-length retry report

Checked 2026-11-03. Scope: the ACT boom-type elevating work platform (WP) licence rule, which was removed from about 85 lessons on 2026-11-03 (see `research/BOOM-OTHER-STATES.md`). No lesson, licence or code file was edited. No commit was made.

## Outcome

The official Access Canberra page was read this time and states the WP class covers booms of 11 metres or more. The page shows no last-updated or reviewed date. The wording came from a summarising fetch, so it should be checked verbatim in a browser before the figure is restored.

## Page used

- Title: High-risk work licences, Access Canberra, ACT Government
- URL: https://www.accesscanberra.act.gov.au/business-and-work/high-risk-work-licences
- Date shown: none found on the page
- Wording (as returned by WebFetch, which paraphrases, so verify verbatim): "Allows the holder to operate a boom-type elevating work platform where the boom is 11 metres or more."
- The same page lists the WP class as "WP (boom-type EWP)" under crane and hoist operation. The page lists 29 classes in total.

Note: the WorkSafe ACT page (below) does not repeat the boom rule.

## URLs tried

| # | URL or query | Result |
|---|---|---|
| 1 | WebSearch: "ACT high risk work licence boom type elevating work platform" (allowed domains act.gov.au, accesscanberra, worksafe.act.gov.au) | Returned the Access Canberra page above and the application PDF. |
| 2 | WebSearch: "WorkSafe ACT high risk work licence classes" | Returned https://www.worksafe.act.gov.au/licensing-and-registration/high-risk-licensing and the Access Canberra page. |
| 3 | WebFetch https://www.accesscanberra.act.gov.au/business-and-work/high-risk-work-licences | **Read.** Boom wording found (above). |
| 4 | WebFetch https://www.worksafe.act.gov.au/licensing-and-registration/high-risk-licensing | Read. No boom wording, no date. Lists five categories only. |
| 5 | WebSearch: "ACT WP licence boom-type elevating work platform boom 11 metres or more" (legislation.act.gov.au, accesscanberra, worksafe.act.gov.au) | No new official page beyond the above. |
| 6 | WebFetch application PDF https://www.accesscanberra.act.gov.au/__data/assets/pdf_file/0019/2310472/Application-for-new,-add-class-or-transfer-from-interstate-high-risk-work-licence.pdf | **Failed**: client_error at the site, nothing retrieved. |
| 7 | WebFetch https://www.legislation.act.gov.au/sl/2011-36/current/pdf/2011-36.pdf (WHS Regulation 2011) | Read partly. The text is about 110,000 characters and was truncated at 100,000. The table of contents lists "Schedule 3, item 3.1 Boom-type elevating work platform" at page 531 of the republication R47 (effective 29 November 2025). The definition was not reached. Next step: fetch with offset 100000. |

## Lessons that would need the ACT figure restored

The removal list is in `research/BOOM-OTHER-STATES.md`, under "Lessons changed (87)". That list covers all states that were changed (WA, NT, SA and ACT), and it does not record which lessons lost ACT text alone. The 85 ACT lessons therefore need a per-lesson check. The candidate set is:

- courses/pressure-cleaning-all-heights: pressure-cleaning-L01, pressure-cleaning-L11, pressure-cleaning-L12
- courses/window-cleaning-all-heights: high-access-window-cleaning-L01, L03, L09, L11, L12
- shared/chemicals: C05-L01, C05-L02, F03-L01 to F03-L04, F05-L02, F08-L03, F16-L01, F16-L03
- shared/customer: F01-L02, F14-L01, F14-L05, F15-L05
- shared/equipment: C05-L03, F04-L01 to F04-L04, F08-L04, F10-L04, F17-L01
- shared/exterior: high-access-window-cleaning-L02, L04, L05, L10; roof-cleaning-soft-washing-L09
- shared/induction: C01-L01 to C01-L03, F01-L01, F01-L03, F10-L01, F15-L01, F15-L02, F15-L04
- shared/job-management: C02-L01 to C02-L03, F01-L04, F05-L01, F05-L03, F19-L01, F19-L05
- shared/operations: F10-L02
- shared/quality: C09-L01 to C09-L03, F09-L01 to F09-L05, F10-L05, F19-L06, S12-L03, S12-L08
- shared/safety: C10-L01 to C10-L03, F02-L01 to F02-L04, F08-L01, F08-L02, F08-L05, F14-L02, F14-L04, F15-L03, F15-L06, F17-L04, F17-L05, S14-L03, S14-L04, S14-L05, S14-L07, S14-L08, WAH-07

Other findings from the grep (`boom` on the same line as `ACT` or `Capital Territory`, in `courses/` and `shared/` JSON):

- Source-citation fields still carry an ACT boom claim, which is inconsistent with the removal note. These are `covers` fields in high-access-window-cleaning-L01 and L09 ("WP class for booms 11 m or more. Publisher: Access Canberra") and in pressure-cleaning-L01 ("WP class where the boom is 11 m or more"). Check whether they should stay.
- `sourceReferences`/notes in high-access-window-cleaning-L02, L04, L05, L10 and WAH-07 still say ACT-22 was "not re-verified". Once the figure is restored these lines can be updated.
- `research/trades/LICENCE-MATRIX.csv` (the file named in BOOM-OTHER-STATES.md) returned no ACT-22 row when grepped from `research/trades/`. Confirm the path before editing the matrix.

## Recommended next steps (for the main session to decide)

1. Verify the Access Canberra sentence verbatim in a browser, and record the date the page was viewed.
2. Fetch the WHS Regulation at offset 100000 to read Schedule 3 item 3.1 and corroborate the 11 m threshold.
3. Restore "boom 11 m or more" for the ACT in the lessons listed above, and add the Access Canberra page as an officialReferences entry where it is missing.
4. Update the ACT-22 row in the licence matrix from CONFIRMED to match.
