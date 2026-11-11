# Structure vs lesson files

Scope: `curriculum/structure/COURSES-MODULES.json` (`courses[].modules[].lessons[]` placements, plus `meta.highRiskModule` and `meta.unplaced`) compared with every JSON file under `curriculum/courses/` and `curriculum/shared/`. Matching key is the lesson `id` field. Read-only audit; no lesson, structure or other file was changed.

## Summary

| Check | Count |
|---|---|
| Placements in course modules | 5164 |
| Distinct placed ids | 445 |
| Lesson files with an `id` | 932 |
| Non-lesson JSON files skipped (no `id`) | 4 |
| Placed ids with no file | 0 |
| Ids in `meta.highRiskModule` with no placement and no file | 84 of 84 |
| Lesson files with no placement | 487 |
| Placements whose course slug is not in the file `courseSlugs` | 3078 across 79 distinct ids |
| `courseSlugs` values not in the structure slug list | 0 |
| `meta.unplaced` ids that are in fact placed and have files | 10 of 10 |

## 1. Placed ids with no file

None. All 445 distinct placed ids resolve to a lesson file.

The earlier checklist count of 84 is not a count of placed ids. It matches the 84 entries in `meta.highRiskModule.lessons` (seven topics, 12 lessons each). Those entries are not placed in any course module and have no file, so they are outside this comparison as placements but are the real gap:

| Topic prefix | Lessons | Placed | File |
|---|---|---|---|
| `biohazard-trauma-cleaning` | 12 | 0 | 0 |
| `crime-scene-cleaning` | 12 | 0 | 0 |
| `drug-contamination-remediation` | 12 | 0 | 0 |
| `fire-smoke-restoration` | 12 | 0 | 0 |
| `flood-water-restoration` | 12 | 0 | 0 |
| `hoarding-squalor` | 12 | 0 | 0 |
| `mould-remediation` | 12 | 0 | 0 |

Ids: `biohazard-trauma-cleaning-L01`, `biohazard-trauma-cleaning-L02`, `biohazard-trauma-cleaning-L03`, `biohazard-trauma-cleaning-L04`, `biohazard-trauma-cleaning-L05`, `biohazard-trauma-cleaning-L06`, `biohazard-trauma-cleaning-L07`, `biohazard-trauma-cleaning-L08`, `biohazard-trauma-cleaning-L09`, `biohazard-trauma-cleaning-L10`, `biohazard-trauma-cleaning-L11`, `biohazard-trauma-cleaning-L12`, `crime-scene-cleaning-L01`, `crime-scene-cleaning-L02`, `crime-scene-cleaning-L03`, `crime-scene-cleaning-L04`, `crime-scene-cleaning-L05`, `crime-scene-cleaning-L06`, `crime-scene-cleaning-L07`, `crime-scene-cleaning-L08`, `crime-scene-cleaning-L09`, `crime-scene-cleaning-L10`, `crime-scene-cleaning-L11`, `crime-scene-cleaning-L12`, `drug-contamination-remediation-L01`, `drug-contamination-remediation-L02`, `drug-contamination-remediation-L03`, `drug-contamination-remediation-L04`, `drug-contamination-remediation-L05`, `drug-contamination-remediation-L06`, `drug-contamination-remediation-L07`, `drug-contamination-remediation-L08`, `drug-contamination-remediation-L09`, `drug-contamination-remediation-L10`, `drug-contamination-remediation-L11`, `drug-contamination-remediation-L12`, `fire-smoke-restoration-L01`, `fire-smoke-restoration-L02`, `fire-smoke-restoration-L03`, `fire-smoke-restoration-L04`, `fire-smoke-restoration-L05`, `fire-smoke-restoration-L06`, `fire-smoke-restoration-L07`, `fire-smoke-restoration-L08`, `fire-smoke-restoration-L09`, `fire-smoke-restoration-L10`, `fire-smoke-restoration-L11`, `fire-smoke-restoration-L12`, `flood-water-restoration-L01`, `flood-water-restoration-L02`, `flood-water-restoration-L03`, `flood-water-restoration-L04`, `flood-water-restoration-L05`, `flood-water-restoration-L06`, `flood-water-restoration-L07`, `flood-water-restoration-L08`, `flood-water-restoration-L09`, `flood-water-restoration-L10`, `flood-water-restoration-L11`, `flood-water-restoration-L12`, `hoarding-squalor-L01`, `hoarding-squalor-L02`, `hoarding-squalor-L03`, `hoarding-squalor-L04`, `hoarding-squalor-L05`, `hoarding-squalor-L06`, `hoarding-squalor-L07`, `hoarding-squalor-L08`, `hoarding-squalor-L09`, `hoarding-squalor-L10`, `hoarding-squalor-L11`, `hoarding-squalor-L12`, `mould-remediation-L01`, `mould-remediation-L02`, `mould-remediation-L03`, `mould-remediation-L04`, `mould-remediation-L05`, `mould-remediation-L06`, `mould-remediation-L07`, `mould-remediation-L08`, `mould-remediation-L09`, `mould-remediation-L10`, `mould-remediation-L11`, `mould-remediation-L12`

## 2. Lesson files with no placement

487 lesson files have an `id` that appears in no course module. Grouped by folder. `courseSlugs` shows what the file itself claims.

### `shared/cleaning` (70)

| id | file | courseSlugs |
|---|---|---|
| `ECO-01` | `ECO-01.json` | 10 slugs |
| `ECO-02` | `ECO-02.json` | 10 slugs |
| `ECO-03` | `ECO-03.json` | 10 slugs |
| `ECO-04` | `ECO-04.json` | 10 slugs |
| `ECO-05` | `ECO-05.json` | 10 slugs |
| `ECO-06` | `ECO-06.json` | 10 slugs |
| `HOT-01` | `HOT-01.json` | shortstay, residential, commercial, bond, strata |
| `HOT-02` | `HOT-02.json` | shortstay, residential, commercial, bond, strata |
| `HOT-03` | `HOT-03.json` | shortstay, residential, commercial, bond, strata |
| `HOT-04` | `HOT-04.json` | shortstay, residential, commercial, bond, strata |
| `HOT-05` | `HOT-05.json` | shortstay, commercial |
| `HOT-06` | `HOT-06.json` | shortstay, commercial |
| `HOT-07` | `HOT-07.json` | shortstay, residential, commercial, bond, strata |
| `HOT-08` | `HOT-08.json` | shortstay, residential, commercial, bond, strata |
| `HOT-09` | `HOT-09.json` | shortstay, residential, commercial, bond, strata |
| `SOP-01` | `SOP-01.json` | 14 slugs |
| `SOP-02` | `SOP-02.json` | 14 slugs |
| `SOP-03` | `SOP-03.json` | 14 slugs |
| `SOP-04` | `SOP-04.json` | 14 slugs |
| `SOP-05` | `SOP-05.json` | 14 slugs |
| `SOP-06` | `SOP-06.json` | 14 slugs |
| `SOP-07` | `SOP-07.json` | 14 slugs |
| `SOP-08` | `SOP-08.json` | 14 slugs |
| `SOP-09` | `SOP-09.json` | 14 slugs |
| `SOP-10` | `SOP-10.json` | 14 slugs |
| `SOP-11` | `SOP-11.json` | 14 slugs |
| `SOP-12` | `SOP-12.json` | 14 slugs |
| `SOP-13` | `SOP-13.json` | 14 slugs |
| `SOP-20` | `SOP-20.json` | 14 slugs |
| `SOP-21` | `SOP-21.json` | 14 slugs |
| `SOP-22` | `SOP-22.json` | 14 slugs |
| `SOP-23` | `SOP-23.json` | 14 slugs |
| `SOP-24` | `SOP-24.json` | 14 slugs |
| `SOP-25` | `SOP-25.json` | 14 slugs |
| `SOP-26` | `SOP-26.json` | 14 slugs |
| `SOP-27` | `SOP-27.json` | 14 slugs |
| `SOP-28` | `SOP-28.json` | 14 slugs |
| `SOP-29` | `SOP-29.json` | 14 slugs |
| `SOP-30` | `SOP-30.json` | 14 slugs |
| `TJS-01` | `TJS-01.json` | residential, commercial, bond, shortstay, strata |
| `TJS-02` | `TJS-02.json` | residential, commercial, bond, shortstay, strata |
| `TJS-03` | `TJS-03.json` | residential, commercial, bond, shortstay, strata |
| `TJS-04` | `TJS-04.json` | residential, commercial, bond, shortstay, strata |
| `TJS-05` | `TJS-05.json` | residential, commercial, bond, shortstay, strata |
| `TJS-06` | `TJS-06.json` | residential, commercial, bond, shortstay, strata |
| `TJS-07` | `TJS-07.json` | residential, commercial, bond, shortstay, strata |
| `TJS-08` | `TJS-08.json` | residential, commercial, bond, shortstay, strata |
| `TJS-09` | `TJS-09.json` | residential, commercial, bond, shortstay, strata |
| `TJS-10` | `TJS-10.json` | residential, commercial, bond, shortstay, strata |
| `TJS-11` | `TJS-11.json` | residential, commercial, bond, shortstay, strata |
| `TJS-12` | `TJS-12.json` | residential, commercial, bond, shortstay, strata |
| `TJS-13` | `TJS-13.json` | residential, commercial, bond, shortstay, strata |
| `TJS-14` | `TJS-14.json` | residential, commercial, bond, shortstay, strata |
| `TJS-15` | `TJS-15.json` | residential, commercial, bond, shortstay, strata |
| `TJS-16` | `TJS-16.json` | residential, commercial, bond, shortstay, strata |
| `TJS-17` | `TJS-17.json` | residential, commercial, bond, shortstay, strata |
| `TJS-18` | `TJS-18.json` | residential, commercial, bond, shortstay, strata |
| `TJS-20` | `TJS-20.json` | 8 slugs |
| `TJS-21` | `TJS-21.json` | 8 slugs |
| `TJS-22` | `TJS-22.json` | 8 slugs |
| `TJS-23` | `TJS-23.json` | 8 slugs |
| `TJS-24` | `TJS-24.json` | 8 slugs |
| `TJS-25` | `TJS-25.json` | 8 slugs |
| `TJS-26` | `TJS-26.json` | 8 slugs |
| `TJS-27` | `TJS-27.json` | 8 slugs |
| `TJS-28` | `TJS-28.json` | 8 slugs |
| `TJS-29` | `TJS-29.json` | 8 slugs |
| `TJS-30` | `TJS-30.json` | 8 slugs |
| `TJS-31` | `TJS-31.json` | 8 slugs |
| `TJS-32` | `TJS-32.json` | 8 slugs |

### `shared/healthcare` (53)

| id | file | courseSlugs |
|---|---|---|
| `ADA-01` | `ADA-01.json` | healthcare |
| `ADA-02` | `ADA-02.json` | healthcare, medequip |
| `ADA-03` | `ADA-03.json` | healthcare, medequip |
| `ADA-04` | `ADA-04.json` | healthcare |
| `ADA-05` | `ADA-05.json` | healthcare |
| `ADA-06` | `ADA-06.json` | healthcare |
| `DIP-01` | `DIP-01.json` | healthcare |
| `DIP-02` | `DIP-02.json` | healthcare, medequip |
| `DIP-03` | `DIP-03.json` | healthcare, medequip |
| `HCG-01` | `HCG-01.json` | healthcare |
| `HCG-02` | `HCG-02.json` | healthcare |
| `HCG-03` | `HCG-03.json` | healthcare |
| `HCG-04` | `HCG-04.json` | healthcare |
| `HCG-05` | `HCG-05.json` | healthcare |
| `HCG-06` | `HCG-06.json` | healthcare |
| `HCG-07` | `HCG-07.json` | healthcare |
| `HCG-08` | `HCG-08.json` | healthcare |
| `HCG-09` | `HCG-09.json` | healthcare |
| `HCG-10` | `HCG-10.json` | healthcare |
| `HCG-11` | `HCG-11.json` | healthcare |
| `HCG-12` | `HCG-12.json` | healthcare |
| `HCG-13` | `HCG-13.json` | healthcare, medequip |
| `HCG-14` | `HCG-14.json` | healthcare, medequip |
| `HCG-15` | `HCG-15.json` | healthcare, medequip |
| `HCG-16` | `HCG-16.json` | healthcare, medequip |
| `HCG-17` | `HCG-17.json` | healthcare, medequip |
| `HCG-18` | `HCG-18.json` | healthcare |
| `HCG-19` | `HCG-19.json` | healthcare |
| `HCG-20` | `HCG-20.json` | healthcare |
| `HIP-01` | `HIP-01.json` | healthcare |
| `HIP-02` | `HIP-02.json` | healthcare |
| `HIP-03` | `HIP-03.json` | healthcare, postcon |
| `HIP-04` | `HIP-04.json` | healthcare |
| `HIP-05` | `HIP-05.json` | healthcare |
| `HLT-01` | `HLT-01.json` | healthcare |
| `HLT-02` | `HLT-02.json` | healthcare |
| `HLT-03` | `HLT-03.json` | healthcare |
| `HLT-04` | `HLT-04.json` | healthcare |
| `HLT-05` | `HLT-05.json` | healthcare |
| `HLT-06` | `HLT-06.json` | healthcare, medequip |
| `HLT-07` | `HLT-07.json` | healthcare, medequip |
| `HLT-08` | `HLT-08.json` | healthcare |
| `HLT-09` | `HLT-09.json` | healthcare |
| `HLT-10` | `HLT-10.json` | healthcare |
| `HLT-11` | `HLT-11.json` | healthcare, medequip |
| `HLT-12` | `HLT-12.json` | healthcare, medequip |
| `HLT-13` | `HLT-13.json` | healthcare |
| `HLT-14` | `HLT-14.json` | healthcare |
| `OTI-01` | `OTI-01.json` | healthcare |
| `OTI-02` | `OTI-02.json` | healthcare |
| `OTI-03` | `OTI-03.json` | healthcare |
| `OTI-04` | `OTI-04.json` | healthcare |
| `OTI-05` | `OTI-05.json` | healthcare |

### `shared/pool` (46)

| id | file | courseSlugs |
|---|---|---|
| `PCS-01` | `PCS-01.json` | pool, residential, commercial |
| `PCS-02` | `PCS-02.json` | pool, residential, commercial |
| `PCS-03` | `PCS-03.json` | pool, residential, commercial |
| `PFM-01` | `PFM-01.json` | pool |
| `PFM-02` | `PFM-02.json` | pool |
| `PFM-03` | `PFM-03.json` | pool |
| `PFM-04` | `PFM-04.json` | pool |
| `PFM-05` | `PFM-05.json` | pool |
| `PFM-06` | `PFM-06.json` | pool |
| `PHM-01` | `PHM-01.json` | pool |
| `PHM-02` | `PHM-02.json` | pool |
| `PHM-03` | `PHM-03.json` | pool |
| `PHM-04` | `PHM-04.json` | pool |
| `PHM-05` | `PHM-05.json` | pool |
| `PHM-06` | `PHM-06.json` | pool |
| `PHM-07` | `PHM-07.json` | pool |
| `PHM-08` | `PHM-08.json` | pool |
| `PHM-09` | `PHM-09.json` | pool |
| `POM-01` | `POM-01.json` | pool |
| `POM-02` | `POM-02.json` | pool |
| `POM-03` | `POM-03.json` | pool |
| `POM-04` | `POM-04.json` | pool |
| `PSA-01` | `PSA-01.json` | pool |
| `PSA-02` | `PSA-02.json` | pool |
| `PSA-03` | `PSA-03.json` | pool |
| `PSA-04` | `PSA-04.json` | pool |
| `PSA-05` | `PSA-05.json` | pool |
| `PSA-06` | `PSA-06.json` | pool |
| `PSA-07` | `PSA-07.json` | pool |
| `PSA-08` | `PSA-08.json` | pool |
| `PSA-09` | `PSA-09.json` | pool |
| `PSA-10` | `PSA-10.json` | pool |
| `PSA-11` | `PSA-11.json` | pool |
| `PSA-12` | `PSA-12.json` | pool |
| `PSA-13` | `PSA-13.json` | pool |
| `PSA-14` | `PSA-14.json` | pool |
| `PSA-15` | `PSA-15.json` | pool |
| `PSA-16` | `PSA-16.json` | pool |
| `PVB-01` | `PVB-01.json` | pool |
| `PVB-02` | `PVB-02.json` | pool |
| `PVB-03` | `PVB-03.json` | pool |
| `PVB-04` | `PVB-04.json` | pool |
| `PVB-05` | `PVB-05.json` | pool |
| `PVB-06` | `PVB-06.json` | pool |
| `PVB-07` | `PVB-07.json` | pool |
| `PVB-08` | `PVB-08.json` | pool |

### `shared/safety` (29)

| id | file | courseSlugs |
|---|---|---|
| `RAS-01` | `RAS-01.json` | commercial, strata |
| `RAS-02` | `RAS-02.json` | commercial, strata |
| `RAS-03` | `RAS-03.json` | commercial, strata |
| `RAS-04` | `RAS-04.json` | commercial, strata, residential |
| `RAS-05` | `RAS-05.json` | commercial, strata |
| `RAS-06` | `RAS-06.json` | commercial, strata, window |
| `RAS-07` | `RAS-07.json` | commercial, strata, residential |
| `RAS-08` | `RAS-08.json` | commercial, strata |
| `RAS-09` | `RAS-09.json` | commercial, strata, healthcare |
| `RAS-10` | `RAS-10.json` | commercial, healthcare |
| `RAS-11` | `RAS-11.json` | commercial, strata, hardfloor |
| `RAS-12` | `RAS-12.json` | commercial, strata |
| `RAS-13` | `RAS-13.json` | commercial, strata |
| `RAS-14` | `RAS-14.json` | commercial, strata |
| `RAS-15` | `RAS-15.json` | commercial, strata |
| `RAS-16` | `RAS-16.json` | commercial, strata |
| `RAS-17` | `RAS-17.json` | commercial, strata |
| `WAH-01` | `WAH-01.json` | 9 slugs |
| `WAH-02` | `WAH-02.json` | 9 slugs |
| `WAH-03` | `WAH-03.json` | 9 slugs |
| `WAH-04` | `WAH-04.json` | 9 slugs |
| `WAH-05` | `WAH-05.json` | 9 slugs |
| `WAH-06` | `WAH-06.json` | 9 slugs |
| `WAH-07` | `WAH-07.json` | 9 slugs |
| `WAH-08` | `WAH-08.json` | 8 slugs |
| `WAH-09` | `WAH-09.json` | 9 slugs |
| `WAH-10` | `WAH-10.json` | 9 slugs |
| `WAH-11` | `WAH-11.json` | 9 slugs |
| `WAH-TPL-01` | `WAH-TPL-01.json` | 9 slugs |

### `shared/fitness-business` (24)

| id | file | courseSlugs |
|---|---|---|
| `ACE-01` | `ACE-01.json` | pt |
| `ACE-02` | `ACE-02.json` | 43 slugs |
| `ACE-03` | `ACE-03.json` | pt |
| `ACE-04` | `ACE-04.json` | 43 slugs |
| `BRY-01` | `BRY-01.json` | yoga, pt |
| `BRY-02` | `BRY-02.json` | yoga, pt |
| `BRY-03` | `BRY-03.json` | yoga, pt |
| `PTB-01` | `PTB-01.json` | pt, yoga, massage |
| `PTB-02` | `PTB-02.json` | pt, yoga, massage |
| `PTB-03` | `PTB-03.json` | pt, yoga, massage |
| `PTB-04` | `PTB-04.json` | pt, yoga, massage |
| `PTB-05` | `PTB-05.json` | pt, yoga, massage |
| `PTB-06` | `PTB-06.json` | pt, yoga, massage |
| `PTB-07` | `PTB-07.json` | pt, yoga, massage |
| `PTB-08` | `PTB-08.json` | pt, yoga |
| `PTB-09` | `PTB-09.json` | pt, yoga |
| `PTB-10` | `PTB-10.json` | pt, yoga |
| `PTB-11` | `PTB-11.json` | pt, yoga |
| `PTB-12` | `PTB-12.json` | pt, yoga |
| `PTB-13` | `PTB-13.json` | pt, yoga, massage |
| `YNS-01` | `YNS-01.json` | 43 slugs |
| `YNS-02` | `YNS-02.json` | 43 slugs |
| `YNS-03` | `YNS-03.json` | 43 slugs |
| `YNS-04` | `YNS-04.json` | 43 slugs |

### `shared/standards` (21)

| id | file | courseSlugs |
|---|---|---|
| `HSE-01` | `HSE-01.json` | healthcare |
| `HSE-02` | `HSE-02.json` | healthcare |
| `HSE-03` | `HSE-03.json` | healthcare |
| `HSE-04` | `HSE-04.json` | healthcare |
| `HSE-05` | `HSE-05.json` | healthcare |
| `HSE-06` | `HSE-06.json` | healthcare |
| `HSE-07` | `HSE-07.json` | healthcare |
| `HSE-08` | `HSE-08.json` | healthcare |
| `HSE-09` | `HSE-09.json` | healthcare |
| `HSE-10` | `HSE-10.json` | healthcare |
| `SAH-01` | `SAH-01.json` | healthcare |
| `SAH-02` | `SAH-02.json` | healthcare |
| `SAH-03` | `SAH-03.json` | healthcare |
| `SAH-04` | `SAH-04.json` | healthcare |
| `SAH-05` | `SAH-05.json` | healthcare |
| `SAH-06` | `SAH-06.json` | healthcare |
| `SAH-07` | `SAH-07.json` | healthcare |
| `SAH-08` | `SAH-08.json` | healthcare |
| `SAH-09` | `SAH-09.json` | healthcare |
| `SAH-10` | `SAH-10.json` | healthcare |
| `SAH-11` | `SAH-11.json` | healthcare |

### `shared/business` (17)

| id | file | courseSlugs |
|---|---|---|
| `BPX-01` | `BPX-01.json` | 7 slugs |
| `BPX-02` | `BPX-02.json` | 7 slugs |
| `BPX-03` | `BPX-03.json` | 7 slugs |
| `BPX-04` | `BPX-04.json` | 7 slugs |
| `BPX-05` | `BPX-05.json` | 7 slugs |
| `PBP-01` | `PBP-01.json` | pool, residential, commercial |
| `PBP-02` | `PBP-02.json` | pool, residential, commercial |
| `PBP-03` | `PBP-03.json` | pool, residential, commercial |
| `PBP-04` | `PBP-04.json` | pool, residential, commercial |
| `PBP-05` | `PBP-05.json` | pool, residential, commercial |
| `PBP-06` | `PBP-06.json` | pool, residential, commercial |
| `PBP-TPL-01` | `PBP-TPL-01.json` | pool, residential, commercial |
| `SHR-FIN-01` | `SHR-FIN-01.json` | 43 slugs |
| `SHR-FIN-02` | `SHR-FIN-02.json` | 43 slugs |
| `SHR-FIN-03` | `SHR-FIN-03.json` | 43 slugs |
| `SHR-FIN-04` | `SHR-FIN-04.json` | 43 slugs |
| `SHR-FIN-05` | `SHR-FIN-05.json` | 43 slugs |

### `shared/app` (16)

| id | file | courseSlugs |
|---|---|---|
| `SFS-01` | `SFS-01.json` | (empty) |
| `SFS-02` | `SFS-02.json` | (empty) |
| `SFS-03` | `SFS-03.json` | (empty) |
| `SFS-04` | `SFS-04.json` | (empty) |
| `SFS-05` | `SFS-05.json` | (empty) |
| `SFS-06` | `SFS-06.json` | (empty) |
| `SFS-07` | `SFS-07.json` | (empty) |
| `SFS-08` | `SFS-08.json` | (empty) |
| `SFS-09` | `SFS-09.json` | (empty) |
| `SFS-10` | `SFS-10.json` | (empty) |
| `SFS-11` | `SFS-11.json` | (empty) |
| `SFS-12` | `SFS-12.json` | (empty) |
| `SFS-13` | `SFS-13.json` | (empty) |
| `SFS-14` | `SFS-14.json` | (empty) |
| `SFS-15` | `SFS-15.json` | (empty) |
| `SFS-16` | `SFS-16.json` | (empty) |

### `shared/handyman` (16)

| id | file | courseSlugs |
|---|---|---|
| `HBM-01` | `HBM-01.json` | handyman |
| `HBM-02` | `HBM-02.json` | 7 slugs |
| `HBM-03` | `HBM-03.json` | 7 slugs |
| `HBM-04` | `HBM-04.json` | 7 slugs |
| `HBM-05` | `HBM-05.json` | 7 slugs |
| `HBM-06` | `HBM-06.json` | 7 slugs |
| `HBM-07` | `HBM-07.json` | handyman |
| `HBM-08` | `HBM-08.json` | 7 slugs |
| `HBM-09` | `HBM-09.json` | 7 slugs |
| `HBM-10` | `HBM-10.json` | 7 slugs |
| `HBM-11` | `HBM-11.json` | 7 slugs |
| `HBM-12` | `HBM-12.json` | 7 slugs |
| `HBM-13` | `HBM-13.json` | 7 slugs |
| `HBM-14` | `HBM-14.json` | 7 slugs |
| `HBM-15` | `HBM-15.json` | 7 slugs |
| `HBM-16` | `HBM-16.json` | 7 slugs |

### `shared/marketing` (15)

| id | file | courseSlugs |
|---|---|---|
| `BP-02` | `BP-02.json` | 43 slugs |
| `BP-04` | `BP-04.json` | 43 slugs |
| `CP-01` | `CP-01.json` | 43 slugs |
| `CP-02` | `CP-02.json` | 43 slugs |
| `CP-03` | `CP-03.json` | 43 slugs |
| `CP-04` | `CP-04.json` | 43 slugs |
| `MP-01` | `MP-01.json` | 43 slugs |
| `MP-02` | `MP-02.json` | 43 slugs |
| `MP-03` | `MP-03.json` | 43 slugs |
| `SHR-PLN-04` | `SHR-PLN-04.json` | 43 slugs |
| `SHR-PLN-05` | `SHR-PLN-05.json` | 43 slugs |
| `SOL-05` | `SOL-05.json` | 43 slugs |
| `SOL-06` | `SOL-06.json` | 43 slugs |
| `SOL-08` | `SOL-08.json` | 43 slugs |
| `TPL-03` | `TPL-03.json` | 43 slugs |

### `shared/operations` (14)

| id | file | courseSlugs |
|---|---|---|
| `MP-05` | `MP-05.json` | 43 slugs |
| `MP-06` | `MP-06.json` | 43 slugs |
| `MP-07` | `MP-07.json` | 43 slugs |
| `MP-08` | `MP-08.json` | 43 slugs |
| `PRO-02` | `PRO-02.json` | 43 slugs |
| `SOL-07` | `SOL-07.json` | 43 slugs |
| `THS-01` | `THS-01.json` | commercial, shortstay |
| `THS-02` | `THS-02.json` | commercial, shortstay |
| `THS-03` | `THS-03.json` | commercial, shortstay |
| `THS-04` | `THS-04.json` | commercial, shortstay |
| `THS-05` | `THS-05.json` | commercial |
| `THS-06` | `THS-06.json` | commercial, shortstay |
| `THS-07` | `THS-07.json` | commercial, shortstay |
| `TPL-05` | `TPL-05.json` | 43 slugs |

### `shared/team` (14)

| id | file | courseSlugs |
|---|---|---|
| `BP-07` | `BP-07.json` | 43 slugs |
| `TLD-01` | `TLD-01.json` | residential, commercial, bond, shortstay |
| `TLD-02` | `TLD-02.json` | residential, commercial, bond, shortstay |
| `TLD-03` | `TLD-03.json` | residential, commercial, bond, shortstay |
| `TLD-04` | `TLD-04.json` | residential, commercial, bond, shortstay |
| `TLD-05` | `TLD-05.json` | residential, commercial, bond, shortstay |
| `TLD-06` | `TLD-06.json` | residential, commercial, bond, shortstay |
| `TLD-07` | `TLD-07.json` | residential, commercial, bond, shortstay |
| `TLD-08` | `TLD-08.json` | residential, commercial, bond, shortstay |
| `TLD-09` | `TLD-09.json` | residential, commercial, bond, shortstay |
| `TLD-10` | `TLD-10.json` | (empty) |
| `TLD-11` | `TLD-11.json` | (empty) |
| `TPL-08` | `TPL-08.json` | 43 slugs |
| `TPL-09` | `TPL-09.json` | 43 slugs |

### `courses/appliance` (12)

| id | file | courseSlugs |
|---|---|---|
| `NEW-APP-01` | `NEW-APP-01.json` | appliance |
| `NEW-APP-02` | `NEW-APP-02.json` | appliance |
| `NEW-APP-03` | `NEW-APP-03.json` | appliance |
| `NEW-APP-04` | `NEW-APP-04.json` | appliance |
| `NEW-APP-05` | `NEW-APP-05.json` | appliance |
| `NEW-APP-06` | `NEW-APP-06.json` | appliance |
| `NEW-APP-07` | `NEW-APP-07.json` | appliance |
| `NEW-APP-08` | `NEW-APP-08.json` | appliance |
| `NEW-APP-09` | `NEW-APP-09.json` | appliance |
| `NEW-APP-10` | `NEW-APP-10.json` | appliance |
| `NEW-APP-11` | `NEW-APP-11.json` | appliance |
| `NEW-APP-12` | `NEW-APP-12.json` | appliance |

### `courses/furniture` (12)

| id | file | courseSlugs |
|---|---|---|
| `NEW-FUR-01` | `NEW-FUR-01.json` | furniture |
| `NEW-FUR-02` | `NEW-FUR-02.json` | furniture |
| `NEW-FUR-03` | `NEW-FUR-03.json` | furniture |
| `NEW-FUR-04` | `NEW-FUR-04.json` | furniture |
| `NEW-FUR-05` | `NEW-FUR-05.json` | furniture |
| `NEW-FUR-06` | `NEW-FUR-06.json` | furniture |
| `NEW-FUR-07` | `NEW-FUR-07.json` | furniture |
| `NEW-FUR-08` | `NEW-FUR-08.json` | furniture |
| `NEW-FUR-09` | `NEW-FUR-09.json` | furniture |
| `NEW-FUR-10` | `NEW-FUR-10.json` | furniture |
| `NEW-FUR-11` | `NEW-FUR-11.json` | furniture |
| `NEW-FUR-12` | `NEW-FUR-12.json` | furniture |

### `courses/stone` (12)

| id | file | courseSlugs |
|---|---|---|
| `NEW-STN-01` | `NEW-STN-01.json` | stone |
| `NEW-STN-02` | `NEW-STN-02.json` | stone |
| `NEW-STN-03` | `NEW-STN-03.json` | stone |
| `NEW-STN-04` | `NEW-STN-04.json` | stone |
| `NEW-STN-05` | `NEW-STN-05.json` | stone |
| `NEW-STN-06` | `NEW-STN-06.json` | stone |
| `NEW-STN-07` | `NEW-STN-07.json` | stone |
| `NEW-STN-08` | `NEW-STN-08.json` | stone |
| `NEW-STN-09` | `NEW-STN-09.json` | stone |
| `NEW-STN-10` | `NEW-STN-10.json` | stone |
| `NEW-STN-11` | `NEW-STN-11.json` | stone |
| `NEW-STN-12` | `NEW-STN-12.json` | stone |

### `courses/timber` (12)

| id | file | courseSlugs |
|---|---|---|
| `NEW-TMB-01` | `NEW-TMB-01.json` | timber |
| `NEW-TMB-02` | `NEW-TMB-02.json` | timber |
| `NEW-TMB-03` | `NEW-TMB-03.json` | timber |
| `NEW-TMB-04` | `NEW-TMB-04.json` | timber |
| `NEW-TMB-05` | `NEW-TMB-05.json` | timber |
| `NEW-TMB-06` | `NEW-TMB-06.json` | timber |
| `NEW-TMB-07` | `NEW-TMB-07.json` | timber |
| `NEW-TMB-08` | `NEW-TMB-08.json` | timber |
| `NEW-TMB-09` | `NEW-TMB-09.json` | timber |
| `NEW-TMB-10` | `NEW-TMB-10.json` | timber |
| `NEW-TMB-11` | `NEW-TMB-11.json` | timber |
| `NEW-TMB-12` | `NEW-TMB-12.json` | timber |

### `courses/pond` (11)

| id | file | courseSlugs |
|---|---|---|
| `NEW-POND-04` | `NEW-POND-04.json` | pond |
| `NEW-POND-05` | `NEW-POND-05.json` | pond |
| `NEW-POND-06` | `NEW-POND-06.json` | pond |
| `NEW-POND-07` | `NEW-POND-07.json` | pond |
| `NEW-POND-08` | `NEW-POND-08.json` | pond |
| `NEW-POND-09` | `NEW-POND-09.json` | pond |
| `pond-cleaning-L03` | `pond-cleaning-L03.json` | pond |
| `pond-cleaning-L04` | `pond-cleaning-L04.json` | pond |
| `pond-cleaning-L07` | `pond-cleaning-L07.json` | pond |
| `pond-cleaning-L10` | `pond-cleaning-L10.json` | pond |
| `pond-cleaning-L11` | `pond-cleaning-L11.json` | pond |

### `shared/starting-business` (10)

| id | file | courseSlugs |
|---|---|---|
| `BP-01` | `BP-01.json` | 43 slugs |
| `BP-03` | `BP-03.json` | 43 slugs |
| `BP-06` | `BP-06.json` | 43 slugs |
| `SHR-PLN-02` | `SHR-PLN-02.json` | 43 slugs |
| `SHR-PLN-03` | `SHR-PLN-03.json` | 43 slugs |
| `SOL-01` | `SOL-01.json` | 43 slugs |
| `SOL-02` | `SOL-02.json` | 43 slugs |
| `SOL-04` | `SOL-04.json` | 43 slugs |
| `TPL-01` | `TPL-01.json` | 43 slugs |
| `TPL-02` | `TPL-02.json` | 43 slugs |

### `courses/aquarium` (9)

| id | file | courseSlugs |
|---|---|---|
| `NEW-AQU-05` | `NEW-AQU-05.json` | aquarium |
| `NEW-AQU-06` | `NEW-AQU-06.json` | aquarium |
| `NEW-AQU-07` | `NEW-AQU-07.json` | aquarium |
| `NEW-AQU-08` | `NEW-AQU-08.json` | aquarium |
| `aquarium-cleaning-L03` | `aquarium-cleaning-L03.json` | aquarium |
| `aquarium-cleaning-L04` | `aquarium-cleaning-L04.json` | aquarium |
| `aquarium-cleaning-L07` | `aquarium-cleaning-L07.json` | aquarium |
| `aquarium-cleaning-L10` | `aquarium-cleaning-L10.json` | aquarium |
| `aquarium-cleaning-L11` | `aquarium-cleaning-L11.json` | aquarium |

### `courses/car-detailing` (8)

| id | file | courseSlugs |
|---|---|---|
| `CAR-NEW-01` | `CAR-NEW-01.json` | cardetail |
| `CAR-NEW-02` | `CAR-NEW-02.json` | cardetail |
| `CAR-NEW-04` | `CAR-NEW-04.json` | cardetail |
| `CAR-NEW-05` | `CAR-NEW-05.json` | cardetail |
| `CAR-NEW-06` | `CAR-NEW-06.json` | cardetail |
| `CAR-NEW-07` | `CAR-NEW-07.json` | cardetail |
| `CAR-NEW-08` | `CAR-NEW-08.json` | cardetail |
| `CAR-NEW-09` | `CAR-NEW-09.json` | cardetail |

### `shared/food-sanitation` (8)

| id | file | courseSlugs |
|---|---|---|
| `FPS-01` | `FPS-01.json` | commercial |
| `FPS-02` | `FPS-02.json` | commercial |
| `FPS-03` | `FPS-03.json` | commercial |
| `FPS-04` | `FPS-04.json` | commercial |
| `FPS-05` | `FPS-05.json` | commercial |
| `FPS-06` | `FPS-06.json` | commercial |
| `FPS-07` | `FPS-07.json` | commercial |
| `FPS-08` | `FPS-08.json` | commercial |

### `shared/validation` (8)

| id | file | courseSlugs |
|---|---|---|
| `CPV-01` | `CPV-01.json` | commercial |
| `CPV-02` | `CPV-02.json` | (empty) |
| `CPV-03` | `CPV-03.json` | (empty) |
| `CPV-04` | `CPV-04.json` | (empty) |
| `CPV-05` | `CPV-05.json` | (empty) |
| `CPV-06` | `CPV-06.json` | (empty) |
| `CPV-07` | `CPV-07.json` | commercial |
| `CPV-08` | `CPV-08.json` | (empty) |

### `courses/high-risk` (7)

| id | file | courseSlugs |
|---|---|---|
| `HR01-biohazard-trauma-cleaning` | `HR01-biohazard-trauma-cleaning.json` | (empty) |
| `HR02-crime-scene-cleaning` | `HR02-crime-scene-cleaning.json` | (empty) |
| `HR03-drug-contamination-remediation` | `HR03-drug-contamination-remediation.json` | (empty) |
| `HR04-mould-remediation` | `HR04-mould-remediation.json` | (empty) |
| `HR05-fire-smoke-restoration` | `HR05-fire-smoke-restoration.json` | (empty) |
| `HR06-flood-water-restoration` | `HR06-flood-water-restoration.json` | (empty) |
| `HR07-hoarding-squalor` | `HR07-hoarding-squalor.json` | (empty) |

### `shared/cleaning-guide` (6)

| id | file | courseSlugs |
|---|---|---|
| `CL2-01` | `CL2-01.json` | residential, commercial, strata |
| `CL2-02` | `CL2-02.json` | residential, commercial |
| `CL2-03` | `CL2-03.json` | residential, commercial, window |
| `CL2-04` | `CL2-04.json` | carpet |
| `CL2-05` | `CL2-05.json` | strata, commercial |
| `CL2-06` | `CL2-06.json` | strata, commercial |

### `shared/quoting` (6)

| id | file | courseSlugs |
|---|---|---|
| `BP-05` | `BP-05.json` | 43 slugs |
| `MP-04` | `MP-04.json` | 43 slugs |
| `PRO-01` | `PRO-01.json` | 43 slugs |
| `SOL-03` | `SOL-03.json` | 43 slugs |
| `TPL-04` | `TPL-04.json` | 43 slugs |
| `TPL-11` | `TPL-11.json` | 43 slugs |

### `shared/templates` (6)

| id | file | courseSlugs |
|---|---|---|
| `TPL-12` | `TPL-12.json` | 10 slugs |
| `TPL-13` | `TPL-13.json` | 10 slugs |
| `TPL-14` | `TPL-14.json` | 10 slugs |
| `TPL-15` | `TPL-15.json` | 10 slugs |
| `TPL-16` | `TPL-16.json` | 10 slugs |
| `TPL-17` | `TPL-17.json` | 10 slugs |

### `shared/business-stats` (5)

| id | file | courseSlugs |
|---|---|---|
| `BST-01` | `BST-01.json` | 43 slugs |
| `BST-02` | `BST-02.json` | 43 slugs |
| `BST-03` | `BST-03.json` | 43 slugs |
| `BST-04` | `BST-04.json` | 43 slugs |
| `BST-05` | `BST-05.json` | 43 slugs |

### `shared/caregiving` (5)

| id | file | courseSlugs |
|---|---|---|
| `CGC-01` | `CGC-01.json` | (empty) |
| `CGC-02` | `CGC-02.json` | (empty) |
| `CGC-03` | `CGC-03.json` | (empty) |
| `CGC-04` | `CGC-04.json` | (empty) |
| `CGC-05` | `CGC-05.json` | (empty) |

### `shared/nhs-sop` (4)

| id | file | courseSlugs |
|---|---|---|
| `NHS-01` | `NHS-01.json` | healthcare |
| `NHS-02` | `NHS-02.json` | healthcare, commercial |
| `NHS-03` | `NHS-03.json` | healthcare, commercial |
| `NHS-04` | `NHS-04.json` | healthcare, commercial |

### `shared/green` (3)

| id | file | courseSlugs |
|---|---|---|
| `GCM-01` | `GCM-01.json` | residential, commercial, bond, shortstay, strata |
| `GCM-02` | `GCM-02.json` | residential, commercial, bond, shortstay |
| `GCM-03` | `GCM-03.json` | residential, commercial, shortstay, bond |

### `courses/pool` (2)

| id | file | courseSlugs |
|---|---|---|
| `pool-cleaning-L13` | `pool-cleaning-L13.json` | pool |
| `pool-cleaning-L14` | `pool-cleaning-L14.json` | pool |

### `shared/customer` (2)

| id | file | courseSlugs |
|---|---|---|
| `SHR-PLN-01` | `SHR-PLN-01.json` | 43 slugs |
| `TPL-10` | `TPL-10.json` | 43 slugs |

### `shared/quality` (2)

| id | file | courseSlugs |
|---|---|---|
| `PRO-03` | `PRO-03.json` | 43 slugs |
| `TPL-07` | `TPL-07.json` | 43 slugs |

### `courses/tiling` (1)

| id | file | courseSlugs |
|---|---|---|
| `NEW-TIL-08` | `NEW-TIL-08.json` | tiling |

### `shared/job-management` (1)

| id | file | courseSlugs |
|---|---|---|
| `TPL-06` | `TPL-06.json` | 43 slugs |

Skipped non-lesson JSON files (no `id`):

- `curriculum/courses/pressure-cleaning-all-heights/SHARED-REFERENCES.json`
- `curriculum/courses/roof-soft-washing/SHARED-REFERENCES.json`
- `curriculum/courses/solar-panel-cleaning/SHARED-REFERENCES.json`
- `curriculum/courses/window-cleaning-all-heights/SHARED-REFERENCES.json`

## 3. Placements whose course slug is not in the lesson `courseSlugs`

3078 placements, 79 distinct lesson ids. Each id is placed in courses that its own `courseSlugs` does not list.

| id | file | file courseSlugs | placed in (count) |
|---|---|---|---|
| `C01-L01` | `shared/induction/C01-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C01-L02` | `shared/induction/C01-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C01-L03` | `shared/induction/C01-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C02-L01` | `shared/job-management/C02-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C02-L02` | `shared/job-management/C02-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C02-L03` | `shared/job-management/C02-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C05-L01` | `shared/chemicals/C05-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C05-L02` | `shared/chemicals/C05-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C05-L03` | `shared/equipment/C05-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C09-L01` | `shared/quality/C09-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C09-L02` | `shared/quality/C09-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C09-L03` | `shared/quality/C09-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C10-L01` | `shared/safety/C10-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C10-L02` | `shared/safety/C10-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `C10-L03` | `shared/safety/C10-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F01-L01` | `shared/induction/F01-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F01-L02` | `shared/customer/F01-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F01-L03` | `shared/induction/F01-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F01-L04` | `shared/job-management/F01-L04.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F02-L01` | `shared/safety/F02-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F02-L02` | `shared/safety/F02-L02.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F02-L03` | `shared/safety/F02-L03.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F02-L04` | `shared/safety/F02-L04.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F03-L01` | `shared/chemicals/F03-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F03-L02` | `shared/chemicals/F03-L02.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F03-L03` | `shared/chemicals/F03-L03.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F03-L04` | `shared/chemicals/F03-L04.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F04-L01` | `shared/equipment/F04-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F04-L02` | `shared/equipment/F04-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F04-L03` | `shared/equipment/F04-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F04-L04` | `shared/equipment/F04-L04.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F05-L01` | `shared/job-management/F05-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F05-L02` | `shared/chemicals/F05-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F05-L03` | `shared/job-management/F05-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F08-L01` | `shared/safety/F08-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F08-L02` | `shared/safety/F08-L02.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F08-L03` | `shared/chemicals/F08-L03.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F08-L04` | `shared/equipment/F08-L04.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F08-L05` | `shared/safety/F08-L05.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F09-L01` | `shared/quality/F09-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F09-L02` | `shared/quality/F09-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F09-L03` | `shared/quality/F09-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F09-L04` | `shared/quality/F09-L04.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F09-L05` | `shared/quality/F09-L05.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F10-L01` | `shared/induction/F10-L01.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F10-L02` | `shared/operations/F10-L02.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F10-L04` | `shared/equipment/F10-L04.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F10-L05` | `shared/quality/F10-L05.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `F14-L01` | `shared/customer/F14-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F14-L02` | `shared/safety/F14-L02.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F14-L04` | `shared/safety/F14-L04.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F14-L05` | `shared/customer/F14-L05.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F15-L01` | `shared/induction/F15-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F15-L02` | `shared/induction/F15-L02.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F15-L03` | `shared/safety/F15-L03.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F15-L04` | `shared/induction/F15-L04.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F15-L05` | `shared/customer/F15-L05.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F15-L06` | `shared/safety/F15-L06.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F16-L01` | `shared/chemicals/F16-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F16-L03` | `shared/chemicals/F16-L03.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F17-L01` | `shared/equipment/F17-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F17-L04` | `shared/safety/F17-L04.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F17-L05` | `shared/safety/F17-L05.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F19-L01` | `shared/job-management/F19-L01.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F19-L05` | `shared/job-management/F19-L05.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `F19-L06` | `shared/quality/F19-L06.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `S12-L03` | `shared/quality/S12-L03.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `S12-L08` | `shared/quality/S12-L08.json` | window | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, solar, stone, strata, tiling, timber, yoga |
| `S14-L03` | `shared/safety/S14-L03.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `S14-L04` | `shared/safety/S14-L04.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `S14-L05` | `shared/safety/S14-L05.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `S14-L07` | `shared/safety/S14-L07.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `S14-L08` | `shared/safety/S14-L08.json` | solar | 42: appliance, aquarium, beauty, bond, cardetail, carpet, commercial, construction, deck, dogwalk, flatpack, furniture, garden, groom, hair, handyman, hardfloor, healthcare, irrigation, landscaping, lawn, locksmith, massage, medequip, painting, petsit, plastering, pond, pool, portfolio, postcon, pressure, pt, residential, roof, shortstay, stone, strata, tiling, timber, window, yoga |
| `pool-cleaning-L03` | `courses/pool/pool-cleaning-L03.json` | pool | 2: aquarium, pond |
| `pool-cleaning-L04` | `courses/pool/pool-cleaning-L04.json` | pool | 2: aquarium, pond |
| `pool-cleaning-L07` | `courses/pool/pool-cleaning-L07.json` | pool | 2: aquarium, pond |
| `pool-cleaning-L10` | `courses/pool/pool-cleaning-L10.json` | pool | 2: aquarium, pond |
| `pool-cleaning-L11` | `courses/pool/pool-cleaning-L11.json` | pool | 2: aquarium, pond |
| `roof-cleaning-soft-washing-L09` | `shared/exterior/roof-cleaning-soft-washing-L09.json` | pressure | 2: cardetail, roof |

Pattern: 73 shared lessons (ids starting C, F or S, all under `shared/`) list only `solar` or `window` in `courseSlugs` but are placed in 42 other courses each. Five `pool-cleaning-L*` files list only `pool` but are also placed in `pond` and `aquarium`. `roof-cleaning-soft-washing-L09` lists only `pressure` and is placed in two other courses. These placements, or the `courseSlugs` values, need a decision; this audit does not choose.

## Decisions made in this audit

- Matching is by lesson `id`; file location and filename were not used for matching. Every filename stem equals its `id`.
- A placement is a mismatch when its course slug is absent from the file `courseSlugs`. Files with empty `courseSlugs` were counted as unplaced, not as mismatched.
- `meta.highRiskModule` is treated as a list of intended lessons, not placements; their absence from course modules is reported, not fixed.
- `meta.unplaced` is reported as stale: its 10 property-maintenance ids are placed and have files.
- The 4 `SHARED-REFERENCES.json` files are reference data, not lessons, and are excluded.
