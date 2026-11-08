# Pool and spa servicing: lesson report

Status: all lessons DRAFT, reviewStatus NOT REVIEWED. Nothing is verified or published.

## Counts
- Lessons: 13 files (pool-cleaning-L01 to L14, with L05 not present). Eleven existing lessons rewritten for Australia-wide scope; two new barrier lessons (L13, L14).
- Assessments: 13 files in curriculum/assessments/, one per lesson. Answer keys live there, not in learner files.
- Learner JSON: all parse; no correctIndex in learner files.
- Pass rule: at least 2 of 3 knowledge checks, stated as reading-only, not practical competence.

## Decisions for review
- D1. L05 is not present: the catalogue merges it into another lesson.
- D2. New IDs: pool-cleaning-L13 (visual barrier check and escalation, the NEW-POOL-01 placeholder) and pool-cleaning-L14 (barrier authority by state and territory, NEW-POOL-02). Confirm the IDs.
- D3. No third new lesson. The WA guide supports barrier and coverage content only, folded into L13 and L14.
- D4. L13 quotes WA barrier figures (1200 mm height, 100 mm ground and gap limits, 1500 mm latch release, 10 mm hinge projection). I checked these against the WA guide text: they appear there. They are attributed to WA and marked UNCONFIRMED as current law. No figures are given for other states.
- D5. L14 quotes depth thresholds from state pages (300 mm, and 30 cm for the ACT). These are not heights or gaps; strike them if you prefer.
- D6. Licence notices set on L01, L02, L06, L07, L10, L12, L13, L14.

## Corrections to existing lessons
- Several lessons cited "source reference U1 to U7", which had no matching entries. Replaced with real references.
- L09 cited a legislation document never opened. It now cites the Safe Work Australia model code, marked as not read.
- L08 dropped an unused source. L09 points to the "High-risk cleaning" module. L12 mentions the barrier check.
- L11 describes the Unitywater policy as one Queensland example.

## Web checks (recorded 2 November 2026, agent-reported; not re-verified by lead)
- Barrier authority pages for all eight states and territories. Status: WA PARTIAL, NSW CHECKED, QLD PARTIAL (page dated 2021), VIC CHECKED for inspectors and PARTIAL for repairs, SA PARTIAL, TAS CHECKED (dated 8 December 2023), ACT CHECKED, NT PARTIAL.
- The VIC page failed on its first URL and loaded from the second.

## Still UNCONFIRMED
- National Construction Code, Building Code of Australia, AS 1926.1, AS 1926.2, AS 1926.3: named only; text not read.
- Current WA rules. The WA guide is dated May 2016 (the file name says June). Its online copy was not verified.
- Pool chemical licences, dangerous goods thresholds, electrical licences, confined-space rules and discharge rules for every jurisdiction.
- Commercial spa barrier rules; the SA building licence point (carried from the research brief, not re-read).

## Source and format notes
- The lesson copies in lessons/ready/ and lessons/converted/ use a different wrapper and cite US and GB sources (pool34-us01, pool34-gb01). No facts were taken from them.
- A four-word overlap check against the WA guide was run. Remaining hits are generic phrases or official names (for example "Health (Aquatic Facilities) Regulations 2007", "Building Code of Australia"). A reviewer should confirm no sentence is copied.

## Items for other owners (not edited)
- levels/pool.csv, structure/COURSES-MODULES.json, lessons/TITLES-ONLY.csv and lessons/MANIFEST.csv need rows for L13 and L14. The L02 level override in pool.csv needs a look.
- Suggested modules: "Safety and hazards" (L13), "Scope and authority" (L14). Both already exist.
