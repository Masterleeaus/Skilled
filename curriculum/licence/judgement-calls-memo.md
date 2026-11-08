# Licence judgement calls: decision memo

Date of review: 2026-11-03
Scope: three open licence judgement calls in `curriculum/licence/lesson-licence.json`.
Method: each lesson's own instruction, procedure and worked examples were read in `curriculum/courses/` (the course copy). The cited official pages were then checked with WebFetch and WebSearch. Six WebFetch calls and two WebSearch calls were used. Two cited URLs were not on the fetch allowlist, so the same pages were fetched from alternate URLs returned by search (noted below).

## Summary of recommendations

| # | Lesson | Current status (lesson-licence.json) | Earlier status (reclassification-scope.md) | Recommended | Owner decision needed |
|---|---|---|---|---|---|
| 1 | C13-L03 Method selection | not_checked | required | keep not_checked | Accept that a learner's pre-use visual check and tag-date record is not licence work |
| 2 | NEW-HAIR-04 Barbering techniques and skin care | not_checked | required | keep not_checked | Decide whether blade shaving stays off the offer list until other states are confirmed |
| 3 | pressure-cleaning-L11 Shutdown and equipment care | not_checked | threshold | keep not_checked | Accept that isolating a plug-in cleaner is not licence work, and update the "not yet confirmed" wording |

Each status in the JSON is already `not_checked`. The recommendations keep that status and ask for note wording to be updated.

---

## 1. C13-L03: Method selection (ACT electrical testing)

**Lesson:** C13-L03, "Method selection", carpet and upholstery course (`curriculum/courses/carpet-and-upholstery-cleaning/C13-L03.json`).

**Current status:** `not_checked` (JSON, note dated 2026-11-03). Earlier status was `required`.

**What the learner actually does (from the lesson's own work):**
- Procedure step 2: "Check the machine: the water temperature, the solution flow, the hoses, the cord, and the test date and tag."
- Instruction "Equipment, settings and electrical checks": "Before each use, look over the hoses, the tank, the cord and the plug for damage." It also says to "Keep a record of the last test date and the tag on each machine."
- Common error: "Using a machine with a damaged cord or an overdue test tag. Prevention: Inspect the machine before use and do not use it until it is tested and tagged."
- The learner does not test equipment anywhere in the lesson. The lesson's own text says a licensed electrician or competent person carries out the testing.

**Evidence:**
- WorkSafe ACT, "Electrical equipment" (`https://www.worksafe.act.gov.au/health-and-safety-portal/managing-safety/electrical-equipment`). Last updated: none shown. The only date is the AS 3760:2022 edition year. The page says: "Inspections are to be carried out by a licensed electrician or a person certified as competent to undertake the testing." It also says: "Following testing, compliant equipment shall be fitted with a durable, non-reusable, non-metallic tag or other indicator." It gives no test interval.
- The page does not address a contractor's portable equipment brought onto a client's premises. It does not say whether a user's pre-use visual check counts as an "inspection" under the sentence above. This is the grey area.
- The ACT page applies in the ACT only. The lesson's other-state position is unconfirmed, and the lesson says so.

**Recommended option: keep `not_checked`.**
Reason: the learner does a visual look, reads the existing test tag, and records the date. The testing that the ACT page describes is done by a licensed electrician or a competent person, and the lesson does not teach it. Making the carpet method lesson "required" would put a licence requirement on a visual check and a record entry that the lesson does not treat as licence work.

**Owner decision (plain language):**
- Are you content that a learner's pre-use look at the cord and plug, plus writing down the tag date, is not licence-covered work? If yes, keep `not_checked`.
- If you want to remove the grey area, the lesson can say in one line that the learner never tests, and that the pre-use look is a visual check only. The lesson already says this in substance. The owner would need to approve that wording.
- Option "required" is available if you decide the ACT sentence does reach visual checks. The evidence does not support that reading for a learner's check, so it is not recommended.

---

## 2. NEW-HAIR-04: Barbering techniques and skin care (ACT skin-penetration licence)

**Lesson:** NEW-HAIR-04, "Barbering techniques and skin care" (`curriculum/courses/hair/NEW-HAIR-04.json`).

**Current status:** `not_checked` (JSON, note dated 2026-11-03). Earlier status was `required`.

**What the lesson's own work covers:**
- A blade shave: "Shaving with a blade touches the skin and can cause cuts." The lesson says blade shaving scope is "a scope question" and gives the instruction: "Blade work over broken or irritated skin should not be offered until the business has written a position, confirmed for the local regulator."
- Skin-care products: a cleanser, moisturiser, beard oil or aftershave. The lesson says do not make medical claims.
- A rash or skin condition check before any blade or product touches the skin, with referral to a general practitioner.
- Worked example: a premium head shave with a blade on the scalp. The lesson says it is not to be offered until the business reviews it and confirms the state position.

**Evidence:**
- ACT Health, "Skin penetration procedures". The alternate URL that was fetched is `https://www.act.gov.au/business/health-licenses-and-inspections/infection-prevention-and-control/skin-penetration-procedures`. The lesson's listed URL (`https://www.act.gov.au/health/businesses/licences-permits-and-registration/infection-prevention-and-control/skin-penetration-procedures`) is not on the fetch allowlist, but it appeared in search results for the same page. Last updated: none shown. The page defines skin penetration as "any process that involves piercing, cutting, puncturing, or tearing of a human body." It then says the term does not cover: "cutting, shaving or hair dyeing" and "closed ear piercing or the use of test equipment." It says: "if a business performs these procedures, you must be licensed and comply with the ACT Health Infection Control" code. It states that "any mobile practitioner providing any of these services" is covered, but "some business types may be restricted to premises-based."
- NSW Health, "Skin penetration" (`https://www.health.nsw.gov.au/environment/skinpenetration`). Current as at: 10 August 2023. The page says "Hairdressing and other body decorating and grooming practices which do not deliberately pierce the skin" are not regulated under this legislation. It says such practices "may be regulated by your local council under different legislation." Shaving and blades are not mentioned. The page also lists "hair removal" in its general definition of skin penetration procedures, and says laser hair removal is not a skin penetration procedure. This is a point to watch (see below).

**Does the ACT licence cover the lesson's work?**
- Blade shaving: no. The ACT page excludes "cutting, shaving or hair dyeing" from the definition. A cut that happens during a shave is also within that shaving exclusion. The lesson's own worked example and summary already say the ACT position does not settle other states, which is correct.
- Skin-care products and skin checks: no. The lesson does not pierce the skin. A skin check and a referral do not involve piercing.
- Mobile barbers: the ACT page covers mobile practitioners only where the service is skin penetration. Because shaving is excluded, the mobile point does not reach this lesson's blade work in ACT.

**Recommended option: keep `not_checked`.**
Reason: the ACT skin-penetration licence expressly excludes shaving, so it does not cover the blade work. NSW does not regulate hairdressing unless it "deliberately pierce[s] the skin," and it does not mention shaving. No confirmed rule was found that requires a licence for blade shaving in any state the lesson covers. "Required" would be an unsupported claim. "Threshold" does not apply because there is no stated numerical limit.

**Point to watch:** NSW lists "hair removal" in its general definition of skin penetration procedures. The lesson does not mention this. Under NSW's own text, shaving that does not deliberately pierce the skin is not regulated. The owner should read this as a reason to keep the lesson's "do not offer until the position is confirmed" wording, not as a licence requirement.

**Owner decision (plain language):**
- The licence question is answered for ACT (shaving is excluded) and is not settled for other states. Keep the status as `not_checked`.
- Separately, decide as a business matter whether blade shaving stays off the approved service list until the lesson's other states are confirmed. The lesson already says it should not be offered yet. That is a scope decision for the owner, not a licence finding.
- Note: the lesson's references section should cite the ACT exclusion wording directly, so the basis is visible to learners. Suggested change for the owner to approve.

---

## 3. pressure-cleaning-L11: Shutdown and equipment care (isolating power and fuel on a plug-in cleaner)

**Lesson:** pressure-cleaning-L11, "Shutdown and equipment care" (`curriculum/courses/pressure-cleaning-all-heights/pressure-cleaning-L11.json`).

**Current status:** `not_checked` (JSON, note dated 2026-11-03). Earlier status was `threshold`.

**What the lesson's own work covers:**
- Procedure step 2: "Stop the engine or motor and isolate the power or fuel supply as the manufacturer's manual directs." Step 3: "Shut off the water supply to the machine." Step 4: "Release the stored pressure using the manufacturer's method, with the supply shut off."
- Hose, fitting and lance inspection, tagging defective items, and recording defects. The learner does not repair or test. The lesson says: "As a trainee, you do not repair the item or test it yourself."
- Chemical storage and labelling, and wash-water handling.
- The electrical notice in the lesson says: "This lesson does not grant the right to work on, isolate or repair solar (PV) systems or any electrical installation." It also says: "Whether repairing a plug-in cleaner needs a licence has not yet been confirmed, and this lesson does not permit that repair."
- The lesson's height content (the 11 m boom threshold for elevating work platforms) is background only. Shutdown is a ground-level task, and no elevating work platform is operated.

**Evidence:**
- NSW Government, "Electrical licences and certificates (building and trades)" (`https://www.nsw.gov.au/business-and-economy/licences-and-credentials/building-and-trades-licences-and-credentials/electrical`). Last updated: 23 June 2026. The page defines the work: "Electrical wiring work means the actual physical work of installing, repairing, altering, removing," and "or adding to an electrical installation or the supervising of that work." It excludes "any electrical article connected to, and extending or situated beyond, any electrical outlet socket."
- Reading of the NSW text: a plug-in cleaner is connected to an outlet and its body lies beyond the socket, so on the page's own words it falls within the exclusion. The page does not say this about repair in those words. The fetch summary said so directly. This is an inference from the exclusion, and the owner should treat it as such.
- The NSW list of verbs (installing, repairing, altering, removing, adding to) does not include switching off, unplugging or shutting a fuel valve. Isolating a plug-in cleaner is therefore not within the defined work on the page's own text.
- Fuel isolation on a petrol-engine cleaner: no licence rule for this was found in any source read. This was not researched in other states.
- Queensland and Victoria: not checked for plug-in cleaners in this pass. The lesson is written with NSW as its reference.

**Recommended option: keep `not_checked`.**
Reason: the shutdown steps (switch off or unplug, shut the water and fuel supply, release pressure, check the gauge) are not in the NSW definition of electrical wiring work. The NSW exclusion covers plug-in equipment beyond the outlet, which is the cleaner. The lesson does not teach repair of fixed wiring. The 11 m threshold belongs to elevated-work lessons and is not triggered here.

The earlier `threshold` status came from the height notes. The lesson's own work does not operate an elevating work platform, so `threshold` does not fit this lesson.

**Owner decision (plain language):**
- Confirm that switching off and unplugging a plug-in cleaner, and shutting its fuel and water supply, are not licence work. Recommended: yes, keep `not_checked`.
- Decide whether the lesson's "not yet confirmed" wording on repair of a plug-in cleaner should be replaced with the NSW exclusion. The NSW text supports the exclusion for NSW only. The lesson should say that repair is excluded from this lesson either way.
- If you want the elevated-work track to carry the 11 m boom rule, that belongs in the elevated-work lessons, not here.

---

## Sources checked (all fetched 2026-11-03)

| Source | URL | Last updated (as shown) | Used for |
|---|---|---|---|
| WorkSafe ACT, Electrical equipment | https://www.worksafe.act.gov.au/health-and-safety-portal/managing-safety/electrical-equipment | None shown (cites AS 3760:2022) | Item 1 |
| ACT Health, Skin penetration procedures | https://www.act.gov.au/business/health-licenses-and-inspections/infection-prevention-and-control/skin-penetration-procedures (alternate URL; lesson's listed URL not fetchable) | None shown | Item 2 |
| NSW Health, Skin penetration | https://www.health.nsw.gov.au/environment/skinpenetration | Current as at 10 August 2023 | Item 2 |
| NSW Government, Electrical licences and credentials | https://www.nsw.gov.au/business-and-economy/licences-and-credentials/building-and-trades-licences-and-credentials/electrical | 23 June 2026 | Item 3 |

Not fetched: Queensland and Victorian wiring rules and any fuel-system rule for plug-in equipment. These are not confirmed.

## Decisions taken in this memo (for review)

1. C13-L03: keep `not_checked`. The learner's visual check and tag-date record are treated as not licence work. The ACT testing wording is read as applying to testing by others.
2. NEW-HAIR-04: keep `not_checked`. Blade shaving is treated as excluded from the ACT licence, and no state rule was found that covers it. Business scope (whether shaving is offered) is left to the owner.
3. pressure-cleaning-L11: keep `not_checked` (down from `threshold`). The NSW exclusion is read as covering a plug-in cleaner's isolation and repair on the NSW text. The NSW repair point is an inference, not a verbatim statement, and is flagged above.
