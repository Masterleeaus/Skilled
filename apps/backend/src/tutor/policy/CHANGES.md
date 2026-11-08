# Tutor policy (T5): changes and reference

Files owned in this build:

- `src/tutor/policy/tutor-guardrail.ts`: rule tables, reason codes, evaluation, logging, grounding, output screen, learner messages.
- `src/tutor/policy/system-prompt.ts`: model-facing system prompt, built from the same rule table.
- `tests/tutor/policy/policy.test.mjs`: 25 tests.
- `src/tutor/policy/CHANGES.md`: this file.

Nothing outside these paths was edited. Runtime files in `src/ai-runtime/` are read only.

## How it plugs into the runtime

- `createTutorGuardrail()` returns a `GuardrailContract`. Pass it as `stages.guardrail` to `runPipeline()`.
- A refusal returns `{ pass: false, reason: <reason code> }`. The pipeline then returns `blocked: true`, `stage: 'guardrail'`, and `reason` set to that code. Retrieval and tools do not run.
- The learner text comes from `learnerMessageFor(code, { hintSection })`. The caller must show it.
- Grounding (`checkGrounding`) and output screening (`screenTutorOutput`) are not pipeline stages. The responder calls them. See "Integration notes".

## Rules (evaluated in this order; first match wins)

| Id | Reason code | Rule |
|---|---|---|
| R1-safety | `safety_signal` | Self-harm, suicide, wish not to live, or immediate danger. Give the safety message only. Normal answer suppressed. Australia: 000 for emergencies, Lifeline 13 11 14. |
| R2-integrity | `integrity_violation` | Cheating; changing a grade or result; marking or recording a false pass; impersonating an assessor or signing off for someone; forging evidence; doing an assessment for the learner; bypassing the pass rule; ignoring or revealing the rules. |
| R3-assessment | `assessment_answer_request` | Asking for the answer to a knowledge check, quiz or assessment item. Refused with a pointer to the lesson section when the caller supplies one. |
| R4-advice | `advice_outside_curriculum` | Personal medical, legal or financial advice. Points to a doctor or pharmacist, a lawyer, or a licensed financial adviser. 000 if an emergency. |
| R5-off-topic | `off_topic` | Creative writing, homework or code for school, sport results, market prices, horoscopes, politics or relationship advice. Politely declined. |
| G1-grounding | `no_curriculum_match` | After retrieval: no non-assessment chunk with a positive score and text. The answer must say the course material does not cover it. |
| O1-answer-leak | `output_answer_leak` | Model output containing an item id, an answer-key field, or a stated correct option. Replaced with a short message. |

Signals within each rule are listed in the table in `tutor-guardrail.ts` with ids such as `safety.self_harm_terms` and `assess.answer_request`. Each refusal log records the rule id and signal id.

## Reason codes (fixed set, 7)

`safety_signal`, `integrity_violation`, `assessment_answer_request`, `advice_outside_curriculum`, `off_topic`, `no_curriculum_match`, `output_answer_leak`.

Adding a code is a policy change. The test "reason code set is fixed" fails until it is updated.

## Refusal log

One JSON entry per refusal: `event`, `stage` (`input`, `output` or `grounding`), `reason_code`, `rule_id`, `signal_id`, `company_id` (string), `at`. The entry type has no text field, so learner text cannot be logged. The default sink is `console.info`. Callers can inject a logger.

## Assessment content: what it looks like and the signals used

Evidence came from `curriculum/` under the lms-work tree. I opened three files as a sample: `assessments/ACE-01.assessment.json`, `assessments/PFM-03.assessment.json` and the learner file `lessons/converted/C19-L05.json`. I also read `curriculum/SCHEMA.md`. Of the 1009 files in `assessments/`, all have `lessonId`, `knowledgeAnswers`, `practicalCriteria`, `passRule`, `evidenceRequired` and `stopWorkCriteria`.

- Assessor-only file (`*.assessment.json`): `knowledgeAnswers` entries with ids such as `ACE-01-K01`, a `correctIndex`, and a `rationale`. Also `practicalCriteria`, `stopWorkCriteria`, `evidenceRequired`, and a `passRule` such as "80% on knowledge checks; practical sign-off separate". A few files carry `completionRule` (template lessons: "assessor signs off ... the learner receives the document on sign-off").
- Learner lesson file: `knowledgeChecks` with the same ids (`C19-L05-K01`), a `question` and `options`, but no `correctIndex`. So the item ids are visible to learners.

Signals used:

1. Item id pattern `<lesson-id>-K<nn>` (for example `ACE-01-K02`, `C19-L05-K01`). This is the strongest signal. It appears in both learner and assessor files. Used for R3 input and O1 output.
2. Answer intent combined with an assessment target. Intent: "correct answer", "which option is correct", "tell me the letters", "answer to question N". Target: knowledge check, quiz, exam, assessment, `question N`, `option A`, `correctIndex`, multiple choice.
3. Pasted lettered options (`a)` and `b)`) with a question cue.
4. Retrieval side: assessor-only fields (`knowledgeAnswers`, `correctIndex`, `passRule`, `practicalCriteria`, `stopWorkCriteria`, `completionRule`) or assessment-typed title or doc type. These chunks are dropped before the model sees them.
5. Output side: `correctIndex`, `answer key`, `knowledge answers`, `pass rule`, and "the correct answer is".

Learner `knowledgeChecks` items are not dropped at retrieval. They carry no answer key, but the item ids are still refused on input.

## Test results

25 tests pass with `node --experimental-transform-types --test tests/tutor/policy/policy.test.mjs`. Coverage: every input and output rule has refused and allowed cases, and each refused case must trip its own rule; the safety message appears and retrieval does not run after a safety block; the refusal log has a reason code and no learner text; the system prompt has the curriculum-only instruction and every rule.

A false-positive check ran the input rules over the 305 course titles in `curriculum/lessons/TITLES-ONLY.csv`. None were flagged. Titles are not learner phrasing, so this shows little about real messages.

Node prints an ExperimentalWarning and a module-type warning for the `.ts` files. The tests still pass. `tsc` was not run, as instructed.

## Integration notes (for the tutor responder, not this build)

1. Call `checkGrounding(retrieval)` after the pipeline's retrieval stage. If it is not allowed, do not call the model. Use `usable` as the context you send.
2. Pass `hintSection` only from a lesson heading in the retrieved curriculum. Do not pass learner text.
3. Run `screenTutorOutput(modelText)` on every model reply before showing it.
4. When `pipeline.reason` is `safety_signal`, show `learnerMessageFor('safety_signal')` and do not call the model.
5. Send `buildTutorSystemPrompt()` as the system prompt.

## Known gaps

- Keyword and pattern rules miss paraphrases, indirect wording, misspellings, leetspeak and other languages. Example: "I'm done with everything" or "I've been thinking about ending it" is not caught by R1. Treat R1 as a floor, not a safety guarantee. Human review of the safety wording is needed before release.
- R3 misses a pasted question with no options and no id, for example "Which one is correct: the pump runs dry or not?". It also misses an item described without its id.
- R3 can false-positive on a learner asking how quizzes work when they also use the word "answer" with "quiz". Accepted for a first release.
- R5 is a deny list, not an allow list of course topics. Off-topic requests that match no pattern pass to the model, which the prompt tells to decline.
- G1 uses "score greater than zero" as the relevance test. There is no real threshold, so weak matches count as grounded.
- The pipeline has no post-retrieval or output hook. Grounding and output screening are not enforced by `runPipeline()`. Each responder must call them.
- Assessment chunks are dropped by title, doc type and assessor-only field names. If the indexer stores assessment content under other names, it gets through.
- Only the input stage and output rules were tested end to end through the pipeline. The responder that calls the model does not exist in this build.
