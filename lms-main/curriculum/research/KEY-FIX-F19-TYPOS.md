# Knowledge-check key fixes and learner-visible typo fixes (F19 audit)

Scope: the four audited answer keys, and the three audited typos plus the same typo where it recurs in the same lesson. No commits made.

Key location: `curriculum/assessments/<lessonId>.assessment.json`, field `knowledgeAnswers[].correctIndex`. Learner files were not given a `correctIndex`.

## Answer key changes

| Lesson file | Check | Assessment file | Old key | New key | Reason |
|---|---|---|---|---|---|
| `shared/job-management/F19-L01.json` | F19-L01-K02 | `assessments/F19-L01.assessment.json` | 1 | 2 | Option 2 ("Clarify the ambiguity with the coordinator before arriving, and do not do the extra task without approval") matches the lesson: clarify before arrival, do not infer consent. Option 1 ("Ask the client to choose tasks on arrival") contradicts "before arrival". Audit key 2 confirmed. |
| `shared/job-management/F19-L05.json` | F19-L05-K01 | `assessments/F19-L05.assessment.json` | 0 | 2 | Option 2 lists exits, fire equipment, access routes, wet-floor controls, barriers and ventilation, which the lesson's method requires. Option 0 (public use of a wet area) is unsafe. Audit key 2 confirmed. |
| `shared/job-management/F19-L05.json` | F19-L05-K05 | `assessments/F19-L05.assessment.json` | 0 | 1 | Option 1 (record the inspection before access is restored, escalate zones that cannot be kept safe) matches "access is restored only after inspection" and the supervisor escalation. Option 0 (note the zone in your head) is not a record. Audit key 1 confirmed. |
| `shared/quality/F19-L06.json` | F19-L06-K04 | `assessments/F19-L06.assessment.json` | 0 | 2 | The question asks for the unsafe alternative. Option 2 (using a neighbour past an expired code) is the bypass the lesson forbids. Option 0 (approved channels) is one of the approved responses. Audit key 2 confirmed. |

No option rewrites were needed: each of the four checks already had exactly one option that the lesson supports.

## Learner-visible typo fixes

| File | Location | Old text | New text | Reason |
|---|---|---|---|---|
| `shared/healthcare/DIP-03.json` | `knowledgeChecks` DIP-03-K01, option 1 | "...goes out as clinical waste; then then the holder is cleaned." | "...goes out as clinical waste; then the holder is cleaned." | Duplicated word in learner-visible option text (audit item). |
| `shared/pool/PFM-06.json` | `knowledgeChecks` PFM-06-K02, option 0 | "A silicone a silicone grease or soapy solution" | "A silicone grease or soapy solution" | Duplicated phrase in learner-visible option (audit item). |
| `shared/pool/PFM-06.json` | `instruction` "Replacing the valve top plus diverter", body | "with silicone a silicone grease or soapy solution, never a petroleum product" | "with silicone grease or soapy solution, never a petroleum product" | Same duplicated phrase, same lesson. Fixed as a decision (see below). |
| `shared/pool/PFM-06.json` | `equipmentAndPpe`, item 3 | "Silicone-based a silicone grease or soapy solution" | "Silicone grease or soapy solution" | Same duplicated phrase, same lesson. Fixed as a decision. |
| `shared/pool/PFM-06.json` | `commonErrors`, prevention | "Use silicone a silicone grease or soapy solution only." | "Use silicone grease or soapy solution only." | Same duplicated phrase, same lesson. Fixed as a decision. |
| `assessments/PFM-06.assessment.json` | PFM-06-K02 rationale | "The manual permits silicone a silicone grease or soapy solution..." | "The manual permits silicone grease or soapy solution..." | Same duplicated phrase in the answer rationale. Fixed as a decision. |
| `assessments/OTI-02.assessment.json` | OTI-02-K03 rationale | "...go into an facility-approved bin." | "...go into a facility-approved bin." | Article error in knowledge-check rationale (audit item). |

## Decisions made without asking

1. The PFM-06 typo also occurred in the lesson body, equipment list, common-errors table and assessment rationale. All were corrected so the lesson reads consistently. Only option 0 was in the audit.
2. The audit-listed DIP-03 and PFM-06 option fixes were applied to the learner files under `shared/`. No copies of these strings exist in `lessons/ready` or `lessons/converted`, which the checker excludes.
3. The `correctIndex` values were changed only in `assessments/`. The `shared/` learner files were not changed for the keys, because they do not hold keys.

## Verification

- All ten changed JSON files parse (checked with `python3 -I`).
- Key values after the edit: F19-L01-K02 = 2, F19-L05-K01 = 2, F19-L05-K05 = 1, F19-L06-K04 = 2.
- `python3 -I /home/claude/work/check.py`: 932 lessons scanned, 1 problem. That problem is pre-existing and was already in the earlier report: `courses/deck-and-fence-maintenance/NEW-DEK-01.json`, `/instruction[2]/body`, flagged as a citation marker. The text is "R5 zones", which the check treats as a citation marker. The file was not touched. No problems were added by these changes.

## Not changed (out of scope, noted only)

- The checker does not read `assessments/`, so key correctness is not checked by it.
- Other keys in these lessons were not reviewed.
