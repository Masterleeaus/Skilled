# Covers fixes log

Checked 2026-11-03. Scope: four items from the covers check. Source pages were read with WebFetch (raw curl on the Tasmanian page returned a Cloudflare challenge). Each page was read twice, and the two reads agreed where noted. No assessment files and no curriculum/licence files were edited. Nothing was committed.

## 1. C06-L01 and Tasmania carpet claim (kept; covers corrected)

Lessons checked: C06-L01 (cites the Tasmanian page as R8). C06-L02 and C06-L03 do not make the carpet or receipt claim, so they were not changed.

Source: CBOS Tasmania, Moving out advice for tenants, https://cbos.tas.gov.au/topics/housing/renting/ending-a-tenancylease/moving-out-advice, "Last updated 08 Aug 2022". The page's "Carpet cleaning" section says "Hire a professional carpet cleaner and keep a copy of the receipt." and "Do not hire a steam cleaning machine to do it yourself." The page also says "Leave the property in the same condition it was in at the beginning of the lease."

Finding: the covers check was wrong. The page does support the claim, so the learner text was kept unchanged.

File: curriculum/courses/bond-and-end-of-lease-cleaning/C06-L01.json, officialReferences R8 covers.

- Old: `CBOS Tasmania website: housing and renting, ending a tenancy, moving out advice page. Publisher: Consumer, Building and Occupational Services (CBOS), Tasmania.`
- New: `CBOS Tasmania website: housing and renting, ending a tenancy, moving out advice page. Its Carpet cleaning section says to hire a professional carpet cleaner and keep a copy of the receipt, and not to hire a steam cleaning machine to do it yourself. The page also says to leave the property in the same condition it was in at the beginning of the lease. Publisher: Consumer, Building and Occupational Services (CBOS), Tasmania.`
- Reason: the covers must name the text that supports the learner claim.

## 2. Aquarium pages: "warning" and "illegal" (covers corrected; learner text already supported)

Source: NSW DPI, Aquarium owners and trade, https://www.dpi.nsw.gov.au/dpi/biosecurity/aquatic-biosecurity/aquarium-owners-and-trade, no date shown. Two reads agreed on these points:
- "don't buy fish, plants or 'live rock' from overseas on the internet – it's illegal!"
- "Releasing fish into NSW public waters such as rivers, creeks and impoundments is illegal under the Fisheries Management Act" "without a fish stocking permit."
- "Check which species are illegal to possess, buy, sell, or move."
- "Dumping an unwanted pet fish is no different to dumping a pet cat or dog and is an illegal act."
- The page names the Biosecurity Act (Schedule 2), the Fisheries Management Act and the Prevention of Cruelty to Animals Act 1979. The word "warning" does not appear on the page.

Finding: the learner text already says overseas online buying is illegal, and the page supports that. No learner text was narrowed. The covers wrongly called this "the warning". Each covers entry was rewritten to the page's own wording.

Old covers text in each file (identical): `Open the page and check the prohibited and notifiable species rules, the fish stocking permit for release into public waters, the warning on buying fish or live rock from overseas online, and the dumping point under the Prevention of Cruelty to Animals Act. Publisher: NSW Department of Primary Industries.`

New covers text in each file: `NSW Department of Primary Industries, Aquarium owners and trade (no date shown). The page says to check which species are illegal to possess, buy, sell or move; that releasing fish into NSW public waters is illegal without a fish stocking permit under the Fisheries Management Act; that buying fish, plants or live rock from overseas on the internet is illegal; and that dumping an unwanted pet fish is an illegal act. It names the Prevention of Cruelty to Animals Act 1979 for animal welfare. The page uses the word illegal for these points, not warning. Publisher: NSW Department of Primary Industries.`

Files and entries:
- curriculum/courses/aquarium/NEW-AQU-01.json, officialReferences R2
- curriculum/courses/aquarium/NEW-AQU-03.json, officialReferences R2
- curriculum/courses/aquarium/NEW-AQU-07.json, officialReferences R2
- curriculum/courses/aquarium/aquarium-cleaning-L03.json, officialReferences R2
- curriculum/courses/aquarium/aquarium-cleaning-L04.json, officialReferences R4
- curriculum/courses/aquarium/aquarium-cleaning-L11.json, officialReferences R1

NEW-AQU-05 R9: no change. Its covers already say "is illegal" for overseas online purchase, and the page supports that.

## 3. CAR-NEW-02 and CAR-NEW-09 (attributions removed; no reference invented)

No official page supports the clay, grade, iron-remover, pressure-washer or bag-test points, and no page was added. The attributions were removed. The claims are kept as working practice, labelled in sourceReferences as not attributed to an official source and not regulatory. The same applied to the Car-Detailing-Guide, the Spanish manual and the show-car sample, which were also named as sources in these two lessons, so those attributions were removed too.

Files: curriculum/courses/car-detailing/CAR-NEW-02.json and curriculum/courses/car-detailing/CAR-NEW-09.json.

CAR-NEW-02 learner text:
- Old: `The Spanish-language manual notes that some contamination lodges in the pores of the clear coat and cannot be seen, and that touch reveals it.` New: `Some contamination lodges in the pores of the clear coat and cannot be seen, so touch is needed to find it.`
- Old: `The Auto-Detailing guide says a clay bar has no impact on those marks, so clay is preparation for polishing rather than a substitute for it.` New: `A clay bar has no effect on those marks, so clay is preparation for polishing rather than a substitute for it.`
- Old: `Iron removers react with iron deposits, and the Car-Detailing-Guide says they can reduce the need for clay on some vehicles.` New: `Iron removers react with iron deposits and can reduce the need for clay on some vehicles.`
- Old: `The baggie test in the show-car sample works the same way: a clean plastic bag over the hand makes rough spots easier to feel.` New: `A clean plastic bag over the hand also makes rough spots easier to feel.`
- Old: `Tar and sap often need the clay itself, since the Car-Detailing-Guide suggests clay can work better for them.` New: `Tar and sap often need the clay itself.`
- Old: ` The Spanish manual warns that chemical treatment can damage a treated surface.` New: (removed).
- Old: `The Auto-Detailing guide notes that a medium grade is more aggressive and will almost always leave marring that needs polishing to remove.` New: `A medium grade is more aggressive and usually leaves marring that needs polishing to remove.`
- sourceReferences: added a line stating the clay, grade, iron remover, bag test and pore points are working practice reworded from the uploaded guides, with no official source and not regulatory.

CAR-NEW-09 learner text:
- Old: `The Spanish-language manual warns that the force of a pressure washer can remove paint that is already thin or damaged. The Auto-Detailing guide advises avoiding a direct high-pressure stream on visible electrical parts and on air intakes.` New: `The force of a pressure washer can remove paint that is already thin or damaged. Avoid a direct high-pressure stream on visible electrical parts and on air intakes.`
- sourceReferences: added a line stating these two points are working practice reworded from the uploaded guides, with no official source and not regulatory.

Reason: the official-references rule requires each attribution to point to an entry that covers it. Neither lesson has such an entry for these points.

## 4. NEW-APP-01 regulation 111 compilation (updated to current compilation)

Sources:
- legislation.gov.au version list for F1996B02085, https://www.legislation.gov.au/F1996B02085/2024-10-14/versions (read 2026-11-03). Lists C48, F2026C00546, start "01 Jul 2026", link /F1996B02085/latest/text. The previous compilation C47 (F2025C00642) covered 01 Jul 2025 to 30 Jun 2026. The version list shows the latest page as "In force".
- legislation.gov.au, compilation dated 1 July 2025 (C47), https://www.legislation.gov.au/F1996B02085/2025-07-01/2025-07-01/text/original/epub/OEBPS/document_1/document_1.html. Regulation 111 "Carrying out work in relation to RAC equipment" makes contravening subregulation (1) a strict liability offence, 50 penalty units, unless the person holds a refrigerant handling licence entitled to the work or falls within a listed exception. Subregulation (2) makes "carries out work" include servicing and maintaining RAC equipment.

Not confirmed: the text of regulation 111 in C48 (1 July 2026). The C48 page showed only the contents entry for regulation 111. The direct text URL for C48 was not on the session allowlist. The learner text therefore points to the current compilation and says to check its wording, and the covers say the C48 text was not read.

Changes in curriculum/courses/appliance/NEW-APP-01.json:
- referencesAtStart and referencesAtEnd: Old: `Ozone Protection and Synthetic Greenhouse Gas Management Regulations 1995 (compilation dated 9 February 2018)` New: `Ozone Protection and Synthetic Greenhouse Gas Management Regulations 1995 (current compilation, in force from 1 July 2026)`
- Instruction body (exclusions paragraph): Old: `Regulation 111 makes it an offence to do work on RAC equipment without the required licence, and the 2018 compilation reads that work broadly (compilation dated 9 February 2018; check the current version).` New: `Regulation 111 makes it an offence to do work on RAC equipment without the required licence, and the regulation reads that work broadly (check the current compilation on legislation.gov.au before relying on the wording).`
- officialReferences R2 title: `(compilation dated 2018)` changed to `(current compilation, in force from 1 July 2026)`.
- officialReferences R2 url: Old `https://legislation.gov.au/F1996B02085/2018-02-09/2018-02-09/text/original/epub/OEBPS/document_1/document_1.html` New `https://www.legislation.gov.au/F1996B02085/latest/text`
- officialReferences R2 pageDate: Old `Compilation dated 9 February 2018 (older version)` New `In force from 1 July 2026 (current compilation; version list on legislation.gov.au checked 2026-11-03)`
- officialReferences R2 covers: rewritten to state the version list result, the C47 wording as read, and that the C48 text was not read.

## Other files not changed (outside the four items)

- curriculum/courses/appliance/NEW-APP-10.json still cites the 9 February 2018 compilation (URL, pageDate, and learner text at instruction and safetyAndRegulatory). Same fix applies; not edited because the task named NEW-APP-01.
- Car-detailing lessons other than CAR-NEW-02 and CAR-NEW-09 still use "Auto-Detailing guide" or "Car-Detailing-Guide" attributions: car-detailing-L02, L03, L04, L07, L08, L10, CAR-NEW-01, CAR-NEW-03, CAR-NEW-04, CAR-NEW-07, CAR-NEW-10. The same "no official reference" defect applies.
- curriculum/assessments/CAR-NEW-03.assessment.json also contains one of these attributions. Assessment files were not edited.
- Copies under curriculum/lessons/converted and curriculum/lessons/ready (C06-L01, NEW-APP-01, aquarium-cleaning-L04) were not edited. They are outside the checker scope, but they carry the old text.
- Pre-existing checker problem, unchanged: NEW-DEK-01 instruction[2] flags "R5 zones" as a citation marker. This is a false positive and was present before these edits.

## Checks run

- All ten changed files parse as JSON.
- Learner text in the changed files contains none of the removed strings: no "Auto-Detailing", "Car-Detailing-Guide", "Spanish", "show-car", "warning" in the aquarium learner text, or "2018" in NEW-APP-01 learner text.
- python3 -I /home/claude/work/check.py: 932 lessons scanned, problemCount 1, identical to the baseline (NEW-DEK-01, pre-existing). No new problems.
