# Titan copy inventory (S6)

Date: 2026-11-08. Branch: `claude/inventory-titan-copy`. Tracks issue #86 ("a line-level inventory records each match, whether it is learner-visible, and the approved replacement/retention rationale").

This document is an inventory only. No curriculum file, source file, test, schema, migration, lockfile or index was changed. Every change it recommends must go through the human review and publication process for the affected lesson revisions (section 7).

## 1. Scope and method

- Scanned: `lms-main/curriculum/` (2,854 files, all types) and `lms-main/apps/backend/prisma/curriculum/` (4 files). Matches are in 550 files.
- Search: case-insensitive `titan` or `academy`, which also covers "Titan Academy", "titan-academy", "Titan Zero" and "/academy/" paths. Searched with `rg -n -i`, then a line-level pass that records each physical line and the JSON key it sits under.
- Result: 1,766 matching lines in 550 files (1,764 in curriculum, 2 in the prisma seed). A line can hold more than one term, so lines are counted, not occurrences.
- Line numbers are physical line numbers in the file. Excerpts are trimmed to about 70 characters either side of the first match.

## 2. Classification rules

1. **Learner-visible, replace.** The match sits in a lesson JSON field that the learner is shown: `audience`, `body` (instruction text), or `equipmentAndPpe`. `curriculum/SCHEMA.md` describes the lesson JSON as "learner-visible". The match is not an identifier, path or citation.
2. **Learner-visible, retain.** The match is visible text but names a third party (Jobber Academy, a public website that publishes guides). Our brand is not involved, so no replacement is proposed.
3. **Provenance, possibly visible.** Matches inside `sourceReferences`. `SCHEMA.md` lists this field in the learner-visible lesson block, so it is treated as visible until the renderer is checked. The tutor chunker (`apps/backend/src/tutor/rag/chunker.ts`) indexes `equipmentAndPpe` but not `sourceReferences`. A search of the frontend for `sourceReferences` found no references, so whether learners see it was not confirmed in this pass.
4. **Retain: identifier or asset path.** Image paths under `/academy/library/` (726 lines), schema strings such as `titan-academy.pathways/1`, table names such as `academy_content_lessons`, and file names. Changing these breaks loading or matching, and none is displayed as text.
5. **Retain: authoring, review, provenance or planning.** Markdown and CSV documents, icon manifests, import tooling and notes that name the product, sources or decisions. They are not part of any lesson.
6. **Duplicate.** A copy of lesson text in `lesson-normalization-index.json`. It is recorded so that an edit to the lesson file also updates the index copy in the same change.

Note on terms: "Titan Zero" and "Titan Zero Field" are treated as brand terms. "Titan Zero Field" is the name of a field-service app that the lessons refer to, and the name is recorded as a decision for the product owner, not a copy error.

## 3. Totals by file group

| Group | Files in group | Files with matches | Matching lines | Learner-visible, replace | Learner-visible, retain | Provenance, possibly visible | Retained (identifier, provenance, duplicate, third party) |
|---|---|---|---|---|---|---|---|
| G1 Course and lesson JSON (courses/) | 724 | 463 | 857 | 20 | 23 | 0 | 814 |
| G1 Course and lesson JSON (shared/) | 560 | 54 | 110 | 51 | 1 | 54 | 4 |
| G2 Lesson normalization index | 1 | 1 | 2 | 0 | 0 | 0 | 2 |
| G3 Other curriculum directories (planning, research, app-basis, integration, assessments, retired and others) | 1557 | 23 | 128 | 0 | 0 | 0 | 128 |
| G4 Icon manifests (icons/) | 3 | 2 | 660 | 0 | 0 | 0 | 660 |
| G5 Import tooling (import/) | 2 | 2 | 4 | 0 | 0 | 0 | 4 |
| G6 Structure and schema docs | 7 | 3 | 3 | 0 | 0 | 0 | 3 |
| G7 Prisma curriculum seed (apps/backend/prisma/curriculum/) | 4 | 2 | 2 | 0 | 0 | 0 | 2 |
| **Total** | 2858 | 550 | 1766 | 71 | 24 | 54 | 1617 |

Group G1 is split by directory: `courses/` holds the course-specific lessons and `shared/` holds lessons that several courses reuse. The lesson JSON in these two directories is the source of all learner-visible matches.

## 4. Learner-visible matches

### 4a. Replace (71 lines)

| # | File (under curriculum/) | Line | Field | Text excerpt | Recommended replacement |
|---|---|---|---|---|---|
| 1 | courses/appliance/NEW-APP-01.json | 29 | body | `…pped switches. Some work near these items is covered elsewhere in the Titan Academy curriculum, such as domestic oven cleaning in the kitchen gro…` | "Skilled curriculum" |
| 2 | courses/timber/NEW-TMB-01.json | 30 | body | `"body": "Completing this course, or any Titan Academy lesson, does not give a licence, certificate or authority to…` | "Skilled lesson" |
| 3 | courses/variants/appliance/CP-01-appliance.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 4 | courses/variants/appliance/CP-04-appliance.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 5 | courses/variants/cardetail/CP-01-cardetail.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 6 | courses/variants/cardetail/CP-04-cardetail.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 7 | courses/variants/furniture/CP-01-furniture.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 8 | courses/variants/furniture/CP-04-furniture.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 9 | courses/variants/painting/CP-01-painting.json | 11 | audience | `"audience": "Painting contractors in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 10 | courses/variants/painting/CP-04-painting.json | 11 | audience | `"audience": "Painting contractors in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 11 | courses/variants/plastering/CP-01-plastering.json | 11 | audience | `"audience": "Plastering contractors in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 12 | courses/variants/plastering/CP-04-plastering.json | 11 | audience | `"audience": "Plastering contractors in any Titan Academy business who want repeat bookings and referrals from homeowne…` | "service business" |
| 13 | courses/variants/portfolio/CP-01-portfolio.json | 11 | audience | `"audience": "Portfolio management businesses in any Titan Academy business who want more work from owners and property groups t…` | "service business" |
| 14 | courses/variants/portfolio/CP-04-portfolio.json | 11 | audience | `"audience": "Portfolio management businesses in any Titan Academy business who want repeat appointments and referrals from owne…` | "service business" |
| 15 | courses/variants/stone/CP-01-stone.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 16 | courses/variants/stone/CP-04-stone.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 17 | courses/variants/tiling/CP-01-tiling.json | 11 | audience | `"audience": "Tiling and flooring contractors in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 18 | courses/variants/tiling/CP-04-tiling.json | 11 | audience | `"audience": "Tiling and flooring contractors in any Titan Academy business who want repeat bookings and referrals from homeowne…` | "service business" |
| 19 | courses/variants/timber/CP-01-timber.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 20 | courses/variants/timber/CP-04-timber.json | 11 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 21 | shared/app/SFS-01.json | 42 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 22 | shared/app/SFS-02.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 23 | shared/app/SFS-03.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 24 | shared/app/SFS-04.json | 44 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 25 | shared/app/SFS-05.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 26 | shared/app/SFS-06.json | 44 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 27 | shared/app/SFS-07.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 28 | shared/app/SFS-08.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 29 | shared/app/SFS-09.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 30 | shared/app/SFS-10.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 31 | shared/app/SFS-11.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 32 | shared/app/SFS-12.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 33 | shared/app/SFS-13.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 34 | shared/app/SFS-14.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 35 | shared/app/SFS-15.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 36 | shared/app/SFS-16.json | 43 | equipmentAndPpe | `"A device with the Titan Zero Field app, where the lesson uses it"` | "field-service app" (product name to be confirmed) |
| 37 | shared/chemicals/F13-L02.json | 53 | audience | `…products for a business that wants lower environmental impact in any Titan Academy business.",` | "service business" |
| 38 | shared/chemicals/F13-L03.json | 53 | audience | `…owner who measures and doses cleaning or maintenance products in any Titan Academy business.",` | "service business" |
| 39 | shared/chemicals/F13-L05.json | 53 | audience | `…dles, separates or disposes of waste and wash water from a job in any Titan Academy business.",` | "service business" |
| 40 | shared/chemicals/custom-eco-cleaning-products-L03.json | 53 | audience | `"audience": "Any worker in any home-service business in the academy, working under supervision.",` | delete "in the academy" |
| 41 | shared/chemicals/custom-eco-cleaning-products-L10.json | 53 | audience | `"audience": "Any worker in any home-service business in the academy, working under supervision.",` | delete "in the academy" |
| 42 | shared/customer/F11-L02.json | 53 | audience | `…who speaks with a prospective customer before a job is booked in any Titan Academy business.",` | "service business" |
| 43 | shared/customer/F11-L05.json | 53 | audience | `…ker who communicates with customers and keeps customer records in any Titan Academy business.",` | "service business" |
| 44 | shared/customer/F12-L05.json | 53 | audience | `…r employer who handles customer and staff personal information in any Titan Academy business.",` | "service business" |
| 45 | shared/job-management/F11-L04.json | 53 | audience | `…r or worker who plans the day, the route and the time for jobs in any Titan Academy business.",` | "service business" |
| 46 | shared/marketing/CP-01.json | 53 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want more work from clients that suit their serv…` | "service business" |
| 47 | shared/marketing/CP-02.json | 53 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want introductions and referrals through people…` | "service business" |
| 48 | shared/marketing/CP-03.json | 53 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want local customers to find them online and tru…` | "service business" |
| 49 | shared/marketing/CP-04.json | 53 | audience | `"audience": "Solo operators and team owners in any Titan Academy business who want repeat bookings and referrals from clients…` | "service business" |
| 50 | shared/marketing/F11-L06.json | 53 | audience | `…s by improving services and winning repeat and additional work in any Titan Academy business.",` | "service business" |
| 51 | shared/operations/F13-L01.json | 53 | audience | `"audience": "Any worker or owner in any Titan Academy business who wants to reduce the environmental impact of serv…` | "service business" |
| 52 | shared/operations/F13-L04.json | 53 | audience | `"audience": "Any worker or owner in any Titan Academy business who uses water and energy in the course of service w…` | "service business" |
| 53 | shared/operations/F13-L06.json | 53 | audience | `"audience": "Any owner or manager in any Titan Academy business who tracks the environmental and operational results…` | "service business" |
| 54 | shared/operations/F18-L01.json | 53 | audience | `"audience": "Any worker, supervisor or owner in any Titan Academy business who builds, carries or checks the kit used for jobs.…` | "service business" |
| 55 | shared/operations/F18-L02.json | 53 | audience | `…nce": "Any supervisor or worker who prepares the kit for a job in any Titan Academy business.",` | "service business" |
| 56 | shared/operations/F18-L04.json | 53 | audience | `…es such as cloths, bags, gloves and dressings are used per job in any Titan Academy business.",` | "service business" |
| 57 | shared/operations/F18-L05.json | 53 | audience | `…roducts and equipment between the store, the vehicle and sites in any Titan Academy business.",` | "service business" |
| 58 | shared/operations/F18-L06.json | 53 | audience | `…ob or shift, or reconciles the kit against the stock register, in any Titan Academy business.",` | "service business" |
| 59 | shared/operations/F20-L05.json | 53 | audience | `…e movement of equipment and products into and out of the store in any Titan Academy business.",` | "service business" |
| 60 | shared/operations/F20-L06.json | 53 | audience | `"audience": "Any owner or supervisor in any Titan Academy business who decides when equipment, tools and protective ite…` | "service business" |
| 61 | shared/operations/additional-specialist-services-L01.json | 53 | audience | `"audience": "Any worker in any home-service business in the academy, working under supervision.",` | delete "in the academy" |
| 62 | shared/quality/additional-specialist-services-L12.json | 53 | audience | `"audience": "Any worker in any home-service business in the academy, working under supervision.",` | delete "in the academy" |
| 63 | shared/quoting/F11-L03.json | 53 | audience | `…son who prepares quotes and sets prices for a service business in any Titan Academy business.",` | "service business" |
| 64 | shared/starting-business/F11-L01.json | 53 | audience | `…operator who is deciding what services the business will offer in any Titan Academy business.",` | "service business" |
| 65 | shared/starting-business/additional-specialist-services-L04.json | 53 | audience | `"audience": "Any worker in any home-service business in the academy, working under supervision.",` | delete "in the academy" |
| 66 | shared/team/F12-L01.json | 53 | audience | `…"Any owner, supervisor or worker who engages people to do work in any Titan Academy business, including subcontractors and sole traders.",` | "service business" |
| 67 | shared/team/F12-L02.json | 53 | audience | `…records hours, pay and supporting documents for people engaged in any Titan Academy business.",` | "service business" |
| 68 | shared/team/F12-L03.json | 53 | audience | `"audience": "Any owner, supervisor or worker in any Titan Academy business who has health and safety duties to others or to the…` | "service business" |
| 69 | shared/team/F12-L04.json | 53 | audience | `"audience": "Any owner, supervisor or worker in any Titan Academy business who recruits, supervises or works alongside other pe…` | "service business" |
| 70 | shared/team/F12-L06.json | 53 | audience | `"audience": "Any owner or compliance contact in any Titan Academy business who must keep the business's rules, licences and pol…` | "service business" |
| 71 | shared/team/additional-specialist-services-L10.json | 53 | audience | `"audience": "Any worker in any home-service business in the academy, working under supervision.",` | delete "in the academy" |

Replacement rules applied:

- "Titan Academy" as the name of the platform becomes "Skilled", as set in the brief.
- "in any Titan Academy business" describes the learner's own business. It becomes "service business", because "Skilled business" would be a brand claim about a business the learner runs.
- "in the academy" is removed. The phrase adds no information.
- "Titan Zero Field app" becomes "field-service app" until the product owner confirms the app's public name.

### 4b. Learner-visible, retained (24 lines)

| # | File (under curriculum/) | Line | Field | Text excerpt | Retention reason |
|---|---|---|---|---|---|
| 1 | courses/variants/aquarium/SOL-03-aquarium.json | 37 | body | `…client can see, such as a filter clean or a marine test panel (Jobber Academy, updated 8 October 2024). Show one clear total and say whether GST is…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 2 | courses/variants/cardetail/SOL-03-cardetail.json | 29 | body | `…mething the customer can see, is one way to lay the tiers out (Jobber Academy, updated 8 October 2024), and Jobber lists car detailing among its ex…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 3 | courses/variants/commercial/SOL-03-commercial.json | 37 | body | `…facilities manager can see, are one way to present the offer (Jobber Academy, published May 2021, updated 8 October 2024). A study of an AI assist…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 4 | courses/variants/construction/SOL-03-construction.json | 37 | body | `…dd-on, can show the principal contractor what each level adds (Jobber Academy, published May 2021, updated 8 October 2024)."` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 5 | courses/variants/dogwalk/HBM-12-dogwalk.json | 28 | body | `…e, not an Australian figure, so check your own log against it (Jobber Academy, 5 November 2024, last modified 20 July 2026)."` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 6 | courses/variants/furniture/SOL-03-furniture.json | 33 | body | `…inished top. Stepped packages are one way to lay out an offer (Jobber Academy, updated 8 October 2024). Show the steps as separate lines, each with…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 7 | courses/variants/groom/HBM-12-groom.json | 28 | body | `…king hours. That is a general range, not an Australian figure (Jobber Academy, 5 November 2024, last modified 20 July 2026)."` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 8 | courses/variants/healthcare/SOL-03-healthcare.json | 37 | body | `…el should add something the facility can see on its checklist (Jobber Academy, May 2021, updated 8 October 2024). Any extra work outside the schedu…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 9 | courses/variants/landscaping/SOL-03-landscaping.json | 37 | body | `…vel adding something visible are one way to present the offer (Jobber Academy, published May 2021, updated 8 October 2024)."` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 10 | courses/variants/painting/SOL-03-painting.json | 37 | body | `…and a touch-up visit, let the client see what each step adds (Jobber Academy, Good, Better, Best Pricing Examples, published May 2021, updated 8 O…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 11 | courses/variants/petsit/HBM-12-petsit.json | 28 | body | `…e, not an Australian figure, so check your own log against it (Jobber Academy, 5 November 2024, last modified 20 July 2026)."` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 12 | courses/variants/plastering/SOL-03-plastering.json | 37 | body | `…ling and a paint line, let the client see what each step adds (Jobber Academy, Good, Better, Best Pricing Examples, published May 2021, updated 8 O…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 13 | courses/variants/pond/SOL-03-pond.json | 37 | body | `…nt can see, such as a filter clean or a seasonal pump service (Jobber Academy, updated 8 October 2024). Show one clear total and say whether GST is…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 14 | courses/variants/pool/SOL-03-pool.json | 37 | body | `…can see, such as a filter clean or a monthly equipment check (Jobber Academy, updated 8 October 2024). Show one clear total and say whether GST is…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 15 | courses/variants/portfolio/SOL-03-portfolio.json | 37 | body | `…ntenance coordination, lets the owner see what each step adds (Jobber Academy, Good, Better, Best Pricing Examples, published May 2021, updated 8 O…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 16 | courses/variants/postcon/SOL-03-postcon.json | 37 | body | `…d a full make-good, can show the builder what each level adds (Jobber Academy, published May 2021, updated 8 October 2024). Label every figure in y…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 17 | courses/variants/pressure/SOL-03-pressure.json | 25 | body | `…orey stated. Stepped packages are one way to present an offer (Jobber Academy, May 2021, updated 8 October 2024), though its examples are not press…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 18 | courses/variants/pt/SOL-03-pt.json | 37 | body | `…ck-in or a home programme, are one way to present the options (Jobber Academy, published May 2021, updated 8 October 2024). The Jobber article pred…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 19 | courses/variants/residential/SOL-03-residential.json | 29 | body | `…n see, and the top level adds a set list of deep-clean jobs. Jobber's Academy shows house cleaning as one trade example of this format (published M…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 20 | courses/variants/roof/SOL-03-roof.json | 25 | body | `…d inhibitor. Stepped packages are one way to present an offer (Jobber Academy, May 2021, updated 8 October 2024), though its examples are lawn care…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 21 | courses/variants/strata/SOL-03-strata.json | 37 | body | `…quarterly report, can show the committee what each level adds (Jobber Academy, published May 2021, updated 8 October 2024)."` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 22 | courses/variants/tiling/SOL-03-tiling.json | 37 | body | `…ng and cleaning visit, let the client see what each step adds (Jobber Academy, Good, Better, Best Pricing Examples, published May 2021, updated 8 O…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 23 | courses/variants/window/SOL-03-window.json | 29 | body | `…and tracks. Stepped packages are one way to present an offer (Jobber Academy, May 2021, updated 8 October 2024), but its examples are lawn care, h…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |
| 24 | shared/quoting/SOL-03.json | 79 | body | `…ething the customer can see, are one way to present the offer (Jobber Academy, published May 2021, updated 8 October 2024). Show one clear total an…` | Jobber Academy is a third-party guide publisher; the citation names a source, not our brand |

### 4c. Provenance that may be visible (sourceReferences)

| File (under curriculum/) | Lines | Count |
|---|---|---|
| shared/customer/F11-L05.json | 165 | 1 |
| shared/customer/F11-L02.json | 169 | 1 |
| shared/customer/F12-L05.json | 182 | 1 |
| shared/team/F12-L02.json | 158 | 1 |
| shared/team/F12-L06.json | 169 | 1 |
| shared/team/F12-L04.json | 166 | 1 |
| shared/team/F12-L01.json | 169 | 1 |
| shared/app/SFS-10.json | 107, 108 | 2 |
| shared/app/SFS-05.json | 107, 108 | 2 |
| shared/app/SFS-12.json | 107, 108 | 2 |
| shared/app/SFS-02.json | 107, 108 | 2 |
| shared/app/SFS-14.json | 117, 118 | 2 |
| shared/app/SFS-13.json | 107, 108 | 2 |
| shared/app/SFS-09.json | 107, 108 | 2 |
| shared/app/SFS-07.json | 107, 108 | 2 |
| shared/app/SFS-16.json | 107, 108 | 2 |
| shared/app/SFS-06.json | 108, 109 | 2 |
| shared/app/SFS-11.json | 117, 118 | 2 |
| shared/app/SFS-03.json | 107, 108 | 2 |
| shared/app/SFS-08.json | 107, 108 | 2 |
| shared/app/SFS-15.json | 107, 108 | 2 |
| shared/app/SFS-01.json | 106, 107 | 2 |
| shared/app/SFS-04.json | 108, 109 | 2 |
| shared/job-management/F11-L04.json | 164 | 1 |
| shared/marketing/F11-L06.json | 169 | 1 |
| shared/operations/F18-L04.json | 163 | 1 |
| shared/operations/F20-L06.json | 170 | 1 |
| shared/operations/F13-L01.json | 168 | 1 |
| shared/operations/F18-L02.json | 164 | 1 |
| shared/operations/F18-L05.json | 171 | 1 |
| shared/operations/F18-L01.json | 168 | 1 |
| shared/operations/F20-L05.json | 166 | 1 |
| shared/operations/F13-L06.json | 166 | 1 |
| shared/operations/F18-L06.json | 167 | 1 |
| shared/operations/F13-L04.json | 172 | 1 |
| shared/starting-business/F11-L01.json | 169 | 1 |
| shared/quoting/F11-L03.json | 168 | 1 |
| shared/chemicals/F13-L03.json | 169 | 1 |

Recommended action for this group: do not replace in this pass. First confirm whether `sourceReferences` is displayed. If it is, the authoring notes (`Titan Academy base source draft ... is not in the ready set`) are a publication problem in their own right and should be removed from learner output in the same review, not only re-branded.

## 5. Retained matches (not learner-visible)

Total retained lines: 1,617 (excluding the provenance group in 4c). Each file row lists its physical line numbers.

| File | Classification | Reason | Count | Lines |
|---|---|---|---|---|
| `icons/BRAND-ICON-MANIFEST.csv` | retain: provenance or authoring note | Icon manifest metadata (brand or file name), not learner text | 562 | 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586 |
| `icons/TITAN-ZERO-ICON-MANIFEST.csv` | retain: provenance or authoring note | Icon manifest metadata (brand or file name), not learner text | 98 | 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99 |
| `research/DEPLOY-RUNBOOK.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 36 | 1, 12, 13, 14, 22, 33, 39, 41, 42, 45, 47, 49, 51, 54, 60, 66, 82, 102, 114, 139, 140, 152, 153, 158, 163, 218, 220, 239, 301, 305, 329, 335, 357, 358, 364, 368 |
| `integration/FIGURES-REGISTER.csv` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 23 | 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 450, 451, 607, 646, 647, 747, 873 |
| `research/SHARED-WORDING-APPLIED.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 9 | 29, 38, 53, 68, 83, 98, 107, 110, 140 |
| `research/TRACK-SECURITY-REVIEW.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 7 | 24, 76, 84, 88, 117, 198, 201 |
| `research/SAVED-TRACK-ONLY.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 7 | 11, 12, 13, 15, 16, 41, 50 |
| `research/IMAGE-REFS-CHECK.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 7 | 5, 16, 17, 18, 23, 29, 91 |
| `app-basis/SALESFORCE-TO-TITAN-FIELD.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 6 | 1, 10, 11, 16, 54, 64 |
| `research/PAYMENT-TRACK-REVIEW.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 5 | 40, 80, 121, 131, 132 |
| `planning/DECISIONS.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 4 | 1, 61, 62, 94 |
| `research/CHECKLIST-STATUS-2026-11-03.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 4 | 36, 37, 38, 59 |
| `research/CHECKLIST-TICK-PROPOSAL.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 4 | 23, 49, 50, 71 |
| `research/V3-REWORK-PLAN.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 3 | 82, 88, 148 |
| `import/build-canonical-import-manifest.py` | retain: identifier or asset path | Import code or target table identifier | 3 | 2, 10, 80 |
| `lesson-normalization-index.json` | duplicate of lesson text (index) | Index copy of lesson body; follows the lesson file | 2 | 35, 16130 |
| `planning/ASSESSMENT-AUDIT.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 2 | 1, 5 |
| `research/IMAGE-GAPS.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 2 | 3, 4 |
| `courses/hair/NEW-HAIR-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 242, 248 |
| `courses/hair/NEW-HAIR-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/hair/NEW-HAIR-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 235, 241 |
| `courses/hair/NEW-HAIR-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 163, 169 |
| `courses/hair/NEW-HAIR-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 223, 229 |
| `courses/hair/NEW-HAIR-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 182, 188 |
| `courses/bond-and-end-of-lease-cleaning/C06-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 221, 227 |
| `courses/bond-and-end-of-lease-cleaning/C06-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 227, 233 |
| `courses/bond-and-end-of-lease-cleaning/C06-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 257, 263 |
| `courses/beauty/NEW-BEA-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/beauty/NEW-BEA-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 203, 209 |
| `courses/beauty/NEW-BEA-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 182, 188 |
| `courses/beauty/NEW-BEA-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 250, 256 |
| `courses/beauty/NEW-BEA-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 225, 231 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 263, 269 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 231, 237 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 214, 220 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 207, 213 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 202, 208 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 222, 228 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 228, 234 |
| `courses/solar-panel-cleaning/solar-panel-cleaning-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 196, 202 |
| `courses/irrigation-servicing/NEW-IRR-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 203, 209 |
| `courses/irrigation-servicing/NEW-IRR-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 177, 183 |
| `courses/irrigation-servicing/NEW-IRR-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/irrigation-servicing/NEW-IRR-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 179, 185 |
| `courses/pond/NEW-POND-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 211, 217 |
| `courses/pond/NEW-POND-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 203, 209 |
| `courses/pond/pond-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 208, 214 |
| `courses/pond/NEW-POND-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 179, 185 |
| `courses/pond/NEW-POND-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 202, 208 |
| `courses/pond/pond-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 201, 207 |
| `courses/pond/NEW-POND-09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/pond/NEW-POND-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/pond/NEW-POND-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 195, 201 |
| `courses/pond/pond-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/pond/pond-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/pond/pond-cleaning-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 227, 233 |
| `courses/pond/NEW-POND-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 208, 214 |
| `courses/pond/NEW-POND-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/painting/NEW-PNT-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 265, 271 |
| `courses/painting/NEW-PNT-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 218, 224 |
| `courses/painting/NEW-PNT-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 287, 293 |
| `courses/painting/NEW-PNT-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 268, 274 |
| `courses/painting/NEW-PNT-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 290, 296 |
| `courses/plastering/NEW-PLS-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/plastering/NEW-PLS-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/plastering/NEW-PLS-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 197, 203 |
| `courses/plastering/NEW-PLS-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 204, 210 |
| `courses/appliance/NEW-APP-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/appliance/NEW-APP-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 203, 209 |
| `courses/appliance/NEW-APP-12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 186, 192 |
| `courses/appliance/NEW-APP-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 303, 309 |
| `courses/appliance/NEW-APP-09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 186, 192 |
| `courses/appliance/NEW-APP-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 194, 200 |
| `courses/appliance/NEW-APP-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 232, 238 |
| `courses/appliance/NEW-APP-11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/appliance/NEW-APP-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/appliance/NEW-APP-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 211, 217 |
| `courses/appliance/NEW-APP-10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 187, 193 |
| `courses/appliance/NEW-APP-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/short-stay-turnover/C07-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 208, 214 |
| `courses/short-stay-turnover/C12-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 199, 205 |
| `courses/short-stay-turnover/C07-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 222, 228 |
| `courses/short-stay-turnover/C12-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 175, 181 |
| `courses/short-stay-turnover/C07-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/flat-pack-and-fixture-installation/NEW-FLP-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 210, 216 |
| `courses/flat-pack-and-fixture-installation/NEW-FLP-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 139, 145 |
| `courses/flat-pack-and-fixture-installation/NEW-FLP-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 168, 174 |
| `courses/real-estate-portfolio-management/C19-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 177, 183 |
| `courses/real-estate-portfolio-management/C19-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 195, 201 |
| `courses/real-estate-portfolio-management/NEW-REP-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 199, 205 |
| `courses/real-estate-portfolio-management/C19-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 178, 184 |
| `courses/real-estate-portfolio-management/NEW-REP-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 177, 183 |
| `courses/real-estate-portfolio-management/C19-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 164, 170 |
| `courses/real-estate-portfolio-management/NEW-REP-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 179, 185 |
| `courses/real-estate-portfolio-management/C19-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/real-estate-portfolio-management/NEW-REP-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 203, 209 |
| `courses/tiling/NEW-TIL-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 281, 287 |
| `courses/tiling/NEW-TIL-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 199, 205 |
| `courses/tiling/NEW-TIL-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 205, 211 |
| `courses/tiling/NEW-TIL-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/tiling/NEW-TIL-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 303, 309 |
| `courses/tiling/NEW-TIL-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 275, 281 |
| `courses/tiling/NEW-TIL-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 164, 170 |
| `courses/window-cleaning-all-heights/C15-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 256, 262 |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 290, 296 |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 362, 368 |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 374, 380 |
| `courses/window-cleaning-all-heights/C15-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 208, 214 |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 333, 339 |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 252, 258 |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 340, 346 |
| `courses/dogwalk/NEW-DOG-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/dogwalk/NEW-DOG-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 225, 231 |
| `courses/dogwalk/NEW-DOG-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 201, 207 |
| `courses/dogwalk/NEW-DOG-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 204, 210 |
| `courses/dogwalk/NEW-DOG-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 231, 237 |
| `courses/dogwalk/NEW-DOG-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 174, 180 |
| `courses/post-construction-clean/NEW-PCC-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 171, 177 |
| `courses/post-construction-clean/NEW-PCC-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/post-construction-clean/NEW-PCC-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 228, 234 |
| `courses/deck-and-fence-maintenance/NEW-DEK-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/deck-and-fence-maintenance/NEW-DEK-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 259, 265 |
| `courses/deck-and-fence-maintenance/NEW-DEK-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 261, 267 |
| `courses/deck-and-fence-maintenance/NEW-DEK-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 213, 219 |
| `courses/residential-cleaning/C11-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 164, 170 |
| `courses/residential-cleaning/NEW-RES-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 150, 156 |
| `courses/residential-cleaning/C11-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 142, 148 |
| `courses/residential-cleaning/C11-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 153, 159 |
| `courses/handyman/property-maintenance-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 162, 168 |
| `courses/handyman/property-maintenance-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 161, 167 |
| `courses/handyman/handyman-work-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/handyman/handyman-work-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/handyman/handyman-work-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 172, 178 |
| `courses/handyman/handyman-work-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 178, 184 |
| `courses/handyman/handyman-work-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 263, 269 |
| `courses/handyman/handyman-work-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 168, 174 |
| `courses/handyman/property-maintenance-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 160, 166 |
| `courses/handyman/handyman-work-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 238, 244 |
| `courses/handyman/property-maintenance-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 171, 177 |
| `courses/handyman/handyman-work-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 204, 210 |
| `courses/handyman/handyman-work-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/handyman/property-maintenance-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 173, 179 |
| `courses/handyman/handyman-work-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 194, 200 |
| `courses/handyman/handyman-work-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 151, 157 |
| `courses/handyman/property-maintenance-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 167, 173 |
| `courses/handyman/property-maintenance-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 145, 151 |
| `courses/handyman/handyman-work-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 247, 253 |
| `courses/handyman/property-maintenance-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 176, 182 |
| `courses/handyman/property-maintenance-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 197, 203 |
| `courses/handyman/property-maintenance-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/petsit/NEW-SIT-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 238, 244 |
| `courses/petsit/NEW-SIT-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 169, 175 |
| `courses/petsit/NEW-SIT-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 170, 176 |
| `courses/petsit/NEW-SIT-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 201, 207 |
| `courses/petsit/NEW-SIT-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 171, 177 |
| `courses/variants/strata/HBM-12-strata.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 2 | 138, 139 |
| `courses/variants/postcon/HBM-12-postcon.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 2 | 138, 139 |
| `courses/variants/commercial/HBM-12-commercial.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 2 | 138, 139 |
| `courses/variants/construction/HBM-12-construction.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 2 | 138, 139 |
| `courses/variants/pt/HBM-12-pt.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 2 | 146, 148 |
| `courses/variants/residential/HBM-12-residential.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 2 | 154, 158 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 242, 248 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 253, 259 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 328, 334 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 253, 259 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 318, 324 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 248, 254 |
| `courses/roof-soft-washing/roof-cleaning-soft-washing-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 243, 249 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 235, 241 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 252, 258 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 342, 348 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 367, 373 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 217, 223 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 367, 373 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 233, 239 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 240, 246 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 234, 240 |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 232, 238 |
| `courses/strata-and-common-area-cleaning/NEW-STR-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/strata-and-common-area-cleaning/NEW-STR-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 178, 184 |
| `courses/strata-and-common-area-cleaning/NEW-STR-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/stone/NEW-STN-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 208, 214 |
| `courses/stone/NEW-STN-12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 199, 205 |
| `courses/stone/NEW-STN-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 227, 233 |
| `courses/stone/NEW-STN-09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/stone/NEW-STN-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 214, 220 |
| `courses/stone/NEW-STN-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/stone/NEW-STN-10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 186, 192 |
| `courses/stone/NEW-STN-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/stone/NEW-STN-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/stone/NEW-STN-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 238, 244 |
| `courses/stone/NEW-STN-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 236, 242 |
| `courses/stone/NEW-STN-11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 195, 201 |
| `courses/furniture/NEW-FUR-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 170, 176 |
| `courses/furniture/NEW-FUR-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 172, 178 |
| `courses/furniture/NEW-FUR-09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 205, 211 |
| `courses/furniture/NEW-FUR-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/furniture/NEW-FUR-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 154, 160 |
| `courses/furniture/NEW-FUR-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 172, 178 |
| `courses/furniture/NEW-FUR-11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 156, 162 |
| `courses/furniture/NEW-FUR-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 194, 200 |
| `courses/furniture/NEW-FUR-10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 175, 181 |
| `courses/furniture/NEW-FUR-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 168, 174 |
| `courses/furniture/NEW-FUR-12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 168, 174 |
| `courses/furniture/NEW-FUR-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 172, 178 |
| `courses/car-detailing/car-detailing-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 174, 180 |
| `courses/car-detailing/CAR-NEW-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 171, 177 |
| `courses/car-detailing/car-detailing-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 170, 176 |
| `courses/car-detailing/CAR-NEW-09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 206, 212 |
| `courses/car-detailing/CAR-NEW-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/car-detailing/CAR-BUS-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 168, 174 |
| `courses/car-detailing/CAR-NEW-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 165, 171 |
| `courses/car-detailing/car-detailing-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/car-detailing/CAR-BUS-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 163, 169 |
| `courses/car-detailing/car-detailing-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 166, 172 |
| `courses/car-detailing/car-detailing-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 156, 162 |
| `courses/car-detailing/CAR-NEW-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/car-detailing/CAR-NEW-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 165, 171 |
| `courses/car-detailing/CAR-NEW-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 171, 177 |
| `courses/car-detailing/CAR-NEW-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 320, 326 |
| `courses/car-detailing/car-detailing-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 170, 176 |
| `courses/car-detailing/car-detailing-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 157, 163 |
| `courses/car-detailing/CAR-NEW-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/car-detailing/car-detailing-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/car-detailing/car-detailing-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 161, 167 |
| `courses/aquarium/NEW-AQU-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 253, 259 |
| `courses/aquarium/NEW-AQU-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 242, 248 |
| `courses/aquarium/NEW-AQU-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 231, 237 |
| `courses/aquarium/NEW-AQU-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 242, 248 |
| `courses/aquarium/aquarium-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 222, 228 |
| `courses/aquarium/NEW-AQU-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 286, 292 |
| `courses/aquarium/aquarium-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 235, 241 |
| `courses/aquarium/aquarium-cleaning-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 248, 254 |
| `courses/aquarium/NEW-AQU-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 241, 247 |
| `courses/aquarium/NEW-AQU-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 246, 252 |
| `courses/aquarium/NEW-AQU-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 229, 235 |
| `courses/aquarium/aquarium-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 243, 249 |
| `courses/aquarium/aquarium-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 229, 235 |
| `courses/massage/NEW-MAS-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 169, 175 |
| `courses/massage/NEW-MAS-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 213, 219 |
| `courses/massage/NEW-MAS-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/massage/NEW-MAS-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/massage/NEW-MAS-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 161, 167 |
| `courses/pool/pool-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/pool/pool-cleaning-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 187, 193 |
| `courses/pool/pool-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 195, 201 |
| `courses/pool/pool-cleaning-L14.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 331, 337 |
| `courses/pool/pool-cleaning-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 211, 217 |
| `courses/pool/pool-cleaning-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 225, 231 |
| `courses/pool/pool-cleaning-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 173, 179 |
| `courses/pool/pool-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 242, 248 |
| `courses/pool/pool-cleaning-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 198, 204 |
| `courses/pool/pool-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 204, 210 |
| `courses/pool/pool-cleaning-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/pool/pool-cleaning-L13.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 251, 257 |
| `courses/pool/pool-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/carpet-and-upholstery-cleaning/C13-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 214, 220 |
| `courses/carpet-and-upholstery-cleaning/C13-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 206, 212 |
| `courses/carpet-and-upholstery-cleaning/C13-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 155, 161 |
| `courses/carpet-and-upholstery-cleaning/C13-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 260, 266 |
| `courses/carpet-and-upholstery-cleaning/NEW-CPT-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 232, 238 |
| `courses/carpet-and-upholstery-cleaning/C13-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 197, 203 |
| `courses/carpet-and-upholstery-cleaning/C13-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 227, 233 |
| `courses/carpet-and-upholstery-cleaning/NEW-CPT-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 230, 236 |
| `courses/yoga/NEW-YOG-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 180, 186 |
| `courses/yoga/NEW-YOG-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/yoga/NEW-YOG-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 167, 173 |
| `courses/yoga/NEW-YOG-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 207, 213 |
| `courses/pt/NEW-FIT-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/pt/NEW-FIT-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 227, 233 |
| `courses/pt/NEW-FIT-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 194, 200 |
| `courses/pt/NEW-FIT-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/pt/NEW-FIT-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 194, 200 |
| `courses/timber/NEW-TMB-10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/timber/NEW-TMB-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 220, 226 |
| `courses/timber/NEW-TMB-08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 226, 232 |
| `courses/timber/NEW-TMB-11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/timber/NEW-TMB-07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/timber/NEW-TMB-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/timber/NEW-TMB-09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 197, 203 |
| `courses/timber/NEW-TMB-12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 196, 202 |
| `courses/timber/NEW-TMB-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/timber/NEW-TMB-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 206, 212 |
| `courses/timber/NEW-TMB-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/timber/NEW-TMB-06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/landscaping/NEW-LSC-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 212, 218 |
| `courses/landscaping/NEW-LSC-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/landscaping/NEW-LSC-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 212, 218 |
| `courses/landscaping/NEW-LSC-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 202, 208 |
| `courses/garden-maintenance-and-clean-ups/garden-cleanups-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/garden-maintenance-and-clean-ups/garden-cleanups-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 206, 212 |
| `courses/garden-maintenance-and-clean-ups/NEW-GAR-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 218, 224 |
| `courses/garden-maintenance-and-clean-ups/garden-cleanups-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 215, 221 |
| `courses/garden-maintenance-and-clean-ups/garden-cleanups-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 179, 185 |
| `courses/garden-maintenance-and-clean-ups/NEW-GAR-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/garden-maintenance-and-clean-ups/NEW-GAR-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/garden-maintenance-and-clean-ups/garden-cleanups-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/garden-maintenance-and-clean-ups/garden-cleanups-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 200, 206 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 207, 213 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 198, 204 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 205, 211 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 209, 215 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 199, 205 |
| `courses/medical-equipment-cleaning/medical-equipment-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/groom/NEW-GRO-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/groom/NEW-GRO-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 169, 175 |
| `courses/groom/NEW-GRO-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 177, 183 |
| `courses/groom/NEW-GRO-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 191, 197 |
| `courses/groom/NEW-GRO-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 201, 207 |
| `courses/healthcare-cleaning/aged-care-infection-control-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 197, 203 |
| `courses/healthcare-cleaning/aged-care-infection-control-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/healthcare-cleaning/aged-care-infection-control-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/healthcare-cleaning/aged-care-infection-control-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 193, 199 |
| `courses/healthcare-cleaning/aged-care-infection-control-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/healthcare-cleaning/aged-care-infection-control-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 185, 191 |
| `courses/healthcare-cleaning/medical-dental-clinic-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/healthcare-cleaning/aged-care-infection-control-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 182, 188 |
| `courses/healthcare-cleaning/NEW-HLC-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/healthcare-cleaning/aged-care-infection-control-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/healthcare-cleaning/medical-dental-clinic-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 177, 183 |
| `courses/healthcare-cleaning/aged-care-infection-control-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 198, 204 |
| `courses/healthcare-cleaning/aged-care-infection-control-L07.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/healthcare-cleaning/aged-care-infection-control-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 208, 214 |
| `courses/commercial-and-office-cleaning/food-processing-sanitation-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 171, 177 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 211, 217 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/commercial-and-office-cleaning/C18-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 152, 158 |
| `courses/commercial-and-office-cleaning/C16-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 192, 198 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 201, 207 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 145, 151 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L11.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 187, 193 |
| `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 216, 222 |
| `courses/commercial-and-office-cleaning/food-processing-sanitation-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 222, 228 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 150, 156 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 162, 168 |
| `courses/commercial-and-office-cleaning/C18-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 176, 182 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 230, 236 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 190, 196 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 222, 228 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 150, 156 |
| `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 247, 253 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 178, 184 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 218, 224 |
| `courses/commercial-and-office-cleaning/C08-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 167, 173 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 220, 226 |
| `courses/commercial-and-office-cleaning/C08-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 224, 230 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 217, 223 |
| `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L08.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 209, 215 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 181, 187 |
| `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 227, 233 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 215, 221 |
| `courses/commercial-and-office-cleaning/food-processing-sanitation-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 221, 227 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 215, 221 |
| `courses/commercial-and-office-cleaning/C08-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 183, 189 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 217, 223 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 156, 162 |
| `courses/commercial-and-office-cleaning/C18-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 170, 176 |
| `courses/commercial-and-office-cleaning/kitchen-exhaust-L10.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 189, 195 |
| `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 238, 244 |
| `courses/commercial-and-office-cleaning/food-processing-sanitation-L12.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 221, 227 |
| `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 160, 166 |
| `courses/commercial-and-office-cleaning/C17-L04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 197, 203 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L06.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 205, 211 |
| `courses/commercial-and-office-cleaning/industrial-degreasing-L03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 144, 150 |
| `courses/commercial-and-office-cleaning/food-processing-sanitation-L09.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 218, 224 |
| `courses/commercial-and-office-cleaning/laboratory-cleaning-L02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 228, 234 |
| `courses/lawn-and-turf-care/NEW-LAW-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 183, 189 |
| `courses/lawn-and-turf-care/NEW-LAW-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 184, 190 |
| `courses/lawn-and-turf-care/NEW-LAW-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 188, 194 |
| `courses/lawn-and-turf-care/NEW-LAW-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 172, 178 |
| `courses/hard-floor-care/NEW-HFC-05.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 164, 170 |
| `courses/hard-floor-care/NEW-HFC-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 214, 220 |
| `courses/hard-floor-care/NEW-HFC-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 153, 159 |
| `courses/hard-floor-care/NEW-HFC-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 182, 188 |
| `courses/hard-floor-care/NEW-HFC-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 195, 201 |
| `courses/locksmith-and-door-installation/NEW-LCK-04.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 172, 178 |
| `courses/locksmith-and-door-installation/NEW-LCK-03.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 215, 221 |
| `courses/locksmith-and-door-installation/NEW-LCK-01.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 204, 210 |
| `courses/locksmith-and-door-installation/NEW-LCK-02.json` | retain: identifier or asset path | Image asset path under /academy/library/ (URL, not visible text) | 2 | 209, 215 |
| `SCHEMA.md` | retain: provenance or authoring note | Authoring documentation | 1 | 104 |
| `shared/fitness-business/ACE-02.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 204 |
| `shared/handyman/HBM-12.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 183 |
| `shared/quoting/F11-L03.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 171 |
| `shared/quoting/SOL-03.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 173 |
| `structure/PATHWAYS.json` | retain: identifier or asset path | Schema or table identifier (not displayed) | 1 | 2 |
| `structure/COURSES-MODULES.md` | retain: provenance or authoring note | Authoring documentation | 1 | 1 |
| `planning/CATALOGUE-V2.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 1 |
| `research/STALE-COPIES-REBUILD-PLAN.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 104 |
| `research/UNCONFIRMED-INVENTORY.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 675 |
| `research/FINISH-CHECKLIST.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 1 |
| `research/UPLOAD-CLASSIFICATION-car-detailing-batch.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 26 |
| `research/SHARED-UNVERIFIED-PROPOSAL.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 40 |
| `research/trades/NOTES.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 88 |
| `research/trades/LICENCE-NOTES.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 87 |
| `integration/FIGURES-CHECK.md` | retain: provenance or authoring note | Authoring, review, provenance or planning document | 1 | 1 |
| `courses/variants/strata/SOL-03-strata.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 132 |
| `courses/variants/hair/SOL-03-hair.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 182 |
| `courses/variants/hair/HBM-12-hair.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 143 |
| `courses/variants/beauty/HBM-12-beauty.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 143 |
| `courses/variants/beauty/SOL-03-beauty.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 181 |
| `courses/variants/irrigation/HBM-12-irrigation.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 142 |
| `courses/variants/irrigation/SOL-03-irrigation.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 192 |
| `courses/variants/pressure/HBM-12-pressure.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 142 |
| `courses/variants/pressure/SOL-03-pressure.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 170 |
| `courses/variants/pond/HBM-12-pond.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/pond/SOL-03-pond.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 156 |
| `courses/variants/lawn/HBM-12-lawn.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 142 |
| `courses/variants/lawn/SOL-03-lawn.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 166 |
| `courses/variants/painting/HBM-12-painting.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/painting/SOL-03-painting.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 168 |
| `courses/variants/plastering/SOL-03-plastering.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 168 |
| `courses/variants/plastering/HBM-12-plastering.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/appliance/HBM-12-appliance.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/garden/SOL-03-garden.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 183 |
| `courses/variants/garden/HBM-12-garden.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/shortstay/SOL-03-shortstay.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 161 |
| `courses/variants/shortstay/HBM-12-shortstay.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 154 |
| `courses/variants/shortstay/BP-05-shortstay.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 161 |
| `courses/variants/postcon/SOL-03-postcon.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 131 |
| `courses/variants/tiling/SOL-03-tiling.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 167 |
| `courses/variants/tiling/HBM-12-tiling.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/window/HBM-12-window.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 142 |
| `courses/variants/window/SOL-03-window.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 173 |
| `courses/variants/medequip/HBM-12-medequip.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 138 |
| `courses/variants/medequip/BP-05-medequip.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 164 |
| `courses/variants/solar/HBM-12-solar.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/dogwalk/SOL-03-dogwalk.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 177 |
| `courses/variants/dogwalk/HBM-12-dogwalk.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 142 |
| `courses/variants/bond/BP-05-bond.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 162 |
| `courses/variants/bond/HBM-12-bond.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 154 |
| `courses/variants/bond/SOL-03-bond.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 158 |
| `courses/variants/handyman/HBM-12-handyman.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/handyman/SOL-03-handyman.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 158 |
| `courses/variants/hardfloor/HBM-12-hardfloor.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 154 |
| `courses/variants/deck/HBM-12-deck.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 145 |
| `courses/variants/commercial/SOL-03-commercial.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 132 |
| `courses/variants/portfolio/HBM-12-portfolio.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/portfolio/SOL-03-portfolio.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 167 |
| `courses/variants/petsit/HBM-12-petsit.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/petsit/SOL-03-petsit.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 186 |
| `courses/variants/construction/SOL-03-construction.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 131 |
| `courses/variants/healthcare/SOL-03-healthcare.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 144 |
| `courses/variants/healthcare/BP-05-healthcare.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 164 |
| `courses/variants/healthcare/HBM-12-healthcare.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 138 |
| `courses/variants/stone/HBM-12-stone.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 143 |
| `courses/variants/furniture/SOL-03-furniture.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 171 |
| `courses/variants/furniture/HBM-12-furniture.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 143 |
| `courses/variants/carpet/BP-05-carpet.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 161 |
| `courses/variants/carpet/HBM-12-carpet.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 154 |
| `courses/variants/aquarium/HBM-12-aquarium.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/aquarium/SOL-03-aquarium.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 156 |
| `courses/variants/locksmith/HBM-12-locksmith.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/massage/SOL-03-massage.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 183 |
| `courses/variants/massage/HBM-12-massage.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/pool/SOL-03-pool.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 152 |
| `courses/variants/pool/HBM-12-pool.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/yoga/HBM-12-yoga.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 152 |
| `courses/variants/pt/SOL-03-pt.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 199 |
| `courses/variants/timber/HBM-12-timber.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 143 |
| `courses/variants/landscaping/SOL-03-landscaping.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 192 |
| `courses/variants/landscaping/HBM-12-landscaping.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 142 |
| `courses/variants/cardetail/BP-05-cardetail.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 171 |
| `courses/variants/cardetail/SOL-03-cardetail.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 167 |
| `courses/variants/cardetail/HBM-12-cardetail.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/groom/HBM-12-groom.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 146 |
| `courses/variants/groom/SOL-03-groom.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 205 |
| `courses/variants/flatpack/HBM-12-flatpack.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/roof/SOL-03-roof.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 170 |
| `courses/variants/roof/HBM-12-roof.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 147 |
| `courses/variants/residential/BP-05-residential.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 166 |
| `courses/variants/residential/SOL-03-residential.json` | retain: third-party name or URL | External citation (Jobber); URL path contains /academy/ | 1 | 161 |
| `import/canonical-import-manifest.json` | retain: identifier or asset path | Import code or target table identifier | 1 | 4 |
| `prisma/cleaning/cleaning-lessons.assessor.json` | retain: identifier or asset path | Schema identifier in seed file (not displayed) | 1 | 2 |
| `prisma/cleaning/cleaning-lessons.learner.json` | retain: identifier or asset path | Schema identifier in seed file (not displayed) | 1 | 2 |

Notes on the largest retained groups:

- `icons/BRAND-ICON-MANIFEST.csv` (562 lines) and `icons/TITAN-ZERO-ICON-MANIFEST.csv` (98 lines) are metadata about image files. The brand image files are under `/academy/brand/`, and the image-reference check (`curriculum/research/IMAGE-REFS-CHECK.md`) found no lesson that references a brand path. The logo files carry wordmark text, so the wordmark becomes visible if any page shows them. That is a brand-asset decision, not a lesson edit, and is outside this inventory.
- The 726 `src` lines are all image references, verified in the scan as `/academy/library/` paths. They are not text.

## 6. Duplicates in lesson-normalization-index.json

The index lessons array holds 1,016 entries, and each carries lesson text. Only two entries copy text that contains a match. Both copies are exact (checked against the lesson file):

| Index entry | Section | Lesson file | Index courseIds | Exact copy of lesson file text |
|---|---|---|---|---|
| NEW-APP-01 | instructionSections[1] | curriculum/courses/appliance/NEW-APP-01.json | 1 | yes |
| NEW-TMB-01 | instructionSections[2] | curriculum/courses/timber/NEW-TMB-01.json | 1 | yes |

The index line numbers are 35 and 16130 in `curriculum/lesson-normalization-index.json`. The file was not edited. Any change to NEW-APP-01 or NEW-TMB-01 must update these copies in the same change, or the index will disagree with the lesson.

## 7. Lesson revisions affected (human review and publication, not an edit now)

| Source file | Lesson ID | Fields | Learner-visible lines | Courses that use it (index) | publicationApproved | originalStatus |
|---|---|---|---|---|---|---|
| `shared/chemicals/F13-L02.json` | F13-L02 | audience | 1 | 43 | False | DRAFT |
| `shared/chemicals/F13-L03.json` | F13-L03 | audience | 1 | 43 | False | DRAFT |
| `shared/chemicals/F13-L05.json` | F13-L05 | audience | 1 | 43 | False | DRAFT |
| `shared/chemicals/custom-eco-cleaning-products-L03.json` | custom-eco-cleaning-products-L03 | audience | 1 | 43 | False | DRAFT |
| `shared/chemicals/custom-eco-cleaning-products-L10.json` | custom-eco-cleaning-products-L10 | audience | 1 | 43 | False | DRAFT |
| `shared/customer/F11-L02.json` | F11-L02 | audience | 1 | 43 | False | DRAFT |
| `shared/customer/F11-L05.json` | F11-L05 | audience | 1 | 43 | False | DRAFT |
| `shared/customer/F12-L05.json` | F12-L05 | audience | 1 | 43 | False | DRAFT |
| `shared/job-management/F11-L04.json` | F11-L04 | audience | 1 | 43 | False | DRAFT |
| `shared/marketing/CP-01.json` | CP-01 | audience | 1 | 43 | False | DRAFT |
| `shared/marketing/CP-02.json` | CP-02 | audience | 1 | 43 | False | DRAFT |
| `shared/marketing/CP-03.json` | CP-03 | audience | 1 | 43 | False | DRAFT |
| `shared/marketing/CP-04.json` | CP-04 | audience | 1 | 43 | False | DRAFT |
| `shared/marketing/F11-L06.json` | F11-L06 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F13-L01.json` | F13-L01 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F13-L04.json` | F13-L04 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F13-L06.json` | F13-L06 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F18-L01.json` | F18-L01 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F18-L02.json` | F18-L02 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F18-L04.json` | F18-L04 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F18-L05.json` | F18-L05 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F18-L06.json` | F18-L06 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F20-L05.json` | F20-L05 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/F20-L06.json` | F20-L06 | audience | 1 | 43 | False | DRAFT |
| `shared/operations/additional-specialist-services-L01.json` | additional-specialist-services-L01 | audience | 1 | 43 | False | DRAFT |
| `shared/quality/additional-specialist-services-L12.json` | additional-specialist-services-L12 | audience | 1 | 43 | False | DRAFT |
| `shared/quoting/F11-L03.json` | F11-L03 | audience | 1 | 43 | False | DRAFT |
| `shared/starting-business/F11-L01.json` | F11-L01 | audience | 1 | 43 | False | DRAFT |
| `shared/starting-business/additional-specialist-services-L04.json` | additional-specialist-services-L04 | audience | 1 | 43 | False | DRAFT |
| `shared/team/F12-L01.json` | F12-L01 | audience | 1 | 43 | False | DRAFT |
| `shared/team/F12-L02.json` | F12-L02 | audience | 1 | 43 | False | DRAFT |
| `shared/team/F12-L03.json` | F12-L03 | audience | 1 | 43 | False | DRAFT |
| `shared/team/F12-L04.json` | F12-L04 | audience | 1 | 43 | False | DRAFT |
| `shared/team/F12-L06.json` | F12-L06 | audience | 1 | 43 | False | DRAFT |
| `shared/team/additional-specialist-services-L10.json` | additional-specialist-services-L10 | audience | 1 | 43 | False | DRAFT |
| `courses/appliance/NEW-APP-01.json` | NEW-APP-01 | body | 1 | 1 | False | DRAFT |
| `courses/timber/NEW-TMB-01.json` | NEW-TMB-01 | body | 1 | 1 | False | DRAFT |
| `courses/variants/appliance/CP-01-appliance.json` | CP-01-appliance (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/appliance/CP-04-appliance.json` | CP-04-appliance (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/cardetail/CP-01-cardetail.json` | CP-01-cardetail (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/cardetail/CP-04-cardetail.json` | CP-04-cardetail (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/furniture/CP-01-furniture.json` | CP-01-furniture (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/furniture/CP-04-furniture.json` | CP-04-furniture (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/painting/CP-01-painting.json` | CP-01-painting (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/painting/CP-04-painting.json` | CP-04-painting (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/plastering/CP-01-plastering.json` | CP-01-plastering (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/plastering/CP-04-plastering.json` | CP-04-plastering (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/portfolio/CP-01-portfolio.json` | CP-01-portfolio (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/portfolio/CP-04-portfolio.json` | CP-04-portfolio (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/stone/CP-01-stone.json` | CP-01-stone (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/stone/CP-04-stone.json` | CP-04-stone (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/tiling/CP-01-tiling.json` | CP-01-tiling (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/tiling/CP-04-tiling.json` | CP-04-tiling (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/timber/CP-01-timber.json` | CP-01-timber (not in index) | audience | 1 | not in index | n/a | n/a |
| `courses/variants/timber/CP-04-timber.json` | CP-04-timber (not in index) | audience | 1 | not in index | n/a | n/a |
| `shared/app/SFS-01.json` | SFS-01 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-02.json` | SFS-02 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-03.json` | SFS-03 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-04.json` | SFS-04 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-05.json` | SFS-05 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-06.json` | SFS-06 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-07.json` | SFS-07 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-08.json` | SFS-08 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-09.json` | SFS-09 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-10.json` | SFS-10 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-11.json` | SFS-11 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-12.json` | SFS-12 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-13.json` | SFS-13 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-14.json` | SFS-14 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-15.json` | SFS-15 | equipmentAndPpe | 1 | 0 | False | DRAFT |
| `shared/app/SFS-16.json` | SFS-16 | equipmentAndPpe | 1 | 0 | False | DRAFT |

71 lesson files would change. The change to a lesson file is a new revision that must pass the human review gate and the publication process before learners see it. Shared lessons (in `shared/`) change every course that uses them, so their course counts are the real impact. No revision was created, and no publication state was changed.

The retained Jobber Academy citations (section 4b) and the provenance group (section 4c) do not need a revision for brand reasons. Section 4c needs a decision first, because it depends on whether the field is shown.

## 8. Out-of-scope matches (noted, not edited)

These are outside `curriculum/`. They were not searched exhaustively, and they are listed so the owner of the rename can see them:

- `lms-main/apps/frontend/src/app/page.tsx` line 56: learner-facing copy "Titan Academy combines curriculum lessons, knowledge checks, practical evidence reviewed by...". This is visible text.
- `lms-main/apps/frontend/src/app/layout.tsx` line 7: page metadata description "SkilledAt.Work learning system: Titan Academy training...". This is the page description and may appear in search results.
- `lms-main/apps/backend/src/modules/courses/video-playback.service.ts` lines 25 and 33: `issuer: "titan-academy"` in the signed video token. Changing it invalidates tokens already issued, so it is an identifier to retain or migrate deliberately.
- `lms-main/apps/backend/src/modules/curriculum/business-lesson-fields.ts` line 1 comment, and `integration.routes.ts` (`x-titan-service` header): code identifiers and comments, retained.
- `curriculum/research/DEPLOY-RUNBOOK.md` (and the matching backend docs): database role and name `titan_academy` is required by the production check in `apps/backend/src/config/env.ts`. Retain.

## 9. Verification

- Every matching line in the scan is in exactly one row of section 4 or 5 (or the provenance group in 4c). Counts in section 3 come from the same scan.
- No file other than this document was changed on the branch.

