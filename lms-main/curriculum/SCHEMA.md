# Lesson authoring contract (applies to every writer, researcher and assessment builder)

Scope: Australia-wide. Victoria is not the default. Read /curriculum/planning/DECISIONS.md first.

## File layout
- One JSON file per lesson: curriculum/courses/<course-slug>/<lesson-id>.json
- Shared (base or group) lessons are written ONCE under curriculum/shared/<area>/<lesson-id>.json and referenced by course manifests. Do not duplicate shared content in each course.
- Research notes: curriculum/research/topics/<course-slug>.md (sources with URL and date checked).
- Assessment files: curriculum/assessments/<lesson-id>.assessment.json (assessor-only answers live here, never in the lesson file).

## Lesson JSON (learner-visible)
{
  "id": "<lesson-id>",
  "title": "<title>",
  "courseSlugs": ["<course-slug>", "..."],
  "moduleTitle": "<module from curriculum/structure>",
  "layer": "base | group | business | high-risk | app",
  "lessonType": "K | RH | RV | C | W",
  "estimatedMinutes": <int>,
  "audience": "<who this is for>",
  "prerequisites": ["<lesson-id>"],
  "learningOutcomes": ["measurable outcome starting with a verb"],
  "instruction": [ { "heading": "...", "body": "full teaching text, not bullet outline" } ],
  "procedure": [ "numbered step" ],
  "workedExamples": [ { "situation": "realistic home-service job", "decisionPrompt": "...", "reasoning": "..." } ],
  "equipmentAndPpe": ["..."],
  "commonErrors": [ { "error": "...", "prevention": "..." } ],
  "safetyAndRegulatory": [ { "point": "...", "licenceNotice": false } ],
  "qualityStandard": ["acceptance criterion"],
  "documentationEvidence": ["what must be recorded"],
  "summary": ["takeaway"],
  "businessFields": ["{{business:group.field}}"],
  "knowledgeChecks": [
    { "id": "<lesson-id>-K01", "question": "...", "options": ["...", "...", "..."], "correctIndex": 0 }
  ],
  "status": "DRAFT | READY",
  "sourceReferences": ["source id or URL, with date checked"],
  "officialReferences": [{ "id": "R1", "title": "<official document or page>", "url": "<URL>", "pageDate": "<date shown on page, or 'no date shown'>", "checked": "YYYY-MM-DD", "covers": "<what this source supports>" }],
  "reviewStatus": "NOT REVIEWED"
}

## Rules
- Knowledge checks: multiple choice, 3 or 4 options, exactly one correct, plausible distractors. correctIndex is in the assessment file, NOT the learner file. Learner JSON uses options and question only. The answer key and rationale go to assessment JSON.
- Business placeholders: use {{business:group.field}} only with the 56 approved fields in /curriculum/business-lesson-fields.json. Never hard-code a business's supplier, phone, price or licence number.
- Licence notice: where a lesson covers licensed or authorised work, set licenceNotice true and state what the licence covers and that the lesson does not grant it. Do not reduce depth because of a licence.
- High-hazard lessons (High-risk cleaning module): full content with warnings where needed. Do not drop content for safety reasons.
- Never imply that completing a lesson gives a licence, certificate or authority to do regulated work.
- Course tracks: every course defaults to the non-licensed track. The licensed track is offered as an alternative on the course page, and the learner chooses one of the two clearly. Lesson licence status comes from curriculum/licence/lesson-licence.json: required lessons are left out of the non-licensed track, threshold lessons stay in with the work limit stated, and not_checked lessons stay in both tracks until reviewed.
- Every factual claim about law, regulation or standards needs a sourceReferences entry with URL and date checked. If not confirmed, write UNCONFIRMED and say so in the lesson.
- Where an official page shows a "last updated" date, the page is still current: use its wording even if that date is old, and take the latest update date the page shows as its pageDate. Record that date on the official page entry (pageDate), and say on the page that it was last updated on that date.
- officialReferences lists the official pages actually fetched and read, one entry per page, with its page date and the date checked. A claim cited to an officialReferences id (for example R1) must match something that page says. Pages read only through a summary tool should be recorded as such in covers. Learner-visible text never carries internal source codes.
- Do not invent statistics, prices, or regulator names.
- Status is DRAFT or READY. All lessons stay DRAFT until the owner reviews and approves them course by course. READY is set only on the owner's approval, one course at a time (OWNER-DECISIONS item 22, which replaces items 11 and 12). The publisher does not read this field. Reviewer status is NOT REVIEWED. Nothing is marked verified.

## Assessment JSON (assessor-only)
{
  "lessonId": "<lesson-id>",
  "knowledgeAnswers": [ { "id": "<lesson-id>-K01", "correctIndex": 0, "rationale": "..." } ],
  "practicalCriteria": [ "observable criterion" ],
  "passRule": "stated pass condition, or NOT SET",
  "evidenceRequired": ["photo, record, observation"],
  "stopWorkCriteria": ["..."]
}
- A reading or quiz pass is never presented as verified practical competence.
- Practical criteria need an observable pass condition, or passRule is NOT SET.

## Working method
- Check TITLES-ONLY.csv and MANIFEST.csv for your lessons. Check /curriculum/planning/CATALOGUE-V2.csv for the decision and action.
- If a source lesson exists in /curriculum/lessons/ready/<id>.json, rewrite from it. Keep the source's correct content, fix errors, and update the format. Do not discard good content.
- If no source exists, write from the research notes for that course, and mark sources you could not confirm as UNCONFIRMED.
- Write each lesson to its own file. Do not edit other writers' files.
- At the end, write curriculum/courses/<group>/REPORT.md with counts: lessons written, rewritten, still needing research, assessments created, UNCONFIRMED items.

## Editable template lessons (added for the extraction pass)
A template lesson replaces knowledge checks with a fill-in document the learner completes. It is assessed against a rubric by an assessor or mentor, not by a quiz.

File: curriculum/shared/<area>/<id>.json (or curriculum/courses/<slug>/<id>.json if course-specific), with:
- "lessonKind": "template"
- "knowledgeChecks": [] (none)
- "editableTemplates": [ { "templateId": "<id>-T01", "title": "...", "purpose": "...", "fields": [ { "fieldId": "f1", "label": "...", "type": "text | longtext | number | currency | date | checklist | table", "prompt": "what to write", "guidance": "what a good answer contains", "required": true } ] } ]
- "assessmentRubric": [ { "criterion": "...", "levels": { "meets": "...", "does_not_meet": "..." } } ]
- The matching assessment file holds "passRule": "assessor sign-off against rubric; no quiz pass", and "evidenceRequired": ["completed template saved", "assessor review"].
- Template fields never contain answer keys. Sample answers are not stored.

## Source material rules (added for the extraction pass)
- Extract facts, steps and structure from source documents, then write the lesson in new words. Do not copy sentences or long phrases.
- Record each source in sourceReferences as: "<document name>, <section>; rights: user-held | reworded (no copying)".
- Dated or non-Australian figures (for example US market sizes) must be marked as historical and not used as current Australian facts.
- Technical standards named in a source (for example BICSc) are referenced by name only, unless the standard text was read; mark UNCONFIRMED otherwise.
- IDs: BP- (business plan), MP- (marketing plan), PRO- (proposal), SOP- (standard operating procedures), ECO- (Eco-Clean manual), HOT- (hotel article), TJS- (Janitorial Store programme, reworded), CP- (Copy Posse guide), TPL- (templates).

## Completed-document output for template lessons (added for the template pass)
Every template lesson produces a finished document for the learner at the end. The learner builds the document, SOP, contract or plan field by field as they work through the lesson; the system then assembles it into one proper document they keep.
- Each template adds "outputDocument": { "title": "...", "format": "document | sop | contract | plan | form", "sections": [ { "heading": "...", "fieldIds": ["f1", "f2"] } ], "footer": "..." }
- Every field in editableTemplates must appear in exactly one section, so nothing the learner writes is dropped.
- Business placeholders in output titles and headings use {{business:group.field}} from business-lesson-fields.json.
- The assessment file holds "completionRule": "assessor signs off the assembled document against the rubric; the learner receives the document on sign-off".
- Templates are fill-in tools. The learner never sees model answers, and the output document never includes sample text from the source.

## Source priority (added for the template pass)
- Where an official or government guide conflicts with any other source, the official guide wins, and the lesson says so in sourceReferences. Examples: the Australian Guidelines for Prevention and Control of Infection in Healthcare (NHMRC) over informal healthcare cleaning advice.
- Cross-check guide content against a second source where one exists. Record the check in sourceReferences as "cross-checked against <source>". If nothing confirms a point, mark it UNCONFIRMED.
- Sources without user-held rights (the Australian healthcare guidelines and the Salesforce field service guide) are reworded only, in new words, with no phrase of four or more words kept from the source. Record them as "rights: not held by user; reworded (no copying)". These sources are never quoted or reproduced in a lesson.
- The Salesforce field service guide is the reference basis for the field-service app (Titan Zero Field). Its lessons use layer "app" and map each concept to the app entity it informs in sourceReferences.

## ID prefixes added in the template pass
- HCG- healthcare infection prevention and control (Australian guidelines, reworded)
- SFS- Salesforce field service concepts (reworded), app layer
- GCM- Green Cleaning Manual (2012)
- RAS- risk assessment for cleaning services
- HBM- handyman business (PDF)
- TPL- all templates, including contract, proposal and business plan templates
- SOP- extended for annex material found in the full text of the SOP document
