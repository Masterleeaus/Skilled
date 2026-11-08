# Construction slug mapping (owner decision 8)

Date: 2026-11-03. Scope: lesson files whose courseSlugs include "construction".

## Decision

No lesson files and no structure files were changed. The owner's target, construction-site-cleaning, does not exist as a course slug. The governing rule is in curriculum/structure/SLUG-MAP.json:

- "canonical": the short slugs in COURSES-MODULES.json are canonical for courseSlugs in every lesson file.
- aliasesToCanonical: "construction-site-cleaning" and "construction-site-clean-up" both map to "construction".
- notes: the course folder construction does not exist; its lessons remain under the canonical slug construction.

Writing "construction-site-cleaning" into courseSlugs would create a non-canonical slug that no course in COURSES-MODULES.json matches, so those lessons would lose their course link. Keeping "construction" applies the owner's mapping through the existing alias. The course titled "Construction-site clean-up" (slug construction) is the existing course the owner meant.

If the owner wants the slug itself renamed, that is a separate change: rename the course entry in COURSES-MODULES.json, update SLUG-MAP.json, and rewrite the 143 courseSlugs. Not done here.

## Counts

- Lesson files with "construction" in courseSlugs: 143 (shared/ and courses/ trees, *.assessment.json excluded).
- Files changed: 0.
- Structure entries changed: 0.
- COURSES-MODULES.json courses: 43. Slug construction-site-cleaning: not present.
- Construction course (slug construction, title "Construction-site clean-up"): 17 modules, 118 placements.
- Of the 143 lessons, 45 have a placement in the construction course. 98 have none.
- Of the 118 construction placements, 73 belong to lesson IDs whose files do not list "construction" in courseSlugs.

## Modules

The construction course has these 17 modules. Because the slug was not renamed, every module stays as is:

1. Shared: Professional induction and standards
2. Shared: Customer communication and privacy
3. Shared: Workplace safety and risk
4. Shared: Job management and service delivery
5. Shared: Quality and job documentation
6. Shared: Starting a business
7. Shared: Tools, equipment and maintenance
8. Shared: Chemicals and materials
9. Shared: Growing and managing a team
10. Group (Cleaning & Hygiene): Scope and authority
11. Group (Cleaning & Hygiene): Methods and technique
12. Group (Cleaning & Hygiene): Safety and hazards
13. Group (Cleaning & Hygiene): Revenue and growth
14. Group (Cleaning & Hygiene): Workload and cost
15. Shared: Quoting and pricing
16. Shared: Marketing and sales
17. Shared: Business operations and finance

## Check

check.py run before and after the decision: lessonsScanned 932, problemCount 0, unchanged.

## Open items for the owner

- The 98 lessons with courseSlugs "construction" and no placement in the construction course need placements, or a decision to leave them unplaced.
- The 73 construction placements for lessons without the construction slug need a decision (remove the placement or add the slug).
- Renaming the slug to construction-site-cleaning, if wanted, is a separate task (see above).
