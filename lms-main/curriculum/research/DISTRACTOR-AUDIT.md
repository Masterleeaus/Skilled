# Distractor audit: shared knowledge checks

Scope: every lesson JSON under `curriculum/shared/` that has `knowledgeChecks` (560 files; 20 template lessons have none, so 540 lessons and 1569 checks are audited). Date of audit: 2026-11-03.

## Method and decisions

- **Correct answers** come from `curriculum/assessments/<lesson-id>.assessment.json` (`knowledgeAnswers[].correctIndex`), as `curriculum/SCHEMA.md` requires. The learner files carry no answer key. All 1,569 checks matched a key; none had an out-of-range index.
- **Absolute wording**: a distractor containing always, never, ignore, random, regardless, no matter, anything, whatever, any time, any depth, permanently, forever, "all/none of the above", "there is none", or "does not matter". Matched by regex; a human should confirm each row.
- **Joke or throwaway distractor**: a distractor containing expensive, cheap, save time, carry on, hope, keep the peace, does not notice, for the next shift, or half full. Regex match, so some rows may be legitimate plausible misconceptions; confirm each row.
- **Fragment distractor**: a distractor of 3 words or fewer when the correct option has at least 2x its word count plus 2. Chosen so that only glaring length gaps are flagged.
- **Repeats the question**: an option (correct or distractor) where at least 60% of its content words (stopwords removed) also appear in the question, or the option is a verbatim phrase of the question. Lower bound, so near-misses may be missed.
- **Correct option is the longest**: correct option has strictly more characters than every distractor. Reported per check in the counts and as one row per lesson in the issue table, with the check ids listed. Lessons where this holds for every check are marked "every check". Ties are not counted.
- Decision: length is measured in characters for the longest test and in words for the fragment test.
- Decision: the coordinator's later instruction (apply the rewrites, highest severity first) was followed. Absolute wording was done first, then joke options, fragments and repeats. Correct options were never changed, and each edit was checked against the answer key before it was written.
- Decision: edits were exact-string replacements inside the target check object, after re-reading the learner file and its assessment key. Each edit asserted the old option text, the correct option text and the key index before writing.
- Decision: the issue table holds one row per flagged distractor or option, plus one row per lesson for the length cue. Every flag is kept, including ones that may be hard to fix.

## Summary

| Measure | Count |
|---|---|
| Lessons with knowledge checks | 540 |
| Knowledge checks audited | 1569 |
| Checks where the correct option is strictly the longest | 1323 (84%) |
| Lessons where the correct option is the longest in every check | 348 |
| Lessons with at least one correct-longest check | 531 |
| Distractor options with absolute wording | 230 |
| Distractor options that are jokes or throwaways | 96 |
| Distractor options that are fragments (length) | 132 |
| Options that repeat the question (correct or distractor) | 38 |
| Checks with at least one distractor defect (wording, joke, fragment or repeat) | 409 |
| Lessons with at least one defect or length-cue check | 534 |

## Counts per lesson

Columns: Correct longest = checks where the correct option is strictly longest; Abs = distractors with absolute wording; Joke = throwaway distractors; Frag = fragment distractors; Repeat = options repeating the question; Flagged = checks with at least one distractor defect or repeat.

| Lesson | Checks | Correct longest | Abs | Joke | Frag | Repeat | Flagged |
|---|---|---|---|---|---|---|---|
| SFS-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SFS-02 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SFS-03 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| SFS-04 | 3 | 3 | 1 | 0 | 1 | 0 | 2 |
| SFS-05 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| SFS-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SFS-07 | 3 | 3 | 0 | 0 | 2 | 0 | 1 |
| SFS-08 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SFS-09 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| SFS-10 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SFS-11 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| SFS-12 | 3 | 2 | 1 | 0 | 1 | 0 | 1 |
| SFS-13 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SFS-14 | 3 | 3 | 0 | 0 | 2 | 0 | 2 |
| SFS-15 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SFS-16 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| BST-01 | 3 | 3 | 3 | 0 | 0 | 2 | 3 |
| BST-02 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| BST-03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| BST-04 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| BST-05 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| BPX-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| BPX-02 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| BPX-03 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| BPX-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| BPX-05 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| PBP-01 | 3 | 2 | 0 | 1 | 0 | 0 | 1 |
| PBP-02 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| PBP-03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| PBP-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PBP-05 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PBP-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PROC-01 | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| PROC-02 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| PROC-03 | 4 | 4 | 1 | 0 | 0 | 0 | 1 |
| PROC-04 | 4 | 4 | 0 | 0 | 1 | 1 | 1 |
| SHR-FIN-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SHR-FIN-02 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SHR-FIN-03 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SHR-FIN-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SHR-FIN-05 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| CGC-01 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| CGC-02 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| CGC-03 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| CGC-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| CGC-05 | 3 | 2 | 1 | 0 | 1 | 0 | 2 |
| C05-L01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C05-L02 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| F03-L01 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| F03-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F03-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F03-L04 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| F05-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F08-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F13-L02 | 2 | 2 | 0 | 1 | 1 | 0 | 2 |
| F13-L03 | 2 | 1 | 0 | 2 | 0 | 0 | 2 |
| F13-L05 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F16-L01 | 5 | 4 | 2 | 0 | 0 | 0 | 1 |
| F16-L03 | 5 | 4 | 0 | 0 | 0 | 0 | 0 |
| custom-eco-cleaning-products-L03 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| custom-eco-cleaning-products-L10 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CL2-01 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| CL2-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| CL2-03 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| CL2-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| CL2-05 | 3 | 2 | 1 | 1 | 0 | 0 | 1 |
| CL2-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C03-L01 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| C03-L03 | 3 | 3 | 1 | 1 | 0 | 0 | 1 |
| C04-L01 | 3 | 2 | 0 | 1 | 0 | 0 | 1 |
| C04-L03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C14-L01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| C14-L02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C14-L03 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| C14-L04 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| C14-L05 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| C14-L06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ECO-01 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| ECO-02 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| ECO-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ECO-04 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| ECO-05 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| ECO-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| F06-L01 | 3 | 2 | 0 | 2 | 0 | 1 | 1 |
| F06-L02 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| F06-L03 | 3 | 3 | 1 | 1 | 0 | 0 | 1 |
| F06-L04 | 3 | 3 | 1 | 0 | 0 | 1 | 2 |
| F06-L05 | 3 | 2 | 1 | 0 | 1 | 0 | 2 |
| F07-L01 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| F07-L03 | 3 | 3 | 0 | 0 | 2 | 0 | 1 |
| F07-L05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| F10-L03 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| F17-L02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| F17-L03 | 3 | 3 | 0 | 1 | 1 | 0 | 2 |
| HOT-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HOT-02 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| HOT-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HOT-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HOT-05 | 3 | 3 | 0 | 1 | 0 | 1 | 2 |
| HOT-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HOT-07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HOT-08 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HOT-09 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOP-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOP-02 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| SOP-03 | 3 | 2 | 0 | 1 | 0 | 0 | 1 |
| SOP-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SOP-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOP-06 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SOP-07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOP-08 | 3 | 2 | 0 | 1 | 0 | 0 | 1 |
| SOP-09 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SOP-10 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SOP-11 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SOP-12 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SOP-13 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SOP-20 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SOP-21 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SOP-22 | 3 | 2 | 0 | 1 | 1 | 0 | 2 |
| SOP-23 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| SOP-24 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SOP-25 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SOP-26 | 3 | 2 | 1 | 0 | 0 | 1 | 2 |
| SOP-27 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOP-28 | 3 | 2 | 0 | 1 | 0 | 0 | 1 |
| SOP-29 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SOP-30 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TJS-01 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TJS-02 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| TJS-03 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| TJS-04 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| TJS-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-06 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| TJS-07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-08 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| TJS-09 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| TJS-10 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| TJS-11 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-12 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-13 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| TJS-14 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TJS-15 | 3 | 3 | 2 | 0 | 1 | 0 | 3 |
| TJS-16 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| TJS-17 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-18 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| TJS-20 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| TJS-21 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TJS-22 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-23 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| TJS-24 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| TJS-25 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| TJS-26 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-27 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TJS-28 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-29 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-30 | 3 | 1 | 2 | 0 | 0 | 0 | 2 |
| TJS-31 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| TJS-32 | 3 | 3 | 0 | 0 | 0 | 1 | 1 |
| construction-site-cleaning-L01 | 3 | 3 | 2 | 0 | 2 | 1 | 2 |
| construction-site-cleaning-L02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| construction-site-cleaning-L03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| construction-site-cleaning-L04 | 3 | 3 | 1 | 0 | 1 | 0 | 2 |
| construction-site-cleaning-L05 | 3 | 3 | 1 | 0 | 2 | 0 | 2 |
| construction-site-cleaning-L06 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| construction-site-cleaning-L07 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| construction-site-cleaning-L08 | 3 | 3 | 1 | 0 | 1 | 0 | 2 |
| construction-site-cleaning-L10 | 3 | 3 | 1 | 2 | 1 | 0 | 2 |
| construction-site-cleaning-L11 | 3 | 3 | 0 | 0 | 2 | 0 | 1 |
| kitchen-cleaning-L02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| kitchen-cleaning-L05 | 3 | 3 | 1 | 1 | 0 | 0 | 1 |
| kitchen-cleaning-L06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| kitchen-cleaning-L07 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| kitchen-cleaning-L08 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| kitchen-cleaning-L09 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| kitchen-cleaning-L10 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| kitchen-cleaning-L11 | 3 | 3 | 1 | 1 | 0 | 1 | 2 |
| warehouse-deep-cleaning-L05 | 3 | 2 | 1 | 0 | 2 | 0 | 1 |
| warehouse-deep-cleaning-L10 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| F01-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F11-L02 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| F11-L05 | 2 | 2 | 1 | 0 | 1 | 0 | 1 |
| F12-L05 | 2 | 1 | 0 | 1 | 0 | 1 | 1 |
| F14-L01 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F14-L05 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| F15-L05 | 5 | 4 | 0 | 0 | 0 | 0 | 0 |
| SHR-PLN-01 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| C05-L03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| F04-L01 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F04-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F04-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F04-L04 | 2 | 2 | 1 | 1 | 0 | 0 | 1 |
| F08-L04 | 2 | 2 | 1 | 1 | 0 | 0 | 1 |
| F10-L04 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F17-L01 | 5 | 5 | 0 | 1 | 0 | 1 | 2 |
| high-access-window-cleaning-L06 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| high-access-window-cleaning-L02 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| high-access-window-cleaning-L04 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| high-access-window-cleaning-L05 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| high-access-window-cleaning-L10 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| roof-cleaning-soft-washing-L09 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| ACE-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ACE-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ACE-03 | 3 | 2 | 0 | 1 | 0 | 1 | 2 |
| ACE-04 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| BRY-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| BRY-02 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| BRY-03 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| PTB-01 | 3 | 2 | 1 | 0 | 2 | 0 | 2 |
| PTB-02 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PTB-03 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| PTB-04 | 3 | 3 | 0 | 0 | 3 | 0 | 2 |
| PTB-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PTB-06 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| PTB-07 | 3 | 3 | 1 | 0 | 3 | 0 | 3 |
| PTB-08 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PTB-09 | 3 | 2 | 1 | 0 | 0 | 1 | 2 |
| PTB-10 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| PTB-11 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PTB-12 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| PTB-13 | 3 | 3 | 1 | 0 | 1 | 0 | 2 |
| YNS-01 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| YNS-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| YNS-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| YNS-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| FPS-01 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| FPS-02 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| FPS-03 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| FPS-04 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| FPS-05 | 3 | 3 | 1 | 2 | 0 | 0 | 2 |
| FPS-06 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| FPS-07 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| FPS-08 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| GCM-01 | 3 | 3 | 1 | 0 | 0 | 1 | 1 |
| GCM-02 | 3 | 1 | 1 | 1 | 0 | 0 | 2 |
| GCM-03 | 3 | 2 | 0 | 2 | 0 | 0 | 2 |
| HBM-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HBM-02 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HBM-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HBM-04 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| HBM-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HBM-06 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HBM-07 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| HBM-08 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HBM-09 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HBM-10 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HBM-11 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HBM-12 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HBM-13 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| HBM-14 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| HBM-15 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| HBM-16 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| ADA-01 | 3 | 2 | 1 | 0 | 1 | 0 | 2 |
| ADA-02 | 3 | 3 | 1 | 0 | 1 | 0 | 2 |
| ADA-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ADA-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ADA-05 | 3 | 1 | 0 | 0 | 1 | 1 | 2 |
| ADA-06 | 3 | 3 | 2 | 1 | 0 | 0 | 3 |
| DIP-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| DIP-02 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| DIP-03 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HCG-01 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| HCG-02 | 3 | 3 | 0 | 1 | 1 | 0 | 2 |
| HCG-03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| HCG-04 | 3 | 3 | 3 | 0 | 0 | 0 | 2 |
| HCG-05 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| HCG-06 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| HCG-07 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| HCG-08 | 3 | 2 | 2 | 1 | 0 | 0 | 1 |
| HCG-09 | 3 | 0 | 1 | 0 | 0 | 0 | 1 |
| HCG-10 | 3 | 3 | 2 | 0 | 0 | 0 | 1 |
| HCG-11 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| HCG-12 | 3 | 3 | 5 | 1 | 0 | 0 | 3 |
| HCG-13 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HCG-14 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HCG-15 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| HCG-16 | 3 | 2 | 0 | 0 | 2 | 0 | 1 |
| HCG-17 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| HCG-18 | 3 | 1 | 2 | 0 | 0 | 0 | 1 |
| HCG-19 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| HCG-20 | 3 | 2 | 2 | 0 | 1 | 1 | 3 |
| HIP-01 | 3 | 3 | 1 | 3 | 0 | 0 | 3 |
| HIP-02 | 3 | 3 | 1 | 2 | 0 | 1 | 2 |
| HIP-03 | 3 | 3 | 0 | 1 | 1 | 0 | 1 |
| HIP-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HIP-05 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| HLT-01 | 3 | 2 | 0 | 0 | 0 | 1 | 1 |
| HLT-02 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| HLT-03 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| HLT-04 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HLT-05 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| HLT-06 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HLT-07 | 3 | 1 | 1 | 0 | 1 | 0 | 1 |
| HLT-08 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| HLT-09 | 3 | 2 | 0 | 0 | 0 | 2 | 2 |
| HLT-10 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HLT-11 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HLT-12 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HLT-13 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| HLT-14 | 3 | 3 | 1 | 0 | 3 | 0 | 2 |
| OTI-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| OTI-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| OTI-03 | 3 | 3 | 1 | 0 | 2 | 1 | 3 |
| OTI-04 | 3 | 3 | 0 | 0 | 2 | 0 | 1 |
| OTI-05 | 3 | 3 | 1 | 0 | 0 | 1 | 1 |
| C01-L01 | 3 | 1 | 0 | 2 | 0 | 0 | 1 |
| C01-L02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C01-L03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| F01-L01 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F01-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F10-L01 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F15-L01 | 5 | 3 | 1 | 1 | 0 | 1 | 3 |
| F15-L02 | 5 | 4 | 1 | 1 | 0 | 0 | 2 |
| F15-L04 | 5 | 4 | 0 | 1 | 0 | 0 | 1 |
| C02-L01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C02-L02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C02-L03 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| F01-L04 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F05-L01 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F05-L03 | 2 | 2 | 1 | 1 | 0 | 0 | 2 |
| F11-L04 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F19-L01 | 5 | 4 | 0 | 0 | 0 | 0 | 0 |
| F19-L05 | 5 | 4 | 0 | 1 | 0 | 1 | 2 |
| BP-02 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| BP-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| CP-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| CP-02 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| CP-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| CP-04 | 3 | 1 | 0 | 0 | 0 | 1 | 1 |
| F11-L06 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| MP-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| MP-02 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| MP-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SHR-PLN-04 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| SHR-PLN-05 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SOL-05 | 3 | 3 | 0 | 0 | 3 | 0 | 1 |
| SOL-06 | 3 | 2 | 1 | 0 | 1 | 0 | 1 |
| SOL-08 | 3 | 1 | 3 | 0 | 0 | 0 | 2 |
| NHS-01 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| NHS-02 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| NHS-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NHS-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| F10-L02 | 2 | 2 | 2 | 0 | 0 | 0 | 2 |
| F13-L01 | 2 | 2 | 0 | 1 | 1 | 0 | 2 |
| F13-L04 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| F13-L06 | 2 | 2 | 0 | 0 | 1 | 0 | 1 |
| F18-L01 | 2 | 2 | 0 | 0 | 1 | 0 | 1 |
| F18-L02 | 2 | 2 | 3 | 0 | 0 | 0 | 2 |
| F18-L04 | 2 | 2 | 1 | 0 | 1 | 0 | 1 |
| F18-L05 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F18-L06 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F20-L05 | 2 | 0 | 1 | 0 | 0 | 0 | 1 |
| F20-L06 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| MP-05 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| MP-06 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| MP-07 | 3 | 2 | 1 | 0 | 1 | 0 | 2 |
| MP-08 | 3 | 3 | 2 | 0 | 1 | 0 | 2 |
| PRO-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOL-07 | 3 | 3 | 0 | 1 | 1 | 0 | 2 |
| THS-01 | 3 | 3 | 1 | 0 | 2 | 0 | 3 |
| THS-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| THS-03 | 3 | 3 | 1 | 0 | 2 | 0 | 2 |
| THS-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| THS-05 | 3 | 3 | 3 | 0 | 1 | 0 | 2 |
| THS-06 | 3 | 2 | 1 | 0 | 1 | 0 | 2 |
| THS-07 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| additional-specialist-services-L01 | 2 | 2 | 0 | 0 | 0 | 1 | 1 |
| garden-cleanups-L06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| garden-cleanups-L07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| garden-cleanups-L09 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| garden-cleanups-L10 | 3 | 3 | 0 | 0 | 0 | 1 | 1 |
| PCS-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PCS-02 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| PCS-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PFM-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PFM-02 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PFM-03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| PFM-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PFM-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PFM-06 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PHM-01 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PHM-02 | 3 | 2 | 0 | 0 | 0 | 1 | 1 |
| PHM-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PHM-04 | 3 | 2 | 0 | 1 | 0 | 0 | 1 |
| PHM-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PHM-06 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| PHM-07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PHM-08 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| PHM-09 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| POM-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| POM-02 | 3 | 2 | 2 | 1 | 0 | 0 | 2 |
| POM-03 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| POM-04 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| PSA-01 | 3 | 0 | 3 | 0 | 0 | 0 | 2 |
| PSA-02 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| PSA-03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| PSA-04 | 3 | 1 | 0 | 0 | 2 | 0 | 1 |
| PSA-05 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| PSA-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| PSA-07 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| PSA-08 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PSA-09 | 3 | 1 | 1 | 0 | 0 | 0 | 1 |
| PSA-10 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| PSA-11 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| PSA-12 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| PSA-13 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| PSA-14 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| PSA-15 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| PSA-16 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| PVB-01 | 3 | 1 | 1 | 0 | 1 | 0 | 2 |
| PVB-02 | 3 | 2 | 0 | 0 | 0 | 1 | 1 |
| PVB-03 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| PVB-04 | 3 | 1 | 1 | 0 | 4 | 0 | 2 |
| PVB-05 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| PVB-06 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| PVB-07 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| PVB-08 | 3 | 2 | 2 | 0 | 0 | 0 | 2 |
| C09-L01 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| C09-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| C09-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F09-L01 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F09-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F09-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F09-L04 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F09-L05 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F10-L05 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F19-L06 | 5 | 4 | 0 | 0 | 0 | 0 | 0 |
| PRO-03 | 3 | 3 | 0 | 0 | 4 | 0 | 2 |
| S12-L03 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| S12-L08 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| additional-specialist-services-L12 | 2 | 2 | 0 | 0 | 0 | 1 | 1 |
| BP-05 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| F11-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| MP-04 | 3 | 2 | 1 | 0 | 1 | 0 | 2 |
| PRO-01 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| SOL-03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| C10-L01 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| C10-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| C10-L03 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F02-L01 | 2 | 2 | 1 | 1 | 0 | 0 | 1 |
| F02-L02 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| F02-L03 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F02-L04 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F08-L01 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F08-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F08-L05 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F14-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F14-L04 | 2 | 2 | 0 | 1 | 0 | 0 | 1 |
| F15-L03 | 5 | 5 | 1 | 1 | 0 | 0 | 2 |
| F15-L06 | 5 | 5 | 1 | 0 | 0 | 1 | 2 |
| F17-L04 | 5 | 5 | 0 | 1 | 0 | 0 | 1 |
| F17-L05 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| RAS-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| RAS-02 | 3 | 2 | 0 | 0 | 1 | 0 | 1 |
| RAS-03 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| RAS-04 | 3 | 1 | 0 | 1 | 0 | 0 | 1 |
| RAS-05 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| RAS-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| RAS-07 | 3 | 2 | 0 | 2 | 0 | 0 | 1 |
| RAS-08 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| RAS-09 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| RAS-10 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| RAS-11 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| RAS-12 | 3 | 3 | 1 | 0 | 0 | 1 | 2 |
| RAS-13 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| RAS-14 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| RAS-15 | 3 | 3 | 1 | 1 | 0 | 0 | 2 |
| RAS-16 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| S14-L03 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| S14-L04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| S14-L05 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| S14-L07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| S14-L08 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| WAH-01 | 3 | 3 | 2 | 0 | 0 | 0 | 1 |
| WAH-02 | 3 | 3 | 0 | 1 | 0 | 0 | 1 |
| WAH-03 | 3 | 2 | 0 | 0 | 0 | 1 | 1 |
| WAH-04 | 3 | 3 | 0 | 0 | 2 | 1 | 2 |
| WAH-05 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| WAH-06 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| WAH-07 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| WAH-08 | 3 | 3 | 1 | 1 | 0 | 0 | 2 |
| WAH-09 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| WAH-10 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| WAH-11 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HSE-01 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HSE-02 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HSE-03 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| HSE-04 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| HSE-05 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| HSE-06 | 3 | 3 | 1 | 0 | 1 | 0 | 2 |
| HSE-07 | 3 | 3 | 0 | 0 | 2 | 0 | 2 |
| HSE-08 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| HSE-09 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| HSE-10 | 3 | 2 | 0 | 0 | 2 | 0 | 2 |
| SAH-01 | 3 | 3 | 0 | 0 | 0 | 1 | 1 |
| SAH-02 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SAH-03 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SAH-04 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SAH-05 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SAH-06 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SAH-07 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SAH-08 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| SAH-09 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| SAH-10 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| SAH-11 | 3 | 2 | 1 | 0 | 1 | 0 | 1 |
| BP-01 | 3 | 2 | 1 | 0 | 0 | 0 | 1 |
| BP-03 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| BP-06 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| F11-L01 | 2 | 2 | 0 | 0 | 1 | 0 | 1 |
| SHR-PLN-02 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| SHR-PLN-03 | 4 | 3 | 0 | 0 | 0 | 0 | 0 |
| SOL-01 | 3 | 3 | 1 | 1 | 0 | 0 | 2 |
| SOL-02 | 3 | 3 | 0 | 0 | 2 | 0 | 1 |
| SOL-04 | 3 | 2 | 1 | 1 | 1 | 0 | 2 |
| additional-specialist-services-L04 | 2 | 2 | 0 | 0 | 0 | 1 | 1 |
| BP-07 | 3 | 3 | 0 | 0 | 1 | 0 | 1 |
| F12-L01 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F12-L02 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| F12-L03 | 2 | 2 | 0 | 1 | 2 | 0 | 2 |
| F12-L04 | 2 | 2 | 0 | 0 | 2 | 0 | 1 |
| F12-L06 | 2 | 2 | 1 | 0 | 0 | 0 | 1 |
| TLD-01 | 3 | 3 | 2 | 0 | 0 | 0 | 1 |
| TLD-02 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TLD-03 | 3 | 3 | 0 | 0 | 2 | 0 | 2 |
| TLD-04 | 3 | 2 | 2 | 0 | 0 | 0 | 2 |
| TLD-05 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| TLD-06 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| TLD-07 | 3 | 3 | 2 | 0 | 1 | 0 | 3 |
| TLD-08 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| TLD-09 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| TLD-10 | 3 | 3 | 0 | 0 | 2 | 0 | 1 |
| TLD-11 | 3 | 2 | 2 | 0 | 0 | 0 | 2 |
| additional-specialist-services-L10 | 2 | 2 | 0 | 0 | 0 | 1 | 1 |
| CPV-01 | 3 | 3 | 2 | 0 | 0 | 0 | 1 |
| CPV-02 | 3 | 3 | 2 | 0 | 0 | 0 | 2 |
| CPV-03 | 3 | 2 | 1 | 1 | 1 | 0 | 2 |
| CPV-04 | 3 | 3 | 2 | 0 | 0 | 0 | 1 |
| CPV-05 | 3 | 3 | 3 | 1 | 0 | 0 | 3 |
| CPV-06 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |
| CPV-07 | 3 | 2 | 2 | 1 | 0 | 0 | 2 |
| CPV-08 | 3 | 3 | 1 | 0 | 0 | 0 | 1 |

## After the edits

Distractors were rewritten in place (see the change log). Correct options and the answer key were not changed. Learner files were edited only in `knowledgeChecks[].options`; `correctIndex` lives in the assessment files, which were not edited.

| Measure | Before | After |
|---|---|---|
| Distractors with absolute wording | 230 | 0 |
| Joke or throwaway distractors | 96 | 0 |
| Fragment distractors | 132 | 0 |
| Distractors that repeat the question | 30 | 0 |
| Checks where the correct option is strictly the longest | 1323 | 1229 |
| Correct options that still repeat the question wording (not changed) | 8 | 8 |

Option changes applied: 470 (in 303 learner files). Each changed file parses as JSON. `python3 -I /home/claude/work/check.py` reports problemCount 1 before and after; that one problem is an existing check-4 finding (internal code in learner text) and is not from these edits.

The correct-longest cue is only partly fixed. Fragments were lengthened, which removed the cue in the checks they covered, but correct options were left as they are, as instructed. Lessons where the correct option is still the longest in every check are listed in the counts table above.

## Issue table

One row per flagged distractor or option. Length-cue rows are one per lesson and list the check ids. Fix text is the suggested fix; the fixes were then applied, and the change log at the end records each edit.

| Lesson | Check id | Issue | Suggested fix (text only) |
|---|---|---|---|
| SFS-04 | SFS-04-K02 | Absolute wording in distractor A ("Because the scheduler then ignores skills"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| SFS-04 | SFS-04-K03 | Fragment distractor A ("Customer bank details", 3 words) is much shorter than the correct option (9 words) | Expand distractor A to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-07 | SFS-07-K01 | Fragment distractor A ("Finished", 1 words) is much shorter than the correct option (7 words) | Expand distractor A to roughly 5 to 9 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-07 | SFS-07-K01 | Fragment distractor C ("Deleted", 1 words) is much shorter than the correct option (7 words) | Expand distractor C to roughly 5 to 9 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-09 | SFS-09-K01 | Fragment distractor B ("Delete the visit", 3 words) is much shorter than the correct option (13 words) | Expand distractor B to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-11 | SFS-11-K02 | Absolute wording in distractor C ("A preferred worker is always excluded"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SFS-11 | SFS-11-K03 | Absolute wording in distractor B ("A random worker from the list"): "random" makes it easy to rule out | Reword distractor B to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| SFS-12 | SFS-12-K01 | Absolute wording in distractor B ("Yes, always"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SFS-12 | SFS-12-K01 | Fragment distractor B ("Yes, always", 2 words) is much shorter than the correct option (6 words) | Expand distractor B to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-14 | SFS-14-K01 | Fragment distractor C ("Delete the job", 3 words) is much shorter than the correct option (11 words) | Expand distractor C to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-14 | SFS-14-K03 | Fragment distractor C ("Cancels the job", 3 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| SFS-15 | SFS-15-K03 | Absolute wording in distractor C ("Always the change entered from a computer"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| BST-01 | BST-01-K01 | Repeats the question wording (correct option: "$170, the median of all five jobs"; overlap 0.6) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| BST-01 | BST-01-K01 | Repeats the question wording (distractor C: "$1,100, the largest job"; overlap 0.67) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| BST-01 | BST-01-K02 | Absolute wording in distractor A ("Because it always matches the middle job"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| BST-01 | BST-01-K02 | Absolute wording in distractor B ("Because it ignores large jobs, which keeps the estimate realistic"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| BST-01 | BST-01-K03 | Absolute wording in distractor B ("Quote the mean from now on without checking anything else"): "anything" makes it easy to rule out | Reword distractor B to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| BST-03 | BST-03-K03 | Absolute wording in distractor C ("Throw the result away because 50 per cent can never be right"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| BPX-02 | BPX-02-K02 | Fragment distractor D ("In long-term liabilities", 3 words) is much shorter than the correct option (8 words) | Expand distractor D to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| BPX-04 | BPX-04-K03 | Absolute wording in distractor C ("Ignore storage, because the plan does not mention it"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| BPX-05 | BPX-05-K03 | Absolute wording in distractor D ("A fixed number that must always be above 2.0"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| PBP-01 | PBP-01-K03 | Joke or throwaway distractor C ("Its descriptions and prices should be copied to save time"): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| PBP-02 | PBP-02-K03 | Fragment distractor D ("The chemical supplier", 3 words) is much shorter than the correct option (10 words) | Expand distractor D to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PBP-03 | PBP-03-K01 | Absolute wording in distractor B ("At whatever the client is willing to pay"): "whatever" makes it easy to rule out | Reword distractor B to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| PBP-05 | PBP-05-K02 | Fragment distractor D ("Delete the entry", 3 words) is much shorter than the correct option (12 words) | Expand distractor D to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| PROC-03 | PROC-03-K04 | Absolute wording in distractor B ("The lowest price seen in any market at any time"): "any time" makes it easy to rule out | Reword distractor B to drop "any time" and state a specific, plausible wrong action or condition for this lesson. |
| PROC-04 | PROC-04-K01 | Fragment distractor B ("Purchase price alone", 3 words) is much shorter than the correct option (8 words) | Expand distractor B to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| PROC-04 | PROC-04-K01 | Repeats the question wording (distractor B: "Purchase price alone"; overlap 0.67) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| SHR-FIN-02 | SHR-FIN-02-K02 | Absolute wording in distractor C ("A tax agent can ignore it if the amounts are round"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| SHR-FIN-03 | SHR-FIN-03-K03 | Absolute wording in distractor A ("It applies to every purchase, whatever its size or the business's turnover"): "whatever" makes it easy to rule out | Reword distractor A to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| CGC-01 | CGC-01-K03 | Fragment distractor A ("Left undefined", 2 words) is much shorter than the correct option (8 words) | Expand distractor A to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| CGC-05 | CGC-05-K01 | Absolute wording in distractor A ("Ignored if no one was hurt"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| CGC-05 | CGC-05-K03 | Fragment distractor C ("Replace the policy", 3 words) is much shorter than the correct option (8 words) | Expand distractor C to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| C05-L02 | C05-L02-K03 | Joke or throwaway distractor C ("Dispense it into a drinking bottle to save time"): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F03-L04 | F03-L04-K02 | Absolute wording in distractor B ("Mop it up with whatever absorbent is nearby"): "whatever" makes it easy to rule out | Reword distractor B to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F13-L02 | F13-L02-K01 | Joke or throwaway distractor B ("Whether it is cheaper."): "cheap" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F13-L02 | F13-L02-K02 | Fragment distractor C ("Only the price.", 3 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| F13-L03 | F13-L03-K01 | Joke or throwaway distractor C ("Use it and hope the surface is clean."): "hope" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F13-L03 | F13-L03-K02 | Joke or throwaway distractor C ("Because mixing is cheaper if done at the end of the day."): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F16-L01 | F16-L01-K03 | Absolute wording in distractor A ("Use a descaler, since it cuts through anything"): "anything" makes it easy to rule out | Reword distractor A to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| F16-L01 | F16-L01-K03 | Absolute wording in distractor C ("Use the nearest bottle, whatever its category"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| CL2-01 | CL2-01-K03 | Absolute wording in distractor C ("It is always wrong and should be ignored."): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CL2-03 | CL2-03-K01 | Joke or throwaway distractor A ("Carry on carefully, because the task is short."): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| CL2-04 | CL2-04-K03 | Absolute wording in distractor C ("Whenever the customer asks, whatever the condition of the carpet."): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| CL2-05 | CL2-05-K03 | Joke or throwaway distractor A ("Raise it while the centre broom is turning, to save time."): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| CL2-05 | CL2-05-K03 | Absolute wording in distractor C ("Raise it at any time, because the broom is shielded."): "any time" makes it easy to rule out | Reword distractor C to drop "any time" and state a specific, plausible wrong action or condition for this lesson. |
| C03-L01 | C03-L01-K01 | Joke or throwaway distractor B ("Because the tap is more expensive"): "expensive" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| C03-L03 | C03-L03-K01 | Absolute wording in distractor A ("Ignore it, because the basin is nearly finished"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| C03-L03 | C03-L03-K01 | Joke or throwaway distractor B ("Rinse the brush and carry on"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| C04-L01 | C04-L01-K01 | Joke or throwaway distractor A ("Because the sanitiser is more expensive on dirt"): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| C14-L03 | C14-L03-K03 | Fragment distractor A ("Test it quickly", 3 words) is much shorter than the correct option (9 words) | Expand distractor A to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| C14-L04 | C14-L04-K01 | Fragment distractor B ("Pull harder", 2 words) is much shorter than the correct option (11 words) | Expand distractor B to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| C14-L05 | C14-L05-K02 | Fragment distractor A ("Reposition it yourself", 3 words) is much shorter than the correct option (8 words) | Expand distractor A to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| ECO-01 | ECO-01-K02 | Joke or throwaway distractor B ("Remove the plug while the machine is still running to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| ECO-02 | ECO-02-K01 | Joke or throwaway distractor C ("Using the same cloth for every area to save time"): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F06-L01 | F06-L01-K03 | Joke or throwaway distractor B ("Wear PPE and carry on"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F06-L01 | F06-L01-K03 | Joke or throwaway distractor C ("Record it and leave it for the next shift"): "for the next shift" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F06-L01 | F06-L01-K03 | Repeats the question wording (correct option: "Remove the hazard, if authorised"; overlap 0.67) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| F06-L02 | F06-L02-K01 | Joke or throwaway distractor A ("They are cheaper and should be saved for the floor"): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F06-L03 | F06-L03-K03 | Absolute wording in distractor A ("Mixed products are always cheaper"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| F06-L03 | F06-L03-K03 | Joke or throwaway distractor A ("Mixed products are always cheaper"): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F06-L04 | F06-L04-K01 | Absolute wording in distractor A ("Because the floor is always the cleanest surface"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| F06-L04 | F06-L04-K02 | Repeats the question wording (distractor B: "Use the contact time from a different product"; overlap 0.6) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| F06-L05 | F06-L05-K01 | Absolute wording in distractor A ("It makes the inspection faster than checking randomly"): "random" makes it easy to rule out | Reword distractor A to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| F06-L05 | F06-L05-K03 | Fragment distractor C ("The floor", 2 words) is much shorter than the correct option (6 words) | Expand distractor C to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| F07-L03 | F07-L03-K03 | Fragment distractor A ("The client's car", 3 words) is much shorter than the correct option (8 words) | Expand distractor A to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| F07-L03 | F07-L03-K03 | Fragment distractor C ("Only the floor", 3 words) is much shorter than the correct option (8 words) | Expand distractor C to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| F10-L03 | F10-L03-K03 | Absolute wording in distractor C ("Never after the first assessment"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| F17-L03 | F17-L03-K02 | Joke or throwaway distractor A ("It is cheaper"): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F17-L03 | F17-L03-K03 | Fragment distractor C ("Working faster", 2 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| HOT-02 | HOT-02-K03 | Fragment distractor C ("Vacuum the floor", 3 words) is much shorter than the correct option (8 words) | Expand distractor C to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| HOT-05 | HOT-05-K02 | Repeats the question wording (distractor A: "Use it, because the stain is small and on the top sheet"; overlap 0.67) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| HOT-05 | HOT-05-K03 | Joke or throwaway distractor A ("Dragging it across the floor to the bed to save time"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HOT-08 | HOT-08-K03 | Absolute wording in distractor A ("Random, so that different things are checked each time"): "random" makes it easy to rule out | Reword distractor A to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-03 | SOP-03-K02 | Joke or throwaway distractor C ("To show which products are the most expensive"): "expensive" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| SOP-04 | SOP-04-K02 | Absolute wording in distractor A ("Random strokes across the room, finishing at the door"): "random" makes it easy to rule out | Reword distractor A to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-06 | SOP-06-K02 | Absolute wording in distractor B ("Never, so the job keeps moving"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-08 | SOP-08-K03 | Joke or throwaway distractor A ("Stand on a chair and carry on carefully"): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| SOP-09 | SOP-09-K03 | Absolute wording in distractor A ("The smell is always offensive to clients"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-10 | SOP-10-K01 | Absolute wording in distractor A ("Nothing, because gloves always protect the hands"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-11 | SOP-11-K02 | Absolute wording in distractor A ("Pads of a single colour are always used on every floor"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-13 | SOP-13-K02 | Absolute wording in distractor C ("Randomly across the whole stain at once"): "random" makes it easy to rule out | Reword distractor C to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-20 | SOP-20-K02 | Absolute wording in distractor C ("It is an offence to leave any liquid on a floor, whatever the amount"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-22 | SOP-22-K01 | Fragment distractor A ("Sunglasses only", 2 words) is much shorter than the correct option (10 words) | Expand distractor A to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| SOP-22 | SOP-22-K02 | Joke or throwaway distractor D ("Cover it with leaves and carry on picking"): "carry on" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| SOP-23 | SOP-23-K02 | Fragment distractor C ("The sharps container", 3 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| SOP-24 | SOP-24-K01 | Absolute wording in distractor A ("Vacuum at random points, starting from the middle of the stair"): "random" makes it easy to rule out | Reword distractor A to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-25 | SOP-25-K02 | Absolute wording in distractor C ("They are sealed, so they must never be wiped"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-26 | SOP-26-K01 | Absolute wording in distractor A ("Nothing, because unplugging is always allowed"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SOP-26 | SOP-26-K02 | Repeats the question wording (correct option: "The equipment is sensitive to dust, water and silicone-based polish"; overlap 0.71) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| SOP-28 | SOP-28-K03 | Joke or throwaway distractor C ("Cover the spill with paper towels and leave it for the next shift"): "for the next shift" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| SOP-30 | SOP-30-K03 | Absolute wording in distractor A ("Ignore it because you cleaned the room recently"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-01 | TJS-01-K02 | Absolute wording in distractor A ("Empty it, since rubbish is always in scope"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-02 | TJS-02-K02 | Absolute wording in distractor B ("Ignore it, because practice runs are not assessed"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-03 | TJS-03-K03 | Fragment distractor B ("The client's computer", 3 words) is much shorter than the correct option (11 words) | Expand distractor B to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| TJS-10 | TJS-10-K02 | Absolute wording in distractor A ("Thrown from a distance so you never lean in"): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-13 | TJS-13-K01 | Absolute wording in distractor B ("Because high dusting is always paid more"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-14 | TJS-14-K01 | Absolute wording in distractor B ("Paper is never dusted"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-15 | TJS-15-K01 | Absolute wording in distractor C ("Because blinds are always wet"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-15 | TJS-15-K02 | Absolute wording in distractor C ("Half lowered at random"): "random" makes it easy to rule out | Reword distractor C to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-15 | TJS-15-K03 | Fragment distractor B ("Count the slats", 3 words) is much shorter than the correct option (12 words) | Expand distractor B to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| TJS-18 | TJS-18-K02 | Absolute wording in distractor C ("Never during dusting"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-20 | TJS-20-K01 | Absolute wording in distractor A ("Because the floor is always the easiest surface to clean"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-20 | TJS-20-K02 | Absolute wording in distractor B ("Dirty mirrors, so polish them again before anything else"): "anything" makes it easy to rule out | Reword distractor B to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-21 | TJS-21-K02 | Absolute wording in distractor B ("Because the taps are never part of the floor clean"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-25 | TJS-25-K03 | Absolute wording in distractor C ("Never, as long as the floor cleaner is added at the start"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-27 | TJS-27-K03 | Absolute wording in distractor C ("Because the floor must never be touched by a mop head"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-30 | TJS-30-K02 | Absolute wording in distractor B ("It is left as it was found, whatever the lock state"): "whatever" makes it easy to rule out | Reword distractor B to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-30 | TJS-30-K03 | Absolute wording in distractor C ("At the start of every room, whatever its state"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| TJS-32 | TJS-32-K01 | Repeats the question wording (correct option: "Ten passes over the first three metres, then five each way across the mat"; overlap 0.6) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| construction-site-cleaning-L01 | construction-site-cleaning-L01-K02 | Fragment distractor C ("All contamination", 2 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L01 | construction-site-cleaning-L01-K03 | Absolute wording in distractor A ("There is none"): "there is none" makes it easy to rule out | Reword distractor A to drop "there is none" and state a specific, plausible wrong action or condition for this lesson. |
| construction-site-cleaning-L01 | construction-site-cleaning-L01-K03 | Fragment distractor A ("There is none", 3 words) is much shorter than the correct option (11 words) | Expand distractor A to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L01 | construction-site-cleaning-L01-K03 | Absolute wording in distractor B ("A cleared room is always presentable"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| construction-site-cleaning-L01 | construction-site-cleaning-L01-K03 | Repeats the question wording (distractor B: "A cleared room is always presentable"; overlap 0.75) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| construction-site-cleaning-L04 | construction-site-cleaning-L04-K02 | Fragment distractor C ("A household vacuum", 3 words) is much shorter than the correct option (11 words) | Expand distractor C to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L04 | construction-site-cleaning-L04-K03 | Absolute wording in distractor B ("Never, once you start"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| construction-site-cleaning-L05 | construction-site-cleaning-L05-K02 | Absolute wording in distractor A ("Nothing, water is always safe"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| construction-site-cleaning-L05 | construction-site-cleaning-L05-K03 | Fragment distractor B ("Any cleaner", 2 words) is much shorter than the correct option (7 words) | Expand distractor B to roughly 5 to 9 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L05 | construction-site-cleaning-L05-K03 | Fragment distractor C ("The client", 2 words) is much shorter than the correct option (7 words) | Expand distractor C to roughly 5 to 9 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L06 | construction-site-cleaning-L06-K01 | Joke or throwaway distractor A ("Because it is the most expensive"): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| construction-site-cleaning-L08 | construction-site-cleaning-L08-K02 | Absolute wording in distractor A ("Because uncured surfaces are always cleaner"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| construction-site-cleaning-L08 | construction-site-cleaning-L08-K03 | Fragment distractor C ("Approves any product", 3 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L10 | construction-site-cleaning-L10-K02 | Joke or throwaway distractor C ("By the cheapest product"): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| construction-site-cleaning-L10 | construction-site-cleaning-L10-K03 | Joke or throwaway distractor A ("Before the inspection, to save time"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| construction-site-cleaning-L10 | construction-site-cleaning-L10-K03 | Absolute wording in distractor B ("Never"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| construction-site-cleaning-L10 | construction-site-cleaning-L10-K03 | Fragment distractor B ("Never", 1 words) is much shorter than the correct option (9 words) | Expand distractor B to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L11 | construction-site-cleaning-L11-K02 | Fragment distractor A ("Laboratory clearance", 2 words) is much shorter than the correct option (9 words) | Expand distractor A to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| construction-site-cleaning-L11 | construction-site-cleaning-L11-K02 | Fragment distractor B ("Regulatory sign-off", 2 words) is much shorter than the correct option (9 words) | Expand distractor B to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| kitchen-cleaning-L05 | kitchen-cleaning-L05-K02 | Absolute wording in distractor A ("Mixing is always more expensive"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| kitchen-cleaning-L05 | kitchen-cleaning-L05-K02 | Joke or throwaway distractor A ("Mixing is always more expensive"): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| kitchen-cleaning-L07 | kitchen-cleaning-L07-K03 | Joke or throwaway distractor A ("Make a judgement and carry on"): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| kitchen-cleaning-L11 | kitchen-cleaning-L11-K01 | Joke or throwaway distractor A ("Sign it to keep the peace"): "keep the peace" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| kitchen-cleaning-L11 | kitchen-cleaning-L11-K01 | Repeats the question wording (distractor C: "Sign it and ask the supervisor to check later"; overlap 0.6) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| kitchen-cleaning-L11 | kitchen-cleaning-L11-K02 | Absolute wording in distractor B ("The supervisor only, regardless of who did the work"): "regardless" makes it easy to rule out | Reword distractor B to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| warehouse-deep-cleaning-L05 | warehouse-deep-cleaning-L05-K02 | Fragment distractor A ("Move it yourself", 3 words) is much shorter than the correct option (13 words) | Expand distractor A to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| warehouse-deep-cleaning-L05 | warehouse-deep-cleaning-L05-K02 | Absolute wording in distractor C ("Ignore it"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| warehouse-deep-cleaning-L05 | warehouse-deep-cleaning-L05-K02 | Fragment distractor C ("Ignore it", 2 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| F11-L02 | F11-L02-K02 | Absolute wording in distractor B ("Ignore it to keep the quote low."): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F11-L05 | F11-L05-K01 | Absolute wording in distractor B ("Ignore the question."): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F11-L05 | F11-L05-K01 | Fragment distractor B ("Ignore the question.", 3 words) is much shorter than the correct option (14 words) | Expand distractor B to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| F12-L05 | F12-L05-K01 | Joke or throwaway distractor B ("Hope the recipient does not notice."): "hope" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F12-L05 | F12-L05-K01 | Repeats the question wording (distractor C: "Send the correct details to the wrong person as well."; overlap 0.67) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| F14-L01 | F14-L01-K02 | Joke or throwaway distractor B ("Carry on, since the person did not object"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F14-L05 | F14-L05-K01 | Absolute wording in distractor A ("Using a loud voice and simple words for everyone regardless of need"): "regardless" makes it easy to rule out | Reword distractor A to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| SHR-PLN-01 | SHR-PLN-01-K01 | Absolute wording in distractor A ("Yes, it always comes out"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| F04-L04 | F04-L04-K01 | Joke or throwaway distractor A ("That tools are left wet in a sealed bucket overnight to save time"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F04-L04 | F04-L04-K01 | Absolute wording in distractor D ("That a fault is ignored if the machine still works"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F08-L04 | F08-L04-K01 | Joke or throwaway distractor B ("Whether one mop head can serve a bathroom and a kitchen to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F08-L04 | F08-L04-K01 | Absolute wording in distractor D ("That the equipment is never cleaned or dried"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| F17-L01 | F17-L01-K01 | Joke or throwaway distractor D ("Whether a toilet-area tool can be used in the kitchen to save time"): "save time" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F17-L01 | F17-L01-K05 | Repeats the question wording (distractor B: "No record is needed for tools"; overlap 0.67) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| ACE-03 | ACE-03-K01 | Repeats the question wording (distractor C: "Clients only pay for admin time"; overlap 0.6) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| ACE-03 | ACE-03-K03 | Joke or throwaway distractor B ("The ideal week you hope to have"): "hope" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| BRY-02 | BRY-02-K02 | Absolute wording in distractor C ("A general word can never be used by any other business"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| BRY-03 | BRY-03-K01 | Absolute wording in distractor B ("A brand name the client has never seen explained"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| PTB-01 | PTB-01-K02 | Absolute wording in distractor B ("Ignore the enquiry"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| PTB-01 | PTB-01-K02 | Fragment distractor B ("Ignore the enquiry", 3 words) is much shorter than the correct option (10 words) | Expand distractor B to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-01 | PTB-01-K03 | Fragment distractor C ("Competitors' prices only", 3 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-02 | PTB-02-K01 | Fragment distractor C ("A discount offer", 3 words) is much shorter than the correct option (12 words) | Expand distractor C to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-03 | PTB-03-K02 | Joke or throwaway distractor B ("The most expensive programme on the menu"): "expensive" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| PTB-04 | PTB-04-K01 | Fragment distractor B ("Buying more advertising", 3 words) is much shorter than the correct option (13 words) | Expand distractor B to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-04 | PTB-04-K01 | Fragment distractor C ("Lowering all prices", 3 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-04 | PTB-04-K03 | Fragment distractor A ("The client's height", 3 words) is much shorter than the correct option (10 words) | Expand distractor A to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-06 | PTB-06-K01 | Fragment distractor B ("A discount code", 3 words) is much shorter than the correct option (8 words) | Expand distractor B to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-07 | PTB-07-K01 | Absolute wording in distractor C ("Test random advertising"): "random" makes it easy to rule out | Reword distractor C to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| PTB-07 | PTB-07-K02 | Fragment distractor A ("Age only", 2 words) is much shorter than the correct option (13 words) | Expand distractor A to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-07 | PTB-07-K03 | Fragment distractor A ("Kept indefinitely", 2 words) is much shorter than the correct option (10 words) | Expand distractor A to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-07 | PTB-07-K03 | Fragment distractor C ("Doubled in time", 3 words) is much shorter than the correct option (10 words) | Expand distractor C to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-08 | PTB-08-K01 | Fragment distractor C ("Unsupervised independent training", 3 words) is much shorter than the correct option (14 words) | Expand distractor C to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-09 | PTB-09-K01 | Absolute wording in distractor C ("Whatever members will pay on day one"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| PTB-09 | PTB-09-K03 | Repeats the question wording (distractor B: "90 units, the same as one-to-one"; overlap 0.67) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| PTB-10 | PTB-10-K01 | Absolute wording in distractor A ("Always the trainer's fault"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| PTB-11 | PTB-11-K02 | Fragment distractor C ("Replacing the warm-up", 3 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-13 | PTB-13-K02 | Fragment distractor C ("A simple logo", 3 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PTB-13 | PTB-13-K03 | Absolute wording in distractor A ("Because profit is never real"): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| YNS-01 | YNS-01-K02 | Joke or throwaway distractor C ("Choose whichever is cheapest to run"): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| YNS-04 | YNS-04-K02 | Absolute wording in distractor A ("Ignore it and keep the niche for a year"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| FPS-01 | FPS-01-K02 | Absolute wording in distractor B ("It always damages stainless steel"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| FPS-03 | FPS-03-K01 | Joke or throwaway distractor C ("Whichever product is cheapest per litre"): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| FPS-05 | FPS-05-K01 | Absolute wording in distractor A ("Pests stop sanitisers from working permanently"): "permanently" makes it easy to rule out | Reword distractor A to drop "permanently" and state a specific, plausible wrong action or condition for this lesson. |
| FPS-05 | FPS-05-K03 | Joke or throwaway distractor C ("Sweep the droppings into a bin and carry on"): "carry on" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| FPS-05 | FPS-05-K03 | Joke or throwaway distractor D ("Move the nearby stock and carry on working"): "carry on" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| FPS-06 | FPS-06-K02 | Absolute wording in distractor C ("It means the stock never needs to be checked"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| FPS-08 | FPS-08-K03 | Absolute wording in distractor B ("Ignore it if the area looks clean"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| GCM-01 | GCM-01-K03 | Absolute wording in distractor B ("End-of-shift checks are never valid for any area"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| GCM-01 | GCM-01-K03 | Repeats the question wording (distractor C: "A daytime check replaces the need to clean at the end of the shift"; overlap 0.71) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| GCM-02 | GCM-02-K02 | Joke or throwaway distractor C ("Carry on, and mention the marks to the customer at the end of the job"): "carry on" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| GCM-02 | GCM-02-K03 | Absolute wording in distractor C ("A water-dampened cloth always saves product, so product checks are not needed"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| GCM-03 | GCM-03-K02 | Joke or throwaway distractor A ("Top it up with the detergent that is left, to save time"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| GCM-03 | GCM-03-K03 | Joke or throwaway distractor B ("Store it on its edge with the sound boards and carry on"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HBM-04 | HBM-04-K02 | Absolute wording in distractor D ("Delete the milestone, because staff are never needed"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-04 | HBM-04-K03 | Absolute wording in distractor D ("A lender's plan is always shorter"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-06 | HBM-06-K01 | Absolute wording in distractor C ("Because customers never ask about licences"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-07 | HBM-07-K01 | Absolute wording in distractor D ("Whatever a friend recommends"): "whatever" makes it easy to rule out | Reword distractor D to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-07 | HBM-07-K02 | Absolute wording in distractor D ("Never, because hiring is always unsafe"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-12 | HBM-12-K02 | Absolute wording in distractor A ("Because short jobs never need travel"): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-13 | HBM-13-K01 | Absolute wording in distractor A ("Because a visit is always billed at double the rate"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-14 | HBM-14-K02 | Absolute wording in distractor C ("This is always the correct method for every job"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HBM-15 | HBM-15-K02 | Joke or throwaway distractor C ("By whichever option is cheaper that week"): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HBM-16 | HBM-16-K02 | Absolute wording in distractor A ("Sending the employee to a random job each morning"): "random" makes it easy to rule out | Reword distractor A to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| ADA-01 | ADA-01-K01 | Fragment distractor C ("On the spittoon.", 3 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| ADA-01 | ADA-01-K03 | Absolute wording in distractor C ("Anything may move in any direction if the lid is closed."): "anything" makes it easy to rule out | Reword distractor C to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| ADA-02 | ADA-02-K01 | Absolute wording in distractor C ("The water is always too hot."): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| ADA-02 | ADA-02-K03 | Fragment distractor A ("Use it anyway.", 3 words) is much shorter than the correct option (15 words) | Expand distractor A to roughly 13 to 17 words with the same level of detail as the correct option, keeping it wrong. |
| ADA-05 | ADA-05-K02 | Repeats the question wording (correct option: "Into the facility's general waste."; overlap 0.67) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| ADA-05 | ADA-05-K03 | Fragment distractor B ("Carry it open.", 3 words) is much shorter than the correct option (11 words) | Expand distractor B to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| ADA-06 | ADA-06-K01 | Joke or throwaway distractor D ("A broom swept through the operatory to save time."): "save time" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| ADA-06 | ADA-06-K02 | Absolute wording in distractor A ("Ignore it, because toys are not a risk."): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| ADA-06 | ADA-06-K03 | Absolute wording in distractor C ("They are always sterile."): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| DIP-02 | DIP-02-K03 | Fragment distractor A ("A quick wipe.", 3 words) is much shorter than the correct option (12 words) | Expand distractor A to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| DIP-03 | DIP-03-K03 | Absolute wording in distractor C ("Never, if it looks clean."): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-01 | HCG-01-K03 | Joke or throwaway distractor B ("Say that isolation is not needed and carry on cleaning."): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HCG-02 | HCG-02-K02 | Fragment distractor A ("Dry dusting only.", 3 words) is much shorter than the correct option (15 words) | Expand distractor A to roughly 13 to 17 words with the same level of detail as the correct option, keeping it wrong. |
| HCG-02 | HCG-02-K03 | Joke or throwaway distractor A ("They are too expensive for a ward budget."): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HCG-03 | HCG-03-K03 | Absolute wording in distractor A ("Nothing changes; the schedule is never adjusted."): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-04 | HCG-04-K02 | Absolute wording in distractor D ("Using a disinfectant on a surface that was never wiped."): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-04 | HCG-04-K03 | Absolute wording in distractor A ("It is always required, every day."): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-04 | HCG-04-K03 | Absolute wording in distractor B ("It is never required outside an acute hospital."): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-05 | HCG-05-K01 | Joke or throwaway distractor A ("Because the solution becomes more expensive over time."): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HCG-07 | HCG-07-K02 | Absolute wording in distractor C ("Never, because curtains are not part of the table."): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-08 | HCG-08-K02 | Absolute wording in distractor C ("Because it leaves a permanent stain on every surface."): "permanently" makes it easy to rule out | Reword distractor C to drop "permanently" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-08 | HCG-08-K02 | Absolute wording in distractor D ("Because it is always more expensive than detergent."): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-08 | HCG-08-K02 | Joke or throwaway distractor D ("Because it is always more expensive than detergent."): "expensive" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HCG-09 | HCG-09-K03 | Absolute wording in distractor B ("Every hour, regardless of condition."): "regardless" makes it easy to rule out | Reword distractor B to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-10 | HCG-10-K03 | Absolute wording in distractor A ("Always, for every spill, without any assessment."): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-10 | HCG-10-K03 | Absolute wording in distractor B ("Never, because detergent is the only permitted product."): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-11 | HCG-11-K02 | Fragment distractor D ("A cleaning cupboard.", 3 words) is much shorter than the correct option (10 words) | Expand distractor D to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| HCG-12 | HCG-12-K01 | Absolute wording in distractor A ("Because the surface is always wet after cleaning."): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-12 | HCG-12-K01 | Absolute wording in distractor C ("Because the checklist is always wrong."): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-12 | HCG-12-K02 | Absolute wording in distractor A ("Because samples are always too expensive to test."): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-12 | HCG-12-K02 | Joke or throwaway distractor A ("Because samples are always too expensive to test."): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HCG-12 | HCG-12-K02 | Absolute wording in distractor D ("Because it always finds too many organisms."): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-12 | HCG-12-K03 | Absolute wording in distractor D ("Never, under any circumstances."): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-15 | HCG-15-K01 | Absolute wording in distractor C ("Never, because the table is not the patient."): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-15 | HCG-15-K02 | Absolute wording in distractor D ("Never, because soap is less effective than any alcohol rub."): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-16 | HCG-16-K02 | Fragment distractor A ("The mask.", 2 words) is much shorter than the correct option (6 words) | Expand distractor A to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| HCG-16 | HCG-16-K02 | Fragment distractor B ("The gown.", 2 words) is much shorter than the correct option (6 words) | Expand distractor B to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| HCG-17 | HCG-17-K02 | Joke or throwaway distractor D ("Half full, so it is light to carry."): "half full" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HCG-18 | HCG-18-K03 | Absolute wording in distractor A ("Because bin labels are never used in Australia."): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-18 | HCG-18-K03 | Absolute wording in distractor D ("Because bins are always the wrong colour."): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-19 | HCG-19-K02 | Fragment distractor A ("Facility bed sheets.", 3 words) is much shorter than the correct option (13 words) | Expand distractor A to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| HCG-20 | HCG-20-K01 | Absolute wording in distractor D ("They are unrelated and are never used together."): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HCG-20 | HCG-20-K01 | Repeats the question wording (distractor A: "Transmission-based precautions replace standard precautions."; overlap 0.6) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| HCG-20 | HCG-20-K02 | Fragment distractor D ("With water only.", 3 words) is much shorter than the correct option (19 words) | Expand distractor D to roughly 17 to 21 words with the same level of detail as the correct option, keeping it wrong. |
| HCG-20 | HCG-20-K03 | Absolute wording in distractor C ("The patient, at any time."): "any time" makes it easy to rule out | Reword distractor C to drop "any time" and state a specific, plausible wrong action or condition for this lesson. |
| HIP-01 | HIP-01-K01 | Joke or throwaway distractor A ("Carry on, because visitors are not your responsibility."): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HIP-01 | HIP-01-K01 | Joke or throwaway distractor C ("Wipe the button with your bare hand to save time."): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HIP-01 | HIP-01-K02 | Joke or throwaway distractor D ("Turn away from people, cough, and carry on working."): "carry on" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HIP-01 | HIP-01-K03 | Absolute wording in distractor D ("Emptying the bin by hand before washing anything."): "anything" makes it easy to rule out | Reword distractor D to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| HIP-02 | HIP-02-K02 | Joke or throwaway distractor B ("Detergent is cheaper than disinfectant."): "cheap" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HIP-02 | HIP-02-K02 | Absolute wording in distractor D ("The order does not matter if the same cloth is used."): "does not matter" makes it easy to rule out | Reword distractor D to drop "does not matter" and state a specific, plausible wrong action or condition for this lesson. |
| HIP-02 | HIP-02-K02 | Repeats the question wording (distractor B: "Detergent is cheaper than disinfectant."; overlap 0.67) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| HIP-02 | HIP-02-K03 | Joke or throwaway distractor D ("Leave the rails for the next shift."): "for the next shift" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HIP-03 | HIP-03-K02 | Fragment distractor C ("By the weekday.", 3 words) is much shorter than the correct option (14 words) | Expand distractor C to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| HIP-03 | HIP-03-K02 | Joke or throwaway distractor D ("By choosing the cheapest option."): "cheap" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HIP-04 | HIP-04-K03 | Absolute wording in distractor B ("Ignore it if it does not hurt."): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| HIP-05 | HIP-05-K02 | Joke or throwaway distractor B ("Squeeze hard to push the fluid out, then carry on."): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HLT-01 | HLT-01-K03 | Repeats the question wording (distractor A: "No disinfectant kills any bacteria."; overlap 1.0) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| HLT-02 | HLT-02-K03 | Absolute wording in distractor B ("Early signs always mean the person is contagious for life"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HLT-03 | HLT-03-K03 | Fragment distractor D ("The product manufacturer", 3 words) is much shorter than the correct option (9 words) | Expand distractor D to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| HLT-05 | HLT-05-K01 | Joke or throwaway distractor A ("Cough into the palm and carry on"): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| HLT-07 | HLT-07-K03 | Fragment distractor A ("Once per shift", 3 words) is much shorter than the correct option (9 words) | Expand distractor A to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| HLT-07 | HLT-07-K03 | Absolute wording in distractor D ("Never, if it still looks clean"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| HLT-09 | HLT-09-K01 | Repeats the question wording (distractor A: "Mop the floor, then wipe the bench, then the wall"; overlap 0.6) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| HLT-09 | HLT-09-K03 | Repeats the question wording (correct option: "Post a wet-floor sign while it is wet"; overlap 0.6) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| HLT-13 | HLT-13-K03 | Fragment distractor C ("The product manufacturer", 3 words) is much shorter than the correct option (10 words) | Expand distractor C to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| HLT-14 | HLT-14-K01 | Fragment distractor A ("Protective equipment", 2 words) is much shorter than the correct option (6 words) | Expand distractor A to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| HLT-14 | HLT-14-K01 | Fragment distractor C ("Signage", 1 words) is much shorter than the correct option (6 words) | Expand distractor C to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| HLT-14 | HLT-14-K01 | Fragment distractor D ("Training alone", 2 words) is much shorter than the correct option (6 words) | Expand distractor D to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| HLT-14 | HLT-14-K03 | Absolute wording in distractor A ("Ignore it, since it is unlikely to be serious"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| OTI-03 | OTI-03-K01 | Absolute wording in distractor B ("Because hair is always dirty"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| OTI-03 | OTI-03-K01 | Fragment distractor D ("To show rank", 3 words) is much shorter than the correct option (15 words) | Expand distractor D to roughly 13 to 17 words with the same level of detail as the correct option, keeping it wrong. |
| OTI-03 | OTI-03-K02 | Fragment distractor A ("Open sandals", 2 words) is much shorter than the correct option (7 words) | Expand distractor A to roughly 5 to 9 words with the same level of detail as the correct option, keeping it wrong. |
| OTI-03 | OTI-03-K03 | Repeats the question wording (correct option: "It is taken off before the person leaves theatre"; overlap 0.6) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| OTI-04 | OTI-04-K02 | Fragment distractor C ("Only the floor", 3 words) is much shorter than the correct option (15 words) | Expand distractor C to roughly 13 to 17 words with the same level of detail as the correct option, keeping it wrong. |
| OTI-04 | OTI-04-K02 | Fragment distractor D ("Water alone", 2 words) is much shorter than the correct option (15 words) | Expand distractor D to roughly 13 to 17 words with the same level of detail as the correct option, keeping it wrong. |
| OTI-05 | OTI-05-K02 | Absolute wording in distractor A ("Water-based solutions are always better"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| OTI-05 | OTI-05-K02 | Repeats the question wording (distractor C: "Skin should be wet before preparation"; overlap 0.67) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| C01-L01 | C01-L01-K02 | Joke or throwaway distractor A ("Continue the task and fix the problem yourself to save time"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| C01-L01 | C01-L01-K02 | Joke or throwaway distractor B ("Carry on, because a client instruction overrides the work order"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| C01-L03 | C01-L03-K03 | Absolute wording in distractor D ("The time the trainee took, regardless of the result"): "regardless" makes it easy to rule out | Reword distractor D to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| F01-L01 | F01-L01-K01 | Joke or throwaway distractor B ("Ask the client to sign a waiver and carry on"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F15-L01 | F15-L01-K01 | Joke or throwaway distractor A ("Carry on if you are wearing the right clothing"): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F15-L01 | F15-L01-K03 | Absolute wording in distractor B ("Choose whatever PPE is nearest to hand"): "whatever" makes it easy to rule out | Reword distractor B to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F15-L01 | F15-L01-K05 | Repeats the question wording (distractor A: "No record is needed for clothing"; overlap 0.67) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| F15-L02 | F15-L02-K01 | Joke or throwaway distractor D ("Carry on because others on site are doing it"): "carry on" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F15-L02 | F15-L02-K03 | Absolute wording in distractor C ("Any flat-soled shoes, whatever the floor"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F15-L04 | F15-L04-K02 | Joke or throwaway distractor C ("Wear it to the next site to save time"): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| C02-L03 | C02-L03-K02 | Joke or throwaway distractor D ("Wipe the pedestrian's shoes with the same cloth and carry on"): "carry on" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F05-L03 | F05-L03-K01 | Absolute wording in distractor D ("Ignore it, since the cloth was only used on the toilet floor"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F05-L03 | F05-L03-K02 | Joke or throwaway distractor D ("Use a kitchen cloth on the toilet to save time"): "save time" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F19-L05 | F19-L05-K01 | Joke or throwaway distractor B ("Whether the cords can run across the walkway to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F19-L05 | F19-L05-K05 | Repeats the question wording (distractor C: "No record is needed for barriers"; overlap 0.67) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| BP-02 | BP-02-K02 | Absolute wording in distractor C ("It shows that referrals never work"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| CP-02 | CP-02-K03 | Absolute wording in distractor C ("Hand out cards to everyone after the meeting, whatever the rules say"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| CP-04 | CP-04-K02 | Repeats the question wording (correct option: "Their consent for the name and photo you plan to publish"; overlap 0.67) | Rephrase correct option so it does not reuse the question's key terms; state the claim in new words. |
| F11-L06 | F11-L06-K01 | Absolute wording in distractor C ("Ignore the complaints because they are few."): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| SHR-PLN-05 | SHR-PLN-05-K02 | Absolute wording in distractor C ("Remove it from the plan, because opinions are never useful"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-05 | SOL-05-K02 | Fragment distractor A ("Your prices", 2 words) is much shorter than the correct option (8 words) | Expand distractor A to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-05 | SOL-05-K02 | Fragment distractor C ("Your awards", 2 words) is much shorter than the correct option (8 words) | Expand distractor C to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-05 | SOL-05-K02 | Fragment distractor D ("Your competitors", 2 words) is much shorter than the correct option (8 words) | Expand distractor D to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-06 | SOL-06-K03 | Absolute wording in distractor A ("Never"): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-06 | SOL-06-K03 | Fragment distractor A ("Never", 1 words) is much shorter than the correct option (5 words) | Expand distractor A to roughly 3 to 7 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-08 | SOL-08-K02 | Absolute wording in distractor D ("Nothing, it is always allowed"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-08 | SOL-08-K03 | Absolute wording in distractor A ("Delete it and never respond"): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-08 | SOL-08-K03 | Absolute wording in distractor D ("Ignore all reviews"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| NHS-01 | NHS-01-K02 | Joke or throwaway distractor A ("Disinfectant is cheaper to use on a clean surface."): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| NHS-04 | NHS-04-K03 | Absolute wording in distractor A ("Only at induction, and never again."): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| F10-L02 | F10-L02-K01 | Absolute wording in distractor D ("Starting with the room the worker likes best, whatever the occupancy"): "whatever" makes it easy to rule out | Reword distractor D to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F10-L02 | F10-L02-K02 | Absolute wording in distractor B ("Complete the unclear task in whatever way seems best"): "whatever" makes it easy to rule out | Reword distractor B to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F13-L01 | F13-L01-K01 | Joke or throwaway distractor C ("Whether it is cheaper."): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F13-L01 | F13-L01-K02 | Fragment distractor B ("Travel grouping.", 2 words) is much shorter than the correct option (6 words) | Expand distractor B to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| F13-L04 | F13-L04-K01 | Absolute wording in distractor C ("Ignore the restriction because it is a small job."): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F13-L06 | F13-L06-K02 | Fragment distractor A ("Blame the product.", 3 words) is much shorter than the correct option (13 words) | Expand distractor A to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| F18-L01 | F18-L01-K01 | Fragment distractor B ("A bucket.", 2 words) is much shorter than the correct option (7 words) | Expand distractor B to roughly 5 to 9 words with the same level of detail as the correct option, keeping it wrong. |
| F18-L02 | F18-L02-K01 | Absolute wording in distractor A ("The same kit as last time, regardless of the tasks."): "regardless" makes it easy to rule out | Reword distractor A to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| F18-L02 | F18-L02-K01 | Absolute wording in distractor C ("Whatever is in the van."): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F18-L02 | F18-L02-K02 | Absolute wording in distractor B ("Ignore it if it looks close enough."): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F18-L04 | F18-L04-K01 | Absolute wording in distractor C ("Ignore the difference."): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F18-L04 | F18-L04-K01 | Fragment distractor C ("Ignore the difference.", 3 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| F20-L05 | F20-L05-K02 | Absolute wording in distractor C ("Ignore it if the difference is small."): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| MP-05 | MP-05-K02 | Absolute wording in distractor B ("Ignore the forecast and keep the goal"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| MP-07 | MP-07-K02 | Fragment distractor C ("A printed chart", 3 words) is much shorter than the correct option (16 words) | Expand distractor C to roughly 14 to 18 words with the same level of detail as the correct option, keeping it wrong. |
| MP-07 | MP-07-K03 | Absolute wording in distractor D ("It always equals the quarterly rate, whatever the number of quarters"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| MP-08 | MP-08-K02 | Absolute wording in distractor A ("Ignore the dependency and start on time anyway"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| MP-08 | MP-08-K02 | Absolute wording in distractor C ("Start both on the same day regardless"): "regardless" makes it easy to rule out | Reword distractor C to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| MP-08 | MP-08-K03 | Fragment distractor D ("The sales forecast", 3 words) is much shorter than the correct option (12 words) | Expand distractor D to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-07 | SOL-07-K01 | Joke or throwaway distractor A ("Buy the most expensive software"): "expensive" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| SOL-07 | SOL-07-K02 | Fragment distractor A ("The rarest process", 3 words) is much shorter than the correct option (11 words) | Expand distractor A to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| THS-01 | THS-01-K01 | Fragment distractor C ("A staff roster", 3 words) is much shorter than the correct option (9 words) | Expand distractor C to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| THS-01 | THS-01-K02 | Absolute wording in distractor B ("Always, once it has been written down"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| THS-01 | THS-01-K03 | Fragment distractor B ("Keep clients happy", 3 words) is much shorter than the correct option (15 words) | Expand distractor B to roughly 13 to 17 words with the same level of detail as the correct option, keeping it wrong. |
| THS-03 | THS-03-K01 | Fragment distractor C ("Supervised work only", 3 words) is much shorter than the correct option (13 words) | Expand distractor C to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| THS-03 | THS-03-K02 | Absolute wording in distractor C ("Take the trainee off the task permanently"): "permanently" makes it easy to rule out | Reword distractor C to drop "permanently" and state a specific, plausible wrong action or condition for this lesson. |
| THS-03 | THS-03-K02 | Fragment distractor D ("Stop the training", 3 words) is much shorter than the correct option (12 words) | Expand distractor D to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| THS-04 | THS-04-K01 | Absolute wording in distractor D ("That the supplier will never have a problem"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| THS-05 | THS-05-K01 | Absolute wording in distractor C ("Because the client always asks for less staff"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| THS-05 | THS-05-K01 | Absolute wording in distractor D ("Because the costing is never needed"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| THS-05 | THS-05-K03 | Absolute wording in distractor B ("Ignore it"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| THS-05 | THS-05-K03 | Fragment distractor B ("Ignore it", 2 words) is much shorter than the correct option (6 words) | Expand distractor B to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| THS-06 | THS-06-K01 | Fragment distractor C ("A new supplier", 3 words) is much shorter than the correct option (11 words) | Expand distractor C to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| THS-06 | THS-06-K03 | Absolute wording in distractor A ("Whatever the crew prefers"): "whatever" makes it easy to rule out | Reword distractor A to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| THS-07 | THS-07-K01 | Fragment distractor A ("Cancel the job", 3 words) is much shorter than the correct option (10 words) | Expand distractor A to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| additional-specialist-services-L01 | additional-specialist-services-L01-K02 | Repeats the question wording (distractor A: "Yes. A training certificate is enough to start restricted work."; overlap 0.71) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| garden-cleanups-L10 | garden-cleanups-L10-K01 | Repeats the question wording (distractor C: "Mix the treated timber into the clippings to fill the trailer."; overlap 0.67) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| PFM-03 | PFM-03-K02 | Absolute wording in distractor D ("Never, because the bleeder should stay open while filtering"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| PFM-06 | PFM-06-K02 | Fragment distractor B ("Cooking oil", 2 words) is much shorter than the correct option (6 words) | Expand distractor B to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| PHM-02 | PHM-02-K03 | Repeats the question wording (distractor A: "Once the surface looks clean from the edge"; overlap 0.8) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| PHM-04 | PHM-04-K02 | Joke or throwaway distractor B ("Fit a replacement cover yourself to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| PHM-06 | PHM-06-K01 | Joke or throwaway distractor A ("Mix them in one bucket first to save time and add the mixture"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| POM-02 | POM-02-K01 | Joke or throwaway distractor C ("From whichever chemical product is cheapest"): "cheap" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| POM-02 | POM-02-K03 | Absolute wording in distractor A ("They are always interchangeable with the same plan"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| POM-02 | POM-02-K03 | Absolute wording in distractor B ("Bromine always has a stronger odour than chlorine"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| POM-03 | POM-03-K02 | Absolute wording in distractor B ("Randomly, so that the whole wall is covered"): "random" makes it easy to rule out | Reword distractor B to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-01 | PSA-01-K01 | Absolute wording in distractor C ("The owner, whatever their chemistry experience"): "whatever" makes it easy to rule out | Reword distractor C to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-01 | PSA-01-K02 | Absolute wording in distractor A ("Apply every figure exactly as written, because the standard always covers private pools"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-01 | PSA-01-K02 | Absolute wording in distractor C ("Ignore the standard entirely because it only covers interstate pools"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-02 | PSA-02-K03 | Absolute wording in distractor C ("Because clear water is always chemically balanced"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-03 | PSA-03-K01 | Absolute wording in distractor C ("Ignore it, because 7.9 is inside the bromine band"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-04 | PSA-04-K02 | Fragment distractor A ("Combined chlorine", 2 words) is much shorter than the correct option (9 words) | Expand distractor A to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| PSA-04 | PSA-04-K02 | Fragment distractor B ("Chloramines", 1 words) is much shorter than the correct option (9 words) | Expand distractor B to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| PSA-05 | PSA-05-K03 | Absolute wording in distractor D ("Ignore it until the next season"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-08 | PSA-08-K03 | Fragment distractor C ("They are colourless", 3 words) is much shorter than the correct option (14 words) | Expand distractor C to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| PSA-09 | PSA-09-K01 | Absolute wording in distractor D ("Whatever the bather load allows"): "whatever" makes it easy to rule out | Reword distractor D to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| PSA-10 | PSA-10-K01 | Fragment distractor A ("Rainfall", 1 words) is much shorter than the correct option (5 words) | Expand distractor A to roughly 3 to 7 words with the same level of detail as the correct option, keeping it wrong. |
| PSA-16 | PSA-16-K03 | Fragment distractor D ("Four", 1 words) is much shorter than the correct option (14 words) | Expand distractor D to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-01 | PVB-01-K01 | Absolute wording in distractor A ("Any depth"): "any depth" makes it easy to rule out | Reword distractor A to drop "any depth" and state a specific, plausible wrong action or condition for this lesson. |
| PVB-01 | PVB-01-K03 | Fragment distractor A ("The whole lot", 3 words) is much shorter than the correct option (10 words) | Expand distractor A to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-02 | PVB-02-K03 | Repeats the question wording (distractor C: "No time limit applies to the work"; overlap 1.0) | Rephrase distractor C so it does not reuse the question's key terms; state the claim in new words. |
| PVB-04 | PVB-04-K02 | Absolute wording in distractor A ("Yes, always"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| PVB-04 | PVB-04-K02 | Fragment distractor A ("Yes, always", 2 words) is much shorter than the correct option (13 words) | Expand distractor A to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-04 | PVB-04-K02 | Fragment distractor D ("Only on Sundays", 3 words) is much shorter than the correct option (13 words) | Expand distractor D to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-04 | PVB-04-K03 | Fragment distractor A ("Stay open", 2 words) is much shorter than the correct option (6 words) | Expand distractor A to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-04 | PVB-04-K03 | Fragment distractor C ("Unlock fully", 2 words) is much shorter than the correct option (6 words) | Expand distractor C to roughly 4 to 8 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-05 | PVB-05-K03 | Fragment distractor A ("None", 1 words) is much shorter than the correct option (4 words) | Expand distractor A to roughly 2 to 6 words with the same level of detail as the correct option, keeping it wrong. |
| PVB-08 | PVB-08-K01 | Absolute wording in distractor D ("Never, because pool work is exempt"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| PVB-08 | PVB-08-K02 | Absolute wording in distractor C ("Ignore it, because the builder is on site"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F09-L04 | F09-L04-K02 | Joke or throwaway distractor C ("Leave the residue for the next shift and note it verbally"): "for the next shift" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F10-L05 | F10-L05-K01 | Joke or throwaway distractor B ("Ticking every task as complete to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| PRO-03 | PRO-03-K01 | Fragment distractor B ("The performance appraisal", 3 words) is much shorter than the correct option (10 words) | Expand distractor B to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PRO-03 | PRO-03-K01 | Fragment distractor C ("The disciplinary warning", 3 words) is much shorter than the correct option (10 words) | Expand distractor C to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PRO-03 | PRO-03-K01 | Fragment distractor D ("The overtime request", 3 words) is much shorter than the correct option (10 words) | Expand distractor D to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| PRO-03 | PRO-03-K03 | Fragment distractor A ("Immediate suspension", 2 words) is much shorter than the correct option (20 words) | Expand distractor A to roughly 18 to 22 words with the same level of detail as the correct option, keeping it wrong. |
| additional-specialist-services-L12 | additional-specialist-services-L12-K02 | Repeats the question wording (distractor A: "Yes. A training certificate is enough to start restricted work."; overlap 0.71) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| BP-05 | BP-05-K02 | Absolute wording in distractor B ("Ignore it, because the client has already paid"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| MP-04 | MP-04-K01 | Fragment distractor C ("Sales minus profit", 3 words) is much shorter than the correct option (10 words) | Expand distractor C to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| MP-04 | MP-04-K03 | Absolute wording in distractor D ("Ignore break-even and use the price list only"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| PRO-01 | PRO-01-K03 | Joke or throwaway distractor B ("Use it at full strength to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F02-L01 | F02-L01-K02 | Joke or throwaway distractor A ("Carry on without it, since the job is nearly finished"): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F02-L01 | F02-L01-K02 | Absolute wording in distractor C ("Ignore the instruction if it seems obvious"): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F02-L02 | F02-L02-K02 | Absolute wording in distractor D ("Improvise a barrier from whatever is nearby"): "whatever" makes it easy to rule out | Reword distractor D to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| F02-L03 | F02-L03-K02 | Joke or throwaway distractor A ("Carry on and report it at the end of the shift"): "carry on" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F08-L01 | F08-L01-K02 | Joke or throwaway distractor D ("Decide yourself whether it is infectious, then carry on"): "carry on" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F14-L04 | F14-L04-K02 | Joke or throwaway distractor A ("Keep the equipment in the route to save time"): "save time" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F15-L03 | F15-L03-K01 | Absolute wording in distractor D ("Use a respirator you have never been fitted for, since it looks right"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| F15-L03 | F15-L03-K03 | Joke or throwaway distractor B ("Use the glove nearest to hand to save time"): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F15-L06 | F15-L06-K01 | Absolute wording in distractor D ("Ignore the wear, since it is only a minor tear"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| F15-L06 | F15-L06-K05 | Repeats the question wording (distractor A: "No record is needed for clothing"; overlap 0.67) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| F17-L04 | F17-L04-K03 | Joke or throwaway distractor B ("Reset the breaker and carry on with the floor"): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-02 | RAS-02-K01 | Fragment distractor A ("Chemicals, bathroom.", 2 words) is much shorter than the correct option (16 words) | Expand distractor A to roughly 14 to 18 words with the same level of detail as the correct option, keeping it wrong. |
| RAS-03 | RAS-03-K02 | Absolute wording in distractor C ("Nothing, because residual scores ignore training."): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| RAS-04 | RAS-04-K03 | Joke or throwaway distractor C ("Pour concentrate into an unlabelled spray bottle to save time."): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-07 | RAS-07-K03 | Joke or throwaway distractor B ("Carry on, since the work is outdoors anyway."): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-07 | RAS-07-K03 | Joke or throwaway distractor C ("Carry on but wave people away from the area."): "carry on" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-08 | RAS-08-K01 | Joke or throwaway distractor B ("Carry on cleaning on the far side of the corridor."): "carry on" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-09 | RAS-09-K01 | Joke or throwaway distractor C ("Mark it with a sign and leave it for the next shift."): "for the next shift" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-12 | RAS-12-K01 | Repeats the question wording (distractor B: "Carry it alone quickly, since the lift is busy."; overlap 0.67) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| RAS-12 | RAS-12-K03 | Absolute wording in distractor A ("Because noise is always legal to ignore."): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| RAS-15 | RAS-15-K01 | Joke or throwaway distractor C ("Take the lift down to save time."): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| RAS-15 | RAS-15-K02 | Absolute wording in distractor A ("At any time while working, as long as the sound is off."): "any time" makes it easy to rule out | Reword distractor A to drop "any time" and state a specific, plausible wrong action or condition for this lesson. |
| S14-L04 | S14-L04-K01 | Absolute wording in distractor A ("Wait for the signal to return before doing anything"): "anything" makes it easy to rule out | Reword distractor A to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| S14-L08 | S14-L08-K01 | Absolute wording in distractor B ("Ignore the alarm while the lone-worker check-in is pending"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| WAH-01 | WAH-01-K03 | Absolute wording in distractor A ("Foreign training decks never mention heights."): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| WAH-01 | WAH-01-K03 | Absolute wording in distractor D ("The figure in any deck is always too high to matter."): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| WAH-02 | WAH-02-K02 | Joke or throwaway distractor A ("It is cheaper to buy."): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| WAH-03 | WAH-03-K02 | Repeats the question wording (distractor A: "Nothing else; the lanyard length is the clearance."; overlap 0.8) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| WAH-04 | WAH-04-K01 | Repeats the question wording (distractor A: "Use it, because it still feels firm."; overlap 0.6) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| WAH-04 | WAH-04-K02 | Fragment distractor A ("Only the connector.", 3 words) is much shorter than the correct option (16 words) | Expand distractor A to roughly 14 to 18 words with the same level of detail as the correct option, keeping it wrong. |
| WAH-04 | WAH-04-K02 | Fragment distractor D ("Only the anchor.", 3 words) is much shorter than the correct option (16 words) | Expand distractor D to roughly 14 to 18 words with the same level of detail as the correct option, keeping it wrong. |
| WAH-07 | WAH-07-K03 | Fragment distractor D ("Working during daylight.", 3 words) is much shorter than the correct option (14 words) | Expand distractor D to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| WAH-08 | WAH-08-K01 | Joke or throwaway distractor B ("Walk across it quickly to save time."): "save time" is an obvious non-answer | Replace distractor B with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| WAH-08 | WAH-08-K03 | Absolute wording in distractor D ("Because materials may never be placed on roofs."): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| WAH-10 | WAH-10-K03 | Absolute wording in distractor D ("Because rescuers must always stand on the ground."): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| WAH-11 | WAH-11-K02 | Absolute wording in distractor C ("Never; the starting score is always used."): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HSE-02 | HSE-02-K01 | Absolute wording in distractor A ("Cleans every aspect regardless of condition"): "regardless" makes it easy to rule out | Reword distractor A to drop "regardless" and state a specific, plausible wrong action or condition for this lesson. |
| HSE-04 | HSE-04-K03 | Absolute wording in distractor C ("Nowhere, because it is always obvious"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| HSE-06 | HSE-06-K02 | Fragment distractor C ("Ethanol wipes only", 3 words) is much shorter than the correct option (11 words) | Expand distractor C to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| HSE-06 | HSE-06-K03 | Absolute wording in distractor C ("Randomly across the room"): "random" makes it easy to rule out | Reword distractor C to drop "random" and state a specific, plausible wrong action or condition for this lesson. |
| HSE-07 | HSE-07-K01 | Fragment distractor C ("To avoid training", 3 words) is much shorter than the correct option (12 words) | Expand distractor C to roughly 10 to 14 words with the same level of detail as the correct option, keeping it wrong. |
| HSE-07 | HSE-07-K02 | Fragment distractor A ("Stop the task", 3 words) is much shorter than the correct option (13 words) | Expand distractor A to roughly 11 to 15 words with the same level of detail as the correct option, keeping it wrong. |
| HSE-10 | HSE-10-K02 | Fragment distractor A ("It looks untidy", 3 words) is much shorter than the correct option (9 words) | Expand distractor A to roughly 7 to 11 words with the same level of detail as the correct option, keeping it wrong. |
| HSE-10 | HSE-10-K03 | Fragment distractor A ("It is recommended", 3 words) is much shorter than the correct option (11 words) | Expand distractor A to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| SAH-01 | SAH-01-K03 | Repeats the question wording (distractor A: "Low risk, because the area is low risk"; overlap 0.75) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| SAH-02 | SAH-02-K01 | Absolute wording in distractor C ("Nothing changes, because a single case never affects the method"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SAH-05 | SAH-05-K02 | Absolute wording in distractor C ("They always use more product than a cloth"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SAH-08 | SAH-08-K01 | Absolute wording in distractor C ("Because cleaning products always leave a film"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| SAH-11 | SAH-11-K03 | Fragment distractor A ("Only at weekends", 3 words) is much shorter than the correct option (10 words) | Expand distractor A to roughly 8 to 12 words with the same level of detail as the correct option, keeping it wrong. |
| SAH-11 | SAH-11-K03 | Absolute wording in distractor C ("Never, because the standard fixes the frequency"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| BP-01 | BP-01-K02 | Absolute wording in distractor B ("Subcontract the work without checking anything"): "anything" makes it easy to rule out | Reword distractor B to drop "anything" and state a specific, plausible wrong action or condition for this lesson. |
| BP-06 | BP-06-K03 | Absolute wording in distractor C ("Because year one is never profitable"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| F11-L01 | F11-L01-K01 | Fragment distractor A ("We clean houses.", 3 words) is much shorter than the correct option (16 words) | Expand distractor A to roughly 14 to 18 words with the same level of detail as the correct option, keeping it wrong. |
| SHR-PLN-02 | SHR-PLN-02-K03 | Absolute wording in distractor A ("Ignore both, because price is the only thing clients compare"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-01 | SOL-01-K01 | Joke or throwaway distractor C ("The price of your most expensive service"): "expensive" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| SOL-01 | SOL-01-K03 | Absolute wording in distractor D ("Never, once it is set"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-02 | SOL-02-K03 | Fragment distractor A ("Buy new equipment", 3 words) is much shorter than the correct option (8 words) | Expand distractor A to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-02 | SOL-02-K03 | Fragment distractor B ("Sign a lease", 3 words) is much shorter than the correct option (8 words) | Expand distractor B to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-04 | SOL-04-K02 | Absolute wording in distractor B ("Never"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SOL-04 | SOL-04-K02 | Fragment distractor B ("Never", 1 words) is much shorter than the correct option (8 words) | Expand distractor B to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| SOL-04 | SOL-04-K03 | Joke or throwaway distractor C ("Nothing, to save time"): "save time" is an obvious non-answer | Replace distractor C with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| additional-specialist-services-L04 | additional-specialist-services-L04-K02 | Repeats the question wording (distractor A: "Yes. A training certificate is enough to start restricted work."; overlap 0.71) | Rephrase distractor A so it does not reuse the question's key terms; state the claim in new words. |
| BP-07 | BP-07-K03 | Fragment distractor A ("Marketing the business", 3 words) is much shorter than the correct option (14 words) | Expand distractor A to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| F12-L03 | F12-L03-K01 | Fragment distractor A ("Only the workers.", 3 words) is much shorter than the correct option (11 words) | Expand distractor A to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| F12-L03 | F12-L03-K01 | Fragment distractor C ("Only the customer.", 3 words) is much shorter than the correct option (11 words) | Expand distractor C to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| F12-L03 | F12-L03-K02 | Joke or throwaway distractor A ("The cheapest control available."): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| F12-L04 | F12-L04-K02 | Fragment distractor B ("The business's preference.", 3 words) is much shorter than the correct option (11 words) | Expand distractor B to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| F12-L04 | F12-L04-K02 | Fragment distractor C ("What customers think.", 3 words) is much shorter than the correct option (11 words) | Expand distractor C to roughly 9 to 13 words with the same level of detail as the correct option, keeping it wrong. |
| F12-L06 | F12-L06-K01 | Absolute wording in distractor C ("Ignore it unless a customer asks."): "ignore" makes it easy to rule out | Reword distractor C to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-01 | TLD-01-K02 | Absolute wording in distractor A ("A team leader always makes the final pay decision for every worker"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-01 | TLD-01-K02 | Absolute wording in distractor C ("A manager never assigns work to the crew"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-02 | TLD-02-K03 | Absolute wording in distractor D ("Tell the worker the task was never suitable"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-03 | TLD-03-K01 | Fragment distractor A ("Improve the cleaning", 3 words) is much shorter than the correct option (18 words) | Expand distractor A to roughly 16 to 20 words with the same level of detail as the correct option, keeping it wrong. |
| TLD-03 | TLD-03-K03 | Fragment distractor D ("Remove all deadlines", 3 words) is much shorter than the correct option (14 words) | Expand distractor D to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| TLD-04 | TLD-04-K02 | Absolute wording in distractor A ("You are always careless with the bathrooms"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-04 | TLD-04-K03 | Absolute wording in distractor A ("Ignore it because it is probably minor"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-06 | TLD-06-K03 | Absolute wording in distractor D ("Ignore the crew and work alone"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-07 | TLD-07-K01 | Fragment distractor B ("Work hard", 2 words) is much shorter than the correct option (14 words) | Expand distractor B to roughly 12 to 16 words with the same level of detail as the correct option, keeping it wrong. |
| TLD-07 | TLD-07-K02 | Absolute wording in distractor C ("So the client never sees a disagreement"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-07 | TLD-07-K03 | Absolute wording in distractor B ("Start the job and ignore it"): "ignore" makes it easy to rule out | Reword distractor B to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-08 | TLD-08-K02 | Absolute wording in distractor A ("You are always negative and nobody wants to work with you"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-08 | TLD-08-K03 | Absolute wording in distractor A ("Never; leads must resolve everything alone"): "never" makes it easy to rule out | Reword distractor A to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-09 | TLD-09-K01 | Absolute wording in distractor B ("Because early conflict is always the worker's fault"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-09 | TLD-09-K03 | Absolute wording in distractor D ("Ignore the pricing and focus on the cleaning"): "ignore" makes it easy to rule out | Reword distractor D to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-10 | TLD-10-K01 | Fragment distractor B ("Starting work early", 3 words) is much shorter than the correct option (8 words) | Expand distractor B to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| TLD-10 | TLD-10-K01 | Fragment distractor C ("Changing the rota", 3 words) is much shorter than the correct option (8 words) | Expand distractor C to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| TLD-11 | TLD-11-K01 | Absolute wording in distractor A ("Burn-down is always caused by a client complaint"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| TLD-11 | TLD-11-K02 | Absolute wording in distractor B ("It is kept private and never reviewed"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| additional-specialist-services-L10 | additional-specialist-services-L10-K02 | Repeats the question wording (distractor B: "Yes. A training certificate is enough to start restricted work."; overlap 0.71) | Rephrase distractor B so it does not reuse the question's key terms; state the claim in new words. |
| CPV-01 | CPV-01-K02 | Absolute wording in distractor B ("A single result is always wrong"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-01 | CPV-01-K02 | Absolute wording in distractor D ("The first result is always the worst"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-02 | CPV-02-K02 | Absolute wording in distractor C ("Because the first cycle is never recorded"): "never" makes it easy to rule out | Reword distractor C to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-02 | CPV-02-K03 | Absolute wording in distractor D ("Nothing, because sampling is always random"): "always" makes it easy to rule out | Reword distractor D to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-03 | CPV-03-K01 | Joke or throwaway distractor D ("The cheapest product in the range"): "cheap" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| CPV-03 | CPV-03-K02 | Absolute wording in distractor A ("They are always contaminated by the product"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-03 | CPV-03-K02 | Fragment distractor B ("They are decorative", 3 words) is much shorter than the correct option (8 words) | Expand distractor B to roughly 6 to 10 words with the same level of detail as the correct option, keeping it wrong. |
| CPV-04 | CPV-04-K03 | Absolute wording in distractor B ("Swabs always read high"): "always" makes it easy to rule out | Reword distractor B to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-04 | CPV-04-K03 | Absolute wording in distractor D ("Residue never falls below a swab's detection"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-05 | CPV-05-K01 | Absolute wording in distractor A ("Limits should always be set as high as possible"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-05 | CPV-05-K02 | Joke or throwaway distractor D ("Choose whichever is cheapest to test"): "cheap" is an obvious non-answer | Replace distractor D with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| CPV-05 | CPV-05-K03 | Absolute wording in distractor A ("Detergent residue is always beneficial"): "always" makes it easy to rule out | Reword distractor A to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-05 | CPV-05-K03 | Absolute wording in distractor D ("Detergent never needs to be removed"): "never" makes it easy to rule out | Reword distractor D to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-06 | CPV-06-K03 | Absolute wording in distractor A ("Can the result be ignored because it is negative?"): "ignore" makes it easy to rule out | Reword distractor A to drop "ignore" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-07 | CPV-07-K02 | Absolute wording in distractor B ("Whatever the supplier suggests for the next job"): "whatever" makes it easy to rule out | Reword distractor B to drop "whatever" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-07 | CPV-07-K03 | Joke or throwaway distractor A ("Separate analysis is cheaper"): "cheap" is an obvious non-answer | Replace distractor A with a realistic misconception drawn from the lesson content (same length and tone as the correct option). |
| CPV-07 | CPV-07-K03 | Absolute wording in distractor C ("Detergent is always removed by the first rinse"): "always" makes it easy to rule out | Reword distractor C to drop "always" and state a specific, plausible wrong action or condition for this lesson. |
| CPV-08 | CPV-08-K02 | Absolute wording in distractor B ("Never, once a method is validated"): "never" makes it easy to rule out | Reword distractor B to drop "never" and state a specific, plausible wrong action or condition for this lesson. |
| SFS-01 | SFS-01-K01, SFS-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-02 | SFS-02-K01, SFS-02-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-03 | SFS-03-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-04 | SFS-04-K01, SFS-04-K02, SFS-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-05 | SFS-05-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-06 | SFS-06-K01, SFS-06-K02, SFS-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-07 | SFS-07-K01, SFS-07-K02, SFS-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-08 | SFS-08-K01, SFS-08-K02, SFS-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-09 | SFS-09-K01, SFS-09-K02, SFS-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-10 | SFS-10-K01, SFS-10-K02, SFS-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-11 | SFS-11-K01, SFS-11-K02, SFS-11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-12 | SFS-12-K01, SFS-12-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-13 | SFS-13-K02, SFS-13-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-14 | SFS-14-K01, SFS-14-K02, SFS-14-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-15 | SFS-15-K01, SFS-15-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SFS-16 | SFS-16-K02, SFS-16-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BST-01 | BST-01-K01, BST-01-K02, BST-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BST-02 | BST-02-K02, BST-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BST-03 | BST-03-K02, BST-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BST-04 | BST-04-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BST-05 | BST-05-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BPX-01 | BPX-01-K01, BPX-01-K02, BPX-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BPX-02 | BPX-02-K01, BPX-02-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BPX-03 | BPX-03-K02, BPX-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BPX-04 | BPX-04-K01, BPX-04-K02, BPX-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BPX-05 | BPX-05-K02, BPX-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PBP-01 | PBP-01-K02, PBP-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PBP-02 | PBP-02-K01, PBP-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PBP-03 | PBP-03-K01, PBP-03-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PBP-04 | PBP-04-K01, PBP-04-K02, PBP-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PBP-05 | PBP-05-K01, PBP-05-K02, PBP-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PBP-06 | PBP-06-K01, PBP-06-K02, PBP-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PROC-01 | PROC-01-K01, PROC-01-K02, PROC-01-K03, PROC-01-K04 | Correct option is the longest in 4 of 4 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PROC-03 | PROC-03-K01, PROC-03-K02, PROC-03-K03, PROC-03-K04 | Correct option is the longest in 4 of 4 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PROC-04 | PROC-04-K01, PROC-04-K02, PROC-04-K03, PROC-04-K04 | Correct option is the longest in 4 of 4 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-FIN-01 | SHR-FIN-01-K01, SHR-FIN-01-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-FIN-02 | SHR-FIN-02-K01, SHR-FIN-02-K02, SHR-FIN-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-FIN-03 | SHR-FIN-03-K01, SHR-FIN-03-K02, SHR-FIN-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-FIN-04 | SHR-FIN-04-K01, SHR-FIN-04-K02, SHR-FIN-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-FIN-05 | SHR-FIN-05-K01, SHR-FIN-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CGC-01 | CGC-01-K01, CGC-01-K02, CGC-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CGC-02 | CGC-02-K01, CGC-02-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CGC-03 | CGC-03-K01, CGC-03-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CGC-04 | CGC-04-K01, CGC-04-K02, CGC-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CGC-05 | CGC-05-K01, CGC-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C05-L01 | C05-L01-K01, C05-L01-K02, C05-L01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C05-L02 | C05-L02-K01, C05-L02-K02, C05-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F03-L01 | F03-L01-K01 | Correct option is the longest in 1 of 2 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F03-L02 | F03-L02-K01, F03-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F03-L03 | F03-L03-K01, F03-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F03-L04 | F03-L04-K01, F03-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F05-L02 | F05-L02-K01, F05-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F08-L03 | F08-L03-K01, F08-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F13-L02 | F13-L02-K01, F13-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F13-L03 | F13-L03-K01 | Correct option is the longest in 1 of 2 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F13-L05 | F13-L05-K01, F13-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F16-L01 | F16-L01-K01, F16-L01-K03, F16-L01-K04, F16-L01-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F16-L03 | F16-L03-K01, F16-L03-K02, F16-L03-K03, F16-L03-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| custom-eco-cleaning-products-L03 | custom-eco-cleaning-products-L03-K01 | Correct option is the longest in 1 of 1 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| custom-eco-cleaning-products-L10 | custom-eco-cleaning-products-L10-K01 | Correct option is the longest in 1 of 1 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CL2-01 | CL2-01-K01, CL2-01-K02, CL2-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CL2-02 | CL2-02-K01, CL2-02-K02, CL2-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CL2-03 | CL2-03-K01, CL2-03-K02, CL2-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CL2-04 | CL2-04-K01, CL2-04-K02, CL2-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CL2-05 | CL2-05-K01, CL2-05-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CL2-06 | CL2-06-K01, CL2-06-K02, CL2-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C03-L01 | C03-L01-K01, C03-L01-K02, C03-L01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C03-L03 | C03-L03-K01, C03-L03-K02, C03-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C04-L01 | C04-L01-K01, C04-L01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C04-L03 | C04-L03-K01, C04-L03-K02, C04-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C14-L01 | C14-L01-K01, C14-L01-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C14-L02 | C14-L02-K01, C14-L02-K02, C14-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C14-L03 | C14-L03-K01, C14-L03-K02, C14-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C14-L04 | C14-L04-K01, C14-L04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C14-L05 | C14-L05-K01, C14-L05-K02, C14-L05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C14-L06 | C14-L06-K01, C14-L06-K02, C14-L06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ECO-01 | ECO-01-K01, ECO-01-K02, ECO-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ECO-02 | ECO-02-K01, ECO-02-K02, ECO-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ECO-03 | ECO-03-K01, ECO-03-K02, ECO-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ECO-04 | ECO-04-K01, ECO-04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ECO-05 | ECO-05-K01, ECO-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ECO-06 | ECO-06-K01, ECO-06-K02, ECO-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F06-L01 | F06-L01-K01, F06-L01-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F06-L02 | F06-L02-K01, F06-L02-K02, F06-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F06-L03 | F06-L03-K01, F06-L03-K02, F06-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F06-L04 | F06-L04-K01, F06-L04-K02, F06-L04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F06-L05 | F06-L05-K02, F06-L05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F07-L01 | F07-L01-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F07-L03 | F07-L03-K01, F07-L03-K02, F07-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F07-L05 | F07-L05-K01, F07-L05-K02, F07-L05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F10-L03 | F10-L03-K01, F10-L03-K02, F10-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F17-L02 | F17-L02-K01, F17-L02-K02, F17-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F17-L03 | F17-L03-K01, F17-L03-K02, F17-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-01 | HOT-01-K01, HOT-01-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-02 | HOT-02-K01, HOT-02-K02, HOT-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-03 | HOT-03-K01, HOT-03-K02, HOT-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-04 | HOT-04-K01, HOT-04-K02, HOT-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-05 | HOT-05-K01, HOT-05-K02, HOT-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-06 | HOT-06-K01, HOT-06-K02, HOT-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-07 | HOT-07-K01, HOT-07-K02, HOT-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-08 | HOT-08-K01, HOT-08-K02, HOT-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HOT-09 | HOT-09-K01, HOT-09-K02, HOT-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-01 | SOP-01-K01, SOP-01-K02, SOP-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-02 | SOP-02-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-03 | SOP-03-K01, SOP-03-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-04 | SOP-04-K01, SOP-04-K02, SOP-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-05 | SOP-05-K01, SOP-05-K02, SOP-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-06 | SOP-06-K01, SOP-06-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-07 | SOP-07-K01, SOP-07-K02, SOP-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-08 | SOP-08-K01, SOP-08-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-09 | SOP-09-K01, SOP-09-K02, SOP-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-10 | SOP-10-K01, SOP-10-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-11 | SOP-11-K01, SOP-11-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-12 | SOP-12-K02, SOP-12-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-13 | SOP-13-K01, SOP-13-K02, SOP-13-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-20 | SOP-20-K01, SOP-20-K02, SOP-20-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-21 | SOP-21-K01, SOP-21-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-22 | SOP-22-K01, SOP-22-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-23 | SOP-23-K01, SOP-23-K02, SOP-23-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-24 | SOP-24-K01, SOP-24-K02, SOP-24-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-25 | SOP-25-K01, SOP-25-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-26 | SOP-26-K02, SOP-26-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-27 | SOP-27-K01, SOP-27-K02, SOP-27-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-28 | SOP-28-K01, SOP-28-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-29 | SOP-29-K01, SOP-29-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOP-30 | SOP-30-K01, SOP-30-K02, SOP-30-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-01 | TJS-01-K01, TJS-01-K02, TJS-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-02 | TJS-02-K02, TJS-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-03 | TJS-03-K01, TJS-03-K02, TJS-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-04 | TJS-04-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-05 | TJS-05-K01, TJS-05-K02, TJS-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-06 | TJS-06-K01, TJS-06-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-07 | TJS-07-K01, TJS-07-K02, TJS-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-08 | TJS-08-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-09 | TJS-09-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-10 | TJS-10-K01, TJS-10-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-11 | TJS-11-K01, TJS-11-K02, TJS-11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-12 | TJS-12-K01, TJS-12-K02, TJS-12-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-13 | TJS-13-K01, TJS-13-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-14 | TJS-14-K01, TJS-14-K02, TJS-14-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-15 | TJS-15-K01, TJS-15-K02, TJS-15-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-16 | TJS-16-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-17 | TJS-17-K01, TJS-17-K02, TJS-17-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-18 | TJS-18-K01, TJS-18-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-20 | TJS-20-K01, TJS-20-K02, TJS-20-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-21 | TJS-21-K01, TJS-21-K02, TJS-21-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-22 | TJS-22-K01, TJS-22-K02, TJS-22-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-23 | TJS-23-K02, TJS-23-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-24 | TJS-24-K01, TJS-24-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-25 | TJS-25-K02, TJS-25-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-26 | TJS-26-K01, TJS-26-K02, TJS-26-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-27 | TJS-27-K01, TJS-27-K02, TJS-27-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-28 | TJS-28-K01, TJS-28-K02, TJS-28-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-29 | TJS-29-K01, TJS-29-K02, TJS-29-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-30 | TJS-30-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-31 | TJS-31-K01, TJS-31-K02, TJS-31-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TJS-32 | TJS-32-K01, TJS-32-K02, TJS-32-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L01 | construction-site-cleaning-L01-K01, construction-site-cleaning-L01-K02, construction-site-cleaning-L01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L02 | construction-site-cleaning-L02-K01, construction-site-cleaning-L02-K02, construction-site-cleaning-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L03 | construction-site-cleaning-L03-K01, construction-site-cleaning-L03-K02, construction-site-cleaning-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L04 | construction-site-cleaning-L04-K01, construction-site-cleaning-L04-K02, construction-site-cleaning-L04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L05 | construction-site-cleaning-L05-K01, construction-site-cleaning-L05-K02, construction-site-cleaning-L05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L06 | construction-site-cleaning-L06-K01, construction-site-cleaning-L06-K02, construction-site-cleaning-L06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L07 | construction-site-cleaning-L07-K01, construction-site-cleaning-L07-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L08 | construction-site-cleaning-L08-K01, construction-site-cleaning-L08-K02, construction-site-cleaning-L08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L10 | construction-site-cleaning-L10-K01, construction-site-cleaning-L10-K02, construction-site-cleaning-L10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| construction-site-cleaning-L11 | construction-site-cleaning-L11-K01, construction-site-cleaning-L11-K02, construction-site-cleaning-L11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L02 | kitchen-cleaning-L02-K01, kitchen-cleaning-L02-K02, kitchen-cleaning-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L05 | kitchen-cleaning-L05-K01, kitchen-cleaning-L05-K02, kitchen-cleaning-L05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L06 | kitchen-cleaning-L06-K01, kitchen-cleaning-L06-K02, kitchen-cleaning-L06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L07 | kitchen-cleaning-L07-K01, kitchen-cleaning-L07-K02, kitchen-cleaning-L07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L08 | kitchen-cleaning-L08-K01, kitchen-cleaning-L08-K02, kitchen-cleaning-L08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L09 | kitchen-cleaning-L09-K01, kitchen-cleaning-L09-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L10 | kitchen-cleaning-L10-K01, kitchen-cleaning-L10-K02, kitchen-cleaning-L10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| kitchen-cleaning-L11 | kitchen-cleaning-L11-K01, kitchen-cleaning-L11-K02, kitchen-cleaning-L11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| warehouse-deep-cleaning-L05 | warehouse-deep-cleaning-L05-K01, warehouse-deep-cleaning-L05-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| warehouse-deep-cleaning-L10 | warehouse-deep-cleaning-L10-K01, warehouse-deep-cleaning-L10-K02, warehouse-deep-cleaning-L10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F01-L02 | F01-L02-K01, F01-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F11-L02 | F11-L02-K01, F11-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F11-L05 | F11-L05-K01, F11-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F12-L05 | F12-L05-K01 | Correct option is the longest in 1 of 2 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F14-L01 | F14-L01-K01, F14-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F14-L05 | F14-L05-K01, F14-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F15-L05 | F15-L05-K02, F15-L05-K03, F15-L05-K04, F15-L05-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-PLN-01 | SHR-PLN-01-K01, SHR-PLN-01-K02, SHR-PLN-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C05-L03 | C05-L03-K01, C05-L03-K02, C05-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F04-L01 | F04-L01-K01, F04-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F04-L02 | F04-L02-K01, F04-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F04-L03 | F04-L03-K01, F04-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F04-L04 | F04-L04-K01, F04-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F08-L04 | F08-L04-K01, F08-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F10-L04 | F10-L04-K01, F10-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F17-L01 | F17-L01-K01, F17-L01-K02, F17-L01-K03, F17-L01-K04, F17-L01-K05 | Correct option is the longest in 5 of 5 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| high-access-window-cleaning-L06 | high-access-window-cleaning-L06-K01, high-access-window-cleaning-L06-K02, high-access-window-cleaning-L06-K03, high-access-window-cleaning-L06-K04, high-access-window-cleaning-L06-K05 | Correct option is the longest in 5 of 5 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| high-access-window-cleaning-L02 | high-access-window-cleaning-L02-K01 | Correct option is the longest in 1 of 1 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| high-access-window-cleaning-L04 | high-access-window-cleaning-L04-K01 | Correct option is the longest in 1 of 1 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| roof-cleaning-soft-washing-L09 | roof-cleaning-soft-washing-L09-K01 | Correct option is the longest in 1 of 1 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ACE-01 | ACE-01-K01, ACE-01-K02, ACE-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ACE-02 | ACE-02-K01, ACE-02-K02, ACE-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ACE-03 | ACE-03-K01, ACE-03-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ACE-04 | ACE-04-K02, ACE-04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BRY-01 | BRY-01-K02, BRY-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BRY-02 | BRY-02-K01, BRY-02-K02, BRY-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BRY-03 | BRY-03-K01, BRY-03-K02, BRY-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-01 | PTB-01-K01, PTB-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-02 | PTB-02-K01, PTB-02-K02, PTB-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-03 | PTB-03-K01, PTB-03-K02, PTB-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-04 | PTB-04-K01, PTB-04-K02, PTB-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-05 | PTB-05-K01, PTB-05-K02, PTB-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-06 | PTB-06-K01, PTB-06-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-07 | PTB-07-K01, PTB-07-K02, PTB-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-08 | PTB-08-K01, PTB-08-K02, PTB-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-09 | PTB-09-K01, PTB-09-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-10 | PTB-10-K01, PTB-10-K02, PTB-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-11 | PTB-11-K01, PTB-11-K02, PTB-11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-12 | PTB-12-K01, PTB-12-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PTB-13 | PTB-13-K01, PTB-13-K02, PTB-13-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| YNS-01 | YNS-01-K01, YNS-01-K02, YNS-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| YNS-02 | YNS-02-K01, YNS-02-K02, YNS-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| YNS-03 | YNS-03-K01, YNS-03-K02, YNS-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| YNS-04 | YNS-04-K01, YNS-04-K02, YNS-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-01 | FPS-01-K01, FPS-01-K02, FPS-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-02 | FPS-02-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-03 | FPS-03-K01, FPS-03-K02, FPS-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-04 | FPS-04-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-05 | FPS-05-K01, FPS-05-K02, FPS-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-06 | FPS-06-K01, FPS-06-K02, FPS-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-07 | FPS-07-K01, FPS-07-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| FPS-08 | FPS-08-K01, FPS-08-K02, FPS-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| GCM-01 | GCM-01-K01, GCM-01-K02, GCM-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| GCM-02 | GCM-02-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| GCM-03 | GCM-03-K01, GCM-03-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-01 | HBM-01-K02, HBM-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-02 | HBM-02-K01, HBM-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-03 | HBM-03-K01, HBM-03-K02, HBM-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-04 | HBM-04-K01, HBM-04-K02, HBM-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-05 | HBM-05-K01, HBM-05-K02, HBM-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-06 | HBM-06-K01, HBM-06-K02, HBM-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-07 | HBM-07-K01, HBM-07-K02, HBM-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-08 | HBM-08-K01, HBM-08-K02, HBM-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-09 | HBM-09-K01, HBM-09-K02, HBM-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-10 | HBM-10-K01, HBM-10-K02, HBM-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-11 | HBM-11-K01, HBM-11-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-12 | HBM-12-K01, HBM-12-K02, HBM-12-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-13 | HBM-13-K01, HBM-13-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-14 | HBM-14-K02, HBM-14-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-15 | HBM-15-K01, HBM-15-K02, HBM-15-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HBM-16 | HBM-16-K01, HBM-16-K02, HBM-16-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ADA-01 | ADA-01-K01, ADA-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ADA-02 | ADA-02-K01, ADA-02-K02, ADA-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ADA-03 | ADA-03-K01, ADA-03-K02, ADA-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ADA-04 | ADA-04-K01, ADA-04-K02, ADA-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ADA-05 | ADA-05-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| ADA-06 | ADA-06-K01, ADA-06-K02, ADA-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| DIP-01 | DIP-01-K01, DIP-01-K02, DIP-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| DIP-02 | DIP-02-K01, DIP-02-K02, DIP-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| DIP-03 | DIP-03-K01, DIP-03-K02, DIP-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-01 | HCG-01-K01, HCG-01-K02, HCG-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-02 | HCG-02-K01, HCG-02-K02, HCG-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-03 | HCG-03-K01, HCG-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-04 | HCG-04-K01, HCG-04-K02, HCG-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-05 | HCG-05-K01, HCG-05-K02, HCG-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-06 | HCG-06-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-07 | HCG-07-K02, HCG-07-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-08 | HCG-08-K02, HCG-08-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-10 | HCG-10-K01, HCG-10-K02, HCG-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-11 | HCG-11-K01, HCG-11-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-12 | HCG-12-K01, HCG-12-K02, HCG-12-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-13 | HCG-13-K02, HCG-13-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-14 | HCG-14-K01, HCG-14-K02, HCG-14-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-15 | HCG-15-K01, HCG-15-K02, HCG-15-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-16 | HCG-16-K01, HCG-16-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-17 | HCG-17-K01, HCG-17-K02, HCG-17-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-18 | HCG-18-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-19 | HCG-19-K01, HCG-19-K02, HCG-19-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HCG-20 | HCG-20-K02, HCG-20-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HIP-01 | HIP-01-K01, HIP-01-K02, HIP-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HIP-02 | HIP-02-K01, HIP-02-K02, HIP-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HIP-03 | HIP-03-K01, HIP-03-K02, HIP-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HIP-04 | HIP-04-K01, HIP-04-K02, HIP-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HIP-05 | HIP-05-K01, HIP-05-K02, HIP-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-01 | HLT-01-K01, HLT-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-02 | HLT-02-K02, HLT-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-03 | HLT-03-K02, HLT-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-04 | HLT-04-K01, HLT-04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-05 | HLT-05-K01, HLT-05-K02, HLT-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-06 | HLT-06-K01, HLT-06-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-07 | HLT-07-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-08 | HLT-08-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-09 | HLT-09-K01, HLT-09-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-10 | HLT-10-K01, HLT-10-K02, HLT-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-11 | HLT-11-K01, HLT-11-K02, HLT-11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-12 | HLT-12-K01, HLT-12-K02, HLT-12-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-13 | HLT-13-K01, HLT-13-K02, HLT-13-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HLT-14 | HLT-14-K01, HLT-14-K02, HLT-14-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| OTI-01 | OTI-01-K01, OTI-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| OTI-02 | OTI-02-K01, OTI-02-K02, OTI-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| OTI-03 | OTI-03-K01, OTI-03-K02, OTI-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| OTI-04 | OTI-04-K01, OTI-04-K02, OTI-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| OTI-05 | OTI-05-K01, OTI-05-K02, OTI-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C01-L01 | C01-L01-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C01-L02 | C01-L02-K01, C01-L02-K02, C01-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C01-L03 | C01-L03-K01, C01-L03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F01-L01 | F01-L01-K01, F01-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F01-L03 | F01-L03-K01, F01-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F10-L01 | F10-L01-K01, F10-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F15-L01 | F15-L01-K02, F15-L01-K03, F15-L01-K05 | Correct option is the longest in 3 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F15-L02 | F15-L02-K02, F15-L02-K03, F15-L02-K04, F15-L02-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F15-L04 | F15-L04-K02, F15-L04-K03, F15-L04-K04, F15-L04-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C02-L01 | C02-L01-K01, C02-L01-K02, C02-L01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C02-L02 | C02-L02-K01, C02-L02-K02, C02-L02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C02-L03 | C02-L03-K01, C02-L03-K02, C02-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F01-L04 | F01-L04-K01, F01-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F05-L01 | F05-L01-K01, F05-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F05-L03 | F05-L03-K01, F05-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F11-L04 | F11-L04-K01, F11-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F19-L01 | F19-L01-K01, F19-L01-K02, F19-L01-K03, F19-L01-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F19-L05 | F19-L05-K01, F19-L05-K02, F19-L05-K03, F19-L05-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-02 | BP-02-K01, BP-02-K02, BP-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-04 | BP-04-K01, BP-04-K02, BP-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CP-01 | CP-01-K01, CP-01-K02, CP-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CP-02 | CP-02-K01, CP-02-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CP-03 | CP-03-K01, CP-03-K02, CP-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CP-04 | CP-04-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F11-L06 | F11-L06-K01, F11-L06-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-01 | MP-01-K01, MP-01-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-02 | MP-02-K02, MP-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-03 | MP-03-K01, MP-03-K02, MP-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-PLN-05 | SHR-PLN-05-K01, SHR-PLN-05-K02, SHR-PLN-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-05 | SOL-05-K01, SOL-05-K02, SOL-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-06 | SOL-06-K01, SOL-06-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-08 | SOL-08-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| NHS-01 | NHS-01-K01, NHS-01-K02, NHS-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| NHS-02 | NHS-02-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| NHS-03 | NHS-03-K01, NHS-03-K02, NHS-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| NHS-04 | NHS-04-K01, NHS-04-K02, NHS-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F10-L02 | F10-L02-K01, F10-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F13-L01 | F13-L01-K01, F13-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F13-L04 | F13-L04-K01, F13-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F13-L06 | F13-L06-K01, F13-L06-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F18-L01 | F18-L01-K01, F18-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F18-L02 | F18-L02-K01, F18-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F18-L04 | F18-L04-K01, F18-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F18-L05 | F18-L05-K01, F18-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F18-L06 | F18-L06-K01, F18-L06-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F20-L06 | F20-L06-K01, F20-L06-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-05 | MP-05-K01, MP-05-K02, MP-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-06 | MP-06-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-07 | MP-07-K02, MP-07-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-08 | MP-08-K01, MP-08-K02, MP-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PRO-02 | PRO-02-K01, PRO-02-K02, PRO-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-07 | SOL-07-K01, SOL-07-K02, SOL-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-01 | THS-01-K01, THS-01-K02, THS-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-02 | THS-02-K01, THS-02-K02, THS-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-03 | THS-03-K01, THS-03-K02, THS-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-04 | THS-04-K01, THS-04-K02, THS-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-05 | THS-05-K01, THS-05-K02, THS-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-06 | THS-06-K01, THS-06-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| THS-07 | THS-07-K01, THS-07-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| additional-specialist-services-L01 | additional-specialist-services-L01-K01, additional-specialist-services-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| garden-cleanups-L06 | garden-cleanups-L06-K01, garden-cleanups-L06-K02, garden-cleanups-L06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| garden-cleanups-L07 | garden-cleanups-L07-K01, garden-cleanups-L07-K02, garden-cleanups-L07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| garden-cleanups-L09 | garden-cleanups-L09-K01, garden-cleanups-L09-K02, garden-cleanups-L09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| garden-cleanups-L10 | garden-cleanups-L10-K01, garden-cleanups-L10-K02, garden-cleanups-L10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PCS-01 | PCS-01-K01, PCS-01-K02, PCS-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PCS-02 | PCS-02-K01, PCS-02-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PCS-03 | PCS-03-K01, PCS-03-K02, PCS-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PFM-01 | PFM-01-K01, PFM-01-K02, PFM-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PFM-02 | PFM-02-K01, PFM-02-K02, PFM-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PFM-03 | PFM-03-K01, PFM-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PFM-04 | PFM-04-K01, PFM-04-K02, PFM-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PFM-05 | PFM-05-K01, PFM-05-K02, PFM-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PFM-06 | PFM-06-K01, PFM-06-K02, PFM-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-01 | PHM-01-K01, PHM-01-K02, PHM-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-02 | PHM-02-K01, PHM-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-03 | PHM-03-K01, PHM-03-K02, PHM-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-04 | PHM-04-K02, PHM-04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-05 | PHM-05-K01, PHM-05-K02, PHM-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-06 | PHM-06-K01, PHM-06-K02, PHM-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-07 | PHM-07-K01, PHM-07-K02, PHM-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-08 | PHM-08-K01, PHM-08-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PHM-09 | PHM-09-K02, PHM-09-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| POM-01 | POM-01-K01, POM-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| POM-02 | POM-02-K01, POM-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| POM-03 | POM-03-K01, POM-03-K02, POM-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| POM-04 | POM-04-K02, POM-04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-02 | PSA-02-K02, PSA-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-03 | PSA-03-K01, PSA-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-04 | PSA-04-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-05 | PSA-05-K02, PSA-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-06 | PSA-06-K01, PSA-06-K02, PSA-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-08 | PSA-08-K01, PSA-08-K02, PSA-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-09 | PSA-09-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-10 | PSA-10-K01, PSA-10-K02, PSA-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-11 | PSA-11-K01, PSA-11-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-13 | PSA-13-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-14 | PSA-14-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-15 | PSA-15-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PSA-16 | PSA-16-K02, PSA-16-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-01 | PVB-01-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-02 | PVB-02-K02, PVB-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-03 | PVB-03-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-04 | PVB-04-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-05 | PVB-05-K01, PVB-05-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-06 | PVB-06-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-07 | PVB-07-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PVB-08 | PVB-08-K01, PVB-08-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C09-L01 | C09-L01-K01 | Correct option is the longest in 1 of 2 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C09-L02 | C09-L02-K01, C09-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C09-L03 | C09-L03-K01, C09-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F09-L01 | F09-L01-K01, F09-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F09-L02 | F09-L02-K01, F09-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F09-L03 | F09-L03-K01, F09-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F09-L04 | F09-L04-K01, F09-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F09-L05 | F09-L05-K01, F09-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F10-L05 | F10-L05-K01, F10-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F19-L06 | F19-L06-K01, F19-L06-K02, F19-L06-K03, F19-L06-K05 | Correct option is the longest in 4 of 5 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PRO-03 | PRO-03-K01, PRO-03-K02, PRO-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S12-L03 | S12-L03-K02, S12-L03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S12-L08 | S12-L08-K01, S12-L08-K02, S12-L08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| additional-specialist-services-L12 | additional-specialist-services-L12-K01, additional-specialist-services-L12-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-05 | BP-05-K01, BP-05-K02, BP-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F11-L03 | F11-L03-K01, F11-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| MP-04 | MP-04-K01, MP-04-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| PRO-01 | PRO-01-K01, PRO-01-K02, PRO-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-03 | SOL-03-K01, SOL-03-K02, SOL-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C10-L01 | C10-L01-K01, C10-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C10-L02 | C10-L02-K01, C10-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| C10-L03 | C10-L03-K01, C10-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F02-L01 | F02-L01-K01, F02-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F02-L02 | F02-L02-K01, F02-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F02-L03 | F02-L03-K01, F02-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F02-L04 | F02-L04-K01, F02-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F08-L01 | F08-L01-K01, F08-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F08-L02 | F08-L02-K01, F08-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F08-L05 | F08-L05-K01, F08-L05-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F14-L02 | F14-L02-K01, F14-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F14-L04 | F14-L04-K01, F14-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F15-L03 | F15-L03-K01, F15-L03-K02, F15-L03-K03, F15-L03-K04, F15-L03-K05 | Correct option is the longest in 5 of 5 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F15-L06 | F15-L06-K01, F15-L06-K02, F15-L06-K03, F15-L06-K04, F15-L06-K05 | Correct option is the longest in 5 of 5 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F17-L04 | F17-L04-K01, F17-L04-K02, F17-L04-K03, F17-L04-K04, F17-L04-K05 | Correct option is the longest in 5 of 5 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F17-L05 | F17-L05-K01, F17-L05-K02, F17-L05-K03, F17-L05-K04, F17-L05-K05 | Correct option is the longest in 5 of 5 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-01 | RAS-01-K02, RAS-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-02 | RAS-02-K01, RAS-02-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-03 | RAS-03-K01, RAS-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-04 | RAS-04-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-05 | RAS-05-K01, RAS-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-06 | RAS-06-K01, RAS-06-K02, RAS-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-07 | RAS-07-K01, RAS-07-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-08 | RAS-08-K01, RAS-08-K02, RAS-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-09 | RAS-09-K01, RAS-09-K02, RAS-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-10 | RAS-10-K01, RAS-10-K02, RAS-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-11 | RAS-11-K01, RAS-11-K02, RAS-11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-12 | RAS-12-K01, RAS-12-K02, RAS-12-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-13 | RAS-13-K01, RAS-13-K02, RAS-13-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-14 | RAS-14-K01, RAS-14-K02, RAS-14-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-15 | RAS-15-K01, RAS-15-K02, RAS-15-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| RAS-16 | RAS-16-K01, RAS-16-K02, RAS-16-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S14-L03 | S14-L03-K01, S14-L03-K02, S14-L03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S14-L04 | S14-L04-K01, S14-L04-K02, S14-L04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S14-L05 | S14-L05-K02, S14-L05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S14-L07 | S14-L07-K01, S14-L07-K02, S14-L07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| S14-L08 | S14-L08-K01, S14-L08-K02, S14-L08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-01 | WAH-01-K01, WAH-01-K02, WAH-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-02 | WAH-02-K01, WAH-02-K02, WAH-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-03 | WAH-03-K02, WAH-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-04 | WAH-04-K01, WAH-04-K02, WAH-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-05 | WAH-05-K01, WAH-05-K02, WAH-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-06 | WAH-06-K01 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-07 | WAH-07-K01, WAH-07-K02, WAH-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-08 | WAH-08-K01, WAH-08-K02, WAH-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-09 | WAH-09-K01, WAH-09-K02, WAH-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-10 | WAH-10-K01, WAH-10-K02, WAH-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| WAH-11 | WAH-11-K01, WAH-11-K02, WAH-11-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-01 | HSE-01-K01, HSE-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-02 | HSE-02-K01, HSE-02-K02, HSE-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-03 | HSE-03-K02 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-04 | HSE-04-K01, HSE-04-K02, HSE-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-05 | HSE-05-K01, HSE-05-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-06 | HSE-06-K01, HSE-06-K02, HSE-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-07 | HSE-07-K01, HSE-07-K02, HSE-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-08 | HSE-08-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-09 | HSE-09-K01, HSE-09-K02, HSE-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| HSE-10 | HSE-10-K02, HSE-10-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-01 | SAH-01-K01, SAH-01-K02, SAH-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-02 | SAH-02-K01, SAH-02-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-03 | SAH-03-K02, SAH-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-04 | SAH-04-K01, SAH-04-K02, SAH-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-05 | SAH-05-K01, SAH-05-K02, SAH-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-06 | SAH-06-K01, SAH-06-K02, SAH-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-07 | SAH-07-K01, SAH-07-K02, SAH-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-08 | SAH-08-K02, SAH-08-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-09 | SAH-09-K03 | Correct option is the longest in 1 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-10 | SAH-10-K02, SAH-10-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SAH-11 | SAH-11-K01, SAH-11-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-01 | BP-01-K02, BP-01-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-03 | BP-03-K01, BP-03-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-06 | BP-06-K01, BP-06-K02, BP-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F11-L01 | F11-L01-K01, F11-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-PLN-02 | SHR-PLN-02-K01, SHR-PLN-02-K02, SHR-PLN-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SHR-PLN-03 | SHR-PLN-03-K01, SHR-PLN-03-K02, SHR-PLN-03-K04 | Correct option is the longest in 3 of 4 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-01 | SOL-01-K01, SOL-01-K02, SOL-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-02 | SOL-02-K01, SOL-02-K02, SOL-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| SOL-04 | SOL-04-K01, SOL-04-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| additional-specialist-services-L04 | additional-specialist-services-L04-K01, additional-specialist-services-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| BP-07 | BP-07-K01, BP-07-K02, BP-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F12-L01 | F12-L01-K01, F12-L01-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F12-L02 | F12-L02-K01, F12-L02-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F12-L03 | F12-L03-K01, F12-L03-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F12-L04 | F12-L04-K01, F12-L04-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| F12-L06 | F12-L06-K01, F12-L06-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-01 | TLD-01-K01, TLD-01-K02, TLD-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-02 | TLD-02-K01, TLD-02-K02, TLD-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-03 | TLD-03-K01, TLD-03-K02, TLD-03-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-04 | TLD-04-K01, TLD-04-K02 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-05 | TLD-05-K02, TLD-05-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-06 | TLD-06-K01, TLD-06-K02, TLD-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-07 | TLD-07-K01, TLD-07-K02, TLD-07-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-08 | TLD-08-K01, TLD-08-K02, TLD-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-09 | TLD-09-K01, TLD-09-K02, TLD-09-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-10 | TLD-10-K01, TLD-10-K02, TLD-10-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| TLD-11 | TLD-11-K01, TLD-11-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| additional-specialist-services-L10 | additional-specialist-services-L10-K01, additional-specialist-services-L10-K02 | Correct option is the longest in 2 of 2 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-01 | CPV-01-K01, CPV-01-K02, CPV-01-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-02 | CPV-02-K01, CPV-02-K02, CPV-02-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-03 | CPV-03-K01, CPV-03-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-04 | CPV-04-K01, CPV-04-K02, CPV-04-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-05 | CPV-05-K01, CPV-05-K02, CPV-05-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-06 | CPV-06-K01, CPV-06-K02, CPV-06-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-07 | CPV-07-K01, CPV-07-K03 | Correct option is the longest in 2 of 3 checks | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |
| CPV-08 | CPV-08-K01, CPV-08-K02, CPV-08-K03 | Correct option is the longest in 3 of 3 checks (every check in lesson) | Trim the correct option or lengthen the distractors so the correct option is not the longest; aim for lengths within about 20% of each other. |

## Change log

Each row is one option rewrite in a learner file under `curriculum/shared/`. Correct options and `correctIndex` were not changed. Column "Reason" shows the audit flags that the rewrite addresses.

| # | File | Check id | Old option | New option | Reason |
|---|---|---|---|---|---|
| 1 | `shared/app/SFS-04.json` | SFS-04-K02 | Because the scheduler then ignores skills | Because the scheduler then matches workers on availability alone, which saves setup time | absolute wording |
| 2 | `shared/app/SFS-04.json` | SFS-04-K03 | Customer bank details | Customer bank account details, stored against every visit | fragment (length) |
| 3 | `shared/app/SFS-07.json` | SFS-07-K01 | Finished | Completed and paid, with the invoice sent to the office | fragment (length) |
| 4 | `shared/app/SFS-07.json` | SFS-07-K01 | Deleted | Cancelled without a note, so the job is removed from the list | fragment (length) |
| 5 | `shared/app/SFS-09.json` | SFS-09-K01 | Delete the visit | Keep the visit as final and send the invoice to the client | fragment (length) |
| 6 | `shared/app/SFS-11.json` | SFS-11-K02 | A preferred worker is always excluded | A preferred worker is removed from the job whenever a required worker is also listed | absolute wording |
| 7 | `shared/app/SFS-11.json` | SFS-11-K03 | A random worker from the list | The worker who was most recently assigned to the site | absolute wording |
| 8 | `shared/app/SFS-12.json` | SFS-12-K01 | Yes, always | Yes, if the second crew is booked by a different manager | absolute wording; fragment (length) |
| 9 | `shared/app/SFS-14.json` | SFS-14-K01 | Delete the job | Cancel the job and ask the customer to buy the part directly | fragment (length) |
| 10 | `shared/app/SFS-14.json` | SFS-14-K03 | Cancels the job | Copies the job to another visit and removes the stock record | fragment (length) |
| 11 | `shared/app/SFS-15.json` | SFS-15-K03 | Always the change entered from a computer | The change entered from a computer, since desktop entries are trusted more | absolute wording |
| 12 | `shared/business-stats/BST-01.json` | BST-01-K01 | $1,100, the largest job | $1,100, the figure a client would quote for a full house | repeats the question; repeat: option reused the question's 'most recent'/'job' wording; reworded as a plausible wrong figure |
| 13 | `shared/business-stats/BST-01.json` | BST-01-K02 | Because it always matches the middle job | Because it matches the most common job size exactly | absolute wording |
| 14 | `shared/business-stats/BST-01.json` | BST-01-K02 | Because it ignores large jobs, which keeps the estimate realistic | Because it drops the largest jobs, which keeps the estimate realistic | absolute wording |
| 15 | `shared/business-stats/BST-01.json` | BST-01-K03 | Quote the mean from now on without checking anything else | Quote the mean from now on, since it is the most accurate figure available | absolute wording |
| 16 | `shared/business-stats/BST-03.json` | BST-03-K03 | Throw the result away because 50 per cent can never be right | Treat it as proof that repeat custom will be exactly 50 per cent for every future batch | absolute wording |
| 17 | `shared/business/BPX-02.json` | BPX-02-K02 | In long-term liabilities | In equity, as an owner's contribution to the business | fragment (length) |
| 18 | `shared/business/BPX-04.json` | BPX-04-K03 | Ignore storage, because the plan does not mention it | Store them beside the food freezer, because the plan does not mention a separate place | absolute wording |
| 19 | `shared/business/BPX-05.json` | BPX-05-K03 | A fixed number that must always be above 2.0 | A fixed legal limit that the business must reach each quarter | absolute wording |
| 20 | `shared/business/PBP-01.json` | PBP-01-K03 | Its descriptions and prices should be copied to save time | Its descriptions and prices should be copied as the business's own, since they are already tested | joke or throwaway wording |
| 21 | `shared/business/PBP-02.json` | PBP-02-K03 | The chemical supplier | The chemical supplier that sells the pool products for each home | fragment (length) |
| 22 | `shared/business/PBP-03.json` | PBP-03-K01 | At whatever the client is willing to pay | At the rate the nearest competitor advertises on its website | absolute wording |
| 23 | `shared/business/PBP-05.json` | PBP-05-K02 | Delete the entry | Keep it in use with a note that the source is pending | fragment (length) |
| 24 | `shared/business/PROC-03.json` | PROC-03-K04 | The lowest price seen in any market at any time | The lowest price found in a single online listing last week | absolute wording |
| 25 | `shared/business/PROC-04.json` | PROC-04-K01 | Purchase price alone | The lowest up-front price, since that is the cost the buyer pays first | fragment (length); repeats the question |
| 26 | `shared/business/SHR-FIN-02.json` | SHR-FIN-02-K02 | A tax agent can ignore it if the amounts are round | A tax agent can skip it when the amounts are small and round | absolute wording |
| 27 | `shared/business/SHR-FIN-03.json` | SHR-FIN-03-K03 | It applies to every purchase, whatever its size or the business's turnover | It applies to every purchase made by a sole trader in the first year | absolute wording |
| 28 | `shared/caregiving/CGC-01.json` | CGC-01-K03 | Left undefined | Used without explanation, since the team already knows it | fragment (length) |
| 29 | `shared/caregiving/CGC-05.json` | CGC-05-K01 | Ignored if no one was hurt | Recorded in a diary and reviewed at the next annual audit | absolute wording |
| 30 | `shared/caregiving/CGC-05.json` | CGC-05-K03 | Replace the policy | Replace the written policy with the meeting minutes | fragment (length) |
| 31 | `shared/chemicals/C05-L02.json` | C05-L02-K03 | Dispense it into a drinking bottle to save time | Dispense it into a clean spray bottle that is kept at the bench | joke or throwaway wording |
| 32 | `shared/chemicals/F03-L04.json` | F03-L04-K02 | Mop it up with whatever absorbent is nearby | Mop it up with a towel from the nearest cleaning cart | absolute wording |
| 33 | `shared/chemicals/F13-L02.json` | F13-L02-K01 | Whether it is cheaper. | Whether the product smells pleasant and looks clean in use. | joke or throwaway wording |
| 34 | `shared/chemicals/F13-L02.json` | F13-L02-K02 | Only the price. | The price, the supplier's sales pitch and the brand on the label. | fragment (length) |
| 35 | `shared/chemicals/F13-L03.json` | F13-L03-K01 | Use it and hope the surface is clean. | Use it again on a second surface to check the strength. | joke or throwaway wording |
| 36 | `shared/chemicals/F13-L03.json` | F13-L03-K02 | Because mixing is cheaper if done at the end of the day. | Because a mix stored overnight keeps its full strength for later use. | joke or throwaway wording |
| 37 | `shared/chemicals/F16-L01.json` | F16-L01-K03 | Use a descaler, since it cuts through anything | Use a descaler, since it is the strongest product on the trolley | absolute wording |
| 38 | `shared/chemicals/F16-L01.json` | F16-L01-K03 | Use the nearest bottle, whatever its category | Use the nearest bottle, since the label category matters little | absolute wording |
| 39 | `shared/cleaning-guide/CL2-01.json` | CL2-01-K03 | It is always wrong and should be ignored. | It is accurate for every site, so the business can price from it directly. | absolute wording |
| 40 | `shared/cleaning-guide/CL2-03.json` | CL2-03-K01 | Carry on carefully, because the task is short. | Stand on the carpet edge, since the wobble is minor and the task is short. | joke or throwaway wording |
| 41 | `shared/cleaning-guide/CL2-04.json` | CL2-04-K03 | Whenever the customer asks, whatever the condition of the carpet. | As soon as the customer asks, even if the carpet is still wet. | absolute wording |
| 42 | `shared/cleaning-guide/CL2-05.json` | CL2-05-K03 | Raise it while the centre broom is turning, to save time. | Raise it while the centre broom is turning, since the dust goes straight into the hopper. | joke or throwaway wording |
| 43 | `shared/cleaning-guide/CL2-05.json` | CL2-05-K03 | Raise it at any time, because the broom is shielded. | Raise it straight away, because the broom guard blocks any contact. | absolute wording |
| 44 | `shared/cleaning/C03-L01.json` | C03-L01-K01 | Because the tap is more expensive | Because the tap finish scratches easily under a damp cloth | joke or throwaway wording |
| 45 | `shared/cleaning/C03-L03.json` | C03-L03-K01 | Ignore it, because the basin is nearly finished | Finish the basin first, then note the brush for the next training session | absolute wording |
| 46 | `shared/cleaning/C03-L03.json` | C03-L03-K01 | Rinse the brush and carry on | Rinse the brush and return it to the same toilet tool set | joke or throwaway wording |
| 47 | `shared/cleaning/C04-L01.json` | C04-L01-K01 | Because the sanitiser is more expensive on dirt | Because dirt makes the sanitiser smell stronger and slows the mix | joke or throwaway wording |
| 48 | `shared/cleaning/C14-L03.json` | C14-L03-K03 | Test it quickly | Test it on a small corner first, then report the result afterwards | fragment (length) |
| 49 | `shared/cleaning/C14-L04.json` | C14-L04-K01 | Pull harder | Pull the part with steady force, then check it for damage later | fragment (length) |
| 50 | `shared/cleaning/C14-L05.json` | C14-L05-K02 | Reposition it yourself | Reposition it yourself, then reconnect the hose and finish the job | fragment (length); residual joke wording: 'carry on' removed |
| 51 | `shared/cleaning/ECO-01.json` | ECO-01-K02 | Remove the plug while the machine is still running to save time | Remove the plug at the cord while the machine is still switched on | joke or throwaway wording |
| 52 | `shared/cleaning/ECO-02.json` | ECO-02-K01 | Using the same cloth for every area to save time | Using the same cloth for every area, since the colour is only a guide | joke or throwaway wording |
| 53 | `shared/cleaning/F06-L01.json` | F06-L01-K03 | Wear PPE and carry on | Wear PPE and keep the task going as normal | joke or throwaway wording |
| 54 | `shared/cleaning/F06-L01.json` | F06-L01-K03 | Record it and leave it for the next shift | Record it and wait for the next routine review. | joke or throwaway wording |
| 55 | `shared/cleaning/F06-L02.json` | F06-L02-K01 | They are cheaper and should be saved for the floor | They are less worn and should be kept for the vanity surfaces | joke or throwaway wording |
| 56 | `shared/cleaning/F06-L03.json` | F06-L03-K03 | Mixed products are always cheaper | Mixed products cost less per clean, so the mix is kept on the trolley | absolute wording; joke or throwaway wording |
| 57 | `shared/cleaning/F06-L04.json` | F06-L04-K01 | Because the floor is always the cleanest surface | Because the floor is the surface most people look at last | absolute wording |
| 58 | `shared/cleaning/F06-L04.json` | F06-L04-K02 | Use the contact time from a different product | Rinse at once, because the product label is only a rough guide | repeats the question |
| 59 | `shared/cleaning/F06-L05.json` | F06-L05-K01 | It makes the inspection faster than checking randomly | It makes the inspection quicker by skipping the rooms that look clean | absolute wording |
| 60 | `shared/cleaning/F06-L05.json` | F06-L05-K03 | The floor | The sink, the mirror and the window frame | fragment (length) |
| 61 | `shared/cleaning/F07-L03.json` | F07-L03-K03 | The client's car | The client's car, the garden hose and the parked bicycle | fragment (length) |
| 62 | `shared/cleaning/F07-L03.json` | F07-L03-K03 | Only the floor | The floor and the skirting boards, which are the main risk | fragment (length) |
| 63 | `shared/cleaning/F10-L03.json` | F10-L03-K03 | Never after the first assessment | At the end of each contract year, when the paperwork is filed | absolute wording |
| 64 | `shared/cleaning/F17-L03.json` | F17-L03-K02 | It is cheaper | It is kept for the mop bucket, which is smaller | joke or throwaway wording |
| 65 | `shared/cleaning/F17-L03.json` | F17-L03-K03 | Working faster | Working faster, so the area is ready sooner for the client | fragment (length) |
| 66 | `shared/cleaning/HOT-02.json` | HOT-02-K03 | Vacuum the floor | Vacuum the floor and wipe the bed frame before the linen is touched | fragment (length); residual absolute wording: 'anything' removed |
| 67 | `shared/cleaning/HOT-05.json` | HOT-05-K02 | Use it, because the stain is small and on the top sheet | Use it after a quick rinse, because a small stain is not a hygiene risk | repeats the question |
| 68 | `shared/cleaning/HOT-05.json` | HOT-05-K03 | Dragging it across the floor to the bed to save time | Dragging it across the floor to the bed, since the floor is clean | joke or throwaway wording |
| 69 | `shared/cleaning/HOT-08.json` | HOT-08-K03 | Random, so that different things are checked each time | The route the worker finds quickest, so the walk-through takes less time | absolute wording |
| 70 | `shared/cleaning/SOP-03.json` | SOP-03-K02 | To show which products are the most expensive | To show which products are the strongest for each job | joke or throwaway wording |
| 71 | `shared/cleaning/SOP-04.json` | SOP-04-K02 | Random strokes across the room, finishing at the door | Wide arcs across the room, finishing at the window | absolute wording |
| 72 | `shared/cleaning/SOP-06.json` | SOP-06-K02 | Never, so the job keeps moving | Once the job is finished, so the pad stays clean for the next room | absolute wording |
| 73 | `shared/cleaning/SOP-08.json` | SOP-08-K03 | Stand on a chair and carry on carefully | Stand on a chair and reach across, keeping your balance | joke or throwaway wording |
| 74 | `shared/cleaning/SOP-09.json` | SOP-09-K03 | The smell is always offensive to clients | A strong smell shows the polish has cured, so a quick sniff confirms it | absolute wording |
| 75 | `shared/cleaning/SOP-10.json` | SOP-10-K01 | Nothing, because gloves always protect the hands | Nothing, because gloves protect the hands from cuts on their own | absolute wording |
| 76 | `shared/cleaning/SOP-11.json` | SOP-11-K02 | Pads of a single colour are always used on every floor | Pads of one colour are used across every floor type, so no choice is needed | absolute wording |
| 77 | `shared/cleaning/SOP-13.json` | SOP-13-K02 | Randomly across the whole stain at once | Across the whole stain at once, starting from the middle | absolute wording |
| 78 | `shared/cleaning/SOP-20.json` | SOP-20-K02 | It is an offence to leave any liquid on a floor, whatever the amount | Slurry dries softer, so drying it on the floor makes it easier to remove | absolute wording |
| 79 | `shared/cleaning/SOP-22.json` | SOP-22-K01 | Sunglasses only | Shorts and a sun hat, which are enough outdoors | fragment (length) |
| 80 | `shared/cleaning/SOP-22.json` | SOP-22-K02 | Cover it with leaves and carry on picking | Cover it with leaves and mark the spot for the next visit | joke or throwaway wording |
| 81 | `shared/cleaning/SOP-23.json` | SOP-23-K02 | The sharps container | The general waste bin, once the lid is closed for the day | fragment (length) |
| 82 | `shared/cleaning/SOP-24.json` | SOP-24-K01 | Vacuum at random points, starting from the middle of the stair | Wash the carpet first with hot water, starting from the middle of the stair | absolute wording |
| 83 | `shared/cleaning/SOP-25.json` | SOP-25-K02 | They are sealed, so they must never be wiped | They are sealed, so they are cleaned only once a year | absolute wording |
| 84 | `shared/cleaning/SOP-26.json` | SOP-26-K01 | Nothing, because unplugging is always allowed | Nothing, because unplugging a computer is allowed without asking | absolute wording |
| 85 | `shared/cleaning/SOP-28.json` | SOP-28-K03 | Cover the spill with paper towels and leave it for the next shift | Cover the spill with paper towels and mop it up at the end of the day | joke or throwaway wording |
| 86 | `shared/cleaning/SOP-30.json` | SOP-30-K03 | Ignore it because you cleaned the room recently | Leave it, because the room was cleaned recently and is probably fine | absolute wording |
| 87 | `shared/cleaning/TJS-01.json` | TJS-01-K02 | Empty it, since rubbish is always in scope | Empty it, since bins are usually included in every walk-through | absolute wording |
| 88 | `shared/cleaning/TJS-02.json` | TJS-02-K02 | Ignore it, because practice runs are not assessed | Let it pass, because practice runs are not recorded at all | absolute wording |
| 89 | `shared/cleaning/TJS-03.json` | TJS-03-K03 | The client's computer | The client's keyboard and the desk lamp on the shelf | fragment (length) |
| 90 | `shared/cleaning/TJS-10.json` | TJS-10-K02 | Thrown from a distance so you never lean in | Tossed from a short distance so you stay standing upright | absolute wording |
| 91 | `shared/cleaning/TJS-13.json` | TJS-13-K01 | Because high dusting is always paid more | Because high dusting is charged at a higher hourly rate | absolute wording |
| 92 | `shared/cleaning/TJS-14.json` | TJS-14-K01 | Paper is never dusted | Paper is dusted last, after the frame and drawers | absolute wording |
| 93 | `shared/cleaning/TJS-15.json` | TJS-15-K01 | Because blinds are always wet | Because blinds are usually damp from the air conditioning | absolute wording |
| 94 | `shared/cleaning/TJS-15.json` | TJS-15-K02 | Half lowered at random | Half lowered, with the slats angled upward toward the ceiling | absolute wording |
| 95 | `shared/cleaning/TJS-15.json` | TJS-15-K03 | Count the slats | Wipe each slat once with a dry cloth and move on quickly | fragment (length) |
| 96 | `shared/cleaning/TJS-18.json` | TJS-18-K02 | Never during dusting | Only on the first room of the day | absolute wording |
| 97 | `shared/cleaning/TJS-20.json` | TJS-20-K01 | Because the floor is always the easiest surface to clean | Because the floor is the easiest surface to dry afterwards | absolute wording |
| 98 | `shared/cleaning/TJS-20.json` | TJS-20-K02 | Dirty mirrors, so polish them again before anything else | Dirty mirrors near the drain, so polish them again first | absolute wording |
| 99 | `shared/cleaning/TJS-21.json` | TJS-21-K02 | Because the taps are never part of the floor clean | Because the taps are cleaned with the floor mop in a separate step | absolute wording |
| 100 | `shared/cleaning/TJS-25.json` | TJS-25-K03 | Never, as long as the floor cleaner is added at the start | After the last room, once the floor cleaner has been added at the start | absolute wording |
| 101 | `shared/cleaning/TJS-27.json` | TJS-27-K03 | Because the floor must never be touched by a mop head | Because mop heads must be stored on the floor to dry out faster | absolute wording |
| 102 | `shared/cleaning/TJS-30.json` | TJS-30-K02 | It is left as it was found, whatever the lock state | It is left as it was found, and the lock is reset afterwards | absolute wording |
| 103 | `shared/cleaning/TJS-30.json` | TJS-30-K03 | At the start of every room, whatever its state | At the start of each room, before the walk-through is done | absolute wording |
| 104 | `shared/cleaning/construction-site-cleaning-L01.json` | construction-site-cleaning-L01-K02 | All contamination | All contamination, including the fixed plant and the works in progress | fragment (length) |
| 105 | `shared/cleaning/construction-site-cleaning-L01.json` | construction-site-cleaning-L01-K03 | There is none | They mean the same thing, so either label applies to any room | absolute wording; fragment (length) |
| 106 | `shared/cleaning/construction-site-cleaning-L01.json` | construction-site-cleaning-L01-K03 | A cleared room is always presentable | A cleared room needs no further check before handover | absolute wording; repeats the question |
| 107 | `shared/cleaning/construction-site-cleaning-L04.json` | construction-site-cleaning-L04-K02 | A household vacuum | A household vacuum with a paper bag, used on the dust directly | fragment (length) |
| 108 | `shared/cleaning/construction-site-cleaning-L04.json` | construction-site-cleaning-L04-K03 | Never, once you start | Once the first sheet is wiped and the area is swept, work may continue | absolute wording |
| 109 | `shared/cleaning/construction-site-cleaning-L05.json` | construction-site-cleaning-L05-K02 | Nothing, water is always safe | Nothing, because water is harmless on any surface and needs no planning | absolute wording |
| 110 | `shared/cleaning/construction-site-cleaning-L05.json` | construction-site-cleaning-L05-K03 | Any cleaner | Any cleaner who is on the crew roster for that day | fragment (length) |
| 111 | `shared/cleaning/construction-site-cleaning-L05.json` | construction-site-cleaning-L05-K03 | The client | The client's own staff, who know the dust collector best | fragment (length) |
| 112 | `shared/cleaning/construction-site-cleaning-L06.json` | construction-site-cleaning-L06-K01 | Because it is the most expensive | Because it is the easiest control to fit on site | joke or throwaway wording |
| 113 | `shared/cleaning/construction-site-cleaning-L08.json` | construction-site-cleaning-L08-K02 | Because uncured surfaces are always cleaner | Because uncured surfaces are cleaner to start with, so the check is skipped | absolute wording |
| 114 | `shared/cleaning/construction-site-cleaning-L08.json` | construction-site-cleaning-L08-K03 | Approves any product | Approves a product for every surface, once a test has passed | fragment (length) |
| 115 | `shared/cleaning/construction-site-cleaning-L10.json` | construction-site-cleaning-L10-K02 | By the cheapest product | By the product that foams the most, for a faster rinse | joke or throwaway wording |
| 116 | `shared/cleaning/construction-site-cleaning-L10.json` | construction-site-cleaning-L10-K03 | Before the inspection, to save time | Before the inspection, so the log is complete for the day | joke or throwaway wording |
| 117 | `shared/cleaning/construction-site-cleaning-L10.json` | construction-site-cleaning-L10-K03 | Never | Once the work has started and the equipment is still in use | absolute wording; fragment (length) |
| 118 | `shared/cleaning/construction-site-cleaning-L11.json` | construction-site-cleaning-L11-K02 | Laboratory clearance | Laboratory clearance of the air, measured by the cleaning contractor | fragment (length) |
| 119 | `shared/cleaning/construction-site-cleaning-L11.json` | construction-site-cleaning-L11-K02 | Regulatory sign-off | Regulatory sign-off by the local council, for the whole site | fragment (length) |
| 120 | `shared/cleaning/kitchen-cleaning-L05.json` | kitchen-cleaning-L05-K02 | Mixing is always more expensive | Mixing stretches each product further, so it is the thrifty choice | absolute wording; joke or throwaway wording |
| 121 | `shared/cleaning/kitchen-cleaning-L07.json` | kitchen-cleaning-L07-K03 | Make a judgement and carry on | Make a quick judgement and continue the shift | joke or throwaway wording |
| 122 | `shared/cleaning/kitchen-cleaning-L11.json` | kitchen-cleaning-L11-K01 | Sign it to keep the peace | Sign it, since the supervisor has authority over sign-off | joke or throwaway wording |
| 123 | `shared/cleaning/kitchen-cleaning-L11.json` | kitchen-cleaning-L11-K01 | Sign it and ask the supervisor to check later | Sign it now and ask for the check to be scheduled later | repeats the question |
| 124 | `shared/cleaning/kitchen-cleaning-L11.json` | kitchen-cleaning-L11-K02 | The supervisor only, regardless of who did the work | The supervisor only, since they carry the sign-off duty for every task | absolute wording |
| 125 | `shared/cleaning/warehouse-deep-cleaning-L05.json` | warehouse-deep-cleaning-L05-K02 | Move it yourself | Move it yourself, then continue cleaning the walkway at once | fragment (length) |
| 126 | `shared/cleaning/warehouse-deep-cleaning-L05.json` | warehouse-deep-cleaning-L05-K02 | Ignore it | Step around it and keep cleaning the rest of the walkway | absolute wording; fragment (length) |
| 127 | `shared/customer/F11-L02.json` | F11-L02-K02 | Ignore it to keep the quote low. | Quote the job as is, and deal with the hazard later if it arises. | absolute wording |
| 128 | `shared/customer/F11-L05.json` | F11-L05-K01 | Ignore the question. | Guess an answer and move on to the next item on the list. | absolute wording; fragment (length) |
| 129 | `shared/customer/F12-L05.json` | F12-L05-K01 | Hope the recipient does not notice. | Wait to see whether the recipient reports it first. | joke or throwaway wording |
| 130 | `shared/customer/F12-L05.json` | F12-L05-K01 | Send the correct details to the wrong person as well. | Forward the message to a colleague to see what was sent | repeats the question |
| 131 | `shared/customer/F14-L01.json` | F14-L01-K02 | Carry on, since the person did not object | Continue, since the person did not object to the change | joke or throwaway wording |
| 132 | `shared/customer/F14-L05.json` | F14-L05-K01 | Using a loud voice and simple words for everyone regardless of need | Using a loud voice and simple words for everyone, to keep the pace even | absolute wording |
| 133 | `shared/customer/SHR-PLN-01.json` | SHR-PLN-01-K01 | Yes, it always comes out | Yes, it comes out with the standard product on the first visit | absolute wording |
| 134 | `shared/equipment/F04-L04.json` | F04-L04-K01 | That tools are left wet in a sealed bucket overnight to save time | That tools are left wet in a sealed bucket overnight until the next visit | joke or throwaway wording |
| 135 | `shared/equipment/F04-L04.json` | F04-L04-K01 | That a fault is ignored if the machine still works | That a fault may be left unrecorded if the machine still runs | absolute wording |
| 136 | `shared/equipment/F08-L04.json` | F08-L04-K01 | Whether one mop head can serve a bathroom and a kitchen to save time | Whether one mop head can serve a bathroom and a kitchen in turn | joke or throwaway wording |
| 137 | `shared/equipment/F08-L04.json` | F08-L04-K01 | That the equipment is never cleaned or dried | That the equipment is cleaned only at the end of the month | absolute wording |
| 138 | `shared/equipment/F17-L01.json` | F17-L01-K01 | Whether a toilet-area tool can be used in the kitchen to save time | Whether a toilet-area tool can be used in the kitchen once rinsed | joke or throwaway wording |
| 139 | `shared/equipment/F17-L01.json` | F17-L01-K05 | No record is needed for tools | Tidy the tool away and tell nobody, since it still works | repeats the question |
| 140 | `shared/fitness-business/ACE-03.json` | ACE-03-K01 | Clients only pay for admin time | Clients pay for sessions only, so admin is an extra cost | repeats the question |
| 141 | `shared/fitness-business/ACE-03.json` | ACE-03-K03 | The ideal week you hope to have | The ideal week set out on a planning template | joke or throwaway wording |
| 142 | `shared/fitness-business/BRY-02.json` | BRY-02-K02 | A general word can never be used by any other business | A general word is the easiest kind to own, so no check is needed | absolute wording |
| 143 | `shared/fitness-business/BRY-03.json` | BRY-03-K01 | A brand name the client has never seen explained | A brand name the client has seen used in an advert elsewhere | absolute wording |
| 144 | `shared/fitness-business/PTB-01.json` | PTB-01-K02 | Ignore the enquiry | Quote a price for the work and take the booking anyway | absolute wording; fragment (length) |
| 145 | `shared/fitness-business/PTB-01.json` | PTB-01-K03 | Competitors' prices only | Competitors' prices and their advertising copy, collected each week | fragment (length) |
| 146 | `shared/fitness-business/PTB-02.json` | PTB-02-K01 | A discount offer | A discount offer that is repeated across every product line | fragment (length) |
| 147 | `shared/fitness-business/PTB-03.json` | PTB-03-K02 | The most expensive programme on the menu | The most detailed programme on the menu, booked first | joke or throwaway wording |
| 148 | `shared/fitness-business/PTB-04.json` | PTB-04-K01 | Buying more advertising | Buying more advertising, since more leads will fix a slow process | fragment (length) |
| 149 | `shared/fitness-business/PTB-04.json` | PTB-04-K01 | Lowering all prices | Lowering all prices across the menu, since cheaper work brings more clients | fragment (length) |
| 150 | `shared/fitness-business/PTB-04.json` | PTB-04-K03 | The client's height | The client's date of birth and street address, on the booking form | fragment (length) |
| 151 | `shared/fitness-business/PTB-06.json` | PTB-06-K01 | A discount code | A discount code and a link to the price list, sent each Friday | fragment (length) |
| 152 | `shared/fitness-business/PTB-07.json` | PTB-07-K01 | Test random advertising | Test advertising across several channels at the same time | absolute wording |
| 153 | `shared/fitness-business/PTB-07.json` | PTB-07-K02 | Age only | Age and postcode only, since those fields are easy to sort | fragment (length) |
| 154 | `shared/fitness-business/PTB-07.json` | PTB-07-K03 | Kept indefinitely | Kept running indefinitely, because the cost is low each week | fragment (length) |
| 155 | `shared/fitness-business/PTB-07.json` | PTB-07-K03 | Doubled in time | Given double the time each week, so the result has longer to show | fragment (length) |
| 156 | `shared/fitness-business/PTB-08.json` | PTB-08-K01 | Unsupervised independent training | Unsupervised independent training, where each person works alone at a desk | fragment (length) |
| 157 | `shared/fitness-business/PTB-09.json` | PTB-09-K01 | Whatever members will pay on day one | The price the members asked for on the first day | absolute wording |
| 158 | `shared/fitness-business/PTB-09.json` | PTB-09-K03 | 90 units, the same as one-to-one | 90 units, a little less than a one-to-one session at the same rate | repeats the question |
| 159 | `shared/fitness-business/PTB-10.json` | PTB-10-K01 | Always the trainer's fault | Usually the trainer's fault, because the schedule was set by the trainer | absolute wording |
| 160 | `shared/fitness-business/PTB-11.json` | PTB-11-K02 | Replacing the warm-up | Replacing the warm-up with a longer cool-down for every member | fragment (length) |
| 161 | `shared/fitness-business/PTB-13.json` | PTB-13-K02 | A simple logo | A simple logo in one colour, drawn by the owner's relative | fragment (length) |
| 162 | `shared/fitness-business/PTB-13.json` | PTB-13-K03 | Because profit is never real | Because profit is shown only on the accounts at year end | absolute wording |
| 163 | `shared/fitness-business/YNS-01.json` | YNS-01-K02 | Choose whichever is cheapest to run | Choose whichever has the bigger brand name on its page | joke or throwaway wording |
| 164 | `shared/fitness-business/YNS-04.json` | YNS-04-K02 | Ignore it and keep the niche for a year | Keep the niche for a year, since weak early responses are normal | absolute wording |
| 165 | `shared/food-sanitation/FPS-01.json` | FPS-01-K02 | It always damages stainless steel | It brightens stainless steel, so it is the preferred finish for the surface | absolute wording |
| 166 | `shared/food-sanitation/FPS-03.json` | FPS-03-K01 | Whichever product is cheapest per litre | Whichever product has the strongest fragrance on the label | joke or throwaway wording |
| 167 | `shared/food-sanitation/FPS-05.json` | FPS-05-K01 | Pests stop sanitisers from working permanently | Pests slow sanitisers down for a short time after each visit | absolute wording |
| 168 | `shared/food-sanitation/FPS-05.json` | FPS-05-K03 | Sweep the droppings into a bin and carry on | Sweep the droppings into a bin and close the store later | joke or throwaway wording |
| 169 | `shared/food-sanitation/FPS-05.json` | FPS-05-K03 | Move the nearby stock and carry on working | Move the nearby stock to a different shelf and keep working | joke or throwaway wording |
| 170 | `shared/food-sanitation/FPS-06.json` | FPS-06-K02 | It means the stock never needs to be checked | It means the stock needs checking only on a weekly schedule | absolute wording |
| 171 | `shared/food-sanitation/FPS-08.json` | FPS-08-K03 | Ignore it if the area looks clean | Leave it if the area looks clean and tidy | absolute wording |
| 172 | `shared/green/GCM-01.json` | GCM-01-K03 | End-of-shift checks are never valid for any area | End-of-shift checks are valid only for the back-of-house areas | absolute wording |
| 173 | `shared/green/GCM-01.json` | GCM-01-K03 | A daytime check replaces the need to clean at the end of the shift | A daytime check swaps for a weekly deep clean instead | repeats the question |
| 174 | `shared/green/GCM-02.json` | GCM-02-K02 | Carry on, and mention the marks to the customer at the end of the job | Finish the job and mention the marks to the customer at the end | joke or throwaway wording |
| 175 | `shared/green/GCM-02.json` | GCM-02-K03 | A water-dampened cloth always saves product, so product checks are not needed | A water-dampened cloth saves product, so the approved list can be skipped | absolute wording |
| 176 | `shared/green/GCM-03.json` | GCM-03-K02 | Top it up with the detergent that is left, to save time | Top it up with the detergent that is left, since it is also a sanitiser | joke or throwaway wording |
| 177 | `shared/green/GCM-03.json` | GCM-03-K03 | Store it on its edge with the sound boards and carry on | Store it on its edge with the sound boards for the next job | joke or throwaway wording |
| 178 | `shared/handyman/HBM-04.json` | HBM-04-K02 | Delete the milestone, because staff are never needed | Delete the milestone, because the hiring cost is already covered by the margin | absolute wording |
| 179 | `shared/handyman/HBM-04.json` | HBM-04-K03 | A lender's plan is always shorter | A lender's plan is the shorter of the two, so it can be reused for staff | absolute wording |
| 180 | `shared/handyman/HBM-06.json` | HBM-06-K01 | Because customers never ask about licences | Because customers usually ask about licences before they book | absolute wording |
| 181 | `shared/handyman/HBM-07.json` | HBM-07-K01 | Whatever a friend recommends | The tools a friend recommends, since they have already tested them | absolute wording |
| 182 | `shared/handyman/HBM-07.json` | HBM-07-K02 | Never, because hiring is always unsafe | Every time, because hired tools need no training or checking at all | absolute wording |
| 183 | `shared/handyman/HBM-12.json` | HBM-12-K02 | Because short jobs never need travel | Because short jobs need travel but no setup time at all | absolute wording |
| 184 | `shared/handyman/HBM-13.json` | HBM-13-K01 | Because a visit is always billed at double the rate | Because a visit is billed at double the rate for the trip | absolute wording |
| 185 | `shared/handyman/HBM-14.json` | HBM-14-K02 | This is always the correct method for every job | This is a 50 per cent markup on cost, the same as a 50 per cent margin | absolute wording |
| 186 | `shared/handyman/HBM-15.json` | HBM-15-K02 | By whichever option is cheaper that week | By whichever option the contractor's preferred form lists first | joke or throwaway wording |
| 187 | `shared/handyman/HBM-16.json` | HBM-16-K02 | Sending the employee to a random job each morning | Sending the employee to the job furthest from home each morning | absolute wording |
| 188 | `shared/healthcare/ADA-01.json` | ADA-01-K01 | On the spittoon. | In the operatory, beside the patient's chair, for quick access | fragment (length) |
| 189 | `shared/healthcare/ADA-01.json` | ADA-01-K03 | Anything may move in any direction if the lid is closed. | Items may move in either direction once the lid is closed. | absolute wording |
| 190 | `shared/healthcare/ADA-02.json` | ADA-02-K01 | The water is always too hot. | The water is kept too cold for the unit's own pump | absolute wording |
| 191 | `shared/healthcare/ADA-02.json` | ADA-02-K03 | Use it anyway. | Use it for one more week, since the lines look clean enough | fragment (length) |
| 192 | `shared/healthcare/ADA-05.json` | ADA-05-K03 | Carry it open. | Carry it open in a tray, so the impression can air-dry on the way | fragment (length) |
| 193 | `shared/healthcare/ADA-06.json` | ADA-06-K01 | A broom swept through the operatory to save time. | A broom swept through the operatory after each patient visit. | joke or throwaway wording |
| 194 | `shared/healthcare/ADA-06.json` | ADA-06-K02 | Ignore it, because toys are not a risk. | Give it to the next child, because a quick rinse is enough | absolute wording |
| 195 | `shared/healthcare/ADA-06.json` | ADA-06-K03 | They are always sterile. | They are sterile after one wipe with a dry cloth. | absolute wording |
| 196 | `shared/healthcare/DIP-02.json` | DIP-02-K03 | A quick wipe. | A quick wipe with a damp cloth and a little detergent | fragment (length) |
| 197 | `shared/healthcare/DIP-03.json` | DIP-03-K03 | Never, if it looks clean. | Only at the end of the week, when the store is emptied | absolute wording |
| 198 | `shared/healthcare/HCG-01.json` | HCG-01-K03 | Say that isolation is not needed and carry on cleaning. | Say that isolation is not needed and continue cleaning the room. | joke or throwaway wording |
| 199 | `shared/healthcare/HCG-02.json` | HCG-02-K02 | Dry dusting only. | Dry dusting once a week, which keeps the surface clear enough | fragment (length) |
| 200 | `shared/healthcare/HCG-02.json` | HCG-02-K03 | They are too expensive for a ward budget. | They are too bulky to store in a ward cupboard. | joke or throwaway wording |
| 201 | `shared/healthcare/HCG-03.json` | HCG-03-K03 | Nothing changes; the schedule is never adjusted. | Nothing changes, and the schedule is left as it was first written. | absolute wording |
| 202 | `shared/healthcare/HCG-04.json` | HCG-04-K02 | Using a disinfectant on a surface that was never wiped. | Using a disinfectant on a surface that was rinsed with water only. | absolute wording |
| 203 | `shared/healthcare/HCG-04.json` | HCG-04-K03 | It is always required, every day. | It is required each day by default, with no assessment needed. | absolute wording |
| 204 | `shared/healthcare/HCG-04.json` | HCG-04-K03 | It is never required outside an acute hospital. | It is required only inside an acute hospital, by default. | absolute wording |
| 205 | `shared/healthcare/HCG-05.json` | HCG-05-K01 | Because the solution becomes more expensive over time. | Because the solution loses its colour on the trolley over time. | joke or throwaway wording |
| 206 | `shared/healthcare/HCG-07.json` | HCG-07-K02 | Never, because curtains are not part of the table. | At admission only, because the curtains are checked on arrival | absolute wording |
| 207 | `shared/healthcare/HCG-08.json` | HCG-08-K02 | Because it leaves a permanent stain on every surface. | Because it leaves a faint film that attracts dust on the surface. | absolute wording |
| 208 | `shared/healthcare/HCG-08.json` | HCG-08-K02 | Because it is always more expensive than detergent. | Because it is slower than detergent on most surfaces. | absolute wording; joke or throwaway wording |
| 209 | `shared/healthcare/HCG-09.json` | HCG-09-K03 | Every hour, regardless of condition. | Once a week, on the same day, as a fixed rule. | absolute wording |
| 210 | `shared/healthcare/HCG-10.json` | HCG-10-K03 | Always, for every spill, without any assessment. | Straight away, on any spill, to be safe. | absolute wording |
| 211 | `shared/healthcare/HCG-10.json` | HCG-10-K03 | Never, because detergent is the only permitted product. | Only after the room is closed, because detergent alone is used | absolute wording |
| 212 | `shared/healthcare/HCG-11.json` | HCG-11-K02 | A cleaning cupboard. | A cleaning cupboard, a mop bucket and a spare linen trolley | fragment (length) |
| 213 | `shared/healthcare/HCG-12.json` | HCG-12-K01 | Because the surface is always wet after cleaning. | Because the surface is wet from the cleaning product, so it looks clean. | absolute wording |
| 214 | `shared/healthcare/HCG-12.json` | HCG-12-K01 | Because the checklist is always wrong. | Because the checklist was written for a different ward. | absolute wording |
| 215 | `shared/healthcare/HCG-12.json` | HCG-12-K02 | Because samples are always too expensive to test. | Because samples must be sent overseas for every test. | absolute wording; joke or throwaway wording |
| 216 | `shared/healthcare/HCG-12.json` | HCG-12-K02 | Because it always finds too many organisms. | Because it reports results only once a year. | absolute wording |
| 217 | `shared/healthcare/HCG-12.json` | HCG-12-K03 | Never, under any circumstances. | Every shift, as a routine check on all surfaces | absolute wording |
| 218 | `shared/healthcare/HCG-15.json` | HCG-15-K01 | Never, because the table is not the patient. | After touching the table, because it is no longer part of the patient's care. | absolute wording |
| 219 | `shared/healthcare/HCG-15.json` | HCG-15-K02 | Never, because soap is less effective than any alcohol rub. | With gloves on, because soap works through the glove material | absolute wording |
| 220 | `shared/healthcare/HCG-16.json` | HCG-16-K02 | The mask. | The mask, pulled down to the chin before the gloves come off | fragment (length) |
| 221 | `shared/healthcare/HCG-16.json` | HCG-16-K02 | The gown. | The gown, unfastened at the neck before the gloves are removed | fragment (length) |
| 222 | `shared/healthcare/HCG-17.json` | HCG-17-K02 | Half full, so it is light to carry. | Half full, so the container is less likely to tip over. | joke or throwaway wording |
| 223 | `shared/healthcare/HCG-18.json` | HCG-18-K03 | Because bin labels are never used in Australia. | Because bin labels are set by the cleaning contractor each month. | absolute wording |
| 224 | `shared/healthcare/HCG-18.json` | HCG-18-K03 | Because bins are always the wrong colour. | Because bin colours change with the building's floor plan. | absolute wording |
| 225 | `shared/healthcare/HCG-19.json` | HCG-19-K02 | Facility bed sheets. | Facility bed sheets, washed on the domestic cold setting | fragment (length) |
| 226 | `shared/healthcare/HCG-20.json` | HCG-20-K01 | Transmission-based precautions replace standard precautions. | Transmission-based precautions take over from the ward's routine checks | repeats the question; repeat: reused 'transmission-based precautions' and 'baseline controls' wording from the question |
| 227 | `shared/healthcare/HCG-20.json` | HCG-20-K01 | They are unrelated and are never used together. | They are unrelated, and each replaces the other on the ward. | absolute wording |
| 228 | `shared/healthcare/HCG-20.json` | HCG-20-K02 | With water only. | With water and a damp cloth, then left to dry naturally | fragment (length) |
| 229 | `shared/healthcare/HCG-20.json` | HCG-20-K03 | The patient, at any time. | The patient, on request, once they feel better | absolute wording |
| 230 | `shared/healthcare/HIP-01.json` | HIP-01-K01 | Carry on, because visitors are not your responsibility. | Continue, because visitors are not your responsibility. | joke or throwaway wording |
| 231 | `shared/healthcare/HIP-01.json` | HIP-01-K01 | Wipe the button with your bare hand to save time. | Wipe the button with your bare hand, then keep working. | joke or throwaway wording |
| 232 | `shared/healthcare/HIP-01.json` | HIP-01-K02 | Turn away from people, cough, and carry on working. | Turn away from people, cough, and continue working. | joke or throwaway wording |
| 233 | `shared/healthcare/HIP-01.json` | HIP-01-K03 | Emptying the bin by hand before washing anything. | Emptying the bin into a second bag before washing the bin lid. | absolute wording |
| 234 | `shared/healthcare/HIP-02.json` | HIP-02-K02 | Detergent is cheaper than disinfectant. | Detergent is applied to a dry surface before any other step. | joke or throwaway wording; repeats the question |
| 235 | `shared/healthcare/HIP-02.json` | HIP-02-K02 | The order does not matter if the same cloth is used. | The order matters less when the same cloth is used for both steps. | absolute wording |
| 236 | `shared/healthcare/HIP-02.json` | HIP-02-K03 | Leave the rails for the next shift. | Leave the rails for the end-of-week deep clean. | joke or throwaway wording |
| 237 | `shared/healthcare/HIP-03.json` | HIP-03-K02 | By the weekday. | By the weekday shift that the crew is rostered on | fragment (length) |
| 238 | `shared/healthcare/HIP-03.json` | HIP-03-K02 | By choosing the cheapest option. | By choosing the option with the most ward space available. | joke or throwaway wording |
| 239 | `shared/healthcare/HIP-04.json` | HIP-04-K03 | Ignore it if it does not hurt. | Keep working if it does not hurt, and cover it later | absolute wording |
| 240 | `shared/healthcare/HIP-05.json` | HIP-05-K02 | Squeeze hard to push the fluid out, then carry on. | Squeeze hard to push the fluid out, then rinse the glove. | joke or throwaway wording |
| 241 | `shared/healthcare/HLT-01.json` | HLT-01-K03 | No disinfectant kills any bacteria. | Such products rarely touch bacteria on the surface at all | repeats the question |
| 242 | `shared/healthcare/HLT-02.json` | HLT-02-K03 | Early signs always mean the person is contagious for life | Early signs mean the person is contagious for the rest of the stay | absolute wording |
| 243 | `shared/healthcare/HLT-03.json` | HLT-03-K03 | The product manufacturer | The product manufacturer, who writes the ward's own infection rules | fragment (length) |
| 244 | `shared/healthcare/HLT-05.json` | HLT-05-K01 | Cough into the palm and carry on | Cough into the palm, then wipe the hand on the uniform | joke or throwaway wording |
| 245 | `shared/healthcare/HLT-07.json` | HLT-07-K03 | Once per shift | Once per shift, even when it still looks clean and dry | fragment (length) |
| 246 | `shared/healthcare/HLT-07.json` | HLT-07-K03 | Never, if it still looks clean | Once a shift, even when it is still dry and intact | absolute wording |
| 247 | `shared/healthcare/HLT-09.json` | HLT-09-K01 | Mop the floor, then wipe the bench, then the wall | Mop the floor first, then wipe the bench and finish with the wall | repeats the question |
| 248 | `shared/healthcare/HLT-13.json` | HLT-13-K03 | The product manufacturer | The product manufacturer's sales team, through its own customer rules | fragment (length) |
| 249 | `shared/healthcare/HLT-14.json` | HLT-14-K01 | Protective equipment | Protective equipment, such as gloves, masks and gowns | fragment (length) |
| 250 | `shared/healthcare/HLT-14.json` | HLT-14-K01 | Signage | Warning signage placed at the door of the affected area | fragment (length) |
| 251 | `shared/healthcare/HLT-14.json` | HLT-14-K01 | Training alone | Training alone, given to every staff member each year | fragment (length) |
| 252 | `shared/healthcare/HLT-14.json` | HLT-14-K03 | Ignore it, since it is unlikely to be serious | Record it and continue, since it is unlikely to be serious | absolute wording |
| 253 | `shared/healthcare/OTI-03.json` | OTI-03-K01 | Because hair is always dirty | Because hair makes the theatre cap sit more comfortably | absolute wording |
| 254 | `shared/healthcare/OTI-03.json` | OTI-03-K01 | To show rank | To show rank and seniority of each person in the theatre team | fragment (length) |
| 255 | `shared/healthcare/OTI-03.json` | OTI-03-K02 | Open sandals | Open sandals with a thin sole, which are light and cool | fragment (length) |
| 256 | `shared/healthcare/OTI-04.json` | OTI-04-K02 | Only the floor | Only the floor, mopped with the same cloth used on the table | fragment (length) |
| 257 | `shared/healthcare/OTI-04.json` | OTI-04-K02 | Water alone | Water alone, poured straight from the tap onto the table | fragment (length) |
| 258 | `shared/healthcare/OTI-05.json` | OTI-05-K02 | Water-based solutions are always better | Water-based solutions are better for dry skin and need no drying time | absolute wording |
| 259 | `shared/healthcare/OTI-05.json` | OTI-05-K02 | Skin should be wet before preparation | Skin should be dried with a cloth before any alcohol is applied | repeats the question; repeat: reused 'skin', 'water', 'preparation' wording from the question |
| 260 | `shared/induction/C01-L01.json` | C01-L01-K02 | Continue the task and fix the problem yourself to save time | Continue the task and fix the problem yourself at the next stop | joke or throwaway wording |
| 261 | `shared/induction/C01-L01.json` | C01-L01-K02 | Carry on, because a client instruction overrides the work order | Continue, because a client instruction overrides the work order | joke or throwaway wording |
| 262 | `shared/induction/C01-L03.json` | C01-L03-K03 | The time the trainee took, regardless of the result | The time the trainee took, since speed shows competence | absolute wording |
| 263 | `shared/induction/F01-L01.json` | F01-L01-K01 | Ask the client to sign a waiver and carry on | Ask the client to sign a waiver and continue with the task | joke or throwaway wording |
| 264 | `shared/induction/F15-L01.json` | F15-L01-K01 | Carry on if you are wearing the right clothing | Continue if you are wearing the right clothing | joke or throwaway wording |
| 265 | `shared/induction/F15-L01.json` | F15-L01-K03 | Choose whatever PPE is nearest to hand | Choose the PPE nearest to hand, since it is the usual item | absolute wording |
| 266 | `shared/induction/F15-L01.json` | F15-L01-K05 | No record is needed for clothing | Clothing defects can be noted in the next shift's briefing | repeats the question |
| 267 | `shared/induction/F15-L02.json` | F15-L02-K01 | Carry on because others on site are doing it | Continue because other crews on site are doing the same task | joke or throwaway wording |
| 268 | `shared/induction/F15-L02.json` | F15-L02-K03 | Any flat-soled shoes, whatever the floor | Flat-soled canvas shoes, chosen for comfort over grip | absolute wording |
| 269 | `shared/induction/F15-L04.json` | F15-L04-K02 | Wear it to the next site to save time | Wear it to the next site and leave it on in the van | joke or throwaway wording |
| 270 | `shared/job-management/C02-L03.json` | C02-L03-K02 | Wipe the pedestrian's shoes with the same cloth and carry on | Wipe the pedestrian's shoes with the same cloth and continue | joke or throwaway wording |
| 271 | `shared/job-management/F05-L03.json` | F05-L03-K01 | Ignore it, since the cloth was only used on the toilet floor | Keep using the worktop, since the cloth was used only on the floor | absolute wording |
| 272 | `shared/job-management/F05-L03.json` | F05-L03-K02 | Use a kitchen cloth on the toilet to save time | Use a kitchen cloth on the toilet floor, since it is closer | joke or throwaway wording |
| 273 | `shared/job-management/F19-L05.json` | F19-L05-K01 | Whether the cords can run across the walkway to save time | Whether the cords can run across the walkway, if they are taped | joke or throwaway wording |
| 274 | `shared/job-management/F19-L05.json` | F19-L05-K05 | No record is needed for barriers | Barriers need a note only if a visitor was delayed | repeats the question |
| 275 | `shared/marketing/BP-02.json` | BP-02-K02 | It shows that referrals never work | It shows that referrals work straight away from month one | absolute wording |
| 276 | `shared/marketing/CP-02.json` | CP-02-K03 | Hand out cards to everyone after the meeting, whatever the rules say | Hand out cards to the members privately, since the rule is for meetings | absolute wording |
| 277 | `shared/marketing/F11-L06.json` | F11-L06-K01 | Ignore the complaints because they are few. | Close the complaints, since a few cases are not a pattern. | absolute wording |
| 278 | `shared/marketing/SHR-PLN-05.json` | SHR-PLN-05-K02 | Remove it from the plan, because opinions are never useful | Keep it as a fact, since a client's opinion proves the claim | absolute wording |
| 279 | `shared/marketing/SOL-05.json` | SOL-05-K02 | Your prices | Your prices, the discount you can offer and the dates available | fragment (length) |
| 280 | `shared/marketing/SOL-05.json` | SOL-05-K02 | Your awards | Your awards and the list of recent press coverage to share | fragment (length) |
| 281 | `shared/marketing/SOL-05.json` | SOL-05-K02 | Your competitors | Your competitors' pricing sheet, shared line by line | fragment (length) |
| 282 | `shared/marketing/SOL-06.json` | SOL-06-K03 | Never | Once a month, whether or not results have moved yet | absolute wording; fragment (length) |
| 283 | `shared/marketing/SOL-08.json` | SOL-08-K02 | Nothing, it is always allowed | Nothing, if the photo was taken in a public place | absolute wording |
| 284 | `shared/marketing/SOL-08.json` | SOL-08-K03 | Delete it and never respond | Delete it quietly and say nothing publicly | absolute wording |
| 285 | `shared/marketing/SOL-08.json` | SOL-08-K03 | Ignore all reviews | Reply with the customer's home address, to prove the job | absolute wording |
| 286 | `shared/nhs-sop/NHS-01.json` | NHS-01-K02 | Disinfectant is cheaper to use on a clean surface. | Disinfectant is kept for the surface only when it is visibly dirty. | joke or throwaway wording |
| 287 | `shared/nhs-sop/NHS-04.json` | NHS-04-K03 | Only at induction, and never again. | Only at induction, and again after each new contract | absolute wording |
| 288 | `shared/operations/F10-L02.json` | F10-L02-K01 | Starting with the room the worker likes best, whatever the occupancy | Starting with the room the worker likes best, to keep morale up | absolute wording |
| 289 | `shared/operations/F10-L02.json` | F10-L02-K02 | Complete the unclear task in whatever way seems best | Complete the unclear task in the way the worker finds easiest | absolute wording |
| 290 | `shared/operations/F13-L01.json` | F13-L01-K01 | Whether it is cheaper. | Whether it smells fresh enough to be used in a clean area. | joke or throwaway wording |
| 291 | `shared/operations/F13-L01.json` | F13-L01-K02 | Travel grouping. | Travel grouping, since fewer trips reduce the cleaning time | fragment (length) |
| 292 | `shared/operations/F13-L04.json` | F13-L04-K01 | Ignore the restriction because it is a small job. | Use the normal method, since small jobs are exempt from restrictions | absolute wording |
| 293 | `shared/operations/F13-L06.json` | F13-L06-K02 | Blame the product. | Blame the product supplier and change to a different brand | fragment (length) |
| 294 | `shared/operations/F18-L01.json` | F18-L01-K01 | A bucket. | A bucket with a graduated scale printed on its side | fragment (length) |
| 295 | `shared/operations/F18-L02.json` | F18-L02-K01 | The same kit as last time, regardless of the tasks. | The same kit as last time, since it covered earlier jobs | absolute wording |
| 296 | `shared/operations/F18-L02.json` | F18-L02-K01 | Whatever is in the van. | The stock currently in the van, sorted by size | absolute wording |
| 297 | `shared/operations/F18-L02.json` | F18-L02-K02 | Ignore it if it looks close enough. | Leave it, since a near match is close enough for the job. | absolute wording |
| 298 | `shared/operations/F18-L04.json` | F18-L04-K01 | Ignore the difference. | Order extra gloves for the next job and leave the estimate as it is | absolute wording; fragment (length) |
| 299 | `shared/operations/F20-L05.json` | F20-L05-K02 | Ignore it if the difference is small. | Accept it if the difference is small enough to round out. | absolute wording |
| 300 | `shared/operations/MP-05.json` | MP-05-K02 | Ignore the forecast and keep the goal | Keep the forecast out of the plan and repeat the 10 per cent goal | absolute wording |
| 301 | `shared/operations/MP-07.json` | MP-07-K02 | A printed chart | A printed chart on the office wall, updated every month | fragment (length) |
| 302 | `shared/operations/MP-07.json` | MP-07-K03 | It always equals the quarterly rate, whatever the number of quarters | It equals the quarterly rate, with no change as the quarters add up | absolute wording |
| 303 | `shared/operations/MP-08.json` | MP-08-K02 | Ignore the dependency and start on time anyway | Keep the dates and start both as planned, since the printing can catch up | absolute wording |
| 304 | `shared/operations/MP-08.json` | MP-08-K02 | Start both on the same day regardless | Start both on the same day, since the printer can work faster later | absolute wording |
| 305 | `shared/operations/MP-08.json` | MP-08-K03 | The sales forecast | The sales forecast, updated each month by the owner | fragment (length) |
| 306 | `shared/operations/SOL-07.json` | SOL-07-K01 | Buy the most expensive software | Buy the software with the most features, before any review | joke or throwaway wording |
| 307 | `shared/operations/SOL-07.json` | SOL-07-K02 | The rarest process | The rarest process, which happens only at year end | fragment (length) |
| 308 | `shared/operations/THS-01.json` | THS-01-K01 | A staff roster | A staff roster that lists shifts and leave for each week | fragment (length) |
| 309 | `shared/operations/THS-01.json` | THS-01-K02 | Always, once it has been written down | Once it is written down, with no reason given | absolute wording |
| 310 | `shared/operations/THS-01.json` | THS-01-K03 | Keep clients happy | Keep clients happy through friendly phone calls each week | fragment (length) |
| 311 | `shared/operations/THS-03.json` | THS-03-K01 | Supervised work only | Supervised work only, with no demonstration or practice first | fragment (length) |
| 312 | `shared/operations/THS-03.json` | THS-03-K02 | Take the trainee off the task permanently | Take the trainee off the task for the rest of the month | absolute wording |
| 313 | `shared/operations/THS-03.json` | THS-03-K02 | Stop the training | Stop the training and move the trainee to a different task | fragment (length) |
| 314 | `shared/operations/THS-04.json` | THS-04-K01 | That the supplier will never have a problem | That the supplier will not have a problem with its insurer | absolute wording |
| 315 | `shared/operations/THS-05.json` | THS-05-K01 | Because the client always asks for less staff | Because the client usually asks for fewer staff at signing | absolute wording |
| 316 | `shared/operations/THS-05.json` | THS-05-K01 | Because the costing is never needed | Because the costing is needed only for large contracts | absolute wording |
| 317 | `shared/operations/THS-05.json` | THS-05-K03 | Ignore it | Note it in the diary and cost the job from memory | absolute wording; fragment (length) |
| 318 | `shared/operations/THS-06.json` | THS-06-K01 | A new supplier | A new supplier chosen from the list of approved vendors | fragment (length) |
| 319 | `shared/operations/THS-06.json` | THS-06-K03 | Whatever the crew prefers | The crew's own memory of past jobs | absolute wording |
| 320 | `shared/operations/THS-07.json` | THS-07-K01 | Cancel the job | Cancel the job and send the client a short note of apology | fragment (length) |
| 321 | `shared/operations/additional-specialist-services-L01.json` | additional-specialist-services-L01-K02 | Yes. A training certificate is enough to start restricted work. | Yes, a training certificate alone covers the basic permit | repeats the question |
| 322 | `shared/outdoor-garden/garden-cleanups-L10.json` | garden-cleanups-L10-K01 | Mix the treated timber into the clippings to fill the trailer. | Load the old fencing with the clippings to save trips | repeats the question |
| 323 | `shared/pool/PFM-03.json` | PFM-03-K02 | Never, because the bleeder should stay open while filtering | After the first hour, because the bleeder should stay open while filtering | absolute wording |
| 324 | `shared/pool/PFM-06.json` | PFM-06-K02 | Cooking oil | Cooking oil, warmed first so it spreads more easily | fragment (length) |
| 325 | `shared/pool/PHM-02.json` | PHM-02-K03 | Once the surface looks clean from the edge | Once the water has been cleared of surface debris from the edge | repeats the question |
| 326 | `shared/pool/PHM-04.json` | PHM-04-K02 | Fit a replacement cover yourself to save time | Fit a replacement cover yourself, using a spare from the store | joke or throwaway wording |
| 327 | `shared/pool/PHM-06.json` | PHM-06-K01 | Mix them in one bucket first to save time and add the mixture | Mix them in one bucket first and add the mixture to the pool | joke or throwaway wording |
| 328 | `shared/pool/POM-02.json` | POM-02-K01 | From whichever chemical product is cheapest | From whichever chemical product has the strongest label warning | joke or throwaway wording |
| 329 | `shared/pool/POM-02.json` | POM-02-K03 | They are always interchangeable with the same plan | They can share one plan, since the test method is the same | absolute wording |
| 330 | `shared/pool/POM-02.json` | POM-02-K03 | Bromine always has a stronger odour than chlorine | Bromine has a weaker odour than chlorine, so it needs no separate plan | absolute wording |
| 331 | `shared/pool/POM-03.json` | POM-03-K02 | Randomly, so that the whole wall is covered | Upward from the deep end, so that the debris floats to the skimmer | absolute wording |
| 332 | `shared/pool/PSA-01.json` | PSA-01-K01 | The owner, whatever their chemistry experience | The owner, because ownership alone gives the authority | absolute wording |
| 333 | `shared/pool/PSA-01.json` | PSA-01-K02 | Apply every figure exactly as written, because the standard always covers private pools | Apply every figure exactly as written, since the standard covers all pool types. | absolute wording |
| 334 | `shared/pool/PSA-01.json` | PSA-01-K02 | Ignore the standard entirely because it only covers interstate pools | Set the standard aside, because it covers only commercial pools in the city | absolute wording |
| 335 | `shared/pool/PSA-02.json` | PSA-02-K03 | Because clear water is always chemically balanced | Because clear water is a sign the heater is set correctly | absolute wording |
| 336 | `shared/pool/PSA-03.json` | PSA-03-K01 | Ignore it, because 7.9 is inside the bromine band | Leave it, because 7.9 is inside the bromine band and needs no action | absolute wording |
| 337 | `shared/pool/PSA-04.json` | PSA-04-K02 | Combined chlorine | Combined chlorine, which is the part that still kills germs | fragment (length) |
| 338 | `shared/pool/PSA-04.json` | PSA-04-K02 | Chloramines | Chloramines, which are measured as the total chlorine reading | fragment (length) |
| 339 | `shared/pool/PSA-05.json` | PSA-05-K03 | Ignore it until the next season | Leave it until the pool is emptied next season, then retest | absolute wording |
| 340 | `shared/pool/PSA-08.json` | PSA-08-K03 | They are colourless | They are colourless and mild, so they can be stored near the pool | fragment (length) |
| 341 | `shared/pool/PSA-09.json` | PSA-09-K01 | Whatever the bather load allows | The level the bather load allows on the day | absolute wording |
| 342 | `shared/pool/PSA-10.json` | PSA-10-K01 | Rainfall | Rain run-off from nearby roofs | fragment (length) |
| 343 | `shared/pool/PSA-16.json` | PSA-16-K03 | Four | Four, one for each corner of the pool | fragment (length) |
| 344 | `shared/pool/PVB-01.json` | PVB-01-K01 | Any depth | Deeper than 600 mm | absolute wording |
| 345 | `shared/pool/PVB-01.json` | PVB-01-K03 | The whole lot | The whole lot, including the car park and the garden | fragment (length) |
| 346 | `shared/pool/PVB-02.json` | PVB-02-K03 | No time limit applies to the work | Work may start at any stage, with no date tied to the permit | repeats the question |
| 347 | `shared/pool/PVB-04.json` | PVB-04-K02 | Yes, always | Yes, when the doorset is fitted with a self-closing hinge | absolute wording; fragment (length) |
| 348 | `shared/pool/PVB-04.json` | PVB-04-K02 | Only on Sundays | Only on Sundays, when the building is quiet and the gate is open | fragment (length) |
| 349 | `shared/pool/PVB-04.json` | PVB-04-K03 | Stay open | Stay open for airflow | fragment (length) |
| 350 | `shared/pool/PVB-04.json` | PVB-04-K03 | Unlock fully | Unlock fully for the rescue team to enter | fragment (length) |
| 351 | `shared/pool/PVB-05.json` | PVB-05-K03 | None | Up to 100 mm only | fragment (length) |
| 352 | `shared/pool/PVB-08.json` | PVB-08-K01 | Never, because pool work is exempt | For fence repairs only, since pool work is otherwise exempt | absolute wording |
| 353 | `shared/pool/PVB-08.json` | PVB-08-K02 | Ignore it, because the builder is on site | Continue digging, since the builder is already on site | absolute wording |
| 354 | `shared/quality/F09-L04.json` | F09-L04-K02 | Leave the residue for the next shift and note it verbally | Leave the residue and note it verbally at the next briefing | joke or throwaway wording |
| 355 | `shared/quality/F10-L05.json` | F10-L05-K01 | Ticking every task as complete to save time | Ticking every task as complete, since the floor was checked | joke or throwaway wording |
| 356 | `shared/quality/PRO-03.json` | PRO-03-K01 | The performance appraisal | The performance appraisal for the year, with the rating scores | fragment (length) |
| 357 | `shared/quality/PRO-03.json` | PRO-03-K01 | The disciplinary warning | The disciplinary warning file, opened for the supervisor | fragment (length) |
| 358 | `shared/quality/PRO-03.json` | PRO-03-K01 | The overtime request | The overtime request form, signed by the client | fragment (length) |
| 359 | `shared/quality/PRO-03.json` | PRO-03-K03 | Immediate suspension | Immediate suspension from all jobs, with the reason placed on the personnel file and the job sheet | fragment (length) |
| 360 | `shared/quality/additional-specialist-services-L12.json` | additional-specialist-services-L12-K02 | Yes. A training certificate is enough to start restricted work. | Yes, once the training certificate has been filed with the employer | repeats the question |
| 361 | `shared/quoting/BP-05.json` | BP-05-K02 | Ignore it, because the client has already paid | Leave the estimate, since the client has already paid | absolute wording |
| 362 | `shared/quoting/MP-04.json` | MP-04-K01 | Sales minus profit | Sales minus fixed costs, shown as a percentage of the cost | fragment (length) |
| 363 | `shared/quoting/MP-04.json` | MP-04-K03 | Ignore break-even and use the price list only | Use the price list alone and skip the break-even check | absolute wording |
| 364 | `shared/quoting/PRO-01.json` | PRO-01-K03 | Use it at full strength to save time | Use it at full strength, then rinse the fitting dry | joke or throwaway wording |
| 365 | `shared/safety/F02-L01.json` | F02-L01-K02 | Carry on without it, since the job is nearly finished | Continue without it, since the job is nearly finished | joke or throwaway wording |
| 366 | `shared/safety/F02-L01.json` | F02-L01-K02 | Ignore the instruction if it seems obvious | Work from memory if the instruction seems obvious | absolute wording; residual joke wording: 'carry on' removed |
| 367 | `shared/safety/F02-L02.json` | F02-L02-K02 | Improvise a barrier from whatever is nearby | Improvise a barrier from a spare chair and a roll of tape | absolute wording |
| 368 | `shared/safety/F02-L03.json` | F02-L03-K02 | Carry on and report it at the end of the shift | Continue and report it at the end of the shift | joke or throwaway wording |
| 369 | `shared/safety/F08-L01.json` | F08-L01-K02 | Decide yourself whether it is infectious, then carry on | Decide yourself whether it is infectious, then continue | joke or throwaway wording |
| 370 | `shared/safety/F14-L04.json` | F14-L04-K02 | Keep the equipment in the route to save time | Keep the equipment in the route, since it is out of the way | joke or throwaway wording |
| 371 | `shared/safety/F15-L03.json` | F15-L03-K01 | Use a respirator you have never been fitted for, since it looks right | Use the respirator nearest to hand, since it looks right for the job | absolute wording |
| 372 | `shared/safety/F15-L03.json` | F15-L03-K03 | Use the glove nearest to hand to save time | Use the glove nearest to hand, since it is the usual size | joke or throwaway wording |
| 373 | `shared/safety/F15-L06.json` | F15-L06-K01 | Ignore the wear, since it is only a minor tear | Keep the worn item in use, since a minor tear is not a hazard | absolute wording |
| 374 | `shared/safety/F15-L06.json` | F15-L06-K05 | No record is needed for clothing | Clothing defects need a record only after the job is finished | repeats the question |
| 375 | `shared/safety/F17-L04.json` | F17-L04-K03 | Reset the breaker and carry on with the floor | Reset the breaker and continue with the floor | joke or throwaway wording |
| 376 | `shared/safety/RAS-02.json` | RAS-02-K01 | Chemicals, bathroom. | Chemicals stored in the bathroom cupboard, with no hazard named | fragment (length) |
| 377 | `shared/safety/RAS-03.json` | RAS-03-K02 | Nothing, because residual scores ignore training. | Nothing, because residual scores leave out the crew's training record | absolute wording |
| 378 | `shared/safety/RAS-04.json` | RAS-04-K03 | Pour concentrate into an unlabelled spray bottle to save time. | Pour concentrate into a spare spray bottle with the label removed. | joke or throwaway wording |
| 379 | `shared/safety/RAS-07.json` | RAS-07-K03 | Carry on, since the work is outdoors anyway. | Continue, since the work is outdoors anyway. | joke or throwaway wording |
| 380 | `shared/safety/RAS-07.json` | RAS-07-K03 | Carry on but wave people away from the area. | Continue but wave people away from the area. | joke or throwaway wording |
| 381 | `shared/safety/RAS-08.json` | RAS-08-K01 | Carry on cleaning on the far side of the corridor. | Continue cleaning on the far side of the corridor. | joke or throwaway wording |
| 382 | `shared/safety/RAS-09.json` | RAS-09-K01 | Mark it with a sign and leave it for the next shift. | Mark it with a sign and leave it for the next cleaner. | joke or throwaway wording |
| 383 | `shared/safety/RAS-12.json` | RAS-12-K01 | Carry it alone quickly, since the lift is busy. | Carry it alone on the stairs, since the lift is out of order | repeats the question |
| 384 | `shared/safety/RAS-12.json` | RAS-12-K03 | Because noise is always legal to ignore. | Because noise below the limit needs no record at all. | absolute wording |
| 385 | `shared/safety/RAS-15.json` | RAS-15-K01 | Take the lift down to save time. | Take the lift down to reach the exit more quickly. | joke or throwaway wording |
| 386 | `shared/safety/RAS-15.json` | RAS-15-K02 | At any time while working, as long as the sound is off. | While driving, as long as the phone is held in the hand | absolute wording |
| 387 | `shared/safety/S14-L04.json` | S14-L04-K01 | Wait for the signal to return before doing anything | Wait for the signal to return, then write up the incident | absolute wording |
| 388 | `shared/safety/S14-L08.json` | S14-L08-K01 | Ignore the alarm while the lone-worker check-in is pending | Hold the alarm until the lone-worker check-in is complete | absolute wording |
| 389 | `shared/safety/WAH-01.json` | WAH-01-K03 | Foreign training decks never mention heights. | Foreign training decks give heights in imperial units only. | absolute wording |
| 390 | `shared/safety/WAH-01.json` | WAH-01-K03 | The figure in any deck is always too high to matter. | The figure in the deck is too high to matter for a short ladder. | absolute wording |
| 391 | `shared/safety/WAH-02.json` | WAH-02-K02 | It is cheaper to buy. | It is lighter to carry up a ladder. | joke or throwaway wording; residual joke wording: 'carry on' removed |
| 392 | `shared/safety/WAH-03.json` | WAH-03-K02 | Nothing else; the lanyard length is the clearance. | Nothing else, since the lanyard length gives the whole clearance | repeats the question |
| 393 | `shared/safety/WAH-04.json` | WAH-04-K01 | Use it, because it still feels firm. | Use it for the rest of the job, since the strap still feels firm | repeats the question |
| 394 | `shared/safety/WAH-04.json` | WAH-04-K02 | Only the connector. | Only the connector, which is the part that usually fails first | fragment (length) |
| 395 | `shared/safety/WAH-04.json` | WAH-04-K02 | Only the anchor. | Only the anchor point, which is the single part most often damaged | fragment (length) |
| 396 | `shared/safety/WAH-07.json` | WAH-07-K03 | Working during daylight. | Working during daylight, when visibility is at its best | fragment (length) |
| 397 | `shared/safety/WAH-08.json` | WAH-08-K01 | Walk across it quickly to save time. | Walk across it quickly, keeping weight near the sheet's edges. | joke or throwaway wording |
| 398 | `shared/safety/WAH-08.json` | WAH-08-K03 | Because materials may never be placed on roofs. | Because materials are placed on the roof edge to hold the sheet down. | absolute wording |
| 399 | `shared/safety/WAH-10.json` | WAH-10-K03 | Because rescuers must always stand on the ground. | Because rescuers must stand on the harness to lift faster. | absolute wording |
| 400 | `shared/safety/WAH-11.json` | WAH-11-K02 | Never; the starting score is always used. | Right away, before the guardrail is ordered, from the plan | absolute wording |
| 401 | `shared/standards/HSE-02.json` | HSE-02-K01 | Cleans every aspect regardless of condition | Cleans every aspect in full, without inspecting first | absolute wording |
| 402 | `shared/standards/HSE-04.json` | HSE-04-K03 | Nowhere, because it is always obvious | Nowhere, because the boundary is understood from the room layout | absolute wording |
| 403 | `shared/standards/HSE-06.json` | HSE-06-K02 | Ethanol wipes only | Ethanol wipes only, applied to a dry surface each time | fragment (length) |
| 404 | `shared/standards/HSE-06.json` | HSE-06-K03 | Randomly across the room | From the door toward the window, in one pass with no overlap | absolute wording |
| 405 | `shared/standards/HSE-07.json` | HSE-07-K01 | To avoid training | To avoid the training schedule and keep the rota simple | fragment (length) |
| 406 | `shared/standards/HSE-07.json` | HSE-07-K02 | Stop the task | Stop the task straight away, and tell the team by phone | fragment (length) |
| 407 | `shared/standards/HSE-10.json` | HSE-10-K02 | It looks untidy | It looks untidy, and visitors may think the store is poorly kept | fragment (length) |
| 408 | `shared/standards/HSE-10.json` | HSE-10-K03 | It is recommended | It is recommended for small sites that use little product | fragment (length) |
| 409 | `shared/standards/SAH-01.json` | SAH-01-K03 | Low risk, because the area is low risk | Moderate risk, because the outbreak is only at the entrance | repeats the question |
| 410 | `shared/standards/SAH-02.json` | SAH-02-K01 | Nothing changes, because a single case never affects the method | Nothing changes, because one case does not alter the method | absolute wording |
| 411 | `shared/standards/SAH-05.json` | SAH-05-K02 | They always use more product than a cloth | They spread product more evenly, so they are preferred for drying. | absolute wording |
| 412 | `shared/standards/SAH-08.json` | SAH-08-K01 | Because cleaning products always leave a film | Because cleaning products leave a film that hides the organisms | absolute wording |
| 413 | `shared/standards/SAH-11.json` | SAH-11-K03 | Only at weekends | Only at weekends, when the visitors are fewer and the staff are rostered lightly | fragment (length) |
| 414 | `shared/standards/SAH-11.json` | SAH-11-K03 | Never, because the standard fixes the frequency | Only when a visitor reports a spill, because the standard fixes the frequency | absolute wording |
| 415 | `shared/starting-business/BP-01.json` | BP-01-K02 | Subcontract the work without checking anything | Subcontract the work and check the licence afterwards | absolute wording |
| 416 | `shared/starting-business/BP-06.json` | BP-06-K03 | Because year one is never profitable | Because year one is the first profit year by definition | absolute wording |
| 417 | `shared/starting-business/F11-L01.json` | F11-L01-K01 | We clean houses. | We clean houses, offices and shops across the whole metro area | fragment (length) |
| 418 | `shared/starting-business/SHR-PLN-02.json` | SHR-PLN-02-K03 | Ignore both, because price is the only thing clients compare | Drop both, because price is the main thing clients compare | absolute wording |
| 419 | `shared/starting-business/SOL-01.json` | SOL-01-K01 | The price of your most expensive service | The price of your most popular service, multiplied by twelve | joke or throwaway wording |
| 420 | `shared/starting-business/SOL-01.json` | SOL-01-K03 | Never, once it is set | Only at the year-end review, once the figures are final | absolute wording |
| 421 | `shared/starting-business/SOL-02.json` | SOL-02-K03 | Buy new equipment | Buy new equipment and print a logo before speaking with anyone | fragment (length) |
| 422 | `shared/starting-business/SOL-02.json` | SOL-02-K03 | Sign a lease | Sign a lease for a shop front before speaking with anyone | fragment (length) |
| 423 | `shared/starting-business/SOL-04.json` | SOL-04-K02 | Never | After the first job, before any second result is seen | absolute wording; fragment (length) |
| 424 | `shared/starting-business/SOL-04.json` | SOL-04-K03 | Nothing, to save time | Nothing, since the pilot is already known to work | joke or throwaway wording |
| 425 | `shared/starting-business/additional-specialist-services-L04.json` | additional-specialist-services-L04-K02 | Yes. A training certificate is enough to start restricted work. | Yes, once the employer signs off the training certificate | repeats the question |
| 426 | `shared/team/BP-07.json` | BP-07-K03 | Marketing the business | Marketing the business to new customers each season | fragment (length) |
| 427 | `shared/team/F12-L03.json` | F12-L03-K01 | Only the workers. | Only the workers, who carry the duty for their own safety | fragment (length) |
| 428 | `shared/team/F12-L03.json` | F12-L03-K01 | Only the customer. | Only the customer, who pays for the risk of the job | fragment (length) |
| 429 | `shared/team/F12-L03.json` | F12-L03-K02 | The cheapest control available. | The control that is quickest to install on site. | joke or throwaway wording |
| 430 | `shared/team/F12-L04.json` | F12-L04-K02 | The business's preference. | The business's preference, recorded in its own staff handbook | fragment (length) |
| 431 | `shared/team/F12-L04.json` | F12-L04-K02 | What customers think. | What customers think about the service, and the price they pay | fragment (length) |
| 432 | `shared/team/F12-L06.json` | F12-L06-K01 | Ignore it unless a customer asks. | Pass it on to customers as it is, since they may ask. | absolute wording |
| 433 | `shared/team/TLD-01.json` | TLD-01-K02 | A team leader always makes the final pay decision for every worker | A team leader makes the final pay decision for the crew each month | absolute wording |
| 434 | `shared/team/TLD-01.json` | TLD-01-K02 | A manager never assigns work to the crew | A manager assigns work to the crew only through the team leader | absolute wording |
| 435 | `shared/team/TLD-02.json` | TLD-02-K03 | Tell the worker the task was never suitable | Tell the worker that the task was unsuitable from the start | absolute wording |
| 436 | `shared/team/TLD-03.json` | TLD-03-K01 | Improve the cleaning | Improve the cleaning by working faster on every room | fragment (length) |
| 437 | `shared/team/TLD-03.json` | TLD-03-K03 | Remove all deadlines | Remove all deadlines so the crew can take its time | fragment (length) |
| 438 | `shared/team/TLD-04.json` | TLD-04-K02 | You are always careless with the bathrooms | You are careless with the bathrooms, and that is why this keeps happening | absolute wording |
| 439 | `shared/team/TLD-04.json` | TLD-04-K03 | Ignore it because it is probably minor | Note it, then wait until someone raises it again | absolute wording |
| 440 | `shared/team/TLD-06.json` | TLD-06-K03 | Ignore the crew and work alone | Set the crew aside and do the work without them | absolute wording |
| 441 | `shared/team/TLD-07.json` | TLD-07-K01 | Work hard | Work hard and keep the team talking through each room | fragment (length) |
| 442 | `shared/team/TLD-07.json` | TLD-07-K02 | So the client never sees a disagreement | So the client sees every disagreement as it happens | absolute wording |
| 443 | `shared/team/TLD-07.json` | TLD-07-K03 | Start the job and ignore it | Start the job and leave the matter for the end of the week | absolute wording |
| 444 | `shared/team/TLD-08.json` | TLD-08-K02 | You are always negative and nobody wants to work with you | You are negative, and nobody on the crew wants to work with you | absolute wording |
| 445 | `shared/team/TLD-08.json` | TLD-08-K03 | Never; leads must resolve everything alone | Straight away, without any private talk, to keep it fair | absolute wording |
| 446 | `shared/team/TLD-09.json` | TLD-09-K01 | Because early conflict is always the worker's fault | Because early conflict usually means the worker has made a mistake | absolute wording |
| 447 | `shared/team/TLD-09.json` | TLD-09-K03 | Ignore the pricing and focus on the cleaning | Settle the pricing with the client, then focus on the cleaning | absolute wording |
| 448 | `shared/team/TLD-10.json` | TLD-10-K01 | Starting work early | Starting work early, before the client has arrived on site | fragment (length) |
| 449 | `shared/team/TLD-10.json` | TLD-10-K01 | Changing the rota | Changing the rota, so each worker has a fixed block of rooms | fragment (length) |
| 450 | `shared/team/TLD-11.json` | TLD-11-K01 | Burn-down is always caused by a client complaint | Burn-down is usually caused by a single client complaint | absolute wording |
| 451 | `shared/team/TLD-11.json` | TLD-11-K02 | It is kept private and never reviewed | It is kept private, so no one can check progress | absolute wording |
| 452 | `shared/team/additional-specialist-services-L10.json` | additional-specialist-services-L10-K02 | Yes. A training certificate is enough to start restricted work. | Yes, once the employer gives the go-ahead on the paperwork | repeats the question |
| 453 | `shared/validation/CPV-01.json` | CPV-01-K02 | A single result is always wrong | A single result is wrong whenever the batch is large | absolute wording |
| 454 | `shared/validation/CPV-01.json` | CPV-01-K02 | The first result is always the worst | The first result is the worst one, so it is discarded | absolute wording |
| 455 | `shared/validation/CPV-02.json` | CPV-02-K02 | Because the first cycle is never recorded | Because the first cycle is recorded and then deleted | absolute wording |
| 456 | `shared/validation/CPV-02.json` | CPV-02-K03 | Nothing, because sampling is always random | Nothing, because sampling is chosen by the cleaner on the day | absolute wording |
| 457 | `shared/validation/CPV-03.json` | CPV-03-K01 | The cheapest product in the range | The product with the most pleasant scent in the range | joke or throwaway wording |
| 458 | `shared/validation/CPV-03.json` | CPV-03-K02 | They are always contaminated by the product | They are contaminated by the product unless they are wiped twice | absolute wording |
| 459 | `shared/validation/CPV-03.json` | CPV-03-K02 | They are decorative | They are decorative, so they need only a light wipe each day | fragment (length) |
| 460 | `shared/validation/CPV-04.json` | CPV-04-K03 | Swabs always read high | Swabs read higher than the true residue, so the result is inflated | absolute wording |
| 461 | `shared/validation/CPV-04.json` | CPV-04-K03 | Residue never falls below a swab's detection | Residue falls below detection only after the third rinse | absolute wording |
| 462 | `shared/validation/CPV-05.json` | CPV-05-K01 | Limits should always be set as high as possible | Limits should be set as high as the cleaner can reach | absolute wording |
| 463 | `shared/validation/CPV-05.json` | CPV-05-K02 | Choose whichever is cheapest to test | Choose whichever is quickest to test on the day | joke or throwaway wording |
| 464 | `shared/validation/CPV-05.json` | CPV-05-K03 | Detergent residue is always beneficial | Detergent residue acts as a protective film, so it is beneficial | absolute wording |
| 465 | `shared/validation/CPV-05.json` | CPV-05-K03 | Detergent never needs to be removed | Detergent needs removal only after the final rinse | absolute wording |
| 466 | `shared/validation/CPV-06.json` | CPV-06-K03 | Can the result be ignored because it is negative? | Can the negative result be filed without a sampling record? | absolute wording |
| 467 | `shared/validation/CPV-07.json` | CPV-07-K02 | Whatever the supplier suggests for the next job | The level the supplier suggests for the next job | absolute wording |
| 468 | `shared/validation/CPV-07.json` | CPV-07-K03 | Separate analysis is cheaper | Separate analysis is the faster route, so it is preferred | joke or throwaway wording |
| 469 | `shared/validation/CPV-07.json` | CPV-07-K03 | Detergent is always removed by the first rinse | Detergent is removed by the first rinse in most cases | absolute wording |
| 470 | `shared/validation/CPV-08.json` | CPV-08-K02 | Never, once a method is validated | Only after the method has been used for a full year | absolute wording |

### Correct options left unchanged that still repeat the question

These are correct options, so they were not changed as instructed. They are listed for review.

| Check id | Correct option |
|---|---|
| BST-01-K01 | $170, the median of all five jobs |
| F06-L01-K03 | Remove the hazard, if authorised |
| SOP-26-K02 | The equipment is sensitive to dust, water and silicone-based polish |
| TJS-32-K01 | Ten passes over the first three metres, then five each way across the mat |
| ADA-05-K02 | Into the facility's general waste. |
| HLT-09-K03 | Post a wet-floor sign while it is wet |
| OTI-03-K03 | It is taken off before the person leaves theatre |
| CP-04-K02 | Their consent for the name and photo you plan to publish |
