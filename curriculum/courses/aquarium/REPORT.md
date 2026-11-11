# Aquarium maintenance: lesson report

Status: all lessons DRAFT, reviewStatus NOT REVIEWED. Nothing is verified or published.

## Counts
- Lessons: 13. Nine rewritten (NEW-AQU-01 to 04; aquarium-cleaning-L03, L04, L07, L10, L11). Four new (NEW-AQU-05 to 08).
- Assessments: 13, one per lesson, in curriculum/assessments/. Knowledge checks: 39 (three per lesson).
- UNCONFIRMED markers in lesson files: 77.

## Lesson set
- NEW-AQU-01 Freshwater, brackish, marine and planted systems (K).
- NEW-AQU-02 Water testing, trends and records (W).
- NEW-AQU-03 Livestock stress, quarantine and welfare boundaries (K).
- NEW-AQU-04 Heaters, filters, lights and electrical safety (K; licence notice).
- NEW-AQU-05 Cycling a new tank and client handover (RH). New.
- NEW-AQU-06 Routine maintenance visit and checklists (W). New.
- NEW-AQU-07 Saltwater and reef-specific water basics (K). New.
- NEW-AQU-08 Service offers for aquarium maintenance (RV). New; uses no study statistics.
- aquarium-cleaning-L03, L04, L07, L10, L11: rewritten, with errors fixed (see below).

## Decisions for review
1. NEW-AQU-01 and NEW-AQU-04 renamed to match the proposed set. IDs unchanged.
2. NEW-AQU-01 is K but sits in "Revenue and growth" per COURSES-MODULES.json. Consider "Methods and technique".
3. Routine water changes are normal maintenance. aquarium-cleaning-L11 previously allowed them only on test or specialist request; corrected. Extra changes need a recorded reason.
4. Biological media is rinsed in removed tank water, not tap water. The cleaning source says "cool water"; the agent followed the existing lessons because tank water keeps the bacteria.
5. Knowledge-check answer positions were shuffled, since several lessons had the correct answer in the same position. Assessment keys were updated to match by answer text.
6. The "80 per cent pass mark, all three must be correct" rule is kept in aquarium-cleaning-L03, L04, L07, L10 and L11. It is not in DECISIONS.md. Reviewer to confirm, or set to NOT SET (the other eight assessments use NOT SET).
7. Temperatures in Celsius only. Tropical systems described at about 24 to 27 degrees Celsius, UNCONFIRMED for Australia.

## Errors fixed in existing files
- NEW-AQU-02 cited a WorkSafe WA pool-chemicals page for test records; removed.
- NEW-AQU-01, 03, 04 cited "U2" and "U4", which did not exist; replaced with named sources.
- NEW-AQU-01 had a pool-compliance sentence that does not apply to aquariums; removed.
- NEW-AQU-04 claimed "most" electrical incidents had named causes with no source; reworded.
- aquarium-cleaning-L03 pointed to a nonexistent tank-chemistry lesson; now points to NEW-AQU-02.
- aquarium-cleaning-L04 listed SRC-A4 as a duplicate of SRC-A1; merged.
- aquarium-cleaning-L11 said NSW fish release was "illegal without a permit"; reworded to match the research brief (needs a permit).
- aquarium-cleaning-L11 cited a Queensland 24-hour reporting rule the lesson did not use; removed.

## Source handling
- House-sitting note (.docx): only the general staged water-change method used. Codes, phone numbers, room layout, personal details and amounts excluded.
- Construction file: used only for the leak-check idea. DIY build not taught.
- IoT report: used only for "monitors supplement manual testing and need calibration". Names, IDs, supervisor and product claims excluded.
- Retailer handbook: marked "rights not held". Brands, prices, staff claims, US figures and medication charts not used.
- 2011-2012 study: marked historical, not Australian. Used only as a qualitative prompt in NEW-AQU-08.
- Reef checklist (2009, US retailer): marked dated and reef-specific; its intervals treated as UNCONFIRMED.
- Home aquarium audience matrix (628262ec): excluded, not opened.
- Rights recorded as "reworded (no copying)" for every upload except the handbook. Reviewer to confirm the rest.

## Open items (UNCONFIRMED)
1. Australian temperature range for tropical and cold-water systems.
2. Target water-chemistry ranges, freshwater and marine, including reef parameters.
3. Australian response thresholds for ammonia, nitrite and nitrate.
4. Australian cycle duration and observation period after first fill.
5. State rules for keeping, moving, releasing and medicating aquarium fish outside WA, NSW and QLD (WA, SA, VIC, TAS, ACT and NT not checked).
6. Which professions may prescribe or dose animal medicines.
7. Whether aquarium electrical tasks are electrical work outside NSW.
8. Application of AS/NZS 3000; edition and use of AS/NZS 3760 for home aquarium equipment.
9. Confined-space rules by state; tank load and glass standards.
10. Whether a hose fill or internal tank plumbing is plumbing work.
11. Authority needed to sell, supply or arrange movement of live animals.
12. Collection rules for seawater, live rock and water sources.
13. Discharge routes for aquarium water in each state.
14. Referral fee, commission, advertising and consumer-law rules for quotes and add-ons.
15. Absence-care staffing, access, emergency and insurance rules.
16. Maintenance intervals as Australian standards (treated as examples only).

## Items for other owners (not edited)
- structure/COURSES-MODULES.json: no entries for NEW-AQU-05 to 08 or the aquarium-cleaning-L* IDs; it lists pool-cleaning-L03, L04, L07, L10, L11 in the aquarium modules.
- levels/aquarium.csv, lessons/TITLES-ONLY.csv, lessons/MANIFEST.csv: rows needed for new lessons.
- canonical-import-manifest.json: checksums for changed files need refreshing.

## Validation (agent-reported, lead-checked)
- All lesson files parse; no correctIndex in learner files; business placeholders among the 56 approved fields.
- Three knowledge checks per lesson, three or four options each.
