# Tasmania boom-length check (WP licence)

Date of check: 2026-11-03. Proposal only. No repository file other than this report was changed. `lesson-licence.json` was not edited and nothing was committed.

## 1. Source page

- Page: https://worksafe.tas.gov.au/topics/licensing-permits-and-registration/high-risk-licensing/check-the-classes
- Heading: "Boom type elevating work platform - WP"
- Date shown on the page: "Last updated: 1 December 2023"
- Access method: WebFetch, which returns a summary. The quotations below are the summariser's extracts, not a byte-for-byte copy of the page. Two separate fetches returned the same boom-length sentence, but the page text should be confirmed by a direct copy before the register is edited.

## 2. Verbatim boom-length wording (as returned by the fetch)

Boom type elevating work platform - WP:

- "An elevating work platform is either a telescoping device, hinged device, articulated device or any combination of these"
- "...and where the boom length is 11 metres or more."
- "You do not require a licence if the boom length is less than 11 metres."
- "The length of the boom is the greater of the following:"
  - "The vertical distance from the surface supporting the boom-type elevating work platform to the floor of the platform" "with the platform extended to its maximum height."
  - "The horizontal distance from the centre point of the boom's rotation to the outer edge of the platform" "with the platform extended to its maximum distance"

Multi tool carrier / Telehandler:

- "A WP HRW licence is required when operating a telehandler, also known as a multi tool carrier," "...that is fitted with a personnel box with operating controls in the box and the boom length is 11 metres or more."
- Table row: "When machine is fitted with a boom-type elevating work platform greater than 11 metres Operators must hold a boom-type elevating work platform Licence (code WP)"

## 3. Verdict on the rule

- The 11 m threshold is confirmed for the WP class by the Tasmanian page: "where the boom length is 11 metres or more" and "You do not require a licence if the boom length is less than 11 metres." The "no licence below 11 m" statement is therefore supported.
- Measurement: the page defines boom length as the greater of the vertical distance (surface to platform floor, platform at maximum height) and the horizontal distance (centre of boom rotation to outer platform edge, platform at maximum distance). The lessons do not state this definition for Tasmania.
- Internal inconsistency on the page: the main WP section says "11 metres or more", while the telehandler table row says "greater than 11 metres". The lesson text uses "11 m or more", which matches the main section. Flag this as a page inconsistency, not a resolved point.
- Not checked: the linked Tasmanian WP licence guidance PDF ("download Boom type elevating work platform (PDF, 81.1 KB)"). The fetch did not expose its URL, so it was not read.

## 4. Lesson wording check

Searched `curriculum/courses` and `curriculum/shared` for files containing both "Tasmania" and "boom": 87 files. Of those, 104 matching lines were counted across them, including reference lists. Files by folder: courses/pressure-cleaning-all-heights 3, courses/window-cleaning-all-heights 5, shared/chemicals 10, shared/customer 4, shared/equipment 8, shared/exterior 5, shared/induction 9, shared/job-management 8, shared/operations 1, shared/quality 12, shared/safety 22.

Sample lines that match the source:

- pressure-cleaning-L01 (body): "Tasmania does not require a licence for a boom under 11 metres (WorkSafe Tasmania page, last updated 1 December 2023)." Matches.
- window-cleaning-all-heights L03 and L12, and pressure-cleaning-L12: "...the WP licence applies to a boom of 11 metres or more in New South Wales, Western Australia, Tasmania and the Northern Territory." Matches.
- window-cleaning L01 point: "The NSW page, the Tasmanian page (last updated 1 December 2023)... each state that threshold." Matches.

Points to correct in lesson text (not changed here):

- Several lessons (for example window-cleaning L01 and pressure-cleaning L11) say the national model code measures the boom "from the original design". That is attributed to the model code, not to Tasmania. Lessons should not attribute the original-design measurement to Tasmania.
- No lesson states the Tasmanian measurement method (greater of vertical or horizontal). If a lesson is meant to carry it, it needs the sourced definition above.

## 5. Register check

`curriculum/licence/lesson-licence.json` has 0 occurrences of "Tasmania". The register rows with boom-length limits list VIC, NSW, QLD, WA and NT, with no TAS. Rows carrying the boom limit text: C01-L01 (line 8), C01-L02 (line 43), F15-L04 (line 2751).

## 6. Proposed register change (proposal only)

Row F15-L04, field `limit`, add Tasmania to the existing string:

"... TAS: boom 11 m or more (no licence below 11 m); the boom length is the greater of the vertical distance (surface to platform floor, platform at maximum height) and the horizontal distance (centre of boom rotation to outer platform edge, platform at maximum extension) ..."

Row F15-L04, field `officialWording`, add the array entry:

"TAS: \"where the boom length is 11 metres or more.\" \"You do not require a licence if the boom length is less than 11 metres.\" (WorkSafe Tasmania, Check the classes, last updated 1 December 2023; fetch extract, not verbatim.)"

Row F15-L04, field `officialUrl`, add: https://worksafe.tas.gov.au/topics/licensing-permits-and-registration/high-risk-licensing/check-the-classes

Rows C01-L01 and C01-L02: the same TAS addition applies to their `limit` string if those rows are meant to cover the same WP class.

Status for F15-L04 stays "threshold". No status change is proposed.

## 7. Open items

1. Confirm the page wording with a direct copy, not a summary.
2. Read the linked Tasmanian WP licence guidance PDF to check the "greater of" measurement and resolve the 11 m versus "greater than 11 m" telehandler wording.
3. Decide whether the "original design" measurement sentences should be reworded so they are not read as Tasmanian.
