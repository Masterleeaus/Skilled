# Titan Academy transformation: confirmed decisions (source of truth for all agents)

## Scope: AUSTRALIA-WIDE (all states and territories). Victoria is not the default. Licensing, registration and council rules must be recorded for every state and territory, with state differences marked. Use national principles (model WHS laws, national frameworks) where they apply.

## Confirmed business list (39 courses)

Cleaning and hygiene: residential cleaning; commercial and office cleaning; bond and end-of-lease cleaning; short-stay turnover; carpet and upholstery cleaning; hard floor care; construction-site clean-up; post-construction clean; strata and common-area cleaning; car detailing.

Specialist: medical equipment cleaning (external only); healthcare cleaning (aged care, medical, dental, NDIS) as one vertical.

Exterior and height (supervised, authorised-only tracks): window cleaning (all heights); pressure cleaning (all heights); roof soft washing; solar panel cleaning.

Aquatic: pool and spa servicing; pond and water-feature maintenance; aquarium maintenance (freshwater and marine combined).

Outdoor and garden: lawn and turf care; garden maintenance and clean-ups (includes hedge, leaf clearance and mulching lessons); irrigation servicing; landscaping.

Property and trades: handyman (includes minor repairs, property maintenance lessons, one basic lesson each from painting, plastering and tiling); locksmith and door installation; deck and fence; flat-pack and fixtures; painting (separate business); plastering (separate business); tiling (includes floating floors); real estate portfolio management (course, for a home-based property manager).

Property manager partner: a MODULE of lessons inside cleaners, gardeners and handymen, not a course.

Personal, fitness and pet: mobile hairdressing and barbering (one business); mobile beauty; mobile massage; personal and fitness training (one business); yoga and Pilates; dog walking (includes pet taxi lessons); pet and house sitting; pet grooming.

## Lessons that are NOT businesses
- Bathroom, kitchen, blind and air-conditioning lessons: in BOTH residential and commercial cleaning.
- Mattress cleaning: residential only.
- Warehouse, laboratory, restaurants and commercial kitchens, food-processing sanitation, industrial degreasing: lessons in commercial and office cleaning.
- Hedge, leaf clearance, mulching: lessons in garden maintenance.
- Property maintenance: lessons in handyman.
- Pet taxi: lessons in dog walking.
- Medical clinic and aged care content: inside healthcare vertical.

## Excluded (high-hazard, do not build as businesses or lessons)
Biohazard and trauma, crime scene, drug contamination, mould, fire and smoke, flood and water restoration, hoarding and squalor. (84 source lessons.)

## Four core lesson types (every lesson gets one primary type)
- K: knowledge and SOPs
- RH: revenue, higher hourly rate (jobs that pay more)
- RV: revenue, volume (upselling, more jobs, partner add-ons, commission)
- C: cost reduction
- W: workload reduction (automation, AI, scheduling)

## Lesson layers
- Base shared pool: applies to all businesses (general principles).
- Group shared lessons: reused across the businesses in one group.
- Business-specific lessons: stay with one business.
- Adapted lessons: an existing technique modified for named other businesses.

## Templating rule
General lessons use template fields ({role}, {service}, {equipment}). Technical and safety lessons are written per service or grouped only where reuse is technically sound. Never swap nouns in a hazard lesson.

## Licence rule
Lessons that cover licensed or authorised work carry a short licence notice saying what the licence covers and that the lesson does not grant it. Licence notices do not reduce lesson depth. Lessons must not imply completion grants a licence.

## Quality rule
Every lesson must be full instructional content (not an outline), with knowledge checks and assessor-only answers kept separate, and source references with review status. Nothing is marked published or verified without review.

## Current status of inputs
- Source inventory: /home/claude/work/out/WP-LESSON-INVENTORY.csv (487 lessons).
- First-pass reuse classification: /home/claude/work/out/LESSON-REUSE-CLASSIFICATION.csv (general 219, adapt 99, specific 85, exclude 84). Rule-based; needs review.
- Earlier catalogue: /home/claude/work/out/LESSON-CATALOGUE.md. Known wrong: maps families to single rows and labels lessons "New" without checking the source. Must be rebuilt.
- WordPress source root: /home/claude/wp_src/titan-academy/titan-academy/
- Architecture plan (superseded for scope, reference only): .../titan-academy/architecture/ (55 courses, 51 modules, 45 verticals, 15 pathways).

## Output rules for every agent
- Write only to your assigned output folder under /home/claude/work/team/.
- Do not edit WordPress source or the TypeScript repo.
- Do not modify files another agent owns.
- Report counts and unresolved issues honestly. Do not claim completion you have not verified.

## Decisions added in review (later than the sections above; these override earlier text)
- C11 to C20 specialist lessons (60): ADD to inventory and catalogue.
- 30 foundation lessons F11, F12, F13, F18, F20: ASSIGN to businesses (not reference only).
- Mould content in pressure-cleaning L09 and property-maintenance L05: KEEP lessons, with full content and warnings where necessary. Do not drop for safety reasons.
- The seven high-hazard families (biohazard, crime scene, drug contamination, mould, fire and smoke, flood, hoarding; 84 lessons): RESTORE as one module named "High-risk cleaning", with each family as one lesson in that module. Full content with warnings. This REPLACES the earlier exclusion.
- General principle from the user: do not drop content because it seems unsafe; write comprehensive lessons with warnings instead.

## Decisions added in one-by-one review (override earlier text)
- Mould content (pressure-cleaning L09, property-maintenance L05): keep, with full content and warnings.
- High-hazard families (7, 84 lessons): restore as ONE module "High-risk cleaning", each family as one lesson. Replaces the earlier exclusion.
- Mobile beauty: EXCLUDE injectables (botulinum toxin, dermal filler).
- Eco-cleaning products: base shared pool.
- Additional specialist services: commercial and office cleaning.
- Commercial kitchen exhaust: commercial and office cleaning (lessons).
- Oven cleaning: kitchen group.
- Kitchen and bathroom lessons: EXTEND to bond, short-stay and strata (in addition to residential and commercial).
- Deceased estate clean-outs: INCLUDE as lessons (in the high-risk module or the relevant cleaning group; placement to be set by architect).
- Tile and grout sealing: lessons inside TILING business.
- Graffiti removal: lessons inside the CLEANING group (not its own business).
- Stone and terrazzo restoration, timber floor restoration, furniture restoration: ADD as businesses (three restoration businesses, or one grouped restoration business; architect to decide the grouping).
- Specialty appliance and machine cleaning: OWN business.
- Ductwork and ventilation cleaning: NOT added. Bin-area sanitation: NOT added.
- Other architecture services: none added.
- Learner pathways (P01–P15): NO pathways.
- Titan Zero app training: YES, as a module (operations, front desk, quotes, pay, teams, money, reporting, archives, marketing). Architect to set the module list.
- WA locksmith licence (WA Police Licensing Services): KEEP in the matrix.
- Classification reviewer summary: PUBLISH as a file for the team.
