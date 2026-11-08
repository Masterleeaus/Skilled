# Licence register: not_checked batches

Source: `curriculum/licence/lesson-licence.json` (generated 2026-11-03, read 2026-11-04). Planning only. The register, lesson files and checklist item 92 were not changed.

## 1. Status counts

| Status | Count |
|---|---|
| required | 40 |
| threshold | 160 |
| not_required | 94 |
| not_checked | 152 |
| **Total** | **446** |

## 2. How the not_checked lessons were grouped

The register has no course or path field. Each lesson was matched by ID to its file. A lesson in `shared/<area>/` is grouped under that area. Otherwise it is grouped under its course folder in `courses/<slug>/`. All 152 lessons matched a file. 48 are shared and 104 are course-specific. Lessons also appear in `lessons/converted/`, but that folder is not a vertical and was ignored.

Verticals with lessons: cleaning (19), healthcare-cleaning (13), medical-equipment-cleaning (9), solar-panel-cleaning (9), operations (7), pressure-cleaning-all-heights (7), hair (6), team (6), beauty (5), commercial-and-office-cleaning (5), groom (5), massage (5), petsit (5), pool (5), pt (5), business (4), yoga (4), aquarium (3), chemicals (3), customer (3), handyman (3), real-estate-portfolio-management (3), dogwalk (2), irrigation-servicing (2), pond (2), roof-soft-washing (2), equipment (1), flat-pack-and-fixture-installation (1), job-management (1), landscaping (1), marketing (1), outdoor-garden (1), quality (1), quoting (1), tiling (1), window-cleaning-all-heights (1).

## 3. The 10 batches

Each batch is 15 or 16 lessons. Verticals are kept together where the sizes allow. Only beauty, cleaning, irrigation-servicing, massage, pressure-cleaning-all-heights, pt, solar-panel-cleaning are split across two batches. The batches have no shared output file, so parallel agents can each write to their own result file (see section 5).

| Batch | Size | Verticals | Depends on rule text | Needs owner completion-rule decision |
|---|---|---|---|---|
| 1 | 16 | cleaning (16) | Yes: all (status meaning). No lessons with the keep-notice note. | Yes, 16 of 16 have no recorded state. |
| 2 | 16 | cleaning (3), healthcare-cleaning (13) | Yes: all (status meaning). 15 lesson(s) say to keep the existing licence notice and state no status. | Yes, 16 of 16 have no recorded state. |
| 3 | 15 | medical-equipment-cleaning (9), solar-panel-cleaning (6) | Yes: all (status meaning). No lessons with the keep-notice note. | Yes, 11 of 15 have no recorded state. |
| 4 | 15 | solar-panel-cleaning (3), operations (7), pressure-cleaning-all-heights (5) | Yes: all (status meaning). No lessons with the keep-notice note. | Yes, 13 of 15 have no recorded state. |
| 5 | 15 | pressure-cleaning-all-heights (2), hair (6), team (6), beauty (1) | Yes: all (status meaning). 5 lesson(s) say to keep the existing licence notice and state no status. | Yes, 14 of 15 have no recorded state. |
| 6 | 15 | beauty (4), commercial-and-office-cleaning (5), groom (5), massage (1) | Yes: all (status meaning). 4 lesson(s) say to keep the existing licence notice and state no status. | Yes, 14 of 15 have no recorded state. |
| 7 | 15 | massage (4), petsit (5), pool (5), pt (1) | Yes: all (status meaning). No lessons with the keep-notice note. | Yes, 15 of 15 have no recorded state. |
| 8 | 15 | pt (4), business (4), yoga (4), aquarium (3) | Yes: all (status meaning). No lessons with the keep-notice note. | Yes, 15 of 15 have no recorded state. |
| 9 | 15 | chemicals (3), customer (3), handyman (3), real-estate-portfolio-management (3), dogwalk (2), irrigation-servicing (1) | Yes: all (status meaning). 1 lesson(s) say to keep the existing licence notice and state no status. | Yes, 15 of 15 have no recorded state. |
| 10 | 15 | irrigation-servicing (1), pond (2), roof-soft-washing (2), equipment (1), flat-pack-and-fixture-installation (1), job-management (1), landscaping (1), marketing (1), outdoor-garden (1), quality (1), quoting (1), tiling (1), window-cleaning-all-heights (1) | Yes: all (status meaning). 1 lesson(s) say to keep the existing licence notice and state no status. | Yes, 15 of 15 have no recorded state. |

### Batch 1 (16): Cleaning (shared cleaning area, 16)

`C14-L01`, `C14-L03`, `C14-L04`, `C14-L05`, `construction-site-cleaning-L01`, `construction-site-cleaning-L04`, `construction-site-cleaning-L05`, `construction-site-cleaning-L06`, `construction-site-cleaning-L07`, `construction-site-cleaning-L08`, `construction-site-cleaning-L10`, `kitchen-cleaning-L02`, `kitchen-cleaning-L05`, `kitchen-cleaning-L06`, `kitchen-cleaning-L07`, `kitchen-cleaning-L08`.

### Batch 2 (16): Healthcare cleaning, plus 3 cleaning lessons

`kitchen-cleaning-L11`, `warehouse-deep-cleaning-L05`, `warehouse-deep-cleaning-L10`, `NEW-HLC-01`, `aged-care-infection-control-L01`, `aged-care-infection-control-L02`, `aged-care-infection-control-L03`, `aged-care-infection-control-L04`, `aged-care-infection-control-L05`, `aged-care-infection-control-L06`, `aged-care-infection-control-L07`, `aged-care-infection-control-L08`, `aged-care-infection-control-L09`, `aged-care-infection-control-L10`, `aged-care-infection-control-L12`, `medical-dental-clinic-L07`.

### Batch 3 (15): Medical equipment cleaning and solar panel cleaning (part)

`medical-equipment-cleaning-L01`, `medical-equipment-cleaning-L02`, `medical-equipment-cleaning-L03`, `medical-equipment-cleaning-L04`, `medical-equipment-cleaning-L06`, `medical-equipment-cleaning-L07`, `medical-equipment-cleaning-L10`, `medical-equipment-cleaning-L11`, `medical-equipment-cleaning-L12`, `solar-panel-cleaning-L01`, `solar-panel-cleaning-L02`, `solar-panel-cleaning-L05`, `solar-panel-cleaning-L07`, `solar-panel-cleaning-L08`, `solar-panel-cleaning-L09`.

### Batch 4 (15): Solar panel cleaning (part), operations, pressure cleaning (part)

`solar-panel-cleaning-L10`, `solar-panel-cleaning-L11`, `solar-panel-cleaning-L12`, `F13-L06`, `F18-L01`, `F18-L02`, `F18-L04`, `F18-L06`, `F20-L05`, `additional-specialist-services-L01`, `pressure-cleaning-L02`, `pressure-cleaning-L03`, `pressure-cleaning-L04`, `pressure-cleaning-L05`, `pressure-cleaning-L06`.

### Batch 5 (15): Hair, team, pressure cleaning (part), beauty (part)

`pressure-cleaning-L09`, `pressure-cleaning-L10`, `NEW-HAIR-01`, `NEW-HAIR-02`, `NEW-HAIR-03`, `NEW-HAIR-04`, `NEW-HAIR-05`, `NEW-HAIR-06`, `F12-L01`, `F12-L02`, `F12-L03`, `F12-L04`, `F12-L06`, `additional-specialist-services-L10`, `NEW-BEA-01`.

### Batch 6 (15): Beauty (part), commercial and office cleaning, groom, massage (part)

`NEW-BEA-02`, `NEW-BEA-03`, `NEW-BEA-04`, `NEW-BEA-05`, `laboratory-cleaning-L10`, `laboratory-cleaning-L12`, `warehouse-deep-cleaning-L01`, `warehouse-deep-cleaning-L02`, `warehouse-deep-cleaning-L03`, `NEW-GRO-01`, `NEW-GRO-02`, `NEW-GRO-03`, `NEW-GRO-04`, `NEW-GRO-05`, `NEW-MAS-01`.

### Batch 7 (15): Massage (part), petsit, pool, pt (part)

`NEW-MAS-02`, `NEW-MAS-03`, `NEW-MAS-04`, `NEW-MAS-05`, `NEW-SIT-01`, `NEW-SIT-02`, `NEW-SIT-03`, `NEW-SIT-04`, `NEW-SIT-05`, `pool-cleaning-L01`, `pool-cleaning-L02`, `pool-cleaning-L04`, `pool-cleaning-L06`, `pool-cleaning-L12`, `NEW-FIT-01`.

### Batch 8 (15): PT (part), business, yoga, aquarium

`NEW-FIT-02`, `NEW-FIT-03`, `NEW-FIT-04`, `NEW-FIT-05`, `PROC-01`, `PROC-02`, `PROC-03`, `PROC-04`, `NEW-YOG-01`, `NEW-YOG-02`, `NEW-YOG-03`, `NEW-YOG-04`, `NEW-AQU-01`, `NEW-AQU-02`, `NEW-AQU-03`.

### Batch 9 (15): Chemicals, customer, handyman, real estate, dogwalk, irrigation (part)

`F13-L02`, `custom-eco-cleaning-products-L03`, `custom-eco-cleaning-products-L10`, `F11-L02`, `F11-L05`, `F12-L05`, `handyman-work-L03`, `handyman-work-L12`, `property-maintenance-L11`, `C19-L02`, `C19-L05`, `C19-L06`, `NEW-DOG-04`, `NEW-DOG-05`, `NEW-IRR-02`.

### Batch 10 (15): Miscellaneous small verticals (one to two lessons each)

`NEW-IRR-04`, `NEW-POND-01`, `NEW-POND-03`, `roof-cleaning-soft-washing-L01`, `roof-cleaning-soft-washing-L08`, `high-access-window-cleaning-L06`, `NEW-FLP-01`, `F11-L04`, `NEW-LSC-04`, `F11-L06`, `garden-cleanups-L07`, `additional-specialist-services-L12`, `F11-L03`, `NEW-TIL-04`, `high-access-window-cleaning-L08`.

## 4. Dependencies

**On the rule text.** The register rule says not_checked means "no licence rule confirmed yet, included in both tracks until reviewed". It also says not_required is "included in both tracks, like not_checked". Every batch needs this wording to decide each lesson's new status, so all 10 depend on it. The rule does not say how a not_required lesson differs from a not_checked one in the licensed track. Batches 2, 5, 6, 9 and 10 hold 26 lessons whose note says to keep the existing licence notice (or keep the lesson as written) without stating a status. Those lessons need the rule wording settled before they are decided.

**On the completion rule for courses without one.** The register does not record a course-level completion rule. So the cost of this decision cannot be split by course. Of the 152 not_checked lessons, 144 have no recorded state (75 blank, 64 "not checked", 5 "not confirmed"). They are spread across every batch. Batches 1 and 2 are all no-state (16 each), and the other batches range from 11 to 15. Those batches should not be decided until the owner has answered question 1 below.

## 5. Owner questions

Each question is standalone. Ask them one at a time.

1. Which completion rule applies to courses that have no licence rule: keep them in both tracks as not_checked until reviewed, or treat them as not_required?
2. Should a not_required lesson appear in the licensed track the same way as a not_checked lesson, or should it be shown differently?
3. Should each batch write its result to its own file (for example `research/licence-batches/batch-NN.json`) so that one merge step makes the only edit to `lesson-licence.json`?

## 6. Notes

- Counts and batch contents were generated from the register on 2026-11-04. If the register changes, recount before starting.
- No lesson file or the register was edited. Nothing was deleted, and git was not used.
