# Titan Academy: Catalogue V2 (Curriculum Architect notes)

Status: draft for review. Nothing here is marked published or verified.
Files: `CATALOGUE-V2.csv` (one row per lesson), `build_v2.py` (the decision table; rerun to regenerate), `catalogue-v2-stats.json`, `first-pass-changes.json`.

## Scope and counts

- 487 inventory lessons: one row each, all present (checked by script).
- 60 further lessons found in source but missing from the inventory: `C11-L01` to `C20-L06` in `specialist-content-c11-c20.json`. Marked `outside 487`. Their instructions are one line each, so every one is marked Rewrite.
- 108 NEW rows for businesses with no source lesson or a gap in source. Marked `NEW`.
- Total rows: 655.

| Decision (inventory 487) | Count |
|---|---|
| Base | 104 |
| Group | 54 |
| Business | 130 |
| Adapt | 12 |
| Merge (folded into a canonical lesson) | 103 |
| Exclude (high-hazard families) | 84 |

| Action (inventory 487) | Count |
|---|---|
| Import as-is | 127 |
| Import with template fields | 114 |
| Rewrite (includes 103 Merge rows, folded into a canonical lesson) | 150 |
| Adapt | 12 |
| Not imported (Exclude) | 84 |

Lesson type, non-excluded inventory rows: K 314, W 44, C 26, RH 14, RV 5. NEW rows: K 67, RH 18, RV 12, W 8, C 3. K dominates because most source content is safety and SOP. Revenue, cost and workload types are used where a lesson's main purpose is one of those.

Licence notices: 55 rows carry `licence_notice = Y`. A notice states what the licence covers and that the lesson does not grant it.

## Method

1. Each inventory row got a decision from the family and content (titles, placements, learning outcomes, and the source file where placement was unclear).
2. Macros used in targets: `ALL` = all 39 businesses; `KIT` = residential, commercial, bond, short-stay; `BATH` = residential, commercial, bond, short-stay, strata; `EXT` = window, roof, solar, pressure; `HEIGHT` = window, roof, solar; `OUT` = garden, lawn, landscaping, irrigation; `FLOOR` = commercial, hard floor care; `PMP` = property-manager partner module (in residential, garden, handyman; a module, not a course); `REPPMP` = real estate course plus the module.
3. Merge: duplicated content folded into one canonical lesson. Each merge row names its canonical ID.
4. Group rows reuse one lesson across businesses in one group. Adapt rows keep the source business and adapt the lesson for named others.
5. Excluded families (biohazard, crime scene, drug contamination, fire and smoke, flood, hoarding, mould remediation) are rows marked Exclude with no target. The script fails if an excluded family appears as a business lesson.
6. Short prefixes used in this note and in the script map to inventory slugs: AC = aged-care-infection-control, MD = medical-dental-clinic, ME = medical-equipment-cleaning, CA = car-detailing, CS = construction-site-cleaning, CE = custom-eco-cleaning-products, FP = food-processing-sanitation, GA = garden-cleanups, HM = handyman-work, WI = high-access-window-cleaning, IN = industrial-degreasing, KC = kitchen-cleaning, KE = kitchen-exhaust, LB = laboratory-cleaning, PM = property-maintenance, PO = pool-cleaning, PR = pressure-cleaning, RO = roof-cleaning-soft-washing, SO = solar-panel-cleaning, WH = warehouse-deep-cleaning, AN = additional-specialist-services. The CSV uses full inventory IDs.

## Corrections to the first-pass classification

- 267 of 487 inventory rows changed decision. Largest changes: 76 specialty lessons first tagged General (placeholder "Base shared pool or group") are business-specific (for example car detailing L01 and L03); 59 General and 33 Adapt rows overlap another lesson and are now Merge (folded into it).
- 93 of 99 first-pass Adapt rows changed. The rule matched keywords, not content. Examples: `C10-L02` "escalation decision-making under pressure" tagged to water-related businesses by a keyword rule; it is general escalation content (now Base); `KE-L06` "plant shutdown" tagged to garden on the word "plant" (now commercial); `WI-L06` "water-fed poles" tagged to pressure (now Adapt to solar); "hygiene" tagged to mobile beauty, massage and pet grooming for general hygiene (now Base with templates).
- "Specific" rows carrying course IDs (for example `cleaner-01`) are replaced with business or group targets.
- The 84 excluded rows match the first pass.

## Coverage (lessons specific to each business)

"Sourced" counts include the 60 outside-487 lessons: carpet (C13), residential (C11), short-stay (C12), commercial and office (C16 to C18), window (C15), and the oven group (C14, placed in the kitchen group). Post-construction and construction share the construction lessons.

| Business | Sourced | NEW | Flag |
|---|---|---|---|
| Residential cleaning | 46 | 1 | |
| Commercial and office cleaning | 76 | 0 | |
| Bond and end-of-lease cleaning | 29 | 0 | |
| Short-stay turnover | 31 | 0 | |
| Carpet and upholstery cleaning | 9 | 2 | depends on draft outside lessons |
| Hard floor care | 4 | 5 | thin |
| Construction-site clean-up | 10 | 0 | |
| Post-construction clean | 10 | 3 | |
| Strata and common-area cleaning | 8 | 3 | |
| Car detailing | 11 | 0 | |
| Medical equipment cleaning (external only) | 11 | 0 | |
| Healthcare cleaning (aged care, medical, dental, NDIS) | 14 | 1 | NDIS has no source |
| Window cleaning (all heights) | 13 | 0 | |
| Pressure cleaning (all heights) | 12 | 0 | |
| Roof soft washing | 12 | 0 | |
| Solar panel cleaning | 14 | 0 | research only, all rows Rewrite |
| Pool and spa servicing | 11 | 0 | |
| Pond and water-feature maintenance | 5 | 3 | thin |
| Aquarium maintenance | 5 | 4 | thin |
| Lawn and turf care | 5 | 4 | thin |
| Garden maintenance and clean-ups | 26 | 3 | hedge, leaf and mulch are NEW |
| Irrigation servicing | 5 | 4 | thin |
| Landscaping | 5 | 4 | thin |
| Handyman | 27 | 0 | |
| Locksmith and door installation | 1 | 4 | thin |
| Deck and fence | 1 | 4 | thin |
| Flat-pack and fixtures | 1 | 3 | thin |
| Painting | 1 | 5 | thin |
| Plastering | 1 | 4 | thin |
| Tiling | 0 | 6 | no source |
| Real estate portfolio management | 5 | 4 | thin |
| Mobile hairdressing and barbering | 0 | 6 | no source |
| Mobile beauty | 0 | 5 | no source |
| Mobile massage | 0 | 5 | no source |
| Personal and fitness training | 0 | 5 | no source |
| Yoga and Pilates | 0 | 4 | no source |
| Dog walking | 0 | 6 | no source (pet taxi included) |
| Pet and house sitting | 0 | 5 | no source |
| Pet grooming | 0 | 5 | no source |

## Open issues (need a decision or a check)

1. Inventory is incomplete. Source holds 60 more draft lessons (C11 to C20). Confirm whether the inventory should be regenerated to include them.
2. Architecture courses C21 to C55 have course-level records only. No lesson content was found in source for them.
3. Premium courses 18 to 25 (graffiti, stone, tile and grout sealing, timber floor, upholstery and mattress, ductwork, commercial bins, deceased estate cleanouts) have titles only. None are built here.
4. Deceased estate cleanouts are not in the 39 and overlap the excluded biohazard and hoarding families. Recommend keeping them out. Confirm.
5. Oven cleaning is not one of the 39. It is placed as kitchen group lessons for residential and commercial cleaning. Confirm.
6. Kitchen and bathroom groups extend to bond, short-stay and strata. DECISIONS names only residential and commercial. This is a proposal. Confirm.
7. Custom eco cleaning products is not one of the 39. Its lessons are kept as general product-knowledge lessons (Base). Confirm.
8. Licences: the notices name what each lesson does not grant. Licence requirements for these need confirming with the regulator, not assumed: locksmith (`NEW-LCK-01`), waterproofing for tiling (`NEW-TIL-02`), lead paint (`NEW-PNT-04`), leasing and real estate (`NEW-REP-04`), electric work, and elevated work platforms and rope access (window `WI-L08`, `WI-L09`).
9. Medical equipment: reprocessing lessons (`ME-L07`, `ME-L08`) are kept as boundary and referral lessons only, because the service is external cleaning. Confirm the team wants them at all.
10. Solar panel cleaning: source is research only. All 12 rows need instruction written.
11. Source lessons were checked for structure and licence wording by search, not read line by line. Content review is needed before any lesson is marked ready.
12. Property-manager partner module draws on `PM-L05` (moisture and mould warning signs only). Mould remediation stays excluded.
13. Source lessons are at course level for garden, handyman, pressure, property maintenance and construction. They must be split by lesson before import.
