# Orphan lesson files: curriculum/courses and curriculum/shared

Checked 2026-11-03 against `curriculum/structure/COURSES-MODULES.json`. Read-only audit; no lesson, structure or course files were changed.

## Method and decisions

- Lesson files: every `.json` under `courses/` and `shared/`, excluding the 4 `courses/*/SHARED-REFERENCES.json` manifests (not lessons; they have no `status`, `id` or `courseSlugs`). The manifests are not counted in any total below.
- Placement: a lesson is placed when its `id` appears in any course `modules[].lessons[].id` in COURSES-MODULES.json. The `highRiskModule` block and the `unplaced` list in `meta` are not course placements, so they are not counted as placed.
- Orphan: a lesson file whose `id` is not placed in any course. The table lists these.
- "Course file" for a slug: a folder under `courses/` that maps to that slug (folder name, or `folderToCanonical` in `structure/SLUG-MAP.json`).
- DRAFT check uses the `status` field inside each lesson file, not the structure status text.
- `courses/high-risk/` is a layer folder per SLUG-MAP notes, not a course. Its 7 parent files are orphans; their 84 sub-lessons are listed only in the `highRiskModule` block.

## Counts

| Measure | Count |
|---|---|
| Lesson files in scope (excluding 4 manifests) | 932 |
| - under courses/ | 372 |
| - under shared/ | 560 |
| Lesson files with status DRAFT | 932 |
| Orphan files (not placed in any course) | 487 |
| - under courses/ | 86 |
| - under shared/ | 401 |
| Orphan files with status DRAFT (all orphans) | 487 |
| Course placements in COURSES-MODULES.json (lesson-id rows) | 5164 |
| Courses in COURSES-MODULES.json | 43 |
| courseSlugs values used by lesson files | 43 |
| Course slugs with no course folder | 1 |

## Course slugs with no course file

- `construction`: referenced by 143 lesson files in courseSlugs. It is a course in COURSES-MODULES.json (43 courses in total) but there is no `curriculum/courses/construction/` folder. SLUG-MAP.json says the folder "does not exist yet". Every other slug used in courseSlugs has a folder.
- No other course slug is missing a folder. `high-risk` has a folder but no course slug and no structure course entry (layer only).

## Other findings

- The 7 high-risk parent files (HR01 to HR07) are orphans with empty courseSlugs. Their 84 sub-lessons carry `sourceLessonId` values that match the `highRiskModule` block, so they are referenced there but not placed in any course.
- 421 of the 487 orphans appear in `structure/COURSE-MODULE-LESSON-MAP.csv`. The CSV therefore places lessons that COURSES-MODULES.json does not. The two structure files disagree and need reconciling. The CSV also has 84 ids that match neither a lesson file nor a JSON placement. All 84 are the high-risk sub-lesson ids (biohazard-trauma-cleaning-L01 onward).
- 79 placed lessons sit in a course that is not in their own `courseSlugs`, for example `pool-cleaning-L03` is placed in aquarium and pond but its courseSlugs is `["pool"]`.
- 451 orphans list one or more courses in courseSlugs. 36 orphans have an empty courseSlugs, and that group includes the 7 high-risk parents.

## Orphan table

| # | Lesson id | File (under curriculum/) | Folder | courseSlugs | Status |
|---|---|---|---|---|---|
| 1 | NEW-APP-01 | courses/appliance/NEW-APP-01.json | courses/appliance | appliance | DRAFT |
| 2 | NEW-APP-02 | courses/appliance/NEW-APP-02.json | courses/appliance | appliance | DRAFT |
| 3 | NEW-APP-03 | courses/appliance/NEW-APP-03.json | courses/appliance | appliance | DRAFT |
| 4 | NEW-APP-04 | courses/appliance/NEW-APP-04.json | courses/appliance | appliance | DRAFT |
| 5 | NEW-APP-05 | courses/appliance/NEW-APP-05.json | courses/appliance | appliance | DRAFT |
| 6 | NEW-APP-06 | courses/appliance/NEW-APP-06.json | courses/appliance | appliance | DRAFT |
| 7 | NEW-APP-07 | courses/appliance/NEW-APP-07.json | courses/appliance | appliance | DRAFT |
| 8 | NEW-APP-08 | courses/appliance/NEW-APP-08.json | courses/appliance | appliance | DRAFT |
| 9 | NEW-APP-09 | courses/appliance/NEW-APP-09.json | courses/appliance | appliance | DRAFT |
| 10 | NEW-APP-10 | courses/appliance/NEW-APP-10.json | courses/appliance | appliance | DRAFT |
| 11 | NEW-APP-11 | courses/appliance/NEW-APP-11.json | courses/appliance | appliance | DRAFT |
| 12 | NEW-APP-12 | courses/appliance/NEW-APP-12.json | courses/appliance | appliance | DRAFT |
| 13 | NEW-AQU-05 | courses/aquarium/NEW-AQU-05.json | courses/aquarium | aquarium | DRAFT |
| 14 | NEW-AQU-06 | courses/aquarium/NEW-AQU-06.json | courses/aquarium | aquarium | DRAFT |
| 15 | NEW-AQU-07 | courses/aquarium/NEW-AQU-07.json | courses/aquarium | aquarium | DRAFT |
| 16 | NEW-AQU-08 | courses/aquarium/NEW-AQU-08.json | courses/aquarium | aquarium | DRAFT |
| 17 | aquarium-cleaning-L03 | courses/aquarium/aquarium-cleaning-L03.json | courses/aquarium | aquarium | DRAFT |
| 18 | aquarium-cleaning-L04 | courses/aquarium/aquarium-cleaning-L04.json | courses/aquarium | aquarium | DRAFT |
| 19 | aquarium-cleaning-L07 | courses/aquarium/aquarium-cleaning-L07.json | courses/aquarium | aquarium | DRAFT |
| 20 | aquarium-cleaning-L10 | courses/aquarium/aquarium-cleaning-L10.json | courses/aquarium | aquarium | DRAFT |
| 21 | aquarium-cleaning-L11 | courses/aquarium/aquarium-cleaning-L11.json | courses/aquarium | aquarium | DRAFT |
| 22 | CAR-NEW-01 | courses/car-detailing/CAR-NEW-01.json | courses/car-detailing | cardetail | DRAFT |
| 23 | CAR-NEW-02 | courses/car-detailing/CAR-NEW-02.json | courses/car-detailing | cardetail | DRAFT |
| 24 | CAR-NEW-04 | courses/car-detailing/CAR-NEW-04.json | courses/car-detailing | cardetail | DRAFT |
| 25 | CAR-NEW-05 | courses/car-detailing/CAR-NEW-05.json | courses/car-detailing | cardetail | DRAFT |
| 26 | CAR-NEW-06 | courses/car-detailing/CAR-NEW-06.json | courses/car-detailing | cardetail | DRAFT |
| 27 | CAR-NEW-07 | courses/car-detailing/CAR-NEW-07.json | courses/car-detailing | cardetail | DRAFT |
| 28 | CAR-NEW-08 | courses/car-detailing/CAR-NEW-08.json | courses/car-detailing | cardetail | DRAFT |
| 29 | CAR-NEW-09 | courses/car-detailing/CAR-NEW-09.json | courses/car-detailing | cardetail | DRAFT |
| 30 | NEW-FUR-01 | courses/furniture/NEW-FUR-01.json | courses/furniture | furniture | DRAFT |
| 31 | NEW-FUR-02 | courses/furniture/NEW-FUR-02.json | courses/furniture | furniture | DRAFT |
| 32 | NEW-FUR-03 | courses/furniture/NEW-FUR-03.json | courses/furniture | furniture | DRAFT |
| 33 | NEW-FUR-04 | courses/furniture/NEW-FUR-04.json | courses/furniture | furniture | DRAFT |
| 34 | NEW-FUR-05 | courses/furniture/NEW-FUR-05.json | courses/furniture | furniture | DRAFT |
| 35 | NEW-FUR-06 | courses/furniture/NEW-FUR-06.json | courses/furniture | furniture | DRAFT |
| 36 | NEW-FUR-07 | courses/furniture/NEW-FUR-07.json | courses/furniture | furniture | DRAFT |
| 37 | NEW-FUR-08 | courses/furniture/NEW-FUR-08.json | courses/furniture | furniture | DRAFT |
| 38 | NEW-FUR-09 | courses/furniture/NEW-FUR-09.json | courses/furniture | furniture | DRAFT |
| 39 | NEW-FUR-10 | courses/furniture/NEW-FUR-10.json | courses/furniture | furniture | DRAFT |
| 40 | NEW-FUR-11 | courses/furniture/NEW-FUR-11.json | courses/furniture | furniture | DRAFT |
| 41 | NEW-FUR-12 | courses/furniture/NEW-FUR-12.json | courses/furniture | furniture | DRAFT |
| 42 | HR01-biohazard-trauma-cleaning | courses/high-risk/HR01-biohazard-trauma-cleaning.json | courses/high-risk | (none) | DRAFT |
| 43 | HR02-crime-scene-cleaning | courses/high-risk/HR02-crime-scene-cleaning.json | courses/high-risk | (none) | DRAFT |
| 44 | HR03-drug-contamination-remediation | courses/high-risk/HR03-drug-contamination-remediation.json | courses/high-risk | (none) | DRAFT |
| 45 | HR04-mould-remediation | courses/high-risk/HR04-mould-remediation.json | courses/high-risk | (none) | DRAFT |
| 46 | HR05-fire-smoke-restoration | courses/high-risk/HR05-fire-smoke-restoration.json | courses/high-risk | (none) | DRAFT |
| 47 | HR06-flood-water-restoration | courses/high-risk/HR06-flood-water-restoration.json | courses/high-risk | (none) | DRAFT |
| 48 | HR07-hoarding-squalor | courses/high-risk/HR07-hoarding-squalor.json | courses/high-risk | (none) | DRAFT |
| 49 | NEW-POND-04 | courses/pond/NEW-POND-04.json | courses/pond | pond | DRAFT |
| 50 | NEW-POND-05 | courses/pond/NEW-POND-05.json | courses/pond | pond | DRAFT |
| 51 | NEW-POND-06 | courses/pond/NEW-POND-06.json | courses/pond | pond | DRAFT |
| 52 | NEW-POND-07 | courses/pond/NEW-POND-07.json | courses/pond | pond | DRAFT |
| 53 | NEW-POND-08 | courses/pond/NEW-POND-08.json | courses/pond | pond | DRAFT |
| 54 | NEW-POND-09 | courses/pond/NEW-POND-09.json | courses/pond | pond | DRAFT |
| 55 | pond-cleaning-L03 | courses/pond/pond-cleaning-L03.json | courses/pond | pond | DRAFT |
| 56 | pond-cleaning-L04 | courses/pond/pond-cleaning-L04.json | courses/pond | pond | DRAFT |
| 57 | pond-cleaning-L07 | courses/pond/pond-cleaning-L07.json | courses/pond | pond | DRAFT |
| 58 | pond-cleaning-L10 | courses/pond/pond-cleaning-L10.json | courses/pond | pond | DRAFT |
| 59 | pond-cleaning-L11 | courses/pond/pond-cleaning-L11.json | courses/pond | pond | DRAFT |
| 60 | pool-cleaning-L13 | courses/pool/pool-cleaning-L13.json | courses/pool | pool | DRAFT |
| 61 | pool-cleaning-L14 | courses/pool/pool-cleaning-L14.json | courses/pool | pool | DRAFT |
| 62 | NEW-STN-01 | courses/stone/NEW-STN-01.json | courses/stone | stone | DRAFT |
| 63 | NEW-STN-02 | courses/stone/NEW-STN-02.json | courses/stone | stone | DRAFT |
| 64 | NEW-STN-03 | courses/stone/NEW-STN-03.json | courses/stone | stone | DRAFT |
| 65 | NEW-STN-04 | courses/stone/NEW-STN-04.json | courses/stone | stone | DRAFT |
| 66 | NEW-STN-05 | courses/stone/NEW-STN-05.json | courses/stone | stone | DRAFT |
| 67 | NEW-STN-06 | courses/stone/NEW-STN-06.json | courses/stone | stone | DRAFT |
| 68 | NEW-STN-07 | courses/stone/NEW-STN-07.json | courses/stone | stone | DRAFT |
| 69 | NEW-STN-08 | courses/stone/NEW-STN-08.json | courses/stone | stone | DRAFT |
| 70 | NEW-STN-09 | courses/stone/NEW-STN-09.json | courses/stone | stone | DRAFT |
| 71 | NEW-STN-10 | courses/stone/NEW-STN-10.json | courses/stone | stone | DRAFT |
| 72 | NEW-STN-11 | courses/stone/NEW-STN-11.json | courses/stone | stone | DRAFT |
| 73 | NEW-STN-12 | courses/stone/NEW-STN-12.json | courses/stone | stone | DRAFT |
| 74 | NEW-TIL-08 | courses/tiling/NEW-TIL-08.json | courses/tiling | tiling | DRAFT |
| 75 | NEW-TMB-01 | courses/timber/NEW-TMB-01.json | courses/timber | timber | DRAFT |
| 76 | NEW-TMB-02 | courses/timber/NEW-TMB-02.json | courses/timber | timber | DRAFT |
| 77 | NEW-TMB-03 | courses/timber/NEW-TMB-03.json | courses/timber | timber | DRAFT |
| 78 | NEW-TMB-04 | courses/timber/NEW-TMB-04.json | courses/timber | timber | DRAFT |
| 79 | NEW-TMB-05 | courses/timber/NEW-TMB-05.json | courses/timber | timber | DRAFT |
| 80 | NEW-TMB-06 | courses/timber/NEW-TMB-06.json | courses/timber | timber | DRAFT |
| 81 | NEW-TMB-07 | courses/timber/NEW-TMB-07.json | courses/timber | timber | DRAFT |
| 82 | NEW-TMB-08 | courses/timber/NEW-TMB-08.json | courses/timber | timber | DRAFT |
| 83 | NEW-TMB-09 | courses/timber/NEW-TMB-09.json | courses/timber | timber | DRAFT |
| 84 | NEW-TMB-10 | courses/timber/NEW-TMB-10.json | courses/timber | timber | DRAFT |
| 85 | NEW-TMB-11 | courses/timber/NEW-TMB-11.json | courses/timber | timber | DRAFT |
| 86 | NEW-TMB-12 | courses/timber/NEW-TMB-12.json | courses/timber | timber | DRAFT |
| 87 | SFS-01 | shared/app/SFS-01.json | shared/app | (none) | DRAFT |
| 88 | SFS-02 | shared/app/SFS-02.json | shared/app | (none) | DRAFT |
| 89 | SFS-03 | shared/app/SFS-03.json | shared/app | (none) | DRAFT |
| 90 | SFS-04 | shared/app/SFS-04.json | shared/app | (none) | DRAFT |
| 91 | SFS-05 | shared/app/SFS-05.json | shared/app | (none) | DRAFT |
| 92 | SFS-06 | shared/app/SFS-06.json | shared/app | (none) | DRAFT |
| 93 | SFS-07 | shared/app/SFS-07.json | shared/app | (none) | DRAFT |
| 94 | SFS-08 | shared/app/SFS-08.json | shared/app | (none) | DRAFT |
| 95 | SFS-09 | shared/app/SFS-09.json | shared/app | (none) | DRAFT |
| 96 | SFS-10 | shared/app/SFS-10.json | shared/app | (none) | DRAFT |
| 97 | SFS-11 | shared/app/SFS-11.json | shared/app | (none) | DRAFT |
| 98 | SFS-12 | shared/app/SFS-12.json | shared/app | (none) | DRAFT |
| 99 | SFS-13 | shared/app/SFS-13.json | shared/app | (none) | DRAFT |
| 100 | SFS-14 | shared/app/SFS-14.json | shared/app | (none) | DRAFT |
| 101 | SFS-15 | shared/app/SFS-15.json | shared/app | (none) | DRAFT |
| 102 | SFS-16 | shared/app/SFS-16.json | shared/app | (none) | DRAFT |
| 103 | BST-01 | shared/business-stats/BST-01.json | shared/business-stats | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 104 | BST-02 | shared/business-stats/BST-02.json | shared/business-stats | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 105 | BST-03 | shared/business-stats/BST-03.json | shared/business-stats | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 106 | BST-04 | shared/business-stats/BST-04.json | shared/business-stats | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 107 | BST-05 | shared/business-stats/BST-05.json | shared/business-stats | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 108 | BPX-01 | shared/business/BPX-01.json | shared/business | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 109 | BPX-02 | shared/business/BPX-02.json | shared/business | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 110 | BPX-03 | shared/business/BPX-03.json | shared/business | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 111 | BPX-04 | shared/business/BPX-04.json | shared/business | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 112 | BPX-05 | shared/business/BPX-05.json | shared/business | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 113 | PBP-01 | shared/business/PBP-01.json | shared/business | pool, residential, commercial | DRAFT |
| 114 | PBP-02 | shared/business/PBP-02.json | shared/business | pool, residential, commercial | DRAFT |
| 115 | PBP-03 | shared/business/PBP-03.json | shared/business | pool, residential, commercial | DRAFT |
| 116 | PBP-04 | shared/business/PBP-04.json | shared/business | pool, residential, commercial | DRAFT |
| 117 | PBP-05 | shared/business/PBP-05.json | shared/business | pool, residential, commercial | DRAFT |
| 118 | PBP-06 | shared/business/PBP-06.json | shared/business | pool, residential, commercial | DRAFT |
| 119 | PBP-TPL-01 | shared/business/PBP-TPL-01.json | shared/business | pool, residential, commercial | DRAFT |
| 120 | SHR-FIN-01 | shared/business/SHR-FIN-01.json | shared/business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 121 | SHR-FIN-02 | shared/business/SHR-FIN-02.json | shared/business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 122 | SHR-FIN-03 | shared/business/SHR-FIN-03.json | shared/business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 123 | SHR-FIN-04 | shared/business/SHR-FIN-04.json | shared/business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 124 | SHR-FIN-05 | shared/business/SHR-FIN-05.json | shared/business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 125 | CGC-01 | shared/caregiving/CGC-01.json | shared/caregiving | (none) | DRAFT |
| 126 | CGC-02 | shared/caregiving/CGC-02.json | shared/caregiving | (none) | DRAFT |
| 127 | CGC-03 | shared/caregiving/CGC-03.json | shared/caregiving | (none) | DRAFT |
| 128 | CGC-04 | shared/caregiving/CGC-04.json | shared/caregiving | (none) | DRAFT |
| 129 | CGC-05 | shared/caregiving/CGC-05.json | shared/caregiving | (none) | DRAFT |
| 130 | CL2-01 | shared/cleaning-guide/CL2-01.json | shared/cleaning-guide | residential, commercial, strata | DRAFT |
| 131 | CL2-02 | shared/cleaning-guide/CL2-02.json | shared/cleaning-guide | residential, commercial | DRAFT |
| 132 | CL2-03 | shared/cleaning-guide/CL2-03.json | shared/cleaning-guide | residential, commercial, window | DRAFT |
| 133 | CL2-04 | shared/cleaning-guide/CL2-04.json | shared/cleaning-guide | carpet | DRAFT |
| 134 | CL2-05 | shared/cleaning-guide/CL2-05.json | shared/cleaning-guide | strata, commercial | DRAFT |
| 135 | CL2-06 | shared/cleaning-guide/CL2-06.json | shared/cleaning-guide | strata, commercial | DRAFT |
| 136 | ECO-01 | shared/cleaning/ECO-01.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail | DRAFT |
| 137 | ECO-02 | shared/cleaning/ECO-02.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail | DRAFT |
| 138 | ECO-03 | shared/cleaning/ECO-03.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail | DRAFT |
| 139 | ECO-04 | shared/cleaning/ECO-04.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail | DRAFT |
| 140 | ECO-05 | shared/cleaning/ECO-05.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail | DRAFT |
| 141 | ECO-06 | shared/cleaning/ECO-06.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail | DRAFT |
| 142 | HOT-01 | shared/cleaning/HOT-01.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 143 | HOT-02 | shared/cleaning/HOT-02.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 144 | HOT-03 | shared/cleaning/HOT-03.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 145 | HOT-04 | shared/cleaning/HOT-04.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 146 | HOT-05 | shared/cleaning/HOT-05.json | shared/cleaning | shortstay, commercial | DRAFT |
| 147 | HOT-06 | shared/cleaning/HOT-06.json | shared/cleaning | shortstay, commercial | DRAFT |
| 148 | HOT-07 | shared/cleaning/HOT-07.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 149 | HOT-08 | shared/cleaning/HOT-08.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 150 | HOT-09 | shared/cleaning/HOT-09.json | shared/cleaning | shortstay, residential, commercial, bond, strata | DRAFT |
| 151 | SOP-01 | shared/cleaning/SOP-01.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 152 | SOP-02 | shared/cleaning/SOP-02.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 153 | SOP-03 | shared/cleaning/SOP-03.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 154 | SOP-04 | shared/cleaning/SOP-04.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 155 | SOP-05 | shared/cleaning/SOP-05.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 156 | SOP-06 | shared/cleaning/SOP-06.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 157 | SOP-07 | shared/cleaning/SOP-07.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 158 | SOP-08 | shared/cleaning/SOP-08.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 159 | SOP-09 | shared/cleaning/SOP-09.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 160 | SOP-10 | shared/cleaning/SOP-10.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 161 | SOP-11 | shared/cleaning/SOP-11.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 162 | SOP-12 | shared/cleaning/SOP-12.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 163 | SOP-13 | shared/cleaning/SOP-13.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 164 | SOP-20 | shared/cleaning/SOP-20.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 165 | SOP-21 | shared/cleaning/SOP-21.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 166 | SOP-22 | shared/cleaning/SOP-22.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 167 | SOP-23 | shared/cleaning/SOP-23.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 168 | SOP-24 | shared/cleaning/SOP-24.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 169 | SOP-25 | shared/cleaning/SOP-25.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 170 | SOP-26 | shared/cleaning/SOP-26.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 171 | SOP-27 | shared/cleaning/SOP-27.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 172 | SOP-28 | shared/cleaning/SOP-28.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 173 | SOP-29 | shared/cleaning/SOP-29.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 174 | SOP-30 | shared/cleaning/SOP-30.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, appliance, stone, timber, furniture | DRAFT |
| 175 | TJS-01 | shared/cleaning/TJS-01.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 176 | TJS-02 | shared/cleaning/TJS-02.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 177 | TJS-03 | shared/cleaning/TJS-03.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 178 | TJS-04 | shared/cleaning/TJS-04.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 179 | TJS-05 | shared/cleaning/TJS-05.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 180 | TJS-06 | shared/cleaning/TJS-06.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 181 | TJS-07 | shared/cleaning/TJS-07.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 182 | TJS-08 | shared/cleaning/TJS-08.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 183 | TJS-09 | shared/cleaning/TJS-09.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 184 | TJS-10 | shared/cleaning/TJS-10.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 185 | TJS-11 | shared/cleaning/TJS-11.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 186 | TJS-12 | shared/cleaning/TJS-12.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 187 | TJS-13 | shared/cleaning/TJS-13.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 188 | TJS-14 | shared/cleaning/TJS-14.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 189 | TJS-15 | shared/cleaning/TJS-15.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 190 | TJS-16 | shared/cleaning/TJS-16.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 191 | TJS-17 | shared/cleaning/TJS-17.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 192 | TJS-18 | shared/cleaning/TJS-18.json | shared/cleaning | residential, commercial, bond, shortstay, strata | DRAFT |
| 193 | TJS-20 | shared/cleaning/TJS-20.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 194 | TJS-21 | shared/cleaning/TJS-21.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 195 | TJS-22 | shared/cleaning/TJS-22.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 196 | TJS-23 | shared/cleaning/TJS-23.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 197 | TJS-24 | shared/cleaning/TJS-24.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 198 | TJS-25 | shared/cleaning/TJS-25.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 199 | TJS-26 | shared/cleaning/TJS-26.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 200 | TJS-27 | shared/cleaning/TJS-27.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 201 | TJS-28 | shared/cleaning/TJS-28.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 202 | TJS-29 | shared/cleaning/TJS-29.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 203 | TJS-30 | shared/cleaning/TJS-30.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 204 | TJS-31 | shared/cleaning/TJS-31.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 205 | TJS-32 | shared/cleaning/TJS-32.json | shared/cleaning | residential, commercial, bond, shortstay, carpet, hardfloor, postcon, strata | DRAFT |
| 206 | SHR-PLN-01 | shared/customer/SHR-PLN-01.json | shared/customer | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 207 | TPL-10 | shared/customer/TPL-10.json | shared/customer | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 208 | ACE-01 | shared/fitness-business/ACE-01.json | shared/fitness-business | pt | DRAFT |
| 209 | ACE-02 | shared/fitness-business/ACE-02.json | shared/fitness-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 210 | ACE-03 | shared/fitness-business/ACE-03.json | shared/fitness-business | pt | DRAFT |
| 211 | ACE-04 | shared/fitness-business/ACE-04.json | shared/fitness-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 212 | BRY-01 | shared/fitness-business/BRY-01.json | shared/fitness-business | yoga, pt | DRAFT |
| 213 | BRY-02 | shared/fitness-business/BRY-02.json | shared/fitness-business | yoga, pt | DRAFT |
| 214 | BRY-03 | shared/fitness-business/BRY-03.json | shared/fitness-business | yoga, pt | DRAFT |
| 215 | PTB-01 | shared/fitness-business/PTB-01.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 216 | PTB-02 | shared/fitness-business/PTB-02.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 217 | PTB-03 | shared/fitness-business/PTB-03.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 218 | PTB-04 | shared/fitness-business/PTB-04.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 219 | PTB-05 | shared/fitness-business/PTB-05.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 220 | PTB-06 | shared/fitness-business/PTB-06.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 221 | PTB-07 | shared/fitness-business/PTB-07.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 222 | PTB-08 | shared/fitness-business/PTB-08.json | shared/fitness-business | pt, yoga | DRAFT |
| 223 | PTB-09 | shared/fitness-business/PTB-09.json | shared/fitness-business | pt, yoga | DRAFT |
| 224 | PTB-10 | shared/fitness-business/PTB-10.json | shared/fitness-business | pt, yoga | DRAFT |
| 225 | PTB-11 | shared/fitness-business/PTB-11.json | shared/fitness-business | pt, yoga | DRAFT |
| 226 | PTB-12 | shared/fitness-business/PTB-12.json | shared/fitness-business | pt, yoga | DRAFT |
| 227 | PTB-13 | shared/fitness-business/PTB-13.json | shared/fitness-business | pt, yoga, massage | DRAFT |
| 228 | YNS-01 | shared/fitness-business/YNS-01.json | shared/fitness-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 229 | YNS-02 | shared/fitness-business/YNS-02.json | shared/fitness-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 230 | YNS-03 | shared/fitness-business/YNS-03.json | shared/fitness-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 231 | YNS-04 | shared/fitness-business/YNS-04.json | shared/fitness-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 232 | FPS-01 | shared/food-sanitation/FPS-01.json | shared/food-sanitation | commercial | DRAFT |
| 233 | FPS-02 | shared/food-sanitation/FPS-02.json | shared/food-sanitation | commercial | DRAFT |
| 234 | FPS-03 | shared/food-sanitation/FPS-03.json | shared/food-sanitation | commercial | DRAFT |
| 235 | FPS-04 | shared/food-sanitation/FPS-04.json | shared/food-sanitation | commercial | DRAFT |
| 236 | FPS-05 | shared/food-sanitation/FPS-05.json | shared/food-sanitation | commercial | DRAFT |
| 237 | FPS-06 | shared/food-sanitation/FPS-06.json | shared/food-sanitation | commercial | DRAFT |
| 238 | FPS-07 | shared/food-sanitation/FPS-07.json | shared/food-sanitation | commercial | DRAFT |
| 239 | FPS-08 | shared/food-sanitation/FPS-08.json | shared/food-sanitation | commercial | DRAFT |
| 240 | GCM-01 | shared/green/GCM-01.json | shared/green | residential, commercial, bond, shortstay, strata | DRAFT |
| 241 | GCM-02 | shared/green/GCM-02.json | shared/green | residential, commercial, bond, shortstay | DRAFT |
| 242 | GCM-03 | shared/green/GCM-03.json | shared/green | residential, commercial, shortstay, bond | DRAFT |
| 243 | HBM-01 | shared/handyman/HBM-01.json | shared/handyman | handyman | DRAFT |
| 244 | HBM-02 | shared/handyman/HBM-02.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 245 | HBM-03 | shared/handyman/HBM-03.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 246 | HBM-04 | shared/handyman/HBM-04.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 247 | HBM-05 | shared/handyman/HBM-05.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 248 | HBM-06 | shared/handyman/HBM-06.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 249 | HBM-07 | shared/handyman/HBM-07.json | shared/handyman | handyman | DRAFT |
| 250 | HBM-08 | shared/handyman/HBM-08.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 251 | HBM-09 | shared/handyman/HBM-09.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 252 | HBM-10 | shared/handyman/HBM-10.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 253 | HBM-11 | shared/handyman/HBM-11.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 254 | HBM-12 | shared/handyman/HBM-12.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 255 | HBM-13 | shared/handyman/HBM-13.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 256 | HBM-14 | shared/handyman/HBM-14.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 257 | HBM-15 | shared/handyman/HBM-15.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 258 | HBM-16 | shared/handyman/HBM-16.json | shared/handyman | handyman, deck, flatpack, locksmith, painting, plastering, tiling | DRAFT |
| 259 | ADA-01 | shared/healthcare/ADA-01.json | shared/healthcare | healthcare | DRAFT |
| 260 | ADA-02 | shared/healthcare/ADA-02.json | shared/healthcare | healthcare, medequip | DRAFT |
| 261 | ADA-03 | shared/healthcare/ADA-03.json | shared/healthcare | healthcare, medequip | DRAFT |
| 262 | ADA-04 | shared/healthcare/ADA-04.json | shared/healthcare | healthcare | DRAFT |
| 263 | ADA-05 | shared/healthcare/ADA-05.json | shared/healthcare | healthcare | DRAFT |
| 264 | ADA-06 | shared/healthcare/ADA-06.json | shared/healthcare | healthcare | DRAFT |
| 265 | DIP-01 | shared/healthcare/DIP-01.json | shared/healthcare | healthcare | DRAFT |
| 266 | DIP-02 | shared/healthcare/DIP-02.json | shared/healthcare | healthcare, medequip | DRAFT |
| 267 | DIP-03 | shared/healthcare/DIP-03.json | shared/healthcare | healthcare, medequip | DRAFT |
| 268 | HCG-01 | shared/healthcare/HCG-01.json | shared/healthcare | healthcare | DRAFT |
| 269 | HCG-02 | shared/healthcare/HCG-02.json | shared/healthcare | healthcare | DRAFT |
| 270 | HCG-03 | shared/healthcare/HCG-03.json | shared/healthcare | healthcare | DRAFT |
| 271 | HCG-04 | shared/healthcare/HCG-04.json | shared/healthcare | healthcare | DRAFT |
| 272 | HCG-05 | shared/healthcare/HCG-05.json | shared/healthcare | healthcare | DRAFT |
| 273 | HCG-06 | shared/healthcare/HCG-06.json | shared/healthcare | healthcare | DRAFT |
| 274 | HCG-07 | shared/healthcare/HCG-07.json | shared/healthcare | healthcare | DRAFT |
| 275 | HCG-08 | shared/healthcare/HCG-08.json | shared/healthcare | healthcare | DRAFT |
| 276 | HCG-09 | shared/healthcare/HCG-09.json | shared/healthcare | healthcare | DRAFT |
| 277 | HCG-10 | shared/healthcare/HCG-10.json | shared/healthcare | healthcare | DRAFT |
| 278 | HCG-11 | shared/healthcare/HCG-11.json | shared/healthcare | healthcare | DRAFT |
| 279 | HCG-12 | shared/healthcare/HCG-12.json | shared/healthcare | healthcare | DRAFT |
| 280 | HCG-13 | shared/healthcare/HCG-13.json | shared/healthcare | healthcare, medequip | DRAFT |
| 281 | HCG-14 | shared/healthcare/HCG-14.json | shared/healthcare | healthcare, medequip | DRAFT |
| 282 | HCG-15 | shared/healthcare/HCG-15.json | shared/healthcare | healthcare, medequip | DRAFT |
| 283 | HCG-16 | shared/healthcare/HCG-16.json | shared/healthcare | healthcare, medequip | DRAFT |
| 284 | HCG-17 | shared/healthcare/HCG-17.json | shared/healthcare | healthcare, medequip | DRAFT |
| 285 | HCG-18 | shared/healthcare/HCG-18.json | shared/healthcare | healthcare | DRAFT |
| 286 | HCG-19 | shared/healthcare/HCG-19.json | shared/healthcare | healthcare | DRAFT |
| 287 | HCG-20 | shared/healthcare/HCG-20.json | shared/healthcare | healthcare | DRAFT |
| 288 | HIP-01 | shared/healthcare/HIP-01.json | shared/healthcare | healthcare | DRAFT |
| 289 | HIP-02 | shared/healthcare/HIP-02.json | shared/healthcare | healthcare | DRAFT |
| 290 | HIP-03 | shared/healthcare/HIP-03.json | shared/healthcare | healthcare, postcon | DRAFT |
| 291 | HIP-04 | shared/healthcare/HIP-04.json | shared/healthcare | healthcare | DRAFT |
| 292 | HIP-05 | shared/healthcare/HIP-05.json | shared/healthcare | healthcare | DRAFT |
| 293 | HLT-01 | shared/healthcare/HLT-01.json | shared/healthcare | healthcare | DRAFT |
| 294 | HLT-02 | shared/healthcare/HLT-02.json | shared/healthcare | healthcare | DRAFT |
| 295 | HLT-03 | shared/healthcare/HLT-03.json | shared/healthcare | healthcare | DRAFT |
| 296 | HLT-04 | shared/healthcare/HLT-04.json | shared/healthcare | healthcare | DRAFT |
| 297 | HLT-05 | shared/healthcare/HLT-05.json | shared/healthcare | healthcare | DRAFT |
| 298 | HLT-06 | shared/healthcare/HLT-06.json | shared/healthcare | healthcare, medequip | DRAFT |
| 299 | HLT-07 | shared/healthcare/HLT-07.json | shared/healthcare | healthcare, medequip | DRAFT |
| 300 | HLT-08 | shared/healthcare/HLT-08.json | shared/healthcare | healthcare | DRAFT |
| 301 | HLT-09 | shared/healthcare/HLT-09.json | shared/healthcare | healthcare | DRAFT |
| 302 | HLT-10 | shared/healthcare/HLT-10.json | shared/healthcare | healthcare | DRAFT |
| 303 | HLT-11 | shared/healthcare/HLT-11.json | shared/healthcare | healthcare, medequip | DRAFT |
| 304 | HLT-12 | shared/healthcare/HLT-12.json | shared/healthcare | healthcare, medequip | DRAFT |
| 305 | HLT-13 | shared/healthcare/HLT-13.json | shared/healthcare | healthcare | DRAFT |
| 306 | HLT-14 | shared/healthcare/HLT-14.json | shared/healthcare | healthcare | DRAFT |
| 307 | OTI-01 | shared/healthcare/OTI-01.json | shared/healthcare | healthcare | DRAFT |
| 308 | OTI-02 | shared/healthcare/OTI-02.json | shared/healthcare | healthcare | DRAFT |
| 309 | OTI-03 | shared/healthcare/OTI-03.json | shared/healthcare | healthcare | DRAFT |
| 310 | OTI-04 | shared/healthcare/OTI-04.json | shared/healthcare | healthcare | DRAFT |
| 311 | OTI-05 | shared/healthcare/OTI-05.json | shared/healthcare | healthcare | DRAFT |
| 312 | TPL-06 | shared/job-management/TPL-06.json | shared/job-management | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 313 | BP-02 | shared/marketing/BP-02.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 314 | BP-04 | shared/marketing/BP-04.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 315 | CP-01 | shared/marketing/CP-01.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 316 | CP-02 | shared/marketing/CP-02.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 317 | CP-03 | shared/marketing/CP-03.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 318 | CP-04 | shared/marketing/CP-04.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 319 | MP-01 | shared/marketing/MP-01.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 320 | MP-02 | shared/marketing/MP-02.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 321 | MP-03 | shared/marketing/MP-03.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 322 | SHR-PLN-04 | shared/marketing/SHR-PLN-04.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 323 | SHR-PLN-05 | shared/marketing/SHR-PLN-05.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 324 | SOL-05 | shared/marketing/SOL-05.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 325 | SOL-06 | shared/marketing/SOL-06.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 326 | SOL-08 | shared/marketing/SOL-08.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 327 | TPL-03 | shared/marketing/TPL-03.json | shared/marketing | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 328 | NHS-01 | shared/nhs-sop/NHS-01.json | shared/nhs-sop | healthcare | DRAFT |
| 329 | NHS-02 | shared/nhs-sop/NHS-02.json | shared/nhs-sop | healthcare, commercial | DRAFT |
| 330 | NHS-03 | shared/nhs-sop/NHS-03.json | shared/nhs-sop | healthcare, commercial | DRAFT |
| 331 | NHS-04 | shared/nhs-sop/NHS-04.json | shared/nhs-sop | healthcare, commercial | DRAFT |
| 332 | MP-05 | shared/operations/MP-05.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 333 | MP-06 | shared/operations/MP-06.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 334 | MP-07 | shared/operations/MP-07.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 335 | MP-08 | shared/operations/MP-08.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 336 | PRO-02 | shared/operations/PRO-02.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 337 | SOL-07 | shared/operations/SOL-07.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 338 | THS-01 | shared/operations/THS-01.json | shared/operations | commercial, shortstay | DRAFT |
| 339 | THS-02 | shared/operations/THS-02.json | shared/operations | commercial, shortstay | DRAFT |
| 340 | THS-03 | shared/operations/THS-03.json | shared/operations | commercial, shortstay | DRAFT |
| 341 | THS-04 | shared/operations/THS-04.json | shared/operations | commercial, shortstay | DRAFT |
| 342 | THS-05 | shared/operations/THS-05.json | shared/operations | commercial | DRAFT |
| 343 | THS-06 | shared/operations/THS-06.json | shared/operations | commercial, shortstay | DRAFT |
| 344 | THS-07 | shared/operations/THS-07.json | shared/operations | commercial, shortstay | DRAFT |
| 345 | TPL-05 | shared/operations/TPL-05.json | shared/operations | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 346 | PCS-01 | shared/pool/PCS-01.json | shared/pool | pool, residential, commercial | DRAFT |
| 347 | PCS-02 | shared/pool/PCS-02.json | shared/pool | pool, residential, commercial | DRAFT |
| 348 | PCS-03 | shared/pool/PCS-03.json | shared/pool | pool, residential, commercial | DRAFT |
| 349 | PFM-01 | shared/pool/PFM-01.json | shared/pool | pool | DRAFT |
| 350 | PFM-02 | shared/pool/PFM-02.json | shared/pool | pool | DRAFT |
| 351 | PFM-03 | shared/pool/PFM-03.json | shared/pool | pool | DRAFT |
| 352 | PFM-04 | shared/pool/PFM-04.json | shared/pool | pool | DRAFT |
| 353 | PFM-05 | shared/pool/PFM-05.json | shared/pool | pool | DRAFT |
| 354 | PFM-06 | shared/pool/PFM-06.json | shared/pool | pool | DRAFT |
| 355 | PHM-01 | shared/pool/PHM-01.json | shared/pool | pool | DRAFT |
| 356 | PHM-02 | shared/pool/PHM-02.json | shared/pool | pool | DRAFT |
| 357 | PHM-03 | shared/pool/PHM-03.json | shared/pool | pool | DRAFT |
| 358 | PHM-04 | shared/pool/PHM-04.json | shared/pool | pool | DRAFT |
| 359 | PHM-05 | shared/pool/PHM-05.json | shared/pool | pool | DRAFT |
| 360 | PHM-06 | shared/pool/PHM-06.json | shared/pool | pool | DRAFT |
| 361 | PHM-07 | shared/pool/PHM-07.json | shared/pool | pool | DRAFT |
| 362 | PHM-08 | shared/pool/PHM-08.json | shared/pool | pool | DRAFT |
| 363 | PHM-09 | shared/pool/PHM-09.json | shared/pool | pool | DRAFT |
| 364 | POM-01 | shared/pool/POM-01.json | shared/pool | pool | DRAFT |
| 365 | POM-02 | shared/pool/POM-02.json | shared/pool | pool | DRAFT |
| 366 | POM-03 | shared/pool/POM-03.json | shared/pool | pool | DRAFT |
| 367 | POM-04 | shared/pool/POM-04.json | shared/pool | pool | DRAFT |
| 368 | PSA-01 | shared/pool/PSA-01.json | shared/pool | pool | DRAFT |
| 369 | PSA-02 | shared/pool/PSA-02.json | shared/pool | pool | DRAFT |
| 370 | PSA-03 | shared/pool/PSA-03.json | shared/pool | pool | DRAFT |
| 371 | PSA-04 | shared/pool/PSA-04.json | shared/pool | pool | DRAFT |
| 372 | PSA-05 | shared/pool/PSA-05.json | shared/pool | pool | DRAFT |
| 373 | PSA-06 | shared/pool/PSA-06.json | shared/pool | pool | DRAFT |
| 374 | PSA-07 | shared/pool/PSA-07.json | shared/pool | pool | DRAFT |
| 375 | PSA-08 | shared/pool/PSA-08.json | shared/pool | pool | DRAFT |
| 376 | PSA-09 | shared/pool/PSA-09.json | shared/pool | pool | DRAFT |
| 377 | PSA-10 | shared/pool/PSA-10.json | shared/pool | pool | DRAFT |
| 378 | PSA-11 | shared/pool/PSA-11.json | shared/pool | pool | DRAFT |
| 379 | PSA-12 | shared/pool/PSA-12.json | shared/pool | pool | DRAFT |
| 380 | PSA-13 | shared/pool/PSA-13.json | shared/pool | pool | DRAFT |
| 381 | PSA-14 | shared/pool/PSA-14.json | shared/pool | pool | DRAFT |
| 382 | PSA-15 | shared/pool/PSA-15.json | shared/pool | pool | DRAFT |
| 383 | PSA-16 | shared/pool/PSA-16.json | shared/pool | pool | DRAFT |
| 384 | PVB-01 | shared/pool/PVB-01.json | shared/pool | pool | DRAFT |
| 385 | PVB-02 | shared/pool/PVB-02.json | shared/pool | pool | DRAFT |
| 386 | PVB-03 | shared/pool/PVB-03.json | shared/pool | pool | DRAFT |
| 387 | PVB-04 | shared/pool/PVB-04.json | shared/pool | pool | DRAFT |
| 388 | PVB-05 | shared/pool/PVB-05.json | shared/pool | pool | DRAFT |
| 389 | PVB-06 | shared/pool/PVB-06.json | shared/pool | pool | DRAFT |
| 390 | PVB-07 | shared/pool/PVB-07.json | shared/pool | pool | DRAFT |
| 391 | PVB-08 | shared/pool/PVB-08.json | shared/pool | pool | DRAFT |
| 392 | PRO-03 | shared/quality/PRO-03.json | shared/quality | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 393 | TPL-07 | shared/quality/TPL-07.json | shared/quality | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 394 | BP-05 | shared/quoting/BP-05.json | shared/quoting | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 395 | MP-04 | shared/quoting/MP-04.json | shared/quoting | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 396 | PRO-01 | shared/quoting/PRO-01.json | shared/quoting | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 397 | SOL-03 | shared/quoting/SOL-03.json | shared/quoting | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 398 | TPL-04 | shared/quoting/TPL-04.json | shared/quoting | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 399 | TPL-11 | shared/quoting/TPL-11.json | shared/quoting | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 400 | RAS-01 | shared/safety/RAS-01.json | shared/safety | commercial, strata | DRAFT |
| 401 | RAS-02 | shared/safety/RAS-02.json | shared/safety | commercial, strata | DRAFT |
| 402 | RAS-03 | shared/safety/RAS-03.json | shared/safety | commercial, strata | DRAFT |
| 403 | RAS-04 | shared/safety/RAS-04.json | shared/safety | commercial, strata, residential | DRAFT |
| 404 | RAS-05 | shared/safety/RAS-05.json | shared/safety | commercial, strata | DRAFT |
| 405 | RAS-06 | shared/safety/RAS-06.json | shared/safety | commercial, strata, window | DRAFT |
| 406 | RAS-07 | shared/safety/RAS-07.json | shared/safety | commercial, strata, residential | DRAFT |
| 407 | RAS-08 | shared/safety/RAS-08.json | shared/safety | commercial, strata | DRAFT |
| 408 | RAS-09 | shared/safety/RAS-09.json | shared/safety | commercial, strata, healthcare | DRAFT |
| 409 | RAS-10 | shared/safety/RAS-10.json | shared/safety | commercial, healthcare | DRAFT |
| 410 | RAS-11 | shared/safety/RAS-11.json | shared/safety | commercial, strata, hardfloor | DRAFT |
| 411 | RAS-12 | shared/safety/RAS-12.json | shared/safety | commercial, strata | DRAFT |
| 412 | RAS-13 | shared/safety/RAS-13.json | shared/safety | commercial, strata | DRAFT |
| 413 | RAS-14 | shared/safety/RAS-14.json | shared/safety | commercial, strata | DRAFT |
| 414 | RAS-15 | shared/safety/RAS-15.json | shared/safety | commercial, strata | DRAFT |
| 415 | RAS-16 | shared/safety/RAS-16.json | shared/safety | commercial, strata | DRAFT |
| 416 | RAS-17 | shared/safety/RAS-17.json | shared/safety | commercial, strata | DRAFT |
| 417 | WAH-01 | shared/safety/WAH-01.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 418 | WAH-02 | shared/safety/WAH-02.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 419 | WAH-03 | shared/safety/WAH-03.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 420 | WAH-04 | shared/safety/WAH-04.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 421 | WAH-05 | shared/safety/WAH-05.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 422 | WAH-06 | shared/safety/WAH-06.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 423 | WAH-07 | shared/safety/WAH-07.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 424 | WAH-08 | shared/safety/WAH-08.json | shared/safety | roof, solar, window, pressure, handyman, painting, deck, postcon | DRAFT |
| 425 | WAH-09 | shared/safety/WAH-09.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 426 | WAH-10 | shared/safety/WAH-10.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 427 | WAH-11 | shared/safety/WAH-11.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 428 | WAH-TPL-01 | shared/safety/WAH-TPL-01.json | shared/safety | window, pressure, roof, solar, handyman, painting, plastering, deck, postcon | DRAFT |
| 429 | HSE-01 | shared/standards/HSE-01.json | shared/standards | healthcare | DRAFT |
| 430 | HSE-02 | shared/standards/HSE-02.json | shared/standards | healthcare | DRAFT |
| 431 | HSE-03 | shared/standards/HSE-03.json | shared/standards | healthcare | DRAFT |
| 432 | HSE-04 | shared/standards/HSE-04.json | shared/standards | healthcare | DRAFT |
| 433 | HSE-05 | shared/standards/HSE-05.json | shared/standards | healthcare | DRAFT |
| 434 | HSE-06 | shared/standards/HSE-06.json | shared/standards | healthcare | DRAFT |
| 435 | HSE-07 | shared/standards/HSE-07.json | shared/standards | healthcare | DRAFT |
| 436 | HSE-08 | shared/standards/HSE-08.json | shared/standards | healthcare | DRAFT |
| 437 | HSE-09 | shared/standards/HSE-09.json | shared/standards | healthcare | DRAFT |
| 438 | HSE-10 | shared/standards/HSE-10.json | shared/standards | healthcare | DRAFT |
| 439 | SAH-01 | shared/standards/SAH-01.json | shared/standards | healthcare | DRAFT |
| 440 | SAH-02 | shared/standards/SAH-02.json | shared/standards | healthcare | DRAFT |
| 441 | SAH-03 | shared/standards/SAH-03.json | shared/standards | healthcare | DRAFT |
| 442 | SAH-04 | shared/standards/SAH-04.json | shared/standards | healthcare | DRAFT |
| 443 | SAH-05 | shared/standards/SAH-05.json | shared/standards | healthcare | DRAFT |
| 444 | SAH-06 | shared/standards/SAH-06.json | shared/standards | healthcare | DRAFT |
| 445 | SAH-07 | shared/standards/SAH-07.json | shared/standards | healthcare | DRAFT |
| 446 | SAH-08 | shared/standards/SAH-08.json | shared/standards | healthcare | DRAFT |
| 447 | SAH-09 | shared/standards/SAH-09.json | shared/standards | healthcare | DRAFT |
| 448 | SAH-10 | shared/standards/SAH-10.json | shared/standards | healthcare | DRAFT |
| 449 | SAH-11 | shared/standards/SAH-11.json | shared/standards | healthcare | DRAFT |
| 450 | BP-01 | shared/starting-business/BP-01.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 451 | BP-03 | shared/starting-business/BP-03.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 452 | BP-06 | shared/starting-business/BP-06.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 453 | SHR-PLN-02 | shared/starting-business/SHR-PLN-02.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 454 | SHR-PLN-03 | shared/starting-business/SHR-PLN-03.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 455 | SOL-01 | shared/starting-business/SOL-01.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 456 | SOL-02 | shared/starting-business/SOL-02.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 457 | SOL-04 | shared/starting-business/SOL-04.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 458 | TPL-01 | shared/starting-business/TPL-01.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 459 | TPL-02 | shared/starting-business/TPL-02.json | shared/starting-business | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 460 | BP-07 | shared/team/BP-07.json | shared/team | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 461 | TLD-01 | shared/team/TLD-01.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 462 | TLD-02 | shared/team/TLD-02.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 463 | TLD-03 | shared/team/TLD-03.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 464 | TLD-04 | shared/team/TLD-04.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 465 | TLD-05 | shared/team/TLD-05.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 466 | TLD-06 | shared/team/TLD-06.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 467 | TLD-07 | shared/team/TLD-07.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 468 | TLD-08 | shared/team/TLD-08.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 469 | TLD-09 | shared/team/TLD-09.json | shared/team | residential, commercial, bond, shortstay | DRAFT |
| 470 | TLD-10 | shared/team/TLD-10.json | shared/team | (none) | DRAFT |
| 471 | TLD-11 | shared/team/TLD-11.json | shared/team | (none) | DRAFT |
| 472 | TPL-08 | shared/team/TPL-08.json | shared/team | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 473 | TPL-09 | shared/team/TPL-09.json | shared/team | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, cardetail, medequip, healthcare, window, pressure, roof, solar, pool, pond, aquarium, lawn, garden, irrigation, landscaping, handyman, locksmith, deck, flatpack, painting, plastering, tiling, portfolio, hair, beauty, massage, pt, yoga, dogwalk, petsit, groom, stone, timber, furniture, appliance | DRAFT |
| 474 | TPL-12 | shared/templates/TPL-12.json | shared/templates | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, healthcare | DRAFT |
| 475 | TPL-13 | shared/templates/TPL-13.json | shared/templates | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, healthcare | DRAFT |
| 476 | TPL-14 | shared/templates/TPL-14.json | shared/templates | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, healthcare | DRAFT |
| 477 | TPL-15 | shared/templates/TPL-15.json | shared/templates | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, healthcare | DRAFT |
| 478 | TPL-16 | shared/templates/TPL-16.json | shared/templates | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, healthcare | DRAFT |
| 479 | TPL-17 | shared/templates/TPL-17.json | shared/templates | residential, commercial, bond, shortstay, carpet, hardfloor, construction, postcon, strata, healthcare | DRAFT |
| 480 | CPV-01 | shared/validation/CPV-01.json | shared/validation | commercial | DRAFT |
| 481 | CPV-02 | shared/validation/CPV-02.json | shared/validation | (none) | DRAFT |
| 482 | CPV-03 | shared/validation/CPV-03.json | shared/validation | (none) | DRAFT |
| 483 | CPV-04 | shared/validation/CPV-04.json | shared/validation | (none) | DRAFT |
| 484 | CPV-05 | shared/validation/CPV-05.json | shared/validation | (none) | DRAFT |
| 485 | CPV-06 | shared/validation/CPV-06.json | shared/validation | (none) | DRAFT |
| 486 | CPV-07 | shared/validation/CPV-07.json | shared/validation | commercial | DRAFT |
| 487 | CPV-08 | shared/validation/CPV-08.json | shared/validation | (none) | DRAFT |

## Changes applied (2026-11-03)

Coordinator instruction: where an orphan's courseSlugs points to one existing course, add its placement to `structure/COURSES-MODULES.json`. Lesson files were not moved, renamed or deleted. `meta.highRiskModule` was not changed.

Rule applied: the lesson file has exactly one courseSlug, that course exists in COURSES-MODULES.json, and the lesson's `moduleTitle` matches a module of that course. The lesson is appended to the end of that module with `id`, `title`, `type` (from `lessonType`) and `status` (from the file, DRAFT).

Also changed: `meta.placements` was updated from 5164 to 5350, the new count of placement rows. No other meta value changed.

- Placements added: 186. Per course: healthcare 60, pool 45, appliance 12, furniture 12, stone 12, pond 11, commercial 11, aquarium 9, cardetail 8, pt 2, handyman 2, tiling 1, carpet 1.
- Verification: the diff against the pre-change file has 1,116 added lines (186 entries of 6 lines) and one changed line (`meta.placements`). No line was removed other than that count. The file was re-serialised with 2-space indent, UTF-8, trailing newline. This matches the original format byte for byte in unchanged parts.
- Orphans remaining after the change: 301 (36 with empty courseSlugs, 252 with two or more, 13 with one course whose module is missing).
  - 36 files with empty courseSlugs, including the 7 high-risk parent files (HR01 to HR07). Left unplaced, because the rule needs one course.
  - 252 files with two or more courseSlugs. Left unplaced, because the course is not clear.
  - 13 files with one courseSlug where the moduleTitle is not a module in that course. Left unplaced. These are the 12 NEW-TMB-01 to NEW-TMB-12 timber lessons and HCG-12 (healthcare, "Quality, evidence and handover"). Adding a module was not in scope.
  - 0 files point to a course that is missing from COURSES-MODULES.json.
- Single-course orphans added to a module by course:
  - healthcare: 60
  - pool: 45
  - appliance: 12
  - furniture: 12
  - stone: 12
  - pond: 11
  - commercial: 11
  - aquarium: 9
  - cardetail: 8
  - pt: 2
  - handyman: 2
  - tiling: 1
  - carpet: 1

Not done: no lesson was assigned to a course not named in its courseSlugs, and no file was moved. The 79 placement-vs-courseSlugs mismatches listed above are unchanged. The COURSE-MODULE-LESSON-MAP.csv was not edited.

### Added placements

| Lesson id | Course slug | Module |
|---|---|---|
| NEW-APP-01 | appliance | Shared: Professional induction and standards |
| NEW-APP-02 | appliance | Shared: Job management and service delivery |
| NEW-APP-03 | appliance | Shared: Workplace safety and risk |
| NEW-APP-04 | appliance | Shared: Workplace safety and risk |
| NEW-APP-05 | appliance | Shared: Workplace safety and risk |
| NEW-APP-06 | appliance | Shared: Workplace safety and risk |
| NEW-APP-07 | appliance | Shared: Workplace safety and risk |
| NEW-APP-08 | appliance | Shared: Chemicals and materials |
| NEW-APP-09 | appliance | Shared: Job management and service delivery |
| NEW-APP-10 | appliance | Shared: Tools, equipment and maintenance |
| NEW-APP-11 | appliance | Shared: Customer communication and privacy |
| NEW-APP-12 | appliance | Shared: Quality and job documentation |
| NEW-AQU-05 | aquarium | Revenue and growth |
| NEW-AQU-06 | aquarium | Workload and cost |
| NEW-AQU-07 | aquarium | Methods and technique |
| NEW-AQU-08 | aquarium | Revenue and growth |
| aquarium-cleaning-L03 | aquarium | Workload and cost |
| aquarium-cleaning-L04 | aquarium | Methods and technique |
| aquarium-cleaning-L07 | aquarium | Revenue and growth |
| aquarium-cleaning-L10 | aquarium | Scope and authority |
| aquarium-cleaning-L11 | aquarium | Workload and cost |
| CAR-NEW-01 | cardetail | Revenue and growth |
| CAR-NEW-02 | cardetail | Revenue and growth |
| CAR-NEW-04 | cardetail | Revenue and growth |
| CAR-NEW-05 | cardetail | Workload and cost |
| CAR-NEW-06 | cardetail | Scope and authority |
| CAR-NEW-07 | cardetail | Revenue and growth |
| CAR-NEW-08 | cardetail | Safety and hazards |
| CAR-NEW-09 | cardetail | Safety and hazards |
| NEW-FUR-01 | furniture | Shared: Job management and service delivery |
| NEW-FUR-02 | furniture | Shared: Chemicals and materials |
| NEW-FUR-03 | furniture | Shared: Workplace safety and risk |
| NEW-FUR-04 | furniture | Shared: Chemicals and materials |
| NEW-FUR-05 | furniture | Shared: Workplace safety and risk |
| NEW-FUR-06 | furniture | Shared: Job management and service delivery |
| NEW-FUR-07 | furniture | Shared: Job management and service delivery |
| NEW-FUR-08 | furniture | Shared: Chemicals and materials |
| NEW-FUR-09 | furniture | Shared: Job management and service delivery |
| NEW-FUR-10 | furniture | Shared: Quoting and pricing |
| NEW-FUR-11 | furniture | Shared: Customer communication and privacy |
| NEW-FUR-12 | furniture | Shared: Quality and job documentation |
| NEW-POND-04 | pond | Methods and technique |
| NEW-POND-05 | pond | Workload and cost |
| NEW-POND-06 | pond | Methods and technique |
| NEW-POND-07 | pond | Workload and cost |
| NEW-POND-08 | pond | Methods and technique |
| NEW-POND-09 | pond | Quality, evidence and handover |
| pond-cleaning-L03 | pond | Workload and cost |
| pond-cleaning-L04 | pond | Methods and technique |
| pond-cleaning-L07 | pond | Revenue and growth |
| pond-cleaning-L10 | pond | Scope and authority |
| pond-cleaning-L11 | pond | Workload and cost |
| pool-cleaning-L13 | pool | Safety and hazards |
| pool-cleaning-L14 | pool | Scope and authority |
| NEW-STN-01 | stone | Shared: Workplace safety and risk |
| NEW-STN-02 | stone | Shared: Workplace safety and risk |
| NEW-STN-03 | stone | Shared: Workplace safety and risk |
| NEW-STN-04 | stone | Shared: Tools, equipment and maintenance |
| NEW-STN-05 | stone | Shared: Workplace safety and risk |
| NEW-STN-06 | stone | Shared: Chemicals and materials |
| NEW-STN-07 | stone | Shared: Quality and job documentation |
| NEW-STN-08 | stone | Shared: Tools, equipment and maintenance |
| NEW-STN-09 | stone | Shared: Chemicals and materials |
| NEW-STN-10 | stone | Shared: Workplace safety and risk |
| NEW-STN-11 | stone | Shared: Quoting and pricing |
| NEW-STN-12 | stone | Shared: Customer communication and privacy |
| NEW-TIL-08 | tiling | Revenue and growth |
| CL2-04 | carpet | Methods and technique |
| ACE-01 | pt | Shared: Starting a business |
| ACE-03 | pt | Shared: Business operations and finance |
| FPS-01 | commercial | Group (Cleaning & Hygiene): Methods and technique |
| FPS-02 | commercial | Shared: Chemicals and materials |
| FPS-03 | commercial | Shared: Chemicals and materials |
| FPS-04 | commercial | Group (Cleaning & Hygiene): Methods and technique |
| FPS-05 | commercial | Group (Cleaning & Hygiene): Safety and hazards |
| FPS-06 | commercial | Group (Cleaning & Hygiene): Safety and hazards |
| FPS-07 | commercial | Group (Cleaning & Hygiene): Safety and hazards |
| FPS-08 | commercial | Group (Cleaning & Hygiene): Quality, evidence and handover |
| HBM-01 | handyman | Shared: Starting a business |
| HBM-07 | handyman | Shared: Tools, equipment and maintenance |
| ADA-01 | healthcare | Methods and technique |
| ADA-04 | healthcare | Safety and hazards |
| ADA-05 | healthcare | Safety and hazards |
| ADA-06 | healthcare | Methods and technique |
| DIP-01 | healthcare | Safety and hazards |
| HCG-01 | healthcare | Scope and authority |
| HCG-02 | healthcare | Methods and technique |
| HCG-03 | healthcare | Methods and technique |
| HCG-04 | healthcare | Shared: Chemicals and materials |
| HCG-05 | healthcare | Methods and technique |
| HCG-06 | healthcare | Methods and technique |
| HCG-07 | healthcare | Methods and technique |
| HCG-08 | healthcare | Shared: Chemicals and materials |
| HCG-09 | healthcare | Methods and technique |
| HCG-10 | healthcare | Safety and hazards |
| HCG-11 | healthcare | Methods and technique |
| HCG-18 | healthcare | Safety and hazards |
| HCG-19 | healthcare | Safety and hazards |
| HCG-20 | healthcare | Methods and technique |
| HIP-01 | healthcare | Safety and hazards |
| HIP-02 | healthcare | Methods and technique |
| HIP-04 | healthcare | Safety and hazards |
| HIP-05 | healthcare | Safety and hazards |
| HLT-01 | healthcare | Scope and authority |
| HLT-02 | healthcare | Scope and authority |
| HLT-03 | healthcare | Scope and authority |
| HLT-04 | healthcare | Safety and hazards |
| HLT-05 | healthcare | Safety and hazards |
| HLT-08 | healthcare | Methods and technique |
| HLT-09 | healthcare | Methods and technique |
| HLT-10 | healthcare | Methods and technique |
| HLT-13 | healthcare | Shared: Quality and job documentation |
| HLT-14 | healthcare | Safety and hazards |
| OTI-01 | healthcare | Scope and authority |
| OTI-02 | healthcare | Safety and hazards |
| OTI-03 | healthcare | Safety and hazards |
| OTI-04 | healthcare | Methods and technique |
| OTI-05 | healthcare | Methods and technique |
| NHS-01 | healthcare | Scope and authority |
| THS-05 | commercial | Shared: Job management and service delivery |
| PFM-01 | pool | Equipment and materials |
| PFM-02 | pool | Equipment and materials |
| PFM-03 | pool | Methods and technique |
| PFM-04 | pool | Equipment and materials |
| PFM-05 | pool | Safety and hazards |
| PFM-06 | pool | Equipment and materials |
| PHM-01 | pool | Methods and technique |
| PHM-02 | pool | Safety and hazards |
| PHM-03 | pool | Equipment and materials |
| PHM-04 | pool | Equipment and materials |
| PHM-05 | pool | Methods and technique |
| PHM-06 | pool | Safety and hazards |
| PHM-07 | pool | Equipment and materials |
| PHM-08 | pool | Safety and hazards |
| PHM-09 | pool | Equipment and materials |
| POM-01 | pool | Equipment and materials |
| POM-02 | pool | Methods and technique |
| POM-03 | pool | Equipment and materials |
| POM-04 | pool | Safety and hazards |
| PSA-01 | pool | Scope and authority |
| PSA-02 | pool | Quality, evidence and handover |
| PSA-03 | pool | Methods and technique |
| PSA-04 | pool | Methods and technique |
| PSA-05 | pool | Methods and technique |
| PSA-06 | pool | Methods and technique |
| PSA-07 | pool | Methods and technique |
| PSA-08 | pool | Methods and technique |
| PSA-09 | pool | Methods and technique |
| PSA-10 | pool | Methods and technique |
| PSA-11 | pool | Safety and hazards |
| PSA-12 | pool | Methods and technique |
| PSA-13 | pool | Methods and technique |
| PSA-14 | pool | Safety and hazards |
| PSA-15 | pool | Methods and technique |
| PSA-16 | pool | Safety and hazards |
| PVB-01 | pool | Scope and authority |
| PVB-02 | pool | Scope and authority |
| PVB-03 | pool | Safety and hazards |
| PVB-04 | pool | Safety and hazards |
| PVB-05 | pool | Safety and hazards |
| PVB-06 | pool | Quality, evidence and handover |
| PVB-07 | pool | Safety and hazards |
| PVB-08 | pool | Scope and authority |
| HSE-01 | healthcare | Shared: Quality and job documentation |
| HSE-02 | healthcare | Methods and technique |
| HSE-03 | healthcare | Shared: Quality and job documentation |
| HSE-04 | healthcare | Scope and authority |
| HSE-05 | healthcare | Equipment and materials |
| HSE-06 | healthcare | Methods and technique |
| HSE-07 | healthcare | Scope and authority |
| HSE-08 | healthcare | Shared: Quoting and pricing |
| HSE-09 | healthcare | Equipment and materials |
| HSE-10 | healthcare | Methods and technique |
| SAH-01 | healthcare | Scope and authority |
| SAH-02 | healthcare | Methods and technique |
| SAH-03 | healthcare | Methods and technique |
| SAH-04 | healthcare | Shared: Chemicals and materials |
| SAH-05 | healthcare | Equipment and materials |
| SAH-06 | healthcare | Equipment and materials |
| SAH-07 | healthcare | Safety and hazards |
| SAH-08 | healthcare | Shared: Quality and job documentation |
| SAH-09 | healthcare | Shared: Quality and job documentation |
| SAH-10 | healthcare | Shared: Quality and job documentation |
| SAH-11 | healthcare | Scope and authority |
| CPV-01 | commercial | Shared: Quality and job documentation |
| CPV-07 | commercial | Shared: Chemicals and materials |
