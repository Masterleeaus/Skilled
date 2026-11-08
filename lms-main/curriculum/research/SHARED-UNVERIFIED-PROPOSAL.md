# Shared lessons: proposal for the wider "unverified" wording (2026-11-03)

Status: proposal only. No lesson file was edited for this proposal. The only file changes made in this session are the official-reference fill in `curriculum/shared/quality/PRO-03.json` (see `NULL-URL-DECISIONS.md`). Nothing was committed.

## Scope and method

- Scanned `curriculum/shared/**/*.json` (560 lesson files). `sourceReferences` and `officialReferences` were skipped.
- Learner fields in scope: `instruction`, `procedure`, `workedExamples`, `commonErrors`, `safetyAndRegulatory`, `summary`, `knowledgeChecks` (question and option text).
- Phrases matched: "not yet been confirmed", "has not been confirmed", "has not been checked", "unverified", "not verified", "not re-verified", "not yet confirmed".
- Result: 780 learner-text hits in 336 files, in the scope fields. 44 more hits in other learner fields (`editableTemplates`, `learningOutcomes`, `referencesAtStart`/`referencesAtEnd`, `qualityStandard`, `assessmentRubric`, `audience`, `documentationEvidence`), which are not in the brief's list and are only listed in the decisions.
- The brief's rough figure of 844 covers all fields and all five phrases. The number above is the in-scope count.
- Hits were split into sentences and each status sentence was labelled by a rule (imperative head, cited fact in the same field, claim words before the status clause, or status only). Labels were spot-checked against the text, not checked one by one. Known misses are listed under Limits.
- Distinct status sentences: 633. Each hit can contain more than one.

## Groups

| Group | Pattern | Proposed replacement | Hits (primary label) |
|---|---|---|---|
| G1 | Status note only: "X has not yet been confirmed, so check with the relevant regulator". No claim in the sentence. | Delete the status sentence. | 493 |
| G2 | Claim with an unconfirmed source: a figure, named standard or "the guide suggests" claim, with a status clause. | Delete the unsourced claim and its status clause. | 47 |
| G3 | Safety step with a status clause: an instruction ("Do not publish...", "Check that...") whose tail says a rule is unconfirmed. | Keep the plain step; drop the status clause. | 17 |
| G4 | Sourced fact with a status clause: a cited fact (ATO page, "checked 2026-11-02") followed by a status sentence. | Keep the sourced fact; drop the status sentence. | 73 |
| H | Human decision (see decisions below). | Owner decides. | 150 |

Hits by the proposed outcome:

- Deleted outright (the whole field item is a status note): 50.
- Rewritten (the status sentence or clause is removed; other learner text stays): 580.
- Needs a human decision: 150.

Total: 780 hits.

## Worked examples

G1, delete the status note. File `curriculum/shared/app/SFS-01.json`, `safetyAndRegulatory/0/point`.
- Now: "This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson."
- Proposed: "This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim."

G2, delete the unsourced claim. File `curriculum/shared/app/SFS-02.json`, `instruction/1/body`.
- Now: "...The reference guide suggests keeping an area to about fifty workers, about a thousand visits a day, and no more than twenty qualified workers for a single visit. Treat these as starting points to review, not as Australian standards; the right figures for Titan Zero Field have not yet been confirmed, so check with the relevant regulator before relying on this point."
- Proposed: delete the "reference guide suggests..." sentence and the "Treat these as starting points..." sentence. The rest of the paragraph stays.

G3, keep the plain step. File `curriculum/shared/business/PBP-04.json`, `workedExamples/0/reasoning`.
- Now: "Do not publish the claim until the business can show evidence for it, and the wording is checked against the advertising rules, which have not yet been confirmed for Australia."
- Proposed: "Do not publish the claim until the business can show evidence for it, and the wording is checked against the advertising rules."

G4, keep the sourced fact. File `curriculum/shared/business/BPX-01.json`, `safetyAndRegulatory/0/point`.
- Now: "GST treatment in a profit and loss: the ATO states that a business with GST turnover of $75,000 or more must register for GST (ATO GST registration page, checked 2026-11-02). How GST is shown on the statement has not yet been confirmed here and must be checked with an accountant."
- Proposed: keep the first sentence unchanged. Delete the second sentence.

## Decisions needed from the owner (150 hits)

1. PV electrical notice (108 hits). The "Electrical notice" paragraph in the chemicals and safety lessons carries the status sentence "Whether PV panel cleaning or PV isolation needs a specific licence has not yet been confirmed in every state and territory checked...". Options: (a) delete the sentence, which leaves the lesson's surrounding licence boundary and "refer any electrical fault to a licensed electrician"; (b) replace it with a plain step, such as "Do not clean, isolate or repair PV equipment; refer electrical work to a licensed electrician." Recommendation: (b). This is a safety boundary, so the owner should choose the wording.
2. Knowledge check text (14 hits: options and questions in 14 lessons). Changing an option can invalidate `correctIndex` and the assessment rationale. Each needs a manual edit with the assessment key updated.
3. "Unverified" as a learner rule or task state (13 hits "Hand unresolved hazards... never mark unverified tasks complete", "Do not proceed on an unverified product" and similar; 15 hits with "unverified" used as a word, for example "Treat a claim without a source as unverified"). These are not status claims. Recommendation: keep them, since they tell the learner what to do. The owner should confirm.
4. Conditional status with an instruction (13 hits beginning "Where..." or "If...", for example "Where a requirement has not been checked, name the individual responsible for checking it."). Recommendation: keep the instruction and drop the status clause, not the whole sentence. Owner to confirm.
5. Field scope (44 hits outside the brief's list). Field names: `learningOutcomes`, `audience`, `editableTemplates`, `qualityStandard`, `assessmentRubric`, `referencesAtStart`/`referencesAtEnd`, `documentationEvidence`. Owner to say whether these fields are learner text under the rule.
6. 23 in-scope hits using "unconfirmed", "not confirmed" or "not checked" outside the family. The earlier pass kept these as operational states, for example "the isolator is not confirmed". Owner to confirm the keep decision.
7. Two sentences from the earlier pass need the owner's check: "Figures apply under the state standard." and "The regulation sets the chlorine range at 30 to 50 mg/L." (Earlier pass, `SHARED-REMOVAL-RESUME.md`, decision 8.)

## Limits

- The labels are rule-based. A spot check found misses. For example, in `SFS-02` "The reference guide suggests keeping an area to about fifty workers..." is a claim that should be deleted under G2, but the rule left it as learner text. Expect some G2 claims to be missed. Review those before applying.
- Counts are per hit. A hit can hold several status sentences, so the outcome is the strictest one.
- No file was edited. Applying the proposal would need a backup first and a re-count after.
- Assessment files under `curriculum/assessments/` were not checked for this proposal. Rationale text that quotes the wording may need the same change.
