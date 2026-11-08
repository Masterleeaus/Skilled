# Index: personal, fitness, pet and shared business research

- Status: DRAFT. Reviewer status: NOT REVIEWED for every file. Nothing here is marked verified or published.
- Scope: Australia-wide. Victoria is not the default. Not legal or tax advice.
- Checked: 2026-11-02, for all files.
- Decisions followed: curriculum/planning/DECISIONS.md. Course slugs are taken from curriculum/structure/COURSES-MODULES.json.
- Output folder: curriculum/research/topics/. This follows the explicit task instruction. DECISIONS.md names a different team folder for agent output. The main session should confirm which applies.

## 1. Files

| File | Course or topic | Slug | Regulation matrix rows (national file) | CONFIRMED / COUNCIL-SPECIFIC / SECONDARY / UNCONFIRMED | Main open items |
|---|---|---|---|---|---|
| hair.md | Mobile hairdressing and barbering | hair | 36 | 15 / 3 / 0 / 18 | VIC mobile exemption; TAS and SA scope; home visits outside NSW and WA |
| beauty.md | Mobile beauty (injectables excluded by decision) | beauty | 25 | 9 / 3 / 0 / 13 | QLD competency conflict (HLTINF005); beauty training code not found; state beauty rules |
| massage.md | Mobile massage | massage | 14 | 2 / 0 / 0 / 12 | Whether massage is regulated at all in VIC; client sheet content not read |
| pt.md | Personal and fitness training | pt | 18 | 3 / 4 / 1 / 10 | State licence unknown in most states; council permits sampled only |
| yoga.md | Yoga and Pilates | yoga | 13 | 1 / 1 / 1 / 10 | No Pilates-specific national qualification found; council coverage of yoga |
| dogwalk.md | Dog walking, including pet taxi | dogwalk | 30 (16 dog walking + 14 pet transport) | 6 / 4 / 0 / 20 | Council permits outside the sample; pet taxi rules in most states |
| petsit.md | Pet and house sitting | petsit | 24 | 7 / 3 / 0 / 14 | Whether in-home house sitting is boarding (unconfirmed in every state) |
| groom.md | Pet grooming (mobile) | groom | 14 | 1 / 0 / 0 / 13 | Most states not checked; animal welfare Acts not read; which pet grooming code is current |
| BUSINESS-CORE.md | Shared business lessons (11 topics) | (shared) | 12 shared rows | Federal sources, read; state items cross-referenced | Clause-level award content; referral fee treatment; payroll tax thresholds |

Counts are rows in curriculum/research/personal/REGULATION-MATRIX-NATIONAL.csv (186 rows in total). Rows mapped by business name: "Pet transport" rows are counted under dogwalk. "All businesses" rows and the national model WHS rows are counted under shared. VIC rows carried forward from the earlier matrix are included in the totals. Victoria rows were not re-verified in the matrix pass.

## 2. Status key (kept from the matrix)

- CONFIRMED: an official page was read and the finding follows it.
- COUNCIL-SPECIFIC: one council only. Not a state-wide rule.
- SECONDARY: industry or news source. Not a legal requirement.
- UNCONFIRMED: not found, not read, or the wording was too loose to rely on.

## 3. Findings that affect more than one course

1. Boarding and house sitting: no jurisdiction confirms that in-home house sitting is boarding. The Victorian definition ties boarding to a place other than the animal's home. The ACT, NSW and SA rules tie it to premises or kennels. Treat as UNCONFIRMED (petsit.md; dogwalk.md uses the same point for walkers).
2. Mobile and home visits: NSW and ACT require notification or licensing for some mobile skin penetration work. WA sets specific mobile hygiene requirements. Home-based rules are UNCONFIRMED almost everywhere. Treat "mobile" and "home" as gaps, not exemptions (hair.md, beauty.md, groom.md).
3. Workers compensation: employer rules are CONFIRMED in each state read. Several states exempt small employers from holding a policy but still require injury reporting. Lessons must not present the exemption as a way around reporting (BUSINESS-CORE.md topic 8).
4. Chemicals: the national model position on the hazardous chemicals register and SDS is CONFIRMED as a model. State adoption is not confirmed for each state. From 1 December 2026, the WorkSafe Victoria page says the Workplace Exposure Limits list replaces the Workplace Exposure Standards list. Lessons citing exposure values need to use the list in force on the day.
5. Dates on sources: many ABLIS listings carry a 2017 metadata date. Several council and state pages show no date. Each brief shows the date printed on the page, or says "not shown".
6. Training packages: SHB30516, SIS30321, ACM30122 and HLT42021 were read. Each is marked Approved on its PDF. None was confirmed as current on the live training.gov.au record. SHB30416, SIS40221, ACM30617 and HLT42015 were located only.
7. Working with Children Checks: the Victorian categories cover children's fitness and coaching, and do not list pet care. Other states are UNCONFIRMED.
8. Awards: the Hair and Beauty Industry Award 2020 (MA000005) covers hairdressing, massage, waxing and nail services. The Fitness Industry Award 2020 (MA000094) covers fitness-industry employers. The Animal Care and Veterinary Services Award 2020 (MA000118) does not name grooming, boarding, dog walking or pet sitting. Coverage for the rest is UNCONFIRMED.

## 4. Source conflicts and errors found

| Item | Problem | Where | Action taken |
|---|---|---|---|
| QLD competency (HLTINF005) | Existing row cites a competency that the Townsville and Gold Coast pages do not name | MBEAU-QLD-01 vs NAT-MBEAU-QLD-04 | Kept as UNCONFIRMED in beauty.md |
| Tasmania workers compensation Act | Page names the 1998 Act; a legislation listing shows the 1988 Act | NAT-ALL-TAS-01 | Flagged for citation check in hair.md |
| Port Phillip dog walking fees | Page gives two different fee end dates | DOG-VIC-02 | Flagged in dogwalk.md |
| Fair Work minimum wage figure | Page shows a rate dated 1 July 2023 | smallbusiness.fairwork.gov.au/paying-employees | Figure not used; flagged in BUSINESS-CORE.md |
| Hair and Beauty award code | Earlier search suggested MA000091, which is a different award | Search result only | Not used. Verified code is MA000005 |
| Animal care award code | Earlier search suggested MA000074, which is a different award | Search result only | Not used. Verified code is MA000118 |
| ACCC personal services guide | Copyright 2013 | accc.gov.au | Principles cited with a currency warning |
| Ryde registration page | Body text not retrieved; summary has a missing word | NAT-HAIR-NSW-01 | Kept as COUNCIL-SPECIFIC lead only |
| Safe Work Australia Model Code pages | Publication date field blank | safeworkaustralia.gov.au | Cited with the date shown as blank |

## 5. Pages that could not be read

- Fair Work "award and agreement free wages and conditions" page and the Fair Work hair and beauty plain-language page: blocked by the site's robots rules. Clause-level content is UNCONFIRMED.
- ATO GST registration page: first attempt used a URL that was not on the allowlist. The same page was fetched after it appeared in search results and was read.
- Safe Work Australia's PCBU working-from-home page and several state and council pages were not readable in the matrix pass. The matrix notes list each one.
- Pages marked "located only" in the briefs were not opened.

## 6. Decisions taken in this pass (for review)

1. Course slugs follow curriculum/structure/COURSES-MODULES.json, not the brief names used in the task. Example: "hair" for mobile hairdressing and barbering.
2. The mobile beauty brief records the injectables decision (DECISIONS.md excludes them) and gives the legal evidence without reopening the decision.
3. Pet taxi is inside dogwalk.md, as DECISIONS.md requires.
4. "Pet grooming" and "mobile pet grooming" are treated as one business. Confirm the name.
5. Massage is treated as UNCONFIRMED where the matrix found no source, not as unregulated.
6. Hazards with no source are listed as UNCONFIRMED. No hazard was added from general knowledge without a note.
7. No pricing, margin, wage or fee figure was added beyond those printed on cited pages with a date.
8. Training package codes are cited only where read or located. The beauty training code was not found and is not given.
9. Output path follows the task instruction, not the team folder named in DECISIONS.md.

## 7. Memory

Stored user memory was not needed for this task and was not used. Nothing from memory appears in these files.

## 8. Next steps before lesson authoring

1. Team decision on the open scope items in each brief (for example, massage, grooming name, house sitting model).
2. Check the live training.gov.au records for every code cited.
3. Check the WA and TAS acts and council lists the matrix marks as leads.
4. Re-check fees and figures quoted from cited pages on the day of publication.
5. Reviewer sign-off on each file (currently NOT REVIEWED).
