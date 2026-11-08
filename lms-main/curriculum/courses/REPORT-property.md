# Property and trades: lesson writing report

Checked 2026-11-02. Status for every file: DRAFT. Review status: NOT REVIEWED. Nothing here is verified or published.

## Counts

| Item | Count |
|---|---|
| Lesson files written (learner JSON) | 58 |
| Assessment files written (assessor-only JSON) | 58 |
| Rewritten from a ready draft | 14 |
| Written from title and catalogue (no ready draft) | 44 |
| Lesson types | K 38, RH 6, RV 6, W 8 |
| Lessons with at least one licence notice | 56 |
| Lessons that mention an UNCONFIRMED position | 54 |
| Proposed new lesson ID (not in TITLES-ONLY or the map) | 1 (NEW-TIL-08) |

Rewritten from ready drafts: handyman-work-L02, L03, L04, L05, L11, L12; property-maintenance-L02, L03, L04, L08, L09, L10, L11, L12.

Courses and lesson files (folder: /home/claude/p29m/lms-main/curriculum/courses/<slug>/):

- handyman (22): handyman-work-L01 to L12 (L01 absorbs property-maintenance-L01, per CATALOGUE-V2); property-maintenance-L02 to L06, L08 to L12 (property manager partner module); placed in handyman, residential-cleaning and garden-maintenance-and-clean-ups.
- real-estate-portfolio-management (9): C19-L01, L02, L03, L05, L06; NEW-REP-01 to 04.
- locksmith-and-door-installation (4): NEW-LCK-01 to 04.
- deck-and-fence-maintenance (4): NEW-DEK-01 to 04.
- flat-pack-and-fixture-installation (3): NEW-FLP-01 to 03.
- painting (5): NEW-PNT-01 to 05.
- plastering (4): NEW-PLS-01 to 04.
- tiling (7): NEW-TIL-01 to 07 (NEW-TIL-08 is proposed, see decision 1).

Assessments: /home/claude/p29m/lms-main/curriculum/assessments/<lesson-id>.assessment.json, one per lesson. All passRule values are NOT SET because no pass mark has been approved. Practical criteria are written as observable conditions.

## Decisions made (for review)

1. Tile and grout sealing has no lesson ID. DECISIONS puts it in the tiling course, but neither TITLES-ONLY.csv nor the map has a tiling sealing lesson. NEW-HFC-03 ("Stone, tile and grout cleaning and sealing boundaries") sits in hard floor care and is only a cross-reference. I wrote NEW-TIL-08 as a proposed ID. The architect should confirm the ID and module.
2. Painting, plastering and tiling basics in handyman. The map does not place any of these in handyman. I used handyman-work-L09 (paint, patch and surface compatibility, which CATALOGUE-V2 says gives the basic painting and plastering lessons) and NEW-TIL-01 (tiling basics for handymen). NEW-TIL-01 now lists handyman in courseSlugs, but the map still needs that placement added.
3. Multi-course lessons live in one folder. A lesson used by several courses is written once, in the first course folder listed in its placements, and courseSlugs lists every course that places it. Examples: handyman-work-L04 (also in four garden and outdoor courses), the property manager partner module (also in residential and garden), and the C19 lessons. SCHEMA.md says shared lessons belong in curriculum/shared/<area>/. I followed the task's course-folder instruction. The architect should decide which rule applies.
4. Module titles follow the map, not the group heading. For example, handyman-work-L12 is in "Workload and cost" and property-maintenance-L05 is in the property manager partner module.
5. Answer keys sit in assessment files only. `correctIndex` appears only in curriculum/assessments/. Learner files carry options and question text only, as the schema requires.
6. The property-maintenance-L07 and property-maintenance-L01 rows are not written as separate lessons. CATALOGUE-V2 merges them into handyman-work-L06, L07 and L01.
7. licenceNotice is set on 56 of 58 lessons. This is broader than strictly needed, because most lessons touch a licensed or referred task. The reviewer may wish to trim it.

## Source gaps and UNCONFIRMED items

- No research topic notes exist for these courses (curriculum/research/topics/ is absent). Title-only lessons were written from the titles, CATALOGUE-V2 decisions and the trades licence matrices. General trade practice is marked as internal course guidance, UNCONFIRMED against any named standard or manufacturer data. No manufacturer data was consulted.
- Source references in the ready drafts (hand28-02, hand28-03, hand28-07, pm31-au02) are not in this workspace. They are cited as UNCONFIRMED.
- Licence facts are taken only from research/trades/ (LICENCE-MATRIX.csv, LICENCE-MATRIX-NSW-QLD.csv, LICENCE-NOTES.md, NOTES.md), with the matrix status kept. Where the matrix says PARTIAL or UNCONFIRMED, the lesson says so.

Open licence positions, carried into the lessons as UNCONFIRMED or PARTIAL:

- Victoria locksmith and key cutting (VIC-07). Door installation (VIC-08). Handyman (VIC-09).
- Victoria floating floors (VIC-06). Victoria PV isolation class (VIC-25, PARTIAL). Victoria roof soft washing and window or pressure cleaning at height (VIC-19, VIC-23).
- NSW handyman and minor trade work (NSW-05). NSW wet plastering and rendering (NSW-02 gap). NSW floating floors (NSW-03, PARTIAL). NSW locksmith company or master licence (NSW-11).
- NSW deck and fence carpentry (NSW-04, PARTIAL). NSW asbestos thresholds (NSW-15, PARTIAL).
- Queensland deck class (QLD-13 gap) and deck and fence planning (QLD-16). Queensland PV isolation and cleaning (QLD-07, QLD-12). Queensland handyman (QLD-05, PARTIAL). Queensland tiling and floating floor scope (QLD-03, PARTIAL).
- Lead paint: no licence rule recorded for any state. Mould: no licence position recorded. Waterproofing: no licence position recorded for any state. Real estate leasing, deposits and trust money: not researched.
- Balustrade height rules for decks: not in the sources.
- Silica dust and tile dust controls: the workplace must confirm the applicable rule. The sources set no licence for it.

## Items to check outside this scope

- Other writers' files are in the same courses folder. My validation picked up lesson IDs that appear in more than one course folder (for example C01-L01 and F01-L01). That breaks the write-once rule. I did not change them.
- The shared base lessons in the property map that are still TITLE ONLY (F11, F12, F13, F18, F20 items) were left to the base writer.
- handyman-work-L04 is placed in the garden and outdoor courses too. The garden writer should reference this file rather than write a second copy.
- The property manager partner lessons also sit in the residential-cleaning and garden courses. Those manifests should reference these IDs.

## Verification performed

- All 58 lesson files and 58 assessment files parse as JSON.
- Each knowledge check has 3 or 4 options and no correctIndex in the learner file.
- Each knowledge check ID has a matching answer key, with correctIndex inside the option range.
- Every lesson is DRAFT and NOT REVIEWED.
- All {{business:...}} placeholders are on the 56-field approved list (business-lesson-fields.json). Three placeholders that were not on the list were corrected to procedures.quality_standard.
