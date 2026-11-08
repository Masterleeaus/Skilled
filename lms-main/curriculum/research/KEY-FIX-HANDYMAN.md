# Knowledge check key fixes: handyman and property maintenance

Scope: five knowledge checks. The keys live in `curriculum/assessments/<lessonId>.assessment.json`. The learner files (`courses/...` and `shared/safety/...`) were read but not changed, and they contain no `correctIndex`.

Not changed: `property-maintenance-L03` (left for the owner to decide).

## Changes

### 1. handyman-work-L03-K01 (assessments/handyman-work-L03.assessment.json)

Question: An adjustable wrench has splayed jaws. What is the correct action?

- correctIndex: 3 changed to 1.
- Old key (3): "Add extra force to hold the fitting". Using extra force is the failure mode the lesson warns against.
- New key (1): "Tag it out of service, replace it, and record the defect".
- Rationale: unchanged. "Tag the tool out of service and replace it rather than compensating with extra force." It matches the new key.
- Source check: the lesson rejects a wrench with splayed jaws, says a rejected tool is tagged out of service, and says not to compensate with extra force.

### 2. property-maintenance-L02-K01 (assessments/property-maintenance-L02.assessment.json)

Question: Two identical pumps are in different rooms. How should they be recorded?

- correctIndex: 0 changed to 2.
- Old key (0): "As one record and the older pump removed from the register".
- New key (2): "As two separate records with unique identifiers and their own locations and histories".
- Rationale changed. Old: "Model answer from source: Authority to perform task; Safety and specialist referral decisions; Observable evidence of work performed; Record of outstanding risk or follow-up". That text belongs to a different question. New: "Each pump needs its own record with a unique identifier, its location and its own service history. Merging identical items makes it unclear which one was serviced."
- Source check: the lesson says to give each pump a separate identifier linked to its location and its own service history, and not to merge the two records.

### 3. property-maintenance-L10-K01 (assessments/property-maintenance-L10.assessment.json)

Question: A pump has failed three times before its annual service. What is the best change to the plan?

- correctIndex: 1 changed to 2.
- Old key (1): "Remove the pump from the register".
- New key (2): "Add condition-based checks and propose authorised servicing for the recurring fault, with the reason recorded".
- Rationale changed. Old: the same boilerplate "Model answer from source: Authority to perform task; ..." text as item 2. New: "When failures repeat before the annual service, a fixed date is not enough. Add condition-based checks, propose authorised servicing for the recurring fault, and record the reason."
- Source check: the lesson says a calendar-only plan may miss recurring failures, says to replace it with condition-based checks where failures recur, and says to propose authorised servicing where the pattern points to a fault the planned service would not address.

### 4. handyman-work-L04-K01 (assessments/handyman-work-L04.assessment.json)

Question: A worker wants to use a power saw with its guard taped back to see the cut. What is correct?

- correctIndex: unchanged at 0.
- Key 0 ("Treat the guard defect as a stop, do not use the saw, and tag it out") is correct. The lesson says a taped-back guard is a defect and the tool must not be used with it bypassed.
- Rationale changed. Old: "Model answer from source: Stop; obtain a suitable tool and verify services using a competent process before any drilling." That describes a drilling question. New: "A guard that has been taped back is a defect. Treat it as a stop: leave the saw unused and tag it out so it cannot be run with the guard bypassed."

### 5. F14-L04-K02 (assessments/F14-L04.assessment.json)

Question: What should you do if consent, access, safety or authority is unclear?

- correctIndex: unchanged at 3.
- Key 3 ("Pause the work, clear the route, and check with the resident or coordinator before continuing") is correct. The lesson says to pause the affected work when consent, safe access, scope or authority is in doubt, and to report and document.
- Rationale changed. Old: "If a fall occurs the emergency response plan is followed and unsafe movement of the person is avoided." That describes a fall. New: "When consent, access, safety or authority is unclear, the affected work stops. Clear the route and check with the resident or coordinator before going on."

## Decisions made

1. Rationales for items 2 and 3 were rewritten, not only the keys. Their old rationales described a different question and would have contradicted the new keys. The "Model answer from source:" prefix was dropped from rewritten rationales because the new text is a paraphrase, not a quote.
2. Items 4 and 5 kept their keys, which were already correct, and only the rationales were rewritten, as instructed.
3. No option text was changed. Each of the five questions already had a correct option in its existing four options, so no option was rewritten.

## Verification

- All five assessment JSON files parse. The key for each item points at an option whose text matches the intended answer (listed above).
- The learner files contain no `correctIndex`.
- `python3 -I /home/claude/work/check.py`: before the edits, `problemCount` was 1. After the edits it is still 1. The one problem is pre-existing and not in these lessons: check 4 (internal citation marker) in `courses/deck-and-fence-maintenance/NEW-DEK-01.json`, `/instruction[2]/body`. No new problems were added.
- Other copies of these lessons (`lessons/converted/` and `lessons/ready/`) contain no `correctIndex`, so they were not changed.

## Open for the owner

- `property-maintenance-L03`: not changed, as instructed.
- `NEW-DEK-01` citation marker (outside this task): pre-existing check 4 problem.
