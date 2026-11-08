# Official references: null-URL decisions (2026-11-03)

Scope: `officialReferences` entries in `curriculum/shared/**/*.json` with `url: null`. Only the `url`, `pageDate`, `checked` and `covers` fields were edited, and only where a page was read and supports the entry's covers claim. No learner text was changed. `curriculum/licence/lesson-licence.json` was not touched. The excluded required-licence lesson `outdoor-garden/garden-cleanups-L10.json` was not touched (its register status is `required`). `quality/PRO-03.json` was re-read before editing.

## Filled (1 entry)

| File | Entry | Page | pageDate set | checked | Notes |
|---|---|---|---|---|---|
| `shared/quality/PRO-03.json` | R3 "Health-information handling (privacy) requirements" | https://www.oaic.gov.au/__data/assets/pdf_file/0011/2090/guide-to-health-privacy.pdf (OAIC Guide to health privacy) | "Version 2.0, May 2025; the guide says it was updated in May 2025" | 2026-11-03 | The page shows a last-updated date (May 2025). Some chapter footers still show Version 1.0, September 2019. Read only the first 100,000 of about 137,000 characters. The guide is written for health service providers, and the covers line says so. |

## Left null, with reason (14 entries)

| File | Entry | Reason |
|---|---|---|
| `shared/fitness-business/YNS-01.json` | R2 state and territory licence requirements | Covers all states and territories. No single official page supports it. |
| `shared/healthcare/DIP-01.json` | R1 clinical waste and fluid rules by state | Covers all states and territories. The NSW EPA sharps page was located, but its body text could not be read. |
| `shared/healthcare/DIP-01.json` | R2 AS/NZS 3816 | Standards store listing found (store.standards.org.au/product/as-3816-2018), but the page is script-rendered and showed no title, status or date when fetched. It cannot confirm the claim that the standard is current. |
| `shared/healthcare/HLT-07.json` | R2 AS/NZS 1716, 1337.1, 1336 and ANSI/AAMI PB70 | Four standards, one of them US. No single page supports the set. |
| `shared/healthcare/OTI-02.json` | R1 AS 4031 | Store listings found, but the 1992 edition page could not be read for status. The lesson names the standard without a year, so the listing does not support the covers claim. |
| `shared/healthcare/OTI-03.json` | R2 AS 3789.6 | Store listing found for the 1996 edition. The page could not be read for status, and the lesson names the standard without a year. |
| `shared/outdoor-garden/garden-cleanups-L10.json` | R2, R3 | Excluded: the lesson is `required` in lesson-licence.json. Not touched. |
| `shared/pool/PVB-01.json` | R2 Practice Note 05-2018 | Practice Note 05-2018 was not located. The VBA "Building Practice Note SP 01" (Version 2.0, 27 April 2023) is a different document and does not support the entry. |
| `shared/pool/PVB-02.json` | R2 Practice Note 05-2018 | Not touched: the earlier pass excluded PVB-02 because its PV claims were removed. Same reason as above for the URL. |
| `shared/pool/PVB-03.json` | R2 VBA Practice Note 05-2018 | Same as PVB-01. SP 01 covers barrier requirements in general but gives no barrier height, non-climbable zone or gap dimension, so it does not support the entry. |
| `shared/pool/PVB-08.json` | R2 Practice Note 05-2018 | Same as PVB-01. |
| `shared/safety/RAS-13.json` | R2 state and territory lighting and traffic management duties | Covers all states and territories. No single page supports it. |
| `shared/templates/TPL-14.json` | R3 multi-part state WHS, animal withdrawal and licence entry | Three unrelated subjects in one entry. No single page supports it. |

## Check script

`python3 -I /home/claude/work/check_official_refs.py` ran on 2026-11-03 and wrote `/home/claude/work/official-refs-check.json`. Results: 1,591 entries, 0 invalid or future `checked` dates, 0 duplicate ids, 0 unresolved bracket citations. 49 entries are missing a url in total. 14 of those are the shared null-URL entries listed above. The other 35 are in `curriculum/courses/**`, which is out of this task's scope and was not edited.

## Decisions for review

1. The Practice Note 05-2018 entries (PVB-01, PVB-03, PVB-08) stay null. The owner should decide whether to re-point them to SP 01 (a different document) or to keep them null.
2. PRO-03 R3 now cites a guide for health service providers. The owner should confirm this is acceptable for a lesson that may not involve health information.
