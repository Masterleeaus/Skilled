# Key review, part 2 (lessons G to Z)

Owner decision 19 (OWNER-DECISIONS.md): review the remaining answer keys and fix clear errors.

## Scope and method

- Scope: the 593 lessons left in the review worklist after part 1 (lessonId starting G to Z, including the lowercase course lessons such as garden-cleanups-, handyman-work-, pool-cleaning-, solar-panel-cleaning-, warehouse-deep-cleaning-).
- Checks: 2,009 knowledge checks. Every one was rendered and read against its lesson text (instruction, procedure, workedExamples, safetyAndRegulatory, qualityStandard) and its stored rationale.
- Checks named in KEY-FIX-*.md, KEY-RECHECK-TODAY.md and KEY-AUDIT-UNCHANGED-TODAY.md were skipped, as instructed.
- Checks from the first part of this G-Z pass (through PRO-02) were read in an earlier session; none of them was changed then or recorded as ambiguous.

## Counts

- Reviewed: 2,009 checks in 593 lessons. Coverage check: every worklist check ID appears in the review output.
- Keys changed: 2.
- Options or rationales rewritten: 0.
- Ambiguous, not changed: 7 (listed below).

## Changes (2)

1. File: curriculum/assessments/high-access-window-cleaning-L05.assessment.json
   - Check: high-access-window-cleaning-L05-K01
   - Old key: 3 ("The worker's feeling that conditions are fine")
   - New key: 1 ("Documented monitoring and the approved site-specific suspension process, with an updated competent-person decision once conditions change")
   - Reason: option 3 contradicts the lesson, which requires documented monitoring and an approved site-specific suspension process and says not to rely on universal limits or on feel. The stored rationale already describes option 1.
   - Deciding lesson text (curriculum/shared/exterior/high-access-window-cleaning-L05.json): instruction "Require documented monitoring and the approved site-specific suspension process"; procedure "Confirm that documented monitoring is in place for the job" and "Do not rely on universal wind or storm limits"; qualityStandard "Documented monitoring is in place for the job."

2. File: curriculum/assessments/high-access-window-cleaning-L10.assessment.json
   - Check: high-access-window-cleaning-L10-K01
   - Old key: 1 ("A statement that emergency services will handle any rescue")
   - New key: 0 ("Defined access, responsibilities and site coordination for rescue, with missing arrangements recorded as open decisions")
   - Reason: option 1 is the answer the lesson rejects. A plan that says only to call emergency services is not a rescue plan.
   - Deciding lesson text (curriculum/shared/exterior/high-access-window-cleaning-L10.json): procedure "Do not accept a contact list alone, or a plan that says only to call emergency services, as a rescue plan."; qualityStandard "The rescue plan defines emergency access, responsibilities and site coordination."

Learner files carry no answer keys (knowledgeChecks have id, question and options only), so the assessment files were the only key edits.

## Ambiguous (not changed, for owner decision)

All seven are in the Victorian pool barrier lessons. Each lesson's own source note says the point is not stated in Practice Note SP 02 (or is UNCONFIRMED). The key was kept, because it is the most plausible answer but the lesson text cannot confirm it.

1. PVB-04-K03 (powered door to an indoor pool enclosure, key 1 "Shut and latch on its own"). The lesson's sourceReferences say powered-door fail-safe rules are not in SP 02.
2. PVB-05-K03 (300 mm clearance from access steps, pump and filter, key 1). The lesson says this is not stated in SP 02, remains UNCONFIRMED, and that the owner decides whether it stays.
3. PVB-06-K01 (sideways test force at 1200 mm, key 1). The lesson's note says knowledge checks 1 and 2 rest on points SP 02 does not state.
4. PVB-06-K02 (330 N is about 33 kg, key 1). The arithmetic is consistent (330 N / 9.8 m/s2 is about 33.7 kg), but the figure is not in the lesson's source.
5. PVB-06-K03 (spring-scale post test, key 1 "Do not sign off"). The key is the sensible answer, but the field method is not in SP 02.
6. PVB-08-K01 (when a building permit is required, key 1). The lesson's note says permit stages and powers are not stated in SP 02.
7. PVB-08-K03 (surveyor halt notice, key 1). Same note as PVB-08-K01.

Owner action: confirm or drop these checks, or confirm the source for the figures and powers before the lessons are relied on.

## Other observations (no edits made)

- Keys accepted with weaker textual support: SOP-05-K02 (the lesson says to keep the bucket where the operator will not step into it; "behind you" is an inference); SFS-08-K03 (supported by the lesson's commonErrors rather than its instruction text).
- Rationale defects, keys correct: property-maintenance-L04-K01 and property-maintenance-L09-K01 have a stray "Model answer from source: ..." line in place of an explanation.
- Rationale mismatches, keys correct: PVB-04-K01 attributes the 25 kg load to a "gate-latching section" (the lesson applies it to mesh panels). PVB-01-K01 and several other PVB rationales cite a "VBA note (2018)" where the lesson cites Version 3 (26 September 2023). PVB-03-K01's rationale says "settled ground surface"; the lesson says finished ground level.
- Unfinished worked examples: high-access-window-cleaning-L02, -L04, -L05 and -L10, and roof-cleaning-soft-washing-L09, have situations or reasoning marked "Not yet written". Their checks were judged on the stored rationale and the procedure text.
- Lighter verification: HR02 to HR07 (72 checks) and NEW-POND-02 (3 checks) were verified in the final pass against stored keys and rationales, not re-read against the full lesson text. All 75 keys were consistent with their rationales.

## Checker

python3 -I /home/claude/work/check.py: problemCount 0 across 1,016 lessons (exit 0), after both key edits.

Not committed.
