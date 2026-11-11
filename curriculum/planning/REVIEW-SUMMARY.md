# Reuse classification review: summary

Reviewer output for `/home/claude/work/out/LESSON-REUSE-CLASSIFICATION.csv` (487 rows). Row-level results are in `REVIEW.csv` in this folder. The input file and the WordPress source were not changed.

## Method

- Sample: 231 rows of 487. All 99 Adapt rows; all 70 General rows whose titles contain scope, authority, access, shift, hazard, risk, PPE, licence or permit; 30 other General rows at random (seed 7); 20 Specific rows at random; 12 Exclude rows across the seven excluded families.
- Source lookup: each row was matched to its lesson text in the JSON files under the WordPress source root, constrained to the lesson family. All 487 rows matched.
- Standard: the decision was checked against the source text and against `/home/claude/work/team/DECISIONS.md`.
- Caveat: 256 rows were not sampled. Their first-pass decisions are unverified.

## Error rate by first-pass decision type

| First-pass decision | Population | Sampled | Decision changed | Target-only correction | Any change | Note |
|---|---|---|---|---|---|---|
| General | 219 | 100 | 50 (50%) | 17 | 67 (67%) | Keyword stratum 70: 40 decision changes (57%). Non-keyword stratum 30: 10 (33%). Stratum-weighted estimate for all 219: about 41%, from only 30 non-keyword rows. |
| Adapt | 99 | 99 (all) | 23 (23%) | 39 | 62 (63%) | Every Adapt row was checked, so these rates are exact for the population. Most decision changes move to Specific (18). |
| Specific | 85 | 20 | 8 (40%) | 2 | 10 (50%) | Small sample (20 rows), so treat as indicative only. |
| Exclude | 84 | 12 | 0 (0%) | 0 | 0 (0%) | Seven families match the excluded list in DECISIONS (84 of 84). No error found. |

Decision changes in the sample: General to Specific 49, Adapt to Specific 18, Specific to General 8, Adapt to General 5, General to Adapt 1.

## Three most common error patterns

**1. Keyword-driven transfer targets that are not technically sound (37 sampled rows).** The rules matched single words in the source text. Examples: "surface" sent roof, medical and handyman lessons to carpet and floor care; "hygiene" sent a forklift traffic lesson (`warehouse-deep-cleaning-L02`) and a roof gutter lesson (`roof-cleaning-soft-washing-L04`) to healthcare and beauty; "powered" sent medical electrical safety (`medical-equipment-cleaning-L10`) to handyman, garden and car detailing; "plant" sent kitchen exhaust fan isolation (`kitchen-exhaust-L06`) to garden and lawn irrigation; "pressure" matched "under pressure" in a lone-worker escalation lesson (`C10-L02`); "moisture" was applied to silica dust (`construction-site-cleaning-L04`). About 17 sampled rows also list their own business in the target (self-reference, e.g. `handyman-work-L04` targets handyman).

**2. Trade-, vertical- or licence-specific content tagged General and placed in the base pool (49 of 100 sampled General rows are Specific on review; 17 more belong in a group).** The title words scope, authority, access, PPE, risk and hazard are not discriminating. Examples: aged-care IPC instructions (`aged-care-infection-control-L03`), height and rope-access authority (`high-access-window-cleaning-L01`, `-L08`), construction asbestos and lead recognition (`construction-site-cleaning-L03`), reprocessing boundaries in an external-only medical equipment business (`medical-equipment-cleaning-L07`), and licence-bearing plumbing and gas boundaries (`handyman-work-L07`). These need trade or vertical placement and licence notices under the licence rule.

**3. Placements that contradict DECISIONS or use unplaced families (41 sampled rows, including agreed rows).** DECISIONS puts industrial degreasing, warehouse, laboratory and food-processing sanitation in commercial and office lessons, but the first pass uses base pool or other targets for them. Clinic and aged-care content sits outside the healthcare vertical. Kitchen exhaust, custom eco-cleaning products and additional-specialist-services are not among the confirmed 39 courses; kitchen exhaust is also not on the excluded list. Fifteen foundation rows in F11, F12, F13, F18 and F20 are marked Specific with target "Not in any course". One row (`additional-specialist-services-L10`) is UNASSIGNED and was not reviewed.

## Other findings

- The target "Base shared pool or group" covers all 219 General rows and does not say which. In the sample, 17 of 100 General rows needed a more specific group or business target.
- The bodies of `additional-specialist-services` (12 lessons) open with the same three-sentence block. The body is scaffolding, not lesson content, so no reuse decision can be validated on it.
- Several specialty lessons, such as roof, high-access, kitchen-exhaust, solar, medical-equipment and laboratory, start with the same template sentence ("Identify conditions, authorisation limits ..."). The title is the only specific content in those openings.
- The mould exclusion conflicts with mould content in `property-maintenance-L05` (mould warning signs) and `pressure-cleaning-L09` (mould as a specialist trigger). An SME and a decision are needed.
- Licence notices are needed for handyman, high-access, additional-specialist-services L04 and plumbing and gas content, per the licence rule.

## Decisions needed from the main session

- Whether kitchen exhaust, custom eco-cleaning products and additional-specialist-services are courses. They are outside the confirmed 39.
- Placement for the F11, F12, F13, F18 and F20 business and admin lessons (15 rows marked "Not in any course").
- Whether `pressure-cleaning-L09` and `property-maintenance-L05` keep their mould content given the exclusion.

## Hazard-related rows needing a subject-matter expert

Rows flagged [SME] in REVIEW.csv: 133 sampled rows across 26 families. These are the hazard, licence, healthcare or specialist rows where the decision depends on expert judgement. Rows outside the sample were not screened.

- **F08** (2): `F08-L01`, `F08-L05`
- **C05** (2): `C05-L01`, `C05-L03`
- **F14** (2): `F14-L03`, `F14-L04`
- **S14** (4): `S14-L01`, `S14-L02`, `S14-L03`, `S14-L08`
- **C10** (1): `C10-L02`
- **additional-specialist-services** (8): `additional-specialist-services-L02`, `additional-specialist-services-L03`, `additional-specialist-services-L04`, `additional-specialist-services-L05`, `additional-specialist-services-L06`, `additional-specialist-services-L07`, `additional-specialist-services-L08`, `additional-specialist-services-L12`
- **aged-care-infection-control** (7): `aged-care-infection-control-L02`, `aged-care-infection-control-L03`, `aged-care-infection-control-L05`, `aged-care-infection-control-L06`, `aged-care-infection-control-L07`, `aged-care-infection-control-L08`, `aged-care-infection-control-L10`
- **car-detailing** (1): `car-detailing-L03`
- **construction-site-cleaning** (5): `construction-site-cleaning-L02`, `construction-site-cleaning-L03`, `construction-site-cleaning-L04`, `construction-site-cleaning-L05`, `construction-site-cleaning-L06`
- **custom-eco-cleaning-products** (3): `custom-eco-cleaning-products-L02`, `custom-eco-cleaning-products-L06`, `custom-eco-cleaning-products-L07`
- **food-processing-sanitation** (6): `food-processing-sanitation-L01`, `food-processing-sanitation-L04`, `food-processing-sanitation-L07`, `food-processing-sanitation-L08`, `food-processing-sanitation-L11`, `food-processing-sanitation-L12`
- **garden-cleanups** (5): `garden-cleanups-L02`, `garden-cleanups-L05`, `garden-cleanups-L06`, `garden-cleanups-L08`, `garden-cleanups-L12`
- **handyman-work** (5): `handyman-work-L02`, `handyman-work-L04`, `handyman-work-L05`, `handyman-work-L07`, `handyman-work-L08`
- **high-access-window-cleaning** (6): `high-access-window-cleaning-L01`, `high-access-window-cleaning-L02`, `high-access-window-cleaning-L03`, `high-access-window-cleaning-L04`, `high-access-window-cleaning-L06`, `high-access-window-cleaning-L08`
- **industrial-degreasing** (7): `industrial-degreasing-L01`, `industrial-degreasing-L02`, `industrial-degreasing-L04`, `industrial-degreasing-L05`, `industrial-degreasing-L06`, `industrial-degreasing-L07`, `industrial-degreasing-L09`
- **kitchen-cleaning** (2): `kitchen-cleaning-L07`, `kitchen-cleaning-L09`
- **kitchen-exhaust** (10): `kitchen-exhaust-L01`, `kitchen-exhaust-L02`, `kitchen-exhaust-L03`, `kitchen-exhaust-L04`, `kitchen-exhaust-L05`, `kitchen-exhaust-L06`, `kitchen-exhaust-L07`, `kitchen-exhaust-L10`, `kitchen-exhaust-L11`, `kitchen-exhaust-L12`
- **laboratory-cleaning** (6): `laboratory-cleaning-L02`, `laboratory-cleaning-L03`, `laboratory-cleaning-L05`, `laboratory-cleaning-L07`, `laboratory-cleaning-L10`, `laboratory-cleaning-L12`
- **medical-dental-clinic** (7): `medical-dental-clinic-L02`, `medical-dental-clinic-L03`, `medical-dental-clinic-L04`, `medical-dental-clinic-L05`, `medical-dental-clinic-L06`, `medical-dental-clinic-L07`, `medical-dental-clinic-L08`
- **medical-equipment-cleaning** (8): `medical-equipment-cleaning-L01`, `medical-equipment-cleaning-L02`, `medical-equipment-cleaning-L04`, `medical-equipment-cleaning-L05`, `medical-equipment-cleaning-L06`, `medical-equipment-cleaning-L07`, `medical-equipment-cleaning-L09`, `medical-equipment-cleaning-L10`
- **pool-cleaning** (3): `pool-cleaning-L01`, `pool-cleaning-L04`, `pool-cleaning-L06`
- **pressure-cleaning** (7): `pressure-cleaning-L01`, `pressure-cleaning-L02`, `pressure-cleaning-L03`, `pressure-cleaning-L05`, `pressure-cleaning-L06`, `pressure-cleaning-L09`, `pressure-cleaning-L10`
- **property-maintenance** (4): `property-maintenance-L05`, `property-maintenance-L06`, `property-maintenance-L08`, `property-maintenance-L09`
- **roof-cleaning-soft-washing** (10): `roof-cleaning-soft-washing-L01`, `roof-cleaning-soft-washing-L02`, `roof-cleaning-soft-washing-L03`, `roof-cleaning-soft-washing-L04`, `roof-cleaning-soft-washing-L05`, `roof-cleaning-soft-washing-L06`, `roof-cleaning-soft-washing-L07`, `roof-cleaning-soft-washing-L09`, `roof-cleaning-soft-washing-L10`, `roof-cleaning-soft-washing-L11`
- **solar-panel-cleaning** (6): `solar-panel-cleaning-L02`, `solar-panel-cleaning-L03`, `solar-panel-cleaning-L04`, `solar-panel-cleaning-L08`, `solar-panel-cleaning-L09`, `solar-panel-cleaning-L11`
- **warehouse-deep-cleaning** (6): `warehouse-deep-cleaning-L02`, `warehouse-deep-cleaning-L04`, `warehouse-deep-cleaning-L06`, `warehouse-deep-cleaning-L08`, `warehouse-deep-cleaning-L09`, `warehouse-deep-cleaning-L12`

