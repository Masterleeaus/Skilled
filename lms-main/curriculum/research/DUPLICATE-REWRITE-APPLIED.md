# Duplicate knowledge-check rewrite: applied log

Owner decision 14 (curriculum/research/OWNER-DECISIONS.md). Source list: curriculum/research/DUPLICATE-CHECKS.md (33 groups, 175 checks).

## Summary

- Groups: 33. Each group keeps one check unchanged and rewords the rest.
- Checks kept unchanged: 33. Checks reworded: 142 (175 minus 33). Option text changed: 1 (one distractor, see below).
- Answer keys: unchanged. `correctIndex` and rationale in `curriculum/assessments/*.assessment.json` were not edited. Each reworded question keeps the same correct option at the same index.
- Edited files: learner lesson JSON under `curriculum/shared/` and `curriculum/courses/` only. Edits are exact literal replacements inside the matching `knowledgeChecks` object, so the rest of each file is left as it was.

## Decisions

1. Kept check per group (the lesson where the generic question fits best, or the first listed lesson where no lesson fits better). Kept checks are listed below.
2. Each reworded question names the lesson's own topic (for example the toilet-area tool rule, marble, the bedrooms-and-linen scope, pool plant area, NSW fish release) and checks against that lesson's learning outcomes, procedure and rationale.
3. F16-L01-K03 option 1 changed from `Use the disinfectant at full strength for both` to `Use the disinfectant at full strength on the cupboard`, because the reworded question asks about one soil on one surface. No other option text changed.
4. Groups G22, G23, G25, G30, G31 and G33 had wording variants in the source list. The live text of each check was used as the old question.
5. PVB-01-K03 (group G25): when this edit ran, another agent had already changed both PVB checks to `How does the note describe the swimming pool area?` (Victorian PV wording change). The reword was applied to the live text, so PVB-01-K03 now reads `How does the note's definitions section describe the swimming pool area?`.
6. Duplicates in `lessons/converted/`, `lessons/ready/`, and `apps/backend/prisma/curriculum/cleaning/` still carry the old questions. Those are generated copies outside the scope of this task and are covered by owner decision 16 (rebuild from source). They were not edited.

## Kept checks (not changed)

| Group | Kept check |
|---|---|
| G01 | F15-L03-K03 (PPE is task-specific) |
| G02 | F15-L01-K04 |
| G03 | F15-L01-K05 |
| G04 | F03-L01-K02 |
| G05 | F01-L04-K01 |
| G06 | F01-L04-K02 |
| G07 | F09-L01-K02 |
| G08 | F10-L01-K02 |
| G09 | F02-L02-K02 |
| G10 | C01-L01-K01 |
| G11 | C01-L01-K02 |
| G12 | C01-L03-K03 |
| G13 | F08-L01-K01 |
| G14 | F08-L01-K02 |
| G15 | S14-L03-K02 |
| G16 | S14-L03-K03 |
| G17 | additional-specialist-services-L04-K02 |
| G18 | C05-L01-K01 |
| G19 | C05-L01-K02 |
| G20 | C05-L01-K03 |
| G21 | C12-L05-K03 |
| G22 | ECO-04-K02 |
| G23 | F06-L04-K01 |
| G24 | NEW-POND-03-K03 |
| G25 | PVB-05-K01 |
| G26 | S12-L03-K01 |
| G27 | S12-L03-K02 |
| G28 | S12-L03-K03 |
| G29 | NEW-MAS-01-K01 |
| G30 | pond-cleaning-L07-K02 |
| G31 | pond-cleaning-L10-K01 |
| G32 | pond-cleaning-L10-K02 |
| G33 | pond-cleaning-L11-K03 |

## Question changes

| Group | File | Check id | Old question | New question |
|---|---|---|---|---|
| G01 | `curriculum/shared/induction/F15-L01.json` | F15-L01-K03 | Explain the task-specific decision | How should protective equipment be chosen, separately from the uniform? |
| G01 | `curriculum/shared/induction/F15-L02.json` | F15-L02-K03 | Explain the task-specific decision | Which footwear is correct for the floor conditions on a wet-floor job? |
| G01 | `curriculum/shared/induction/F15-L04.json` | F15-L04-K03 | Explain the task-specific decision | When must hand hygiene be performed during a cleaning task? |
| G01 | `curriculum/shared/customer/F15-L05.json` | F15-L05-K03 | Explain the task-specific decision | How should you gain entry to a customer's premises? |
| G01 | `curriculum/shared/safety/F15-L06.json` | F15-L06-K03 | Explain the task-specific decision | How should contaminated protective clothing be handled after a shift? |
| G01 | `curriculum/shared/chemicals/F16-L01.json` | F16-L01-K03 | Explain the task-specific decision | Which product category suits greasy soil on a painted cupboard? |
| G01 | `curriculum/shared/chemicals/F16-L03.json` | F16-L03-K03 | Explain the task-specific decision | What should happen when an acidic bathroom cleaner is considered for marble? |
| G01 | `curriculum/shared/equipment/F17-L01.json` | F17-L01-K03 | Explain the task-specific decision | How should cloths and brushes be chosen between kitchen and toilet zones? |
| G01 | `curriculum/shared/safety/F17-L04.json` | F17-L04-K03 | Explain the task-specific decision | What should you do when equipment trips a breaker intermittently? |
| G01 | `curriculum/shared/safety/F17-L05.json` | F17-L05-K03 | Explain the task-specific decision | What should you do before carrying two full buckets up a flight of stairs? |
| G01 | `curriculum/shared/job-management/F19-L01.json` | F19-L01-K03 | Explain the task-specific decision | What should you do when the job scope is unclear about bedrooms and linen? |
| G01 | `curriculum/shared/job-management/F19-L05.json` | F19-L05-K03 | Explain the task-specific decision | How should a wet corridor be worked in an occupied building? |
| G01 | `curriculum/shared/quality/F19-L06.json` | F19-L06-K03 | Explain the task-specific decision | What must a readiness report state before work begins? |
| G02 | `curriculum/shared/induction/F15-L02.json` | F15-L02-K04 | Identify the unsafe alternative | Which footwear practice is unsafe on a wet walkway? |
| G02 | `curriculum/shared/safety/F15-L03.json` | F15-L03-K04 | Identify the unsafe alternative | Which glove choice is unsafe when the product label specifies the glove type? |
| G02 | `curriculum/shared/induction/F15-L04.json` | F15-L04-K04 | Identify the unsafe alternative | Which habit is unsafe near the chemical store? |
| G02 | `curriculum/shared/customer/F15-L05.json` | F15-L05-K04 | Identify the unsafe alternative | Which practice at a customer's premises is unsafe? |
| G02 | `curriculum/shared/safety/F15-L06.json` | F15-L06-K04 | Identify the unsafe alternative | Which practice with clothing and footwear is unsafe for a hazardous task? |
| G02 | `curriculum/shared/chemicals/F16-L01.json` | F16-L01-K04 | Identify the unsafe alternative | Which product choice is unsafe when heavy visible soil is present? |
| G02 | `curriculum/shared/chemicals/F16-L03.json` | F16-L03-K04 | Identify the unsafe alternative | Which action is unsafe on natural stone such as marble? |
| G02 | `curriculum/shared/equipment/F17-L01.json` | F17-L01-K04 | Identify the unsafe alternative | Which tool practice breaks hygiene-zone segregation? |
| G02 | `curriculum/shared/safety/F17-L04.json` | F17-L04-K04 | Identify the unsafe alternative | Which electrical practice is unsafe with portable equipment? |
| G02 | `curriculum/shared/safety/F17-L05.json` | F17-L05-K04 | Identify the unsafe alternative | Which manual-handling practice is unsafe? |
| G02 | `curriculum/shared/job-management/F19-L01.json` | F19-L01-K04 | Identify the unsafe alternative | Which response to a job scope request is unsafe? |
| G02 | `curriculum/shared/job-management/F19-L05.json` | F19-L05-K04 | Identify the unsafe alternative | Which work-zone practice is unsafe in a wet area? |
| G02 | `curriculum/shared/quality/F19-L06.json` | F19-L06-K04 | Identify the unsafe alternative | Which response to a failed site access is unsafe? |
| G03 | `curriculum/shared/induction/F15-L02.json` | F15-L02-K05 | Describe the record or escalation needed | What should be recorded and escalated about worn footwear? |
| G03 | `curriculum/shared/safety/F15-L03.json` | F15-L03-K05 | Describe the record or escalation needed | What should be recorded about PPE issued for a hazardous task? |
| G03 | `curriculum/shared/induction/F15-L04.json` | F15-L04-K05 | Describe the record or escalation needed | How should an exposure or symptom be reported on site? |
| G03 | `curriculum/shared/customer/F15-L05.json` | F15-L05-K05 | Describe the record or escalation needed | What should you do when a customer challenges your identity? |
| G03 | `curriculum/shared/safety/F15-L06.json` | F15-L06-K05 | Describe the record or escalation needed | What must be recorded about worn protective clothing before the next hazardous task? |
| G03 | `curriculum/shared/chemicals/F16-L01.json` | F16-L01-K05 | Describe the record or escalation needed | What should be recorded when a cleaning product is chosen? |
| G03 | `curriculum/shared/chemicals/F16-L03.json` | F16-L03-K05 | Describe the record or escalation needed | What should be recorded when a product is ruled out for a surface? |
| G03 | `curriculum/shared/equipment/F17-L01.json` | F17-L01-K05 | Describe the record or escalation needed | What should happen to a cleaning tool with frayed or damaged parts? |
| G03 | `curriculum/shared/safety/F17-L04.json` | F17-L04-K05 | Describe the record or escalation needed | What must be recorded and tagged before faulty equipment is reused? |
| G03 | `curriculum/shared/safety/F17-L05.json` | F17-L05-K05 | Describe the record or escalation needed | What should you report when a task is beyond personal capacity? |
| G03 | `curriculum/shared/job-management/F19-L01.json` | F19-L01-K05 | Describe the record or escalation needed | What should be recorded about a scope question before the job starts? |
| G03 | `curriculum/shared/job-management/F19-L05.json` | F19-L05-K05 | Describe the record or escalation needed | What must be recorded before a controlled work zone is reopened? |
| G03 | `curriculum/shared/quality/F19-L06.json` | F19-L06-K05 | Describe the record or escalation needed | How should a readiness decision be recorded for the job file? |
| G04 | `curriculum/shared/chemicals/F03-L02.json` | F03-L02-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do after an unknown mixture of cleaning products is created? |
| G04 | `curriculum/shared/chemicals/F03-L03.json` | F03-L03-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when the correct dilution of a product is unclear? |
| G04 | `curriculum/shared/chemicals/F03-L04.json` | F03-L04-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when a chemical spill occurs in storage? |
| G04 | `curriculum/shared/equipment/F04-L01.json` | F04-L01-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What should you do when the tool choice would scratch a polished stone vanity? |
| G04 | `curriculum/shared/equipment/F04-L02.json` | F04-L02-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when a lead is damaged before a machine is used? |
| G04 | `curriculum/shared/equipment/F04-L03.json` | F04-L03-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when a scrubber approaches an occupied corridor? |
| G04 | `curriculum/shared/equipment/F04-L04.json` | F04-L04-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | When can equipment with a recorded fault go back into storage? |
| G04 | `curriculum/shared/chemicals/F16-L01.json` | F16-L01-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when the right product category for grease is uncertain? |
| G04 | `curriculum/shared/chemicals/F16-L03.json` | F16-L03-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do before spot-testing a new method on a surface? |
| G04 | `curriculum/shared/equipment/F17-L01.json` | F17-L01-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when a toilet-area tool is found in the kitchen kit? |
| G04 | `curriculum/shared/safety/F17-L04.json` | F17-L04-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when a cable shows a fault during a pre-start check? |
| G04 | `curriculum/shared/safety/F17-L05.json` | F17-L05-K02 | What do you do if the method, product or equipment is unsafe or uncertain? | What do you do when a load is too awkward to lift alone? |
| G05 | `curriculum/shared/induction/F01-L01.json` | F01-L01-K01 | What should you do if the task is outside your authorisation or training? | What should you do when a client asks for an extra task outside the work order? |
| G05 | `curriculum/shared/customer/F01-L02.json` | F01-L02-K01 | What should you do if the task is outside your authorisation or training? | What should you do after damaging a customer's property? |
| G05 | `curriculum/shared/induction/F01-L03.json` | F01-L03-K01 | What should you do if the task is outside your authorisation or training? | How should you respond when a client asks for more than you can deliver? |
| G05 | `curriculum/shared/induction/F15-L01.json` | F15-L01-K01 | What should you do if the task is outside your authorisation or training? | What should you do if the uniform you have does not suit an unfamiliar task? |
| G05 | `curriculum/shared/induction/F15-L02.json` | F15-L02-K01 | What should you do if the task is outside your authorisation or training? | What should you do if your footwear does not suit a wet-floor task? |
| G05 | `curriculum/shared/safety/F15-L03.json` | F15-L03-K01 | What should you do if the task is outside your authorisation or training? | What should you do before using a respirator you have not been fitted for? |
| G05 | `curriculum/shared/induction/F15-L04.json` | F15-L04-K01 | What should you do if the task is outside your authorisation or training? | What should you do if a hygiene risk is beyond your training? |
| G05 | `curriculum/shared/customer/F15-L05.json` | F15-L05-K01 | What should you do if the task is outside your authorisation or training? | What should you do when a customer refuses entry or challenges your access? |
| G05 | `curriculum/shared/safety/F15-L06.json` | F15-L06-K01 | What should you do if the task is outside your authorisation or training? | What should you do with a damaged piece of protective clothing? |
| G06 | `curriculum/shared/induction/F01-L01.json` | F01-L01-K02 | How should a hazard, defect or unresolved issue be handed over? | How should an unresolved expectation or boundary issue be reported? |
| G06 | `curriculum/shared/customer/F01-L02.json` | F01-L02-K02 | How should a hazard, defect or unresolved issue be handed over? | How should access codes and client details be passed on at handover? |
| G06 | `curriculum/shared/induction/F01-L03.json` | F01-L03-K02 | How should a hazard, defect or unresolved issue be handed over? | How should you communicate a problem found on site to the nominated contact? |
| G06 | `curriculum/shared/induction/F15-L01.json` | F15-L01-K02 | How should a hazard, defect or unresolved issue be handed over? | How should a torn or contaminated uniform item be handed over? |
| G06 | `curriculum/shared/induction/F15-L02.json` | F15-L02-K02 | How should a hazard, defect or unresolved issue be handed over? | How should a site footwear rule that conflicts with safe work be handed over? |
| G06 | `curriculum/shared/safety/F15-L03.json` | F15-L03-K02 | How should a hazard, defect or unresolved issue be handed over? | How should missing or damaged PPE be handed over before a task continues? |
| G06 | `curriculum/shared/induction/F15-L04.json` | F15-L04-K02 | How should a hazard, defect or unresolved issue be handed over? | How should soiled clothing be handled before you travel to the next site? |
| G06 | `curriculum/shared/customer/F15-L05.json` | F15-L05-K02 | How should a hazard, defect or unresolved issue be handed over? | How should access details be passed to the next worker? |
| G06 | `curriculum/shared/safety/F15-L06.json` | F15-L06-K02 | How should a hazard, defect or unresolved issue be handed over? | How should a defect in issued protective clothing be handed over? |
| G07 | `curriculum/shared/quality/F09-L02.json` | F09-L02-K02 | What should happen when the work is outside scope or cannot be completed safely? | What should you do when a high area cannot be inspected safely? |
| G07 | `curriculum/shared/quality/F09-L03.json` | F09-L03-K02 | What should happen when the work is outside scope or cannot be completed safely? | What should you do with an inspection item that cannot be finished within scope? |
| G07 | `curriculum/shared/quality/F09-L04.json` | F09-L04-K02 | What should happen when the work is outside scope or cannot be completed safely? | What should happen when a nonconforming residue makes a floor slippery? |
| G07 | `curriculum/shared/quality/F09-L05.json` | F09-L05-K02 | What should happen when the work is outside scope or cannot be completed safely? | What should happen to an unfinished item at customer handover? |
| G07 | `curriculum/shared/job-management/F19-L01.json` | F19-L01-K02 | What should happen when the work is outside scope or cannot be completed safely? | How should a request for work the job scope does not cover be handled? |
| G07 | `curriculum/shared/job-management/F19-L05.json` | F19-L05-K02 | What should happen when the work is outside scope or cannot be completed safely? | What should you do with the barriers when a wet area cannot be made safe in time? |
| G07 | `curriculum/shared/quality/F19-L06.json` | F19-L06-K02 | What should happen when the work is outside scope or cannot be completed safely? | What should you do when access fails on arrival? |
| G08 | `curriculum/shared/operations/F10-L02.json` | F10-L02-K02 | What should you do if consent, access, safety or authority is unclear? | What should you do when the signed scope for a shift conflicts with what is on site? |
| G08 | `curriculum/shared/equipment/F10-L04.json` | F10-L04-K02 | What should you do if consent, access, safety or authority is unclear? | What should you do when the storage location for chemicals is unapproved or unclear? |
| G08 | `curriculum/shared/quality/F10-L05.json` | F10-L05-K02 | What should you do if consent, access, safety or authority is unclear? | What should happen to an access gap found while reinspecting completed zones? |
| G08 | `curriculum/shared/customer/F14-L01.json` | F14-L01-K02 | What should you do if consent, access, safety or authority is unclear? | What should you do when a client's consent to a change is unclear? |
| G08 | `curriculum/shared/safety/F14-L02.json` | F14-L02-K02 | What should you do if consent, access, safety or authority is unclear? | What should you do about a safeguarding concern during a visit? |
| G08 | `curriculum/shared/safety/F14-L04.json` | F14-L04-K02 | What should you do if consent, access, safety or authority is unclear? | What should you do when a walking aid blocks your route in a resident's home? |
| G08 | `curriculum/shared/customer/F14-L05.json` | F14-L05-K02 | What should you do if consent, access, safety or authority is unclear? | What should you do when a client's communication preference is unclear? |
| G09 | `curriculum/shared/safety/F02-L01.json` | F02-L01-K02 | What should you do if a required control or instruction is unavailable? | What should you do when a hazard found on the walk-through has no control in place? |
| G09 | `curriculum/shared/safety/F02-L03.json` | F02-L03-K02 | What should you do if a required control or instruction is unavailable? | What is the first response to an incident when no instruction has been given? |
| G09 | `curriculum/shared/safety/F02-L04.json` | F02-L04-K02 | What should you do if a required control or instruction is unavailable? | What should happen to a job whose pre-start check finds a control missing? |
| G09 | `curriculum/shared/job-management/F05-L01.json` | F05-L01-K02 | What should you do if a required control or instruction is unavailable? | What should you do when the sequence plan depends on a control you do not have? |
| G09 | `curriculum/shared/chemicals/F05-L02.json` | F05-L02-K02 | What should you do if a required control or instruction is unavailable? | What should you do when the disinfection step cannot be followed as the label directs? |
| G09 | `curriculum/shared/job-management/F05-L03.json` | F05-L03-K02 | What should you do if a required control or instruction is unavailable? | What should you do when the designated cloths for a zone are unavailable? |
| G10 | `curriculum/shared/induction/C01-L02.json` | C01-L02-K01 | What must be checked before starting this task? | What must be read on the work order before the first room is cleaned? |
| G10 | `curriculum/shared/induction/C01-L03.json` | C01-L03-K01 | What must be checked before starting this task? | What must be checked before the first-job demonstration touches equipment? |
| G10 | `curriculum/shared/job-management/C02-L01.json` | C02-L01-K01 | What must be checked before starting this task? | What must be identified about a surface before a cleaning method is chosen? |
| G10 | `curriculum/shared/job-management/C02-L02.json` | C02-L02-K01 | What must be checked before starting this task? | What two factors must a cleaning method be matched to before work starts? |
| G10 | `curriculum/shared/job-management/C02-L03.json` | C02-L03-K01 | What must be checked before starting this task? | What hazard check must be repeated as conditions change during a demonstration? |
| G11 | `curriculum/shared/induction/C01-L02.json` | C01-L02-K02 | What is the safest response when the situation changes or is uncertain? | What should you do when a client asks for a change to the work order? |
| G11 | `curriculum/shared/induction/C01-L03.json` | C01-L03-K02 | What is the safest response when the situation changes or is uncertain? | What should you do with a damaged power lead during the first-job demonstration? |
| G11 | `curriculum/shared/job-management/C02-L01.json` | C02-L01-K02 | What is the safest response when the situation changes or is uncertain? | What should you do with an unlabelled polished stone counter before cleaning it? |
| G11 | `curriculum/shared/job-management/C02-L02.json` | C02-L02-K02 | What is the safest response when the situation changes or is uncertain? | What should you do when a mark on a painted cabinet resists the first method? |
| G11 | `curriculum/shared/job-management/C02-L03.json` | C02-L03-K02 | What is the safest response when the situation changes or is uncertain? | What should you do when a pedestrian enters a wet work zone during a demonstration? |
| G12 | `curriculum/shared/induction/C01-L01.json` | C01-L01-K03 | What evidence shows this task was completed competently? | What record shows the first-shift walkthrough was done correctly? |
| G12 | `curriculum/shared/induction/C01-L02.json` | C01-L02-K03 | What evidence shows this task was completed competently? | What record shows a work order's scope was honoured? |
| G12 | `curriculum/shared/job-management/C02-L01.json` | C02-L01-K03 | What evidence shows this task was completed competently? | What record shows a surface was identified before cleaning? |
| G12 | `curriculum/shared/job-management/C02-L02.json` | C02-L02-K03 | What evidence shows this task was completed competently? | What written record shows the method was matched to the soil and surface? |
| G12 | `curriculum/shared/job-management/C02-L03.json` | C02-L03-K03 | What evidence shows this task was completed competently? | What must the assessor observe to sign off a safe cleaning demonstration? |
| G13 | `curriculum/shared/safety/F08-L02.json` | F08-L02-K01 | What must be checked before applying this lesson in a real workplace? | What must be checked when changing PPE between rooms? |
| G13 | `curriculum/shared/chemicals/F08-L03.json` | F08-L03-K01 | What must be checked before applying this lesson in a real workplace? | What must be checked before deciding whether a surface needs disinfection? |
| G13 | `curriculum/shared/equipment/F08-L04.json` | F08-L04-K01 | What must be checked before applying this lesson in a real workplace? | What must be identified before a high-touch cleaning route is planned? |
| G13 | `curriculum/shared/safety/F08-L05.json` | F08-L05-K01 | What must be checked before applying this lesson in a real workplace? | What must be confirmed before handling a sharp or biological material after an exposure? |
| G14 | `curriculum/shared/safety/F08-L02.json` | F08-L02-K02 | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? | How should a hazard found during a glove change be handled? |
| G14 | `curriculum/shared/chemicals/F08-L03.json` | F08-L03-K02 | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? | What should you do when a surface needs disinfecting but the product is not approved? |
| G14 | `curriculum/shared/equipment/F08-L04.json` | F08-L04-K02 | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? | What should you do when an electrical device on a high-touch route is found faulty? |
| G14 | `curriculum/shared/safety/F08-L05.json` | F08-L05-K02 | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? | What should you do when an unknown sharp is found during a clean? |
| G15 | `curriculum/shared/safety/S14-L04.json` | S14-L04-K02 | When can a worker resume after stopping work because a control failed? | When can a lone worker resume after a missed check-in? |
| G15 | `curriculum/shared/safety/S14-L05.json` | S14-L05-K02 | When can a worker resume after stopping work because a control failed? | When can staff re-enter a building after an evacuation alarm? |
| G15 | `curriculum/shared/safety/S14-L07.json` | S14-L07-K02 | When can a worker resume after stopping work because a control failed? | When can a worker resume after a threatening person is on site? |
| G15 | `curriculum/shared/safety/S14-L08.json` | S14-L08-K02 | When can a worker resume after stopping work because a control failed? | In an emergency scenario, when may the worker resume the task? |
| G16 | `curriculum/shared/safety/S14-L04.json` | S14-L04-K03 | What should an incident record distinguish? | What should a lone-worker check-in incident note keep apart? |
| G16 | `curriculum/shared/safety/S14-L05.json` | S14-L05-K03 | What should an incident record distinguish? | What should an evacuation incident record capture instead of speculation about the cause? |
| G16 | `curriculum/shared/safety/S14-L07.json` | S14-L07-K03 | What should an incident record distinguish? | What should a threat report record about the person involved? |
| G16 | `curriculum/shared/safety/S14-L08.json` | S14-L08-K03 | What should an incident record distinguish? | What should a practical emergency scenario record include? |
| G17 | `curriculum/shared/operations/additional-specialist-services-L01.json` | additional-specialist-services-L01-K02 | Can you start restricted work on the strength of a training certificate alone? | Can an intake request for restricted work be accepted on a training certificate alone? |
| G17 | `curriculum/shared/team/additional-specialist-services-L10.json` | additional-specialist-services-L10-K02 | Can you start restricted work on the strength of a training certificate alone? | Can a planned restricted task go ahead on the employer's paperwork alone? |
| G17 | `curriculum/shared/quality/additional-specialist-services-L12.json` | additional-specialist-services-L12-K02 | Can you start restricted work on the strength of a training certificate alone? | Can a worker be handed restricted work once a training certificate is filed with the employer? |
| G18 | `curriculum/shared/chemicals/C05-L02.json` | C05-L02-K01 | What should happen when the correct method or authorisation is uncertain? | What should happen when the dilution ratio for a mixture is uncertain? |
| G18 | `curriculum/shared/equipment/C05-L03.json` | C05-L03-K01 | What should happen when the correct method or authorisation is uncertain? | What should happen when a machine shows a fault during a simulation? |
| G19 | `curriculum/shared/chemicals/C05-L02.json` | C05-L02-K02 | What evidence demonstrates completion of this task? | What evidence shows a dilution was prepared and labelled correctly? |
| G19 | `curriculum/shared/equipment/C05-L03.json` | C05-L03-K02 | What evidence demonstrates completion of this task? | What record shows a machine is safe to return to service after a fault? |
| G20 | `curriculum/shared/chemicals/C05-L02.json` | C05-L02-K03 | How should an out-of-scope request be handled? | How should a client's request for a different dilution be handled? |
| G20 | `curriculum/shared/equipment/C05-L03.json` | C05-L03-K03 | How should an out-of-scope request be handled? | How should a request to run a machine for a client be handled? |
| G21 | `curriculum/courses/short-stay-turnover/C07-L03.json` | C07-L03-K02 | Should you operate an unfamiliar appliance to prove it works? | During a timed turnover, should you run an unfamiliar appliance to confirm it works? |
| G22 | `curriculum/shared/cleaning/SOP-05.json` | SOP-05-K02 | Where should the bucket sit while you mop? | In single-solution wet mopping, where should the bucket sit? |
| G23 | `curriculum/shared/cleaning/TJS-20.json` | TJS-20-K01 | Why is the floor cleaned last in a washroom? | Why does the washroom finishing standard leave the floor for last? |
| G24 | `curriculum/shared/cleaning-guide/CL2-03.json` | CL2-03-K03 | Which statement about this lesson is correct? | What does completing the step-ladder lesson do, and what does it not do? |
| G26 | `curriculum/shared/quality/S12-L08.json` | S12-L08-K01 | What must be checked before classifying an inspection finding as a service defect? | What must a practical inspection finding be checked against before it is called a defect? |
| G27 | `curriculum/shared/quality/S12-L08.json` | S12-L08-K02 | What should happen when a photograph would expose private client information? | What should the inspector record when a finding cannot be photographed without exposing private information? |
| G28 | `curriculum/shared/quality/S12-L08.json` | S12-L08-K03 | When can a corrective action be closed? | What is needed before a corrective action from a practical inspection is closed? |
| G29 | `curriculum/courses/handyman/handyman-work-L01.json` | handyman-work-L01-K02 | Which statement about completing this lesson is correct? | Which statement about licensing for regulated trade work is correct after this lesson? |
| G30 | `curriculum/courses/aquarium/aquarium-cleaning-L07.json` | aquarium-cleaning-L07-K02 | Why should biological filter media be rinsed in removed tank water rather than tap water? | Why should filter media in a freshwater or marine tank be rinsed in removed tank water rather than tap water? |
| G31 | `curriculum/courses/pool/pool-cleaning-L10.json` | pool-cleaning-L10-K01 | A pump needs inspection and the power switch is nearby. What must happen before any hands go near the pump? | A pump in the pool plant area needs inspection and a power switch is nearby. What must happen before any hand goes near the pump? |
| G32 | `curriculum/courses/pool/pool-cleaning-L10.json` | pool-cleaning-L10-K02 | A pit with standing water needs checking. What is the correct response? | A pit in the pool plant area has standing water and needs checking. What is the correct response? |
| G33 | `curriculum/courses/aquarium/aquarium-cleaning-L11.json` | aquarium-cleaning-L11-K02 | A client in New South Wales asks you to release a surplus fish into a local creek. What is the correct response? | A client asks you to release a surplus aquarium fish into a local NSW creek. What is the correct response? |
| G25 | `curriculum/shared/pool/PVB-01.json` | PVB-01-K03 | How does the note describe the swimming pool area? | How does the note's definitions section describe the swimming pool area? |

## Option changes (distractor text only)

| File | Check id | Field | Old | New |
|---|---|---|---|---|
| `curriculum/shared/chemicals/F16-L01.json` | F16-L01-K03 | options[1] | Use the disinfectant at full strength for both | Use the disinfectant at full strength on the cupboard |

## Checks not reworded

The 33 kept checks above. All 142 other checks in the 33 groups were reworded.

