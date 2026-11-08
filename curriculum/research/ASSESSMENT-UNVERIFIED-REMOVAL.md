# Assessment files: removal of unverified and unconfirmed claims

Scope: `curriculum/assessments/*.assessment.json`. Lesson files, `curriculum/licence/*` and code were not edited. No `correctIndex` values or option text were changed. No commits were made.

## Summary

- Files changed: 153
- Edits applied: 196
- Every changed file parses as JSON.
- `python3 -I /home/claude/work/check.py`: problemCount 1 before and 1 after, so no new problem. The checker skips `*.assessment.json`, so it cannot detect assessment changes.
- Backups of the pre-edit files are in `/home/claude/work/unverified-removal-backup/`. Files with a `.pre-fix2` or `.pre-fix3` suffix were copied immediately before the two later fix passes.

## Edits per file

| File | Edits |
|---|---|
| ACE-01.assessment.json | 3 |
| ACE-02.assessment.json | 1 |
| BP-01.assessment.json | 2 |
| BP-07.assessment.json | 1 |
| BPX-01.assessment.json | 2 |
| BPX-05.assessment.json | 1 |
| BRY-02.assessment.json | 1 |
| BRY-03.assessment.json | 1 |
| C08-L02.assessment.json | 1 |
| C13-L01.assessment.json | 1 |
| C13-L03.assessment.json | 1 |
| C15-L05.assessment.json | 1 |
| C19-L03.assessment.json | 1 |
| C19-L06.assessment.json | 1 |
| CAR-BUS-04.assessment.json | 1 |
| CAR-BUS-05.assessment.json | 1 |
| CL2-03.assessment.json | 1 |
| CP-01.assessment.json | 1 |
| CP-03.assessment.json | 1 |
| F09-L05.assessment.json | 1 |
| F10-L05.assessment.json | 3 |
| F12-L02.assessment.json | 2 |
| F12-L06.assessment.json | 1 |
| F13-L02.assessment.json | 1 |
| FPS-06.assessment.json | 1 |
| HBM-01.assessment.json | 1 |
| HBM-03.assessment.json | 1 |
| HBM-06.assessment.json | 1 |
| HBM-16.assessment.json | 1 |
| HR01-biohazard-trauma-cleaning.assessment.json | 4 |
| HR03-drug-contamination-remediation.assessment.json | 1 |
| HR04-mould-remediation.assessment.json | 2 |
| HR05-fire-smoke-restoration.assessment.json | 2 |
| HR06-flood-water-restoration.assessment.json | 1 |
| HR07-hoarding-squalor.assessment.json | 1 |
| MP-03.assessment.json | 1 |
| NEW-APP-01.assessment.json | 1 |
| NEW-APP-05.assessment.json | 1 |
| NEW-AQU-08.assessment.json | 1 |
| NEW-BEA-04.assessment.json | 1 |
| NEW-BEA-05.assessment.json | 1 |
| NEW-CPT-01.assessment.json | 1 |
| NEW-DEK-01.assessment.json | 1 |
| NEW-DOG-01.assessment.json | 1 |
| NEW-FIT-01.assessment.json | 1 |
| NEW-FIT-05.assessment.json | 1 |
| NEW-FLP-02.assessment.json | 3 |
| NEW-FUR-04.assessment.json | 1 |
| NEW-FUR-08.assessment.json | 1 |
| NEW-GRO-01.assessment.json | 1 |
| NEW-GRO-03.assessment.json | 1 |
| NEW-GRO-05.assessment.json | 1 |
| NEW-HAIR-01.assessment.json | 1 |
| NEW-HAIR-02.assessment.json | 1 |
| NEW-HAIR-06.assessment.json | 2 |
| NEW-LCK-01.assessment.json | 1 |
| NEW-LCK-03.assessment.json | 2 |
| NEW-LCK-04.assessment.json | 1 |
| NEW-LSC-01.assessment.json | 1 |
| NEW-PNT-04.assessment.json | 1 |
| NEW-POND-03.assessment.json | 1 |
| NEW-REP-04.assessment.json | 1 |
| NEW-SIT-01.assessment.json | 1 |
| NEW-STN-01.assessment.json | 3 |
| NEW-STN-05.assessment.json | 1 |
| NEW-STN-07.assessment.json | 1 |
| NEW-STN-12.assessment.json | 1 |
| NEW-TIL-03.assessment.json | 1 |
| NEW-TIL-04.assessment.json | 1 |
| NEW-TMB-01.assessment.json | 1 |
| NEW-TMB-02.assessment.json | 1 |
| NEW-TMB-04.assessment.json | 2 |
| NEW-TMB-12.assessment.json | 1 |
| NEW-YOG-01.assessment.json | 1 |
| NHS-04.assessment.json | 1 |
| PBP-04.assessment.json | 1 |
| PBP-TPL-01.assessment.json | 1 |
| PCS-01.assessment.json | 4 |
| PCS-03.assessment.json | 1 |
| PHM-01.assessment.json | 1 |
| PHM-06.assessment.json | 1 |
| PRO-01.assessment.json | 2 |
| PROC-01.assessment.json | 1 |
| PROC-02.assessment.json | 1 |
| PROC-03.assessment.json | 1 |
| PROC-04.assessment.json | 1 |
| PSA-01.assessment.json | 1 |
| PTB-09.assessment.json | 2 |
| PTB-13.assessment.json | 4 |
| PVB-02.assessment.json | 3 |
| SAH-01.assessment.json | 1 |
| SFS-03.assessment.json | 1 |
| SHR-FIN-01.assessment.json | 1 |
| SHR-FIN-02.assessment.json | 1 |
| SHR-FIN-03.assessment.json | 2 |
| SHR-FIN-04.assessment.json | 1 |
| SHR-FIN-05.assessment.json | 1 |
| SHR-PLN-01.assessment.json | 1 |
| SHR-PLN-02.assessment.json | 1 |
| SHR-PLN-03.assessment.json | 1 |
| SHR-PLN-04.assessment.json | 1 |
| SOL-05.assessment.json | 1 |
| SOP-11.assessment.json | 1 |
| SOP-12.assessment.json | 1 |
| SOP-22.assessment.json | 1 |
| SOP-25.assessment.json | 1 |
| SOP-27.assessment.json | 1 |
| THS-06.assessment.json | 1 |
| TJS-25.assessment.json | 1 |
| TPL-02.assessment.json | 1 |
| TPL-08.assessment.json | 1 |
| TPL-13.assessment.json | 1 |
| TPL-15.assessment.json | 2 |
| TPL-16.assessment.json | 1 |
| WAH-01.assessment.json | 1 |
| WAH-06.assessment.json | 1 |
| WAH-09.assessment.json | 2 |
| construction-site-cleaning-L04.assessment.json | 2 |
| food-processing-sanitation-L01.assessment.json | 1 |
| garden-cleanups-L10.assessment.json | 2 |
| garden-cleanups-L12.assessment.json | 1 |
| handyman-work-L10.assessment.json | 1 |
| high-access-window-cleaning-L01.assessment.json | 1 |
| high-access-window-cleaning-L02.assessment.json | 1 |
| high-access-window-cleaning-L03.assessment.json | 1 |
| high-access-window-cleaning-L04.assessment.json | 1 |
| high-access-window-cleaning-L05.assessment.json | 1 |
| high-access-window-cleaning-L06.assessment.json | 4 |
| high-access-window-cleaning-L08.assessment.json | 1 |
| high-access-window-cleaning-L09.assessment.json | 1 |
| high-access-window-cleaning-L10.assessment.json | 1 |
| high-access-window-cleaning-L12.assessment.json | 1 |
| industrial-degreasing-L01.assessment.json | 1 |
| kitchen-exhaust-L04.assessment.json | 3 |
| kitchen-exhaust-L09.assessment.json | 1 |
| pond-cleaning-L10.assessment.json | 1 |
| pond-cleaning-L11.assessment.json | 1 |
| pool-cleaning-L02.assessment.json | 1 |
| pool-cleaning-L14.assessment.json | 2 |
| pressure-cleaning-L02.assessment.json | 1 |
| pressure-cleaning-L04.assessment.json | 1 |
| pressure-cleaning-L05.assessment.json | 1 |
| pressure-cleaning-L09.assessment.json | 1 |
| property-maintenance-L11.assessment.json | 1 |
| roof-cleaning-soft-washing-L11.assessment.json | 2 |
| solar-panel-cleaning-L01.assessment.json | 2 |
| solar-panel-cleaning-L02.assessment.json | 2 |
| solar-panel-cleaning-L09.assessment.json | 1 |
| solar-panel-cleaning-L10.assessment.json | 1 |
| solar-panel-cleaning-L11.assessment.json | 1 |
| solar-panel-cleaning-L12.assessment.json | 1 |
| warehouse-deep-cleaning-L04.assessment.json | 1 |
| warehouse-deep-cleaning-L10.assessment.json | 1 |

## Edit log

| # | File | Old text (short) | New text (short) | Reason |
|---|---|---|---|---|
| 1 | ACE-01.assessment.json | , which are UNCONFIRMED here | (deleted) | Status clause deleted (claim unconfirmed) |
| 2 | ACE-01.assessment.json | as US, historical, not applicable or UNCONFIRMED. | as US, historical or not applicable. | Marker option removed (owner: unverified items are removed, not marked) |
| 3 | ACE-01.assessment.json | has not confirmed how the space is paid for | has not agreed how the space is paid for | Scenario/status wording rewritten as plain condition |
| 4 | ACE-02.assessment.json | or unverified claim was used | or claim without a source was used | Scenario/status wording rewritten as plain condition |
| 5 | BP-01.assessment.json | marked out of scope or UNCONFIRMED. | marked out of scope. | Marker option removed (owner: unverified items are removed, not marked) |
| 6 | BP-01.assessment.json | Open-items table listing UNCONFIRMED points | Open-items table | Marker option removed (owner: unverified items are removed, not marked) |
| 7 | BP-07.assessment.json | recorded as checked or as UNCONFIRMED with an owner. | recorded as checked, with a source and an owner. | Marker option removed (owner: unverified items are removed, not marked) |
| 8 | BPX-01.assessment.json |  The exact treatment is UNCONFIRMED here and is checked with an accountant. | (deleted) | Status clause deleted (claim unconfirmed) |
| 9 | BPX-01.assessment.json | tax, superannuation and payroll lines are marked UNCONFIRMED | tax, superannuation and payroll lines are included only with a source | Marker option removed (owner: unverified items are removed, not marked) |
| 10 | BPX-05.assessment.json | while the tax treatment is UNCONFIRMED | until the tax treatment is checked | Stop/practical criterion rewritten as plain check |
| 11 | BRY-02.assessment.json |  Whether a particular word can be registered in Australia is UNCONFIRMED, so the answer does not claim a registration outcome. | (deleted) | Status clause deleted (claim unconfirmed) |
| 12 | BRY-03.assessment.json |  that is UNCONFIRMED as to permission, | (deleted) | Status clause deleted (claim unconfirmed) |
| 13 | C08-L02.assessment.json |  while an item is unverified | (deleted) | Scenario/status wording rewritten as plain condition |
| 14 | C13-L01.assessment.json |  This point is UNCONFIRMED against a standard, so it is taught as a caution. | (deleted) | Status clause deleted (claim unconfirmed) |
| 15 | C13-L03.assessment.json |  Other jurisdictions' wording is UNCONFIRMED. | (deleted) | Status clause deleted (claim unconfirmed) |
| 16 | C15-L05.assessment.json | for an unverified scope. | for a scope without checking it. | Scenario/status wording rewritten as plain condition |
| 17 | C19-L06.assessment.json | describe an unverified cause as confirmed | describe a cause as confirmed without checking it | Scenario/status wording rewritten as plain condition |
| 18 | CAR-BUS-04.assessment.json | treats an UNCONFIRMED tax, licence or wastewater point as settled | treats a tax, licence or wastewater point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 19 | CAR-BUS-05.assessment.json | treats an UNCONFIRMED tax, licence or wastewater point as settled | treats a tax, licence or wastewater point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 20 | CL2-03.assessment.json |  State requirements for work at height are UNCONFIRMED here. | (deleted) | Status clause deleted (claim unconfirmed) |
| 21 | CP-01.assessment.json |  The exact requirements are UNCONFIRMED in this draft. | (deleted) | Status clause deleted (claim unconfirmed) |
| 22 | CP-03.assessment.json |  The exact requirements are UNCONFIRMED in this draft. | (deleted) | Status clause deleted (claim unconfirmed) |
| 23 | F09-L05.assessment.json | and unverified items are not marked complete. | and items without evidence are not marked complete. | Scenario/status wording rewritten as plain condition |
| 24 | F10-L05.assessment.json | never to mark unverified tasks complete | never to mark tasks complete without checking them | Scenario/status wording rewritten as plain condition |
| 25 | F10-L05.assessment.json | Unverified tasks are never marked complete. | Tasks without checks are never marked complete. | Scenario/status wording rewritten as plain condition |
| 26 | F12-L02.assessment.json | are not confirmed sources. | are not acceptable sources. | Scenario/status wording rewritten as plain condition |
| 27 | F12-L02.assessment.json | and does not set a rate from an unconfirmed source. | and does not set a rate without naming the source. | Scenario/status wording rewritten as plain condition |
| 28 | F12-L06.assessment.json | Learner acts on an unconfirmed rule change | Learner acts on a rule change without checking it | Stop/practical criterion rewritten as plain check |
| 29 | FPS-06.assessment.json |  and is UNCONFIRMED for Australia. | . | Status clause deleted (claim unconfirmed) |
| 30 | HBM-01.assessment.json | contains no unverified licence or insurance claim | contains no licence or insurance claim without a source | Scenario/status wording rewritten as plain condition |
| 31 | HBM-03.assessment.json |  or UNCONFIRMED. | . | Marker option removed (owner: unverified items are removed, not marked) |
| 32 | HBM-06.assessment.json | as checked or UNCONFIRMED, with the adviser or authority named for each open step. | as checked with the adviser or authority named. | Marker option removed (owner: unverified items are removed, not marked) |
| 33 | HBM-16.assessment.json | marked confirmed or UNCONFIRMED and | marked confirmed and | Marker option removed (owner: unverified items are removed, not marked) |
| 34 | HR01-biohazard-trauma-cleaning.assessment.json | A client description is an unverified enquiry. | A client description is only an enquiry. | Scenario/status wording rewritten as plain condition |
| 35 | HR01-biohazard-trauma-cleaning.assessment.json | The area stays unverified until the authorised party assesses it. | The area is not treated as safe until the authorised party assesses it. | Scenario/status wording rewritten as plain condition |
| 36 | HR01-biohazard-trauma-cleaning.assessment.json | Excluded areas and unverified outcomes must be stated. | Excluded areas and outcomes not assessed must be stated. | Scenario/status wording rewritten as plain condition |
| 37 | HR01-biohazard-trauma-cleaning.assessment.json | accepting an unverified hazardous scene as routine work | accepting a hazardous scene as routine work without assessment | Scenario/status wording rewritten as plain condition |
| 38 | HR03-drug-contamination-remediation.assessment.json | Written refusal of an unverified statement | Written refusal of a statement without a source | Scenario/status wording rewritten as plain condition |
| 39 | HR04-mould-remediation.assessment.json | names what is unverified and who | names what is not cleared and who | Scenario/status wording rewritten as plain condition |
| 40 | HR04-mould-remediation.assessment.json | names the unverified areas. | names the areas not cleared. | Scenario/status wording rewritten as plain condition |
| 41 | HR05-fire-smoke-restoration.assessment.json | unverified chemical or ozone treatment in occupied spaces | chemical or ozone treatment in occupied spaces without checking it | Scenario/status wording rewritten as plain condition |
| 42 | HR05-fire-smoke-restoration.assessment.json | or unverified chemical or ozone treatment in an occupied space. | or chemical or ozone treatment in an occupied space without checking it. | Scenario/status wording rewritten as plain condition |
| 43 | HR06-flood-water-restoration.assessment.json | by an unconfirmed route. | by a route the job does not approve. | Stop/practical criterion rewritten as plain check |
| 44 | HR07-hoarding-squalor.assessment.json | refuses general disposal of unconfirmed material. | refuses general disposal of material it cannot identify. | Scenario/status wording rewritten as plain condition |
| 45 | MP-03.assessment.json | as confirmed or UNCONFIRMED, and the assessor | as confirmed, and the assessor | Marker option removed (owner: unverified items are removed, not marked) |
| 46 | NEW-APP-01.assessment.json | not confirmed in writing | without written confirmation | Scenario/status wording rewritten as plain condition |
| 47 | NEW-APP-05.assessment.json |  Other states are UNCONFIRMED. | (deleted) | Status clause deleted (claim unconfirmed) |
| 48 | NEW-AQU-08.assessment.json |  Those rules are UNCONFIRMED in this draft. | (deleted) | Status clause deleted (claim unconfirmed) |
| 49 | NEW-BEA-04.assessment.json |  and its mobile scope is UNCONFIRMED. | . | Status clause deleted (claim unconfirmed) |
| 50 | NEW-BEA-05.assessment.json | where the sewer connection is not confirmed | where the sewer connection cannot be checked | Scenario/status wording rewritten as plain condition |
| 51 | NEW-CPT-01.assessment.json |  and UNCONFIRMED against product data. | . | Status clause deleted (claim unconfirmed) |
| 52 | NEW-DEK-01.assessment.json | and marks any item as UNCONFIRMED where no source was checked. | and leaves out any item where no source was checked. | Marker option removed (owner: unverified items are removed, not marked) |
| 53 | NEW-DOG-01.assessment.json | with the source and the UNCONFIRMED items marked | with the source for each position | Marker option removed (owner: unverified items are removed, not marked) |
| 54 | NEW-FIT-01.assessment.json | and marks the class position as UNCONFIRMED where it is not confirmed | and names the check to make for the class position | Marker option removed (owner: unverified items are removed, not marked) |
| 55 | NEW-FIT-05.assessment.json | confirms the consumer-law check is recorded as UNCONFIRMED where it is not confirmed | confirms that no consumer-law point is included without a check | Marker option removed (owner: unverified items are removed, not marked) |
| 56 | NEW-FLP-02.assessment.json | where the rating is not confirmed | where the rating cannot be found in the manufacturer's data | Stop/practical criterion rewritten as plain check |
| 57 | NEW-FLP-02.assessment.json | , which is UNCONFIRMED in this course. | . | Status clause deleted (claim unconfirmed) |
| 58 | NEW-FLP-02.assessment.json | not confirmed as clear of services | not shown to be clear of services | Scenario/status wording rewritten as plain condition |
| 59 | NEW-FUR-04.assessment.json |  Specific rules are UNCONFIRMED. | (deleted) | Status clause deleted (claim unconfirmed) |
| 60 | NEW-FUR-08.assessment.json |  Specific guidance is UNCONFIRMED. | (deleted) | Status clause deleted (claim unconfirmed) |
| 61 | NEW-GRO-01.assessment.json | , marked UNCONFIRMED until checked | , with its source and date | Marker option removed (owner: unverified items are removed, not marked) |
| 62 | NEW-GRO-03.assessment.json | , and flea product rules are UNCONFIRMED. | . | Status clause deleted (claim unconfirmed) |
| 63 | NEW-GRO-05.assessment.json | as UNCONFIRMED where it is not confirmed, and name the check to make | and name the check to make | Marker option removed (owner: unverified items are removed, not marked) |
| 64 | NEW-HAIR-01.assessment.json | Whether it applies to a given visit is (UNCONFIRMED) until the Act and regulations are checked, so the middle option is the only accurate status. | Whether it applies to a given visit depends on the Act and regulations, so the middle option is the only accurate status. | Status clause deleted (claim unconfirmed) |
| 65 | NEW-HAIR-02.assessment.json |  Victorian screening content was not read and is UNCONFIRMED. | (deleted) | Status clause deleted (claim unconfirmed) |
| 66 | NEW-HAIR-06.assessment.json | explain that public liability for Victoria is UNCONFIRMED and name the check to make | explain the public liability position for Victoria and name the check to make | Marker option removed (owner: unverified items are removed, not marked) |
| 67 | NEW-HAIR-06.assessment.json | identifying the UNCONFIRMED insurance point and the check to make | identifying the insurance point to be checked and the check to make | Marker option removed (owner: unverified items are removed, not marked) |
| 68 | NEW-LCK-01.assessment.json | The state position is unconfirmed or the worker does not hold the required licence | The worker cannot state the state position, or does not hold the required licence | Stop/practical criterion rewritten as plain check |
| 69 | NEW-LCK-03.assessment.json | Fire-rated opening with an unconfirmed rating referred and recorded. | Fire-rated opening whose rating cannot be found is referred and recorded. | Stop/practical criterion rewritten as plain check |
| 70 | NEW-LCK-03.assessment.json | whose rating is not confirmed | without checking its rating | Stop/practical criterion rewritten as plain check |
| 71 | NEW-LCK-04.assessment.json | The job is refused and referred if not confirmed. | The job is refused and referred if either is missing. | Scenario/status wording rewritten as plain condition |
| 72 | NEW-LSC-01.assessment.json |  and names the authority that issues each, stating where the status is unconfirmed. |  and names the authority that issues each, with the check to make. | Marker option removed (owner: unverified items are removed, not marked) |
| 73 | NEW-PNT-04.assessment.json | and records that the lead paint removal licence position is UNCONFIRMED until checked. | and records the lead paint removal licence position only with its source. | Marker option removed (owner: unverified items are removed, not marked) |
| 74 | NEW-POND-03.assessment.json | ; state rules are UNCONFIRMED in this draft. | . | Status clause deleted (claim unconfirmed) |
| 75 | NEW-REP-04.assessment.json | ; the Victorian property management position is not confirmed, so the state must be checked before leasing work is accepted. | . The state must be checked before leasing work is accepted. | Status clause deleted (claim unconfirmed) |
| 76 | NEW-SIT-01.assessment.json | and mark the council position as UNCONFIRMED where it is not confirmed | and name the check to make for the council position | Marker option removed (owner: unverified items are removed, not marked) |
| 77 | NEW-STN-01.assessment.json | when the material is unconfirmed. | when the material cannot be identified. | Scenario/status wording rewritten as plain condition |
| 78 | NEW-STN-01.assessment.json | Stops and escalates when the material is unconfirmed | Stops and escalates when the material cannot be identified | Scenario/status wording rewritten as plain condition |
| 79 | NEW-STN-01.assessment.json | Material unconfirmed, or possibly engineered stone | Material that cannot be identified, or possibly engineered stone | Scenario/status wording rewritten as plain condition |
| 80 | NEW-STN-05.assessment.json | Their application in other states is UNCONFIRMED, so they are confirmed | They are confirmed | Status clause deleted (claim unconfirmed) |
| 81 | NEW-STN-07.assessment.json | Surface not confirmed as natural stone or terrazzo | Surface that cannot be identified as natural stone or terrazzo | Scenario/status wording rewritten as plain condition |
| 82 | NEW-STN-12.assessment.json | Surface identification not confirmed | Stop and report if the surface cannot be identified | Stop/practical criterion rewritten as plain check |
| 83 | NEW-TIL-03.assessment.json | Grouting continues while adhesive coverage is unconfirmed | Grouting continues without checking adhesive coverage | Scenario/status wording rewritten as plain condition |
| 84 | NEW-TIL-04.assessment.json | The licence position for floating floors in the state is unconfirmed and has not been referred to the regulator | Floating-floor work proceeds without checking the state licence position or referring it to the regulator | Stop/practical criterion rewritten as plain check |
| 85 | NEW-TMB-01.assessment.json | , or records it as UNCONFIRMED where it cannot be confirmed. | , or names the check to make. | Marker option removed (owner: unverified items are removed, not marked) |
| 86 | NEW-TMB-02.assessment.json | records each as identified or UNCONFIRMED. | records each as identified. | Marker option removed (owner: unverified items are removed, not marked) |
| 87 | NEW-TMB-04.assessment.json | , and marks any UNCONFIRMED value. | . | Marker option removed (owner: unverified items are removed, not marked) |
| 88 | NEW-TMB-04.assessment.json | Board type record marked UNCONFIRMED where not confirmed | Board type record with a source for each entry | Marker option removed (owner: unverified items are removed, not marked) |
| 89 | NEW-TMB-12.assessment.json | , or marks it UNCONFIRMED where it cannot be confirmed. | . | Marker option removed (owner: unverified items are removed, not marked) |
| 90 | NEW-YOG-01.assessment.json | and marks other councils UNCONFIRMED | and leaves other councils out | Marker option removed (owner: unverified items are removed, not marked) |
| 91 | NHS-04.assessment.json | allocate unverified work. | allocate work without checking it. | Scenario/status wording rewritten as plain condition |
| 92 | PBP-04.assessment.json | and any payment is marked UNCONFIRMED until checked | and any payment is recorded with its source | Marker option removed (owner: unverified items are removed, not marked) |
| 93 | PBP-TPL-01.assessment.json | , or UNCONFIRMED with a named person | (deleted) | Marker option removed (owner: unverified items are removed, not marked) |
| 94 | PCS-01.assessment.json | The Australian requirement is UNCONFIRMED and must be checked | The Australian requirement must be checked | Status clause deleted (claim unconfirmed) |
| 95 | PCS-01.assessment.json | Australian requirements are UNCONFIRMED until checked. | Australian requirements must be checked. | Status clause deleted (claim unconfirmed) |
| 96 | PCS-01.assessment.json | The Australian rules are UNCONFIRMED and must be checked. | The Australian rules must be checked. | Status clause deleted (claim unconfirmed) |
| 97 | PCS-01.assessment.json | applicable, not applicable or UNCONFIRMED, with a reason | applicable or not applicable, with a reason | Marker option removed (owner: unverified items are removed, not marked) |
| 98 | PCS-03.assessment.json | with unconfirmed fields left blank | and any field without a source is left blank | Scenario/status wording rewritten as plain condition |
| 99 | PHM-01.assessment.json | Pump run with the water level not confirmed | Pump run without checking the water level | Scenario/status wording rewritten as plain condition |
| 100 | PHM-06.assessment.json | The Australian disposal route is UNCONFIRMED and must be checked | The Australian disposal route must be checked | Status clause deleted (claim unconfirmed) |
| 101 | PRO-01.assessment.json | or one not checked against its safety data sheet | or one for which the safety data sheet cannot be found | Stop/practical criterion rewritten as plain check |
| 102 | PRO-01.assessment.json | that the business has not confirmed is within its licence and training position | that is not within its licence and training position | Stop/practical criterion rewritten as plain check |
| 103 | PROC-01.assessment.json |  (UNCONFIRMED in this draft) | (deleted) | Status clause deleted (claim unconfirmed) |
| 104 | PROC-02.assessment.json | when it is UNCONFIRMED in this draft | without checking it | Stop/practical criterion rewritten as plain check |
| 105 | PROC-03.assessment.json | when they are UNCONFIRMED in this draft | without checking them | Stop/practical criterion rewritten as plain check |
| 106 | PROC-04.assessment.json | when they are UNCONFIRMED in this draft | without checking them | Stop/practical criterion rewritten as plain check |
| 107 | PSA-01.assessment.json | Applicability to private pools was not confirmed in this lesson, so it must be checked before use. | Applicability to private pools must be checked before use. | Status clause deleted (claim unconfirmed) |
| 108 | PTB-09.assessment.json | marks each consumer-law and GST point UNCONFIRMED where advice has not been obtained | leaves out each consumer-law and GST point where advice has not been obtained | Marker option removed (owner: unverified items are removed, not marked) |
| 109 | PTB-09.assessment.json | UNCONFIRMED checks list | Checks list with a source for each point | Marker option removed (owner: unverified items are removed, not marked) |
| 110 | PTB-13.assessment.json | has a result or an UNCONFIRMED mark | has a result | Marker option removed (owner: unverified items are removed, not marked) |
| 111 | PTB-13.assessment.json | lists every UNCONFIRMED point with an owner | lists every point that needs a source, with an owner | Marker option removed (owner: unverified items are removed, not marked) |
| 112 | PTB-13.assessment.json | UNCONFIRMED list with owners | List of points needing a source, with owners | Marker option removed (owner: unverified items are removed, not marked) |
| 113 | PVB-02.assessment.json | when the barrier position has not been confirmed with the building surveyor | when the barrier position is not agreed with the building surveyor | Stop/practical criterion rewritten as plain check |
| 114 | PVB-02.assessment.json | the barrier position not confirmed with the building surveyor | the barrier position not agreed with the building surveyor | Stop/practical criterion rewritten as plain check |
| 115 | PVB-02.assessment.json | not checked with the building surveyor before starting | not agreed with the building surveyor before starting | Stop/practical criterion rewritten as plain check |
| 116 | SAH-01.assessment.json | the coordinator has not confirmed the new frequency | the new frequency is used before the coordinator approves it | Scenario/status wording rewritten as plain condition |
| 117 | SFS-03.assessment.json | Tentative and published shifts are not yet confirmed as cover. | Tentative and published shifts do not count as cover. | Status clause deleted (claim unconfirmed) |
| 118 | SHR-FIN-01.assessment.json | treats an UNCONFIRMED tax, licence or environmental point as settled | treats a tax, licence or environmental point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 119 | SHR-FIN-02.assessment.json | treats an UNCONFIRMED tax, licence or environmental point as settled | treats a tax, licence or environmental point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 120 | SHR-FIN-03.assessment.json | for each UNCONFIRMED point, or a note | for each tax point, or a note | Marker option removed (owner: unverified items are removed, not marked) |
| 121 | SHR-FIN-03.assessment.json | treats an UNCONFIRMED tax treatment, such as the write-off or a depreciation rate, as settled | treats a tax treatment, such as the write-off or a depreciation rate, as settled without checking it | Stop/practical criterion rewritten as plain check |
| 122 | SHR-FIN-04.assessment.json | as settled without the UNCONFIRMED note | as settled without checking it | Stop/practical criterion rewritten as plain check |
| 123 | SHR-FIN-05.assessment.json | treats an UNCONFIRMED tax treatment of depreciation, bad debts or prepayments as settled | treats a tax treatment of depreciation, bad debts or prepayments as settled without checking it | Stop/practical criterion rewritten as plain check |
| 124 | SHR-PLN-01.assessment.json | treats an UNCONFIRMED tax, licence, privacy or consumer law point as settled | treats a tax, licence, privacy or consumer law point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 125 | SHR-PLN-02.assessment.json | treats an UNCONFIRMED licence, insurance or safety data sheet point as settled | treats a licence, insurance or safety data sheet point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 126 | SHR-PLN-03.assessment.json | treats an UNCONFIRMED licence, insurance or tax point as settled. | treats a licence, insurance or tax point as settled without checking it. | Stop/practical criterion rewritten as plain check |
| 127 | SHR-PLN-04.assessment.json | treats an UNCONFIRMED licence, insurance or marketing-law point as settled | treats a licence, insurance or marketing-law point as settled without checking it | Stop/practical criterion rewritten as plain check |
| 128 | SOL-05.assessment.json | ; UNCONFIRMED wording) | ) | Status clause deleted (claim unconfirmed) |
| 129 | SOP-11.assessment.json | not confirmed for the surface | not approved for the surface | Scenario/status wording rewritten as plain condition |
| 130 | SOP-12.assessment.json | Whether the work needs training or a licence is UNCONFIRMED in this lesson, and the lesson does not grant either. | The lesson does not grant training or a licence for this work. | Status clause deleted (claim unconfirmed) |
| 131 | SOP-22.assessment.json | is unclear or not confirmed | is unclear or not agreed | Scenario/status wording rewritten as plain condition |
| 132 | SOP-25.assessment.json | Permission to isolate the lift has not been confirmed | Isolating the lift without permission | Scenario/status wording rewritten as plain condition |
| 133 | SOP-27.assessment.json |  How often routine refreshers run is UNCONFIRMED in this lesson. | (deleted) | Status clause deleted (claim unconfirmed) |
| 134 | THS-06.assessment.json | where the compatibility of the instrument is not confirmed | where the compatibility of the instrument cannot be checked | Stop/practical criterion rewritten as plain check |
| 135 | TJS-25.assessment.json | Cleaner used on a floor not confirmed as suitable | Cleaner used on a floor without checking it is suitable | Scenario/status wording rewritten as plain condition |
| 136 | TPL-02.assessment.json | source of set-aside figure or UNCONFIRMED marker | source of set-aside figure | Marker option removed (owner: unverified items are removed, not marked) |
| 137 | TPL-08.assessment.json | , or marked UNCONFIRMED | (deleted) | Marker option removed (owner: unverified items are removed, not marked) |
| 138 | TPL-13.assessment.json | No UNCONFIRMED flag remains in the version issued to the client | Version issued to the client contains only sourced points | Marker option removed (owner: unverified items are removed, not marked) |
| 139 | TPL-15.assessment.json | and each UNCONFIRMED flag is resolved or removed before issue | and every point is sourced before issue | Marker option removed (owner: unverified items are removed, not marked) |
| 140 | TPL-15.assessment.json | Each UNCONFIRMED check has | Each check has | Marker option removed (owner: unverified items are removed, not marked) |
| 141 | TPL-16.assessment.json | is either sourced or marked UNCONFIRMED with an owner | is sourced | Marker option removed (owner: unverified items are removed, not marked) |
| 142 | WAH-01.assessment.json | and marks any unchecked state figure UNCONFIRMED | and leaves out any state figure without a source | Marker option removed (owner: unverified items are removed, not marked) |
| 143 | WAH-06.assessment.json | means the scaffold has not been confirmed safe for use. | means the scaffold is not cleared for use. | Scenario/status wording rewritten as plain condition |
| 144 | WAH-09.assessment.json | The figures are UNCONFIRMED for Australia, but the control still | The control still | Status clause deleted (claim unconfirmed) |
| 145 | WAH-09.assessment.json | is not replaced by an unconfirmed number. | is not replaced by a figure. | Status clause deleted (claim unconfirmed) |
| 146 | construction-site-cleaning-L04.assessment.json | An absent or unverified control means | A control that is absent or cannot be checked means | Scenario/status wording rewritten as plain condition |
| 147 | construction-site-cleaning-L04.assessment.json | Dust control absent or unverified | Dust control absent or cannot be checked | Scenario/status wording rewritten as plain condition |
| 148 | food-processing-sanitation-L01.assessment.json | Production release not confirmed | Production started before release is signed off | Scenario/status wording rewritten as plain condition |
| 149 | garden-cleanups-L10.assessment.json | An unconfirmed destination is held | A destination that cannot be identified is held | Scenario/status wording rewritten as plain condition |
| 150 | garden-cleanups-L10.assessment.json | whose destination has not been confirmed | whose destination cannot be identified | Scenario/status wording rewritten as plain condition |
| 151 | garden-cleanups-L12.assessment.json | does not certify any unconfirmed removal | does not certify any removal without a record | Scenario/status wording rewritten as plain condition |
| 152 | handyman-work-L10.assessment.json | and the licence position is unconfirmed | and the licence position cannot be checked | Scenario/status wording rewritten as plain condition |
| 153 | high-access-window-cleaning-L01.assessment.json | An unverified condition is recorded as unknown | A condition that cannot be checked is recorded as unknown | Scenario/status wording rewritten as plain condition |
| 154 | high-access-window-cleaning-L02.assessment.json | Assumes an unverified site permission, equipment clearance or competence | Assumes site permission, equipment clearance or competence without checking it | Scenario/status wording rewritten as plain condition |
| 155 | high-access-window-cleaning-L03.assessment.json | Assumes an unverified site permission, equipment clearance or competence | Assumes site permission, equipment clearance or competence without checking it | Scenario/status wording rewritten as plain condition |
| 156 | high-access-window-cleaning-L04.assessment.json | Assumes an unverified site permission, equipment clearance or competence | Assumes site permission, equipment clearance or competence without checking it | Scenario/status wording rewritten as plain condition |
| 157 | high-access-window-cleaning-L05.assessment.json | Assumes an unverified site permission, equipment clearance or competence | Assumes site permission, equipment clearance or competence without checking it | Scenario/status wording rewritten as plain condition |
| 158 | high-access-window-cleaning-L06.assessment.json | with unconfirmed clearance means | with clearance that cannot be checked means | Scenario/status wording rewritten as plain condition |
| 159 | high-access-window-cleaning-L06.assessment.json | is not a substitute for a confirmed clearance (clearance distance UNCONFIRMED in this draft). | is not a substitute for a checked clearance. | Status clause deleted (claim unconfirmed) |
| 160 | high-access-window-cleaning-L06.assessment.json | The state and council rules are UNCONFIRMED in this draft, so the plan must control the runoff. | The plan must control the runoff. | Status clause deleted (claim unconfirmed) |
| 161 | high-access-window-cleaning-L06.assessment.json | and clearance is unconfirmed. | and clearance cannot be checked. | Scenario/status wording rewritten as plain condition |
| 162 | high-access-window-cleaning-L08.assessment.json | The anchor is unverified or its rating is unknown. | The anchor cannot be checked or its rating is unknown. | Scenario/status wording rewritten as plain condition |
| 163 | high-access-window-cleaning-L09.assessment.json | , or records it as UNCONFIRMED. | , or names the check to make. | Marker option removed (owner: unverified items are removed, not marked) |
| 164 | high-access-window-cleaning-L10.assessment.json | Assumes an unverified site permission, equipment clearance or competence | Assumes site permission, equipment clearance or competence without checking it | Scenario/status wording rewritten as plain condition |
| 165 | high-access-window-cleaning-L12.assessment.json | Assumes an unverified site permission, equipment clearance or competence | Assumes site permission, equipment clearance or competence without checking it | Scenario/status wording rewritten as plain condition |
| 166 | industrial-degreasing-L01.assessment.json | Treats a simulated isolation as unconfirmed when only a tag is shown | Treats a simulated isolation as not made when only a tag is shown | Scenario/status wording rewritten as plain condition |
| 167 | kitchen-exhaust-L04.assessment.json | , or marks it UNCONFIRMED. | . | Marker option removed (owner: unverified items are removed, not marked) |
| 168 | kitchen-exhaust-L04.assessment.json | All citations recorded or marked UNCONFIRMED, | All citations recorded with their source, | Marker option removed (owner: unverified items are removed, not marked) |
| 169 | kitchen-exhaust-L04.assessment.json | on an edition that has not been confirmed as adopted | on an edition without checking that it is adopted | Scenario/status wording rewritten as plain condition |
| 170 | kitchen-exhaust-L09.assessment.json | whose details are not confirmed against the approved list | without checking its details against the approved list | Scenario/status wording rewritten as plain condition |
| 171 | pond-cleaning-L10.assessment.json | and whether pond lights are covered is UNCONFIRMED. | and whether pond lights are covered must be checked. | Status clause deleted (claim unconfirmed) |
| 172 | pond-cleaning-L11.assessment.json | The discharge rule is UNCONFIRMED, so the route must be checked | The route must be checked | Status clause deleted (claim unconfirmed) |
| 173 | pool-cleaning-L02.assessment.json | and the operator has not confirmed closure | and the operator's closure is still pending | Scenario/status wording rewritten as plain condition |
| 174 | pool-cleaning-L14.assessment.json | and marks each unchecked point UNCONFIRMED. | and leaves out any point it cannot check. | Marker option removed (owner: unverified items are removed, not marked) |
| 175 | pool-cleaning-L14.assessment.json | that is not confirmed on the job's official page | that does not appear on the job's official page | Scenario/status wording rewritten as plain condition |
| 176 | pressure-cleaning-L02.assessment.json | or the clearance is not confirmed | or the clearance cannot be checked | Scenario/status wording rewritten as plain condition |
| 177 | pressure-cleaning-L04.assessment.json |  (UNCONFIRMED against an official first-aid source) | (deleted) | Status clause deleted (claim unconfirmed) |
| 178 | pressure-cleaning-L05.assessment.json | , not confirmed against a regulatory text in this draft) | ) | Status clause deleted (claim unconfirmed) |
| 179 | pressure-cleaning-L09.assessment.json | Those requirements are UNCONFIRMED in this draft and not covered | Those requirements are not covered | Status clause deleted (claim unconfirmed) |
| 180 | property-maintenance-L11.assessment.json | Allowing unverified high-risk work alongside | Allowing high-risk work without checking it, alongside | Scenario/status wording rewritten as plain condition |
| 181 | roof-cleaning-soft-washing-L11.assessment.json | because nest-removal rules are UNCONFIRMED in this draft (NSW protects native birds, but the page does not address nests). | because the page does not address nest removal, and NSW protects native birds. | Status clause deleted (claim unconfirmed) |
| 182 | roof-cleaning-soft-washing-L11.assessment.json |  are UNCONFIRMED and not covered. |  are not covered. | Status clause deleted (claim unconfirmed) |
| 183 | solar-panel-cleaning-L01.assessment.json |  Specific cleaning warranty conditions are UNCONFIRMED in this draft. | (deleted) | Status clause deleted (claim unconfirmed) |
| 184 | solar-panel-cleaning-L01.assessment.json | accepts an unverified ownership claim | accepts an ownership claim without checking it | Scenario/status wording rewritten as plain condition |
| 185 | solar-panel-cleaning-L02.assessment.json | so the claim is UNCONFIRMED and the safe rule | so the safe rule | Status clause deleted (claim unconfirmed) |
| 186 | solar-panel-cleaning-L02.assessment.json |  are not confirmed in this draft (UNCONFIRMED). |  are not cited here. | Status clause deleted (claim unconfirmed) |
| 187 | solar-panel-cleaning-L09.assessment.json | the state wildlife rule, which is UNCONFIRMED in this draft, keeps | the state wildlife rule, keeps | Status clause deleted (claim unconfirmed) |
| 188 | solar-panel-cleaning-L10.assessment.json | ; wastewater rules in other states are UNCONFIRMED. | . | Status clause deleted (claim unconfirmed) |
| 189 | solar-panel-cleaning-L11.assessment.json |  The transfer date from the Clean Energy Council is UNCONFIRMED on an official page in this draft. | (deleted) | Status clause deleted (claim unconfirmed) |
| 190 | solar-panel-cleaning-L12.assessment.json | auto-approves unverified work | auto-approves work without checking it | Scenario/status wording rewritten as plain condition |
| 191 | warehouse-deep-cleaning-L04.assessment.json | separates observed and unverified conditions | separates observed conditions from assumed ones | Scenario/status wording rewritten as plain condition |
| 192 | warehouse-deep-cleaning-L10.assessment.json | separates observed and unverified conditions | separates observed conditions from assumed ones | Scenario/status wording rewritten as plain condition |
| 193 | C19-L03.assessment.json | , and the Victorian property management position is not confirmed, so the state must be checked before leasing begins. | . The state must be checked before leasing begins. | Status clause deleted (claim unconfirmed) |
| 194 | PTB-13.assessment.json | depend on an UNCONFIRMED tax or insurance point | depend on a tax or insurance point without checking it | Stop criterion rewritten as plain check |
| 195 | F13-L02.assessment.json | and marks any claim without a source as unverified. | and leaves out any claim without a source. | Marker option removed (owner: unverified items are removed, not marked) |
| 196 | F10-L05.assessment.json | Do not mark any unverified task as complete. | Do not mark any task as complete without checking it. | Stop criterion rewritten as plain check |

## Hits left unchanged

- `PBP-02.assessment.json` line 12: "Guessed figures and unverified claims are not recorded as facts." This is a policy rule about claims, not a status on a claim in the text. Kept.
- `pool-cleaning-L02.assessment.json` line 21: "marks any item not checked". This is a checklist mechanic for pre-start items, not a claim status. Kept.
- `pool-cleaning-L13.assessment.json` line 21: "marks any part not seen as not checked". This is a checklist mechanic for inspection coverage. Kept.

## Decisions and points for review

1. Marker options were removed where a criterion asked the learner to mark an item UNCONFIRMED. This follows the owner decision. The criterion now asks for a source or a check instead.
2. Stop-work and practical criteria that said "not confirmed" or "unconfirmed" were rewritten as plain checks, for example "without checking it", "cannot be identified", or "cannot be checked". This follows the task's example of a plain stop criterion. The meaning is a judgment call and should be read against each lesson.
3. Scenario conditions in stop lists, such as "Permission to isolate the lift has not been confirmed", were rewritten as plain conditions rather than left in place. The stop-work instruction required this. Reviewers should confirm the stop logic still matches the lesson.
4. Disclosure requirements that name areas not cleared (HR04 closeout) were reworded to "not cleared" rather than removed, so the closeout duty is kept.
5. `NEW-HAIR-01.assessment.json` knowledge rationale (K03): the option text in the lesson file presumably reads UNCONFIRMED, and I could not change it. The rationale now says "depends on the Act and regulations, so the middle option is the only accurate status". Please check that the lesson option wording still fits this rationale.
6. `NEW-FLP-02.assessment.json` passRule still says "The minimum knowledge score is NOT SET and needs owner decision." This is not one of the listed phrases, so I left it. Owner may want it reviewed.
7. `F10-L05.assessment.json` line 29 was not in my first search results. It appeared in a later search. I treated it as a stop criterion and edited it.
8. Lesson files and `curriculum/licence/*` still contain UNCONFIRMED markers and similar wording. Assessments may now refer to checks the lessons do not state. This is outside this task and was not touched.
9. Owner may want a repeat search after lesson edits. I searched only the phrases in the task list.
