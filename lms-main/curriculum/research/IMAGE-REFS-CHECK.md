# Image reference check: curriculum lesson JSON

Date: 2026-11-03
Scope: every `.json` under `curriculum/courses` and `curriculum/shared` (936 files).
Method: parsed each file, walked all values under any `images` key (reading each entry's `src`), and collected any string beginning `/academy/library/` or `/academy/brand/`. Each path was mapped to `apps/frontend/public` (exact, case-sensitive) and, for `/academy/library/` paths, checked against `apps/frontend/src/lib/academy-library.json`.

## Summary

| Check | Result |
|---|---:|
| JSON files scanned (courses + shared) | 936 |
| Files that failed to parse | 0 |
| Lesson files with an `images` field | 363 (all under `curriculum/courses`; 0 under `curriculum/shared`) |
| Image entries (`images[].src`) | 726 (2 per lesson file) |
| Distinct image paths referenced | 278 |
| `/academy/library/` references | 726 |
| `/academy/brand/` references | 0 |
| External or non-academy image sources | 0 |
| **Referenced files missing on disk** | **0** |
| Case-only path mismatches | 0 |
| Zero-byte referenced files | 0 |
| **Library references not in catalogue** | **0** |
| Catalogue entries (`academy-library.json`) | 1,004 (all `/academy/library/`; 278 referenced, 726 unreferenced) |
| Catalogue entries whose file is missing | 0 |
| Library files on disk not in catalogue | 0 (disk has 1,004 library files) |
| Brand files on disk (not catalogued; library rule does not apply) | 491 (none referenced by lessons) |
| Learner-visible paths that do not resolve | 0 |

All 726 references are `.jpg` photos. All pass the frontend filter in `apps/frontend/src/components/CurriculumLessonBody.tsx` (`ImageStrip` renders only `src` values starting with `/academy/library/`), so none are dropped at render time.

## Findings

No missing files, uncatalogued files, or unresolved learner-visible image paths were found.

Informational:
- 726 of the 1,004 catalogue entries are not referenced by any lesson: 382 photos, 258 icons and 86 logos. This is expected for a shared library and is not a defect.
- All 932 lesson files carry `"status": "DRAFT"`. The 4 `SHARED-REFERENCES.json` files have no status and no `images` field. Whether a lesson reaches learners depends on publication, which this check did not trace.

## Per-course reference table

| Course folder | Lesson files | Image entries | Distinct photos | Library folder |
|---|---:|---:|---:|---|
| appliance | 12 | 24 | 24 | cleaning-residential |
| aquarium | 13 | 26 | 26 | aquatic |
| beauty | 5 | 10 | 10 | wellbeing-personal |
| bond-and-end-of-lease-cleaning | 3 | 6 | 6 | cleaning-residential |
| car-detailing | 20 | 40 | 15 | vehicles |
| carpet-and-upholstery-cleaning | 8 | 16 | 16 | cleaning-residential |
| commercial-and-office-cleaning | 45 | 90 | 90 | cleaning-commercial |
| deck-and-fence-maintenance | 4 | 8 | 8 | garden-outdoor |
| dogwalk | 6 | 12 | 12 | pets |
| flat-pack-and-fixture-installation | 3 | 6 | 6 | trades-building |
| furniture | 12 | 24 | 24 | cleaning-residential |
| garden-maintenance-and-clean-ups | 9 | 18 | 18 | garden-outdoor |
| groom | 5 | 10 | 10 | pets |
| hair | 6 | 12 | 12 | wellbeing-personal |
| handyman | 22 | 44 | 44 | trades-building |
| hard-floor-care | 5 | 10 | 10 | cleaning-commercial |
| healthcare-cleaning | 14 | 28 | 28 | cleaning-commercial |
| irrigation-servicing | 4 | 8 | 8 | garden-outdoor |
| landscaping | 4 | 8 | 8 | garden-outdoor |
| lawn-and-turf-care | 4 | 8 | 8 | garden-outdoor |
| locksmith-and-door-installation | 4 | 8 | 8 | trades-building |
| massage | 5 | 10 | 10 | wellbeing-personal |
| medical-equipment-cleaning | 11 | 22 | 22 | cleaning-commercial |
| painting | 5 | 10 | 10 | trades-building |
| petsit | 5 | 10 | 10 | pets |
| plastering | 4 | 8 | 8 | trades-building |
| pond | 14 | 28 | 28 | aquatic |
| pool | 13 | 26 | 26 | aquatic |
| post-construction-clean | 3 | 6 | 6 | cleaning-commercial |
| pressure-cleaning-all-heights | 10 | 20 | 20 | exterior-cleaning |
| pt | 5 | 10 | 10 | wellbeing-personal |
| real-estate-portfolio-management | 9 | 18 | 15 | property |
| residential-cleaning | 4 | 8 | 8 | cleaning-residential |
| roof-soft-washing | 7 | 14 | 14 | exterior-cleaning |
| short-stay-turnover | 5 | 10 | 10 | cleaning-residential |
| solar-panel-cleaning | 9 | 18 | 18 | exterior-cleaning |
| stone | 12 | 24 | 24 | cleaning-commercial |
| strata-and-common-area-cleaning | 3 | 6 | 6 | cleaning-commercial |
| tiling | 7 | 14 | 14 | trades-building |
| timber | 12 | 24 | 24 | cleaning-residential |
| window-cleaning-all-heights | 8 | 16 | 16 | exterior-cleaning |
| yoga | 4 | 8 | 8 | wellbeing-personal |
| **Total (42 folders)** | **363** | **726** | **278 distinct** | |

## Decisions made

1. Scope: all 936 JSON files under `curriculum/courses` and `curriculum/shared`. Non-lesson files (such as `SHARED-REFERENCES.json`) were included in the scan and contain no images.
2. "Learner would see": every referenced path was treated as learner-visible. The backend (`curriculum.routes.ts`, `publicLessonBody`) passes `images` through unchanged, and the frontend renders it. Publication status was not traced, even though all lessons are `DRAFT`.
3. Library rule: applied to `/academy/library/` only. The catalogue holds no `/academy/brand/` entries, so brand paths were checked for existence only. No lesson references a brand path.
4. Matching: exact, case-sensitive path match on disk. No case-insensitive fallback was needed.
5. `alt`, `kind` and `origin` values were not treated as paths.

## Path corrections

Requested by the coordinator: correct any unresolved lesson image path to a catalogued file with the same subject, and log each change as (lesson, old path, new path).

Result: no changes made. The re-run found 0 unresolved `src` paths and 0 library paths missing from the catalogue (726 of 726 resolve), so there was nothing to correct and no edits were made to any lesson file.

| Lesson | Old path | New path |
|---|---|---|
| (none) | (none) | (none) |

Items left unchanged for review: none.

## Method notes

- The scan script was kept outside the repo at `/tmp/imgcheck/check.py`. Nothing in the repo was modified other than this report.
- Nothing was committed.
