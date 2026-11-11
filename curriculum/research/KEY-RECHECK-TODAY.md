# Independent recheck of answer keys changed today

Scope: the 42 unique checks named in the six KEY-FIX reports (KEY-FIX-F02-F03, KEY-FIX-F08-F15, KEY-FIX-F15-B, KEY-FIX-F16-F17, KEY-FIX-F19-TYPOS, KEY-FIX-HANDYMAN), including F15-L04-K01 and F15-L04-K04. The earlier reports were not used as evidence. Each key was read from `curriculum/assessments/<lessonId>.assessment.json` (`correctIndex`, 0-based). Question and options were read from the learner lesson file (`curriculum/shared/...` or `curriculum/courses/handyman/...`). The decision text was read from that lesson's instruction, procedure, worked examples, quality standard, summary and safety notes. No files were edited and nothing was committed.

Method for each check: (1) the marked option must be one the lesson text supports; (2) every other option must be contrary to the lesson or clearly not the answer to the stem; (3) for "unsafe alternative" stems, the marked option must be the unsafe one.

## Results

Checks in the changed list: 42. Correct: 42. Wrong: 0. Ambiguous: 0.

Two checks outside the changed list were found wrong while reading the same lessons (section B).

## A. Checks in the changed list

| Check | Marked key (index: option) | Verdict | Option I think is right | Lesson text that decides it (file, section) |
|---|---|---|---|---|
| F02-L02-K01 | 2: "Because a sign does not remove the hazard. Close access and dry the floor where practicable" | correct | 2 | shared/safety/F02-L02.json, procedure: "Close access and dry a wet walkway where practicable, rather than relying on a warning sign alone." |
| F02-L03-K01 | 2: "Yes. A near miss counts as an incident, so record the facts promptly" | correct | 2 | shared/safety/F02-L03.json, "Recognise an incident": "An incident can include injury, near miss, spill, property damage or unsafe condition." |
| F02-L04-K02 | 0: "Do not start the job. Isolate where possible, report the reason and await instructions" | correct | 0 | shared/safety/F02-L04.json, "Make a go/no-go decision": "If the job cannot be made safe, isolate where possible, report the reason and await instructions." |
| F03-L01-K01 | 2: "The exact product and formulation, matched to its current label and SDS" | correct | 2 | shared/chemicals/F03-L01.json, procedure: "Match the exact product and formulation to its current safety data sheet (SDS), and do not rely on a similar brand name." |
| F03-L02-K01 | 2: "That the bucket and sprayer hold no residue of a previous product" | correct | 2 | shared/chemicals/F03-L02.json, procedure: "Check that buckets, sprayers and cloths hold no residue of a previous product before the next product goes in." |
| F03-L02-K02 | 1: "Leave the area, keep others away, alert the supervisor and follow the site emergency plan" | correct | 1 | shared/chemicals/F03-L02.json, core procedure: "Leave the area, keep others away, alert the supervisor and follow the site emergency plan." |
| F03-L04-K01 | 2: "Upright, secured, labelled and separated by compatibility, with transport restraints checked" | correct | 2 | shared/chemicals/F03-L04.json, procedure: "Store products upright and secured, in original or approved labelled containers, separated according to their compatibility instructions." |
| F03-L04-K02 | 2: "Keep people clear, follow the SDS and site spill plan, and escalate beyond your training" | correct | 2 | shared/chemicals/F03-L04.json, procedure: "Keep people clear..." "Do not improvise absorbents, and do not pour liquid down a drain." "Follow the SDS and the site spill plan..." |
| F08-L01-K01 | 1: "That the method matches the authorised site scope and current product labels, with no uncontrolled hazard remaining" | correct | 1 | shared/safety/F08-L01.json, "Quality and safety checks": "confirm that the method matches the authorised site scope and current product labels, that no uncontrolled hazard remains." |
| F08-L02-K01 | 1: "That the PPE selection matches the risk assessment, product label and site requirements" | correct | 1 | shared/safety/F08-L02.json, instruction: "Select gloves and other PPE from the risk assessment, product label and site requirements, not habit alone." |
| F14-L01-K02 | 3: "Pause the task and contact the designated coordinator" | correct | 3 | shared/customer/F14-L01.json, workplace procedure: "If consent is unclear or the person appears distressed, pause the task and contact the designated coordinator." |
| F15-L01-K01 | 2: "Stop, and ask the supervisor before going further" | correct | 2 | shared/induction/F15-L01.json, procedure: "Stop and ask the supervisor before going further if a task falls outside your training or authority." |
| F15-L01-K04 | 1 (unsafe): "Relying on a branded shirt as splash protection" | correct | 1 | shared/induction/F15-L01.json, instruction: "A branded shirt is not protection against splashes." |
| F15-L02-K02 | 0: "Tell the supervisor the rule conflicts with safe performance, and say what the risk is" | correct | 0 | shared/induction/F15-L02.json, "Check, record and escalate": "Report site footwear rules that conflict with safe task performance." |
| F15-L02-K04 | 3 (unsafe): "Relying on footwear alone on a wet walkway, with no barrier or drying" | correct | 3 | shared/induction/F15-L02.json, procedure: "Use barriers, dry routes and controlled work zones, since footwear alone does not control slip risk." |
| F15-L03-K04 | 1 (unsafe): "Wearing gloves that are not the chemical-resistant type the label requires" | correct | 1 | shared/safety/F15-L03.json, procedure: "Confirm that the glove material suits the product, because gloves are not interchangeable." |
| F15-L04-K01 | 1: "Stop, and escalate to the supervisor" | correct | 1 | shared/induction/F15-L04.json, overview: "stop if a task falls outside your training or authority." |
| F15-L04-K04 | 0 (unsafe): "Eating a snack near the chemical store and contaminated area" | correct | 0 | shared/induction/F15-L04.json, performing: "Keep eating, drinking and personal belongings away from cleaning chemicals and contaminated areas." Option 3 (covering a minor cut under site policy) is a safe practice per procedure: "Cover minor cuts according to site policy." |
| F15-L05-K01 | 3: "Stay outside restricted areas and contact your supervisor" | correct | 3 | shared/customer/F15-L05.json, "Check, record and escalate": "remain outside restricted areas, provide approved verification and contact the supervisor. Do not pressure the customer to grant access." |
| F15-L05-K05 | 0: "Give the approved verification and contact the supervisor about the challenge" | correct | 0 | shared/customer/F15-L05.json, same section as above; "Never disclose another client's identity." |
| F15-L06-K01 | 1: "Stop using the damaged item and request a replacement before the next hazardous task" | correct (key), stem needs rewrite | 1 | shared/safety/F15-L06.json, "Check, record and escalate": "Request replacements before clothing or footwear becomes unsafe." The stem asks about a task outside authorisation or training, which no option answers. The key is the only supported option, but the stem does not match it. |
| F15-L06-K02 | 0: "Document the defect and the issued PPE, and pass it to the supervisor" | correct | 0 | shared/safety/F15-L06.json, "Check, record and escalate": "Document issued PPE and defects when required." The supervisor step is inferred. Options 1 to 3 (put back in clean store, ask client, keep to yourself) are contrary to the lesson. |
| F15-L06-K04 | 0 (unsafe): "Wearing footwear with worn grip for a hazardous task" | correct | 0 | shared/safety/F15-L06.json, prepare: "Identify tears, worn grip, stains..."; check: "Request replacements before clothing or footwear becomes unsafe." |
| F16-L01-K01 | 1: "The soil and substrate, and the product's intended task rather than its marketing language" | correct | 1 | shared/chemicals/F16-L01.json, core procedure: "Distinguish ... by intended task, not marketing language. Identify the soil and substrate before choosing a category." |
| F16-L01-K02 | 3: "Pause, protect the area and seek supervisor guidance" | correct | 3 | shared/chemicals/F16-L01.json, procedure: "If the choice is unclear, pause, protect the area and seek supervisor guidance." |
| F16-L01-K05 | 2: "Record the product choice, the surface, and any coaching or reassessment needed" | correct (best of set; part inferred) | 2 | shared/chemicals/F16-L01.json, evidence: "Record observations, required coaching and reassessment rather than awarding competence from attendance alone." Recording product choice is not stated in the lesson text; the other options (no record, brand name only, verbal) are clearly wrong. |
| F16-L03-K03 | 2: "Reject the acidic cleaner for marble and select a stone-compatible approved alternative" | correct | 2 | shared/chemicals/F16-L03.json, worked scenario: "An acidic bathroom cleaner is proposed for marble. The cleaner rejects it and selects a stone-compatible approved alternative." |
| F16-L03-K04 | 3 (unsafe): "Applying an acidic bathroom cleaner to marble" | correct | 3 | shared/chemicals/F16-L03.json, procedure: "Reject any product known to damage the surface, such as an acidic cleaner on marble, and select an approved alternative." |
| F16-L03-K05 | 0: "A note of existing damage and the reason for the no-use decision, for supervisor review" | correct (best of set; part inferred) | 0 | shared/chemicals/F16-L03.json, procedure: "Record any existing damage before starting work." Supervisor review is inferred from "seek supervisor guidance" elsewhere in the lesson. |
| F17-L01-K02 | 2: "Remove the wrong tool and use the site-assigned clean tool" | correct | 2 | shared/equipment/F17-L01.json, worked scenario: "The worker removes it and replaces it with the site-assigned clean tool." |
| F17-L04-K01 | 1: "Plugs, cables, chargers, switches and equipment condition before energising, with residual-current protection observed" | correct | 1 | shared/safety/F17-L04.json, procedure: "Inspect plugs, cables, chargers, switches and equipment condition before you switch it on." |
| F17-L05-K02 | 3: "Use a safer system such as a cart or assistance, and report tasks beyond your capacity" | correct | 3 | shared/safety/F17-L05.json, procedure: "Use carts and adjustable tools..." and "Report any task that is beyond your personal capacity, and agree a safer system of work with the supervisor." |
| F17-L05-K03 | 3: "Assess the load, the route and a safer transport arrangement before going up" | correct | 3 | shared/safety/F17-L05.json, worked scenario: "They assess load, route and safer transport arrangements before proceeding." |
| F19-L01-K02 | 2: "Clarify the ambiguity with the coordinator before arriving, and do not do the extra task without approval" | correct | 2 | shared/job-management/F19-L01.json, method: "Clarify ambiguous or contradictory instructions before arrival. Do not infer consent to perform extra tasks." |
| F19-L05-K01 | 2: "Exits, fire equipment, access routes, wet-floor controls and barriers, and ventilation planned before work starts" | correct | 2 | shared/job-management/F19-L05.json, method: "Plan equipment placement, safe access routes, wet-floor controls, ventilation... Keep exits and fire equipment clear." |
| F19-L05-K05 | 1: "Record the inspection before access is restored, and escalate any zone that cannot be kept safe" | correct | 1 | shared/job-management/F19-L05.json, procedure: "Restore access only after the work zone has been inspected, and record the facts." Escalation: "Stop and seek direction when work is unsafe." |
| F19-L06-K04 | 2 (unsafe): "Using a neighbour to get past an expired code" | correct | 2 | shared/quality/F19-L06.json, worked example: "...instead of asking a neighbour to open the premises." Procedure: "does not bypass access or safety controls." |
| handyman-work-L03-K01 | 1: "Tag it out of service, replace it, and record the defect" | correct | 1 | courses/handyman/handyman-work-L03.json, instruction: "Reject a wrench with splayed jaws... A rejected tool is tagged out of service... Do not compensate for a faulty tool with extra force." |
| property-maintenance-L02-K01 | 2: "As two separate records with unique identifiers and their own locations and histories" | correct | 2 | courses/handyman/property-maintenance-L02.json, instruction: "Where two items look identical, the register must still hold two different records." |
| property-maintenance-L10-K01 | 2: "Add condition-based checks and propose authorised servicing for the recurring fault, with the reason recorded" | correct | 2 | courses/handyman/property-maintenance-L10.json, instruction: "Use history, not only the calendar... Propose authorised servicing where the failure pattern points to a fault the planned service would not address." |
| handyman-work-L04-K01 | 0: "Treat the guard defect as a stop, do not use the saw, and tag it out" | correct | 0 | courses/handyman/handyman-work-L04.json, instruction: "A guard that has been removed or taped back is a defect and the tool must not be used with it bypassed." |
| F14-L04-K02 | 3: "Pause the work, clear the route, and check with the resident or coordinator before continuing" | correct | 3 | shared/safety/F14-L04.json, decision boundaries: "pause the affected work, protect others as appropriate, report promptly and document the reason." Options 0 to 2 (leave equipment in route, move the frame, carry on) are contrary to the lesson. |

## B. Checks outside the changed list, found wrong while reading

| Check | Marked key | Verdict | Option I think is right | Lesson text that decides it |
|---|---|---|---|---|
| F15-L02-K01 | 2: "Rely on your footwear to make the task safe" (unsafe) | wrong | 0: "Stop and tell the supervisor before going further" | shared/induction/F15-L02.json, overview: "stop if a task falls outside your training or authority." Its own rationale says footwear is not used to carry on. This is the same item the KEY-FIX-F08-F15 report left for owner decision. Recommend key 0. |
| F19-L05-K04 | 3: "Securing cords and hoses against trips" (a safe practice, marked as unsafe) | wrong | 2: "Leaving a wet area unmarked while the work continues" | shared/job-management/F19-L05.json, procedure: "Secure cords and hoses against trips, and use site-approved barriers to keep the public out of wet or hazardous zones." Option 3 is the safe practice the lesson requires. Recommend key 2. The rationale is correct about cords but the option it describes is not among the choices. |

## C. Other observations (not key verdicts)

- In every learner lesson opened for this recheck, each worked example's `reasoning` field reads "Not yet written. The source draft gives the scenario only; reasoning needs subject-matter-expert review." The keys above were decided from the instruction, procedure and quality-standard text, not from worked-example reasoning.
- Several stems use a generic template ("What should you do if the task is outside your authorisation or training?") that does not match the item's answer. F15-L06-K01 is one. F15-L02-K01 uses the same stem. Rewording these stems is advisable.
- Keys I read in passing but did not re-verify (not in the changed list): F02-L02-K02 (0), F02-L03-K02 (2), F02-L04-K01 (1), F03-L01-K02 (2). They read as correct.

## D. Decisions made

1. Scope was the 42 unique checks listed in the six KEY-FIX reports, plus F15-L04-K01 and F15-L04-K04 (these were already in KEY-FIX-F15-B and were counted once).
2. Verdict "correct" was given when the marked option is supported by lesson text and every other option is contrary to it. Where the option is the best available but part of its wording is inferred, the row says so.
3. The two out-of-scope wrong keys (section B) were reported, not changed. The request was read-only.
4. The F15-L06-K01 stem mismatch is treated as a stem defect, not a key defect.
5. Owner instruction (coordinator message, later in the session): edit F19-L05-K04 and log it. F15-L02-K01 stays unchanged until the owner decides it. Done as logged in section E.

## E. Edit log (owner-instructed)

| File | Check | Old key | New key | Reason |
|---|---|---|---|---|
| curriculum/assessments/F19-L05.assessment.json | F19-L05-K04 | 3 | 2 | Option 3 ("Securing cords and hoses against trips") is a safe practice, but the question asks for the unsafe alternative. Option 2 ("Leaving a wet area unmarked while the work continues") is the unsafe one, against the procedure's wet-floor controls and site-approved barriers. Rationale rewritten to match: it names option 2 as unsafe and lists securing cords, keeping exits clear and approved barriers as the safe practices. |

Only the `correctIndex` and `rationale` of F19-L05-K04 changed. No other key or file was edited. The F15-L02-K01 key (2) is unchanged.

Validation: the edited JSON parses. `python3 -I /home/claude/work/check.py` reports problemCount 1, the same as before the edit. The remaining problem is check 4 (internal citation marker) in `courses/deck-and-fence-maintenance/NEW-DEK-01.json`, which was already present. No new problems.
