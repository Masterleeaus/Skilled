# Null officialReferences: proposals for five unconfirmed claims

Checked: 2026-11-03. Proposal only. No lesson file was changed, and nothing was committed.

Each entry gives the unconfirmed sentence, the official page that answers it, that page's date, the outcome, and the sentence to use if the owner accepts it. Dates are as shown on each page. Where a page shows no date, that is stated.

Outcome key:
- ANSWERED: the page settles the claim for the stated scope.
- PARTIAL: the page settles part of the claim. The rest stays unconfirmed and is labelled as such.
- NOT ANSWERED: no official page found that settles it.

---

## 1. pressure-cleaning-all-heights/pressure-cleaning-L09.json (U9, mould, NSW)

**Unconfirmed sentence:** "No mould-specific regulatory requirement was checked, so it has not yet been confirmed." (instruction "Mould and biological growth", and safetyAndRegulatory[0]).

**Page that answers it:** SafeWork NSW, "Mould at work"
https://www.safework.nsw.gov.au/hazards-a-z/mould
- Date: published 23 July 2025; last modified 4 December 2025.

**What the page says (summary):**
- Mould that is present needs immediate attention, whatever reaction workers may be having.
- Disturbing mouldy areas may spread mould further through the building. Dry sweeping, household vacuums and compressed air should be avoided.
- It links to the Work Health and Safety Act 2011 and the Work Health and Safety Regulation 2025 but does not summarise the duties in them.
- It does not say whether mould removal or remediation needs a licence, and it gives no formal clearance process. It does not mention pressure cleaning.

**Supporting page (not a regulatory source):** NSW Health, "Mould" fact sheet, last updated 20 December 2022. It advises removing mould promptly and fixing the cause, because mould is likely to return otherwise.

**Outcome:** PARTIAL. The NSW general duty and the spread warning are now sourced. Licence, clearance and remediation controls remain unconfirmed.

**Proposed learner sentence (replaces the "No mould-specific regulatory requirement" sentence):**
"SafeWork NSW's mould guidance (last modified 4 December 2025) says mould needs immediate attention, and that disturbing mouldy areas may spread mould further through a building. The guidance does not say whether mould removal needs a licence or clearance, so no licence or clearance requirement is confirmed here."

**Still unconfirmed, keep the existing wording:** respiratory protection, containment and waste controls for remediation; licence or clearance rules; other states.

**Proposed reference entry:** url = https://www.safework.nsw.gov.au/hazards-a-z/mould, pageDate = "published 23 July 2025; last modified 4 December 2025", scope = NSW guidance only.

---

## 2. window-cleaning-all-heights/high-access-window-cleaning-L01.json (U10, strata approval, NSW)

**Unconfirmed sentence:** "...the homeowner may not be able to approve work on a strata-managed building element (not yet confirmed: strata rules not checked)." (workedExamples[1].reasoning), and the matching sentence in referencesAtStart.

**Page that answers it:** NSW Government, "Strata repairs and maintenance"
https://www.nsw.gov.au/dcs-sandbox/repairs-capital-works
- Date: last updated 22 June 2026; published 24 January 2022.
- URL check: the path contains "dcs-sandbox", which may not be the canonical address. Confirm the canonical URL before publishing it.

**What the page says (summary):**
- The owners corporation is responsible for common property, including windows and window locks.
- Lot owners handle window cleaning, unless they cannot reach the windows.
- The owners corporation or strata committee must approve the preferred quote and supplier. Work over $30,000 needs at least two independent quotes, except for emergency repairs. By-laws may set a spending limit.

**Outcome:** ANSWERED for NSW strata schemes. Other states remain unconfirmed.

**Proposed learner sentence (replaces "strata rules not checked"):**
"In a NSW strata scheme, the owners corporation is responsible for common property, including windows and window locks, and the owners corporation or strata committee must approve the preferred quote and supplier for work on it, so a lot owner's approval may not be enough. NSW Government guidance also says lot owners handle window cleaning unless they cannot reach the windows, so check the scheme's by-laws before agreeing who cleans which windows."

**Proposed reference entry:** url = the canonical NSW Government strata repairs page (confirm first), pageDate = "last updated 22 June 2026; published 24 January 2022", scope = NSW only.

---

## 3. solar-panel-cleaning/solar-panel-cleaning-L05.json (R3, AS/NZS 5033)

**Unconfirmed sentence:** "AS/NZS 5033 ... the current edition and cleaning clauses have not yet been confirmed, because the text was not read..." (safetyAndRegulatory[1], instruction[4], referencesAtStart).

**Pages checked:**
- Energy Safe Victoria, "Revised industry standard: AS/NZS 5033:2021" (notice dated 24 November 2021 by its title)
  https://energysafe.vic.gov.au/sites/default/files/2023-05/24-November-2021-Revised-industry-standard-%E2%80%93-ASNZS-5033-2021.pdf
  - Says AS/NZS 5033:2014 stayed current until 18 May 2022, and from 19 May 2022 installation must comply with AS/NZS 5033:2021.
  - Says nothing about cleaning, maintenance or inspection of PV arrays.
- Standards Australia news item on the revised standard (dated 19 November 2021 in the article)
  https://www.standards.org.au/news/australian-solar-standard-as-nzs-5033-revised-to-support-growing-solar-industry
  - Names the 2021 edition. Does not say the standard covers cleaning, maintenance or inspection.
- Standards Australia store page (https://store.standards.org.au/product/as-nzs-5033-2021): could not be read; the fetch returned no content.

**Outcome:** PARTIAL. The edition is now sourced to a regulator notice. Cleaning clauses are NOT ANSWERED by any official page read; the standard text is not available to check.

**Proposed learner sentence (replaces the edition part of the current sentence):**
"Energy Safe Victoria's notice on the revised standard (24 November 2021) says installation of solar panels from 19 May 2022 must comply with AS/NZS 5033:2021. The notice does not cover cleaning or maintenance, so no cleaning clause is confirmed here, and other states may apply the standard on different dates."

**Caveats:**
- The ESV notice is a Victorian regulator document. Standards Australia says regulators may apply the standard at different times.
- A draft amendment listing (DR AS/NZS 5033 Amd 2) appeared in a non-official store result. It could not be confirmed, so a later amendment cannot be ruled out from the pages read.

**Proposed reference entry:** add the ESV notice as a new entry for the edition only (pageDate = "24 November 2021"). Keep R3 url = null for the cleaning-clause claim.

---

## 4. shared/quality/PRO-03.json (R3, health information)

**Unconfirmed sentence:** "Health information and performance records are personal information. Handle them securely and limit access. Privacy obligations have not yet been confirmed, so check with the relevant regulator before relying on this point." (safetyAndRegulatory[2]).

**Page that answers it:** OAIC, "Employee records exemption"
https://oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/employee-records-exemption
- Dates: published 10 March 2023; last modified 5 September 2024 (the page also shows a publication date of December 2015).
- URL check: the search result gave the non-www form. Confirm the canonical address (www.oaic.gov.au) before publishing.

**What the page says (summary):**
- The exemption covers a private sector employer's handling of employee records, in certain circumstances, from the Australian Privacy Principles.
- Health information about an employee is given as an example of an employee record. Performance or conduct records are included if they form part of the employee record.
- Conditions: the handling must be directly related to a current or former employment relationship. It does not extend to acts outside the employment relationship. Contractors handling another employer's records, and volunteers, are not covered.

**Outcome:** ANSWERED for private sector employers, with the conditions above. Whether a given record falls within the exemption is a case-by-case question.

**Proposed learner sentence (replaces the current sentence):**
"Under the Privacy Act 1988, a private sector employer's handling of employee records can be exempt from the Australian Privacy Principles in certain circumstances. The OAIC gives health information about an employee as an example of an employee record, and performance or conduct records can fall within that category, but only where the handling is directly related to the employment relationship. Other obligations may still apply, so check with the employer or a privacy adviser."

**Decision for the owner (inference, not on the page):** the course slugs include healthcare. If the employer is a health service holding patient information, the employee-records exemption does not cover patient records. Decide whether to add a line saying so.

**Proposed reference entry:** url = OAIC employee records exemption page (canonical form to confirm), pageDate = "published 10 March 2023; last modified 5 September 2024".

---

## 5. shared/healthcare/DIP-01.json (R1, clinical waste)

**Unconfirmed sentence:** "Australian waste and fluid rules are set by state and territory law and by local authorities. They have not yet been confirmed in this lesson..." (safetyAndRegulatory[1]), with R1 url = null.

**Pages checked:**
- NSW Health policy directive PD2020_049, "Clinical and Related Waste Management for Health Services"
  https://www1.health.nsw.gov.au/pds/ActivePDSDocuments/PD2020_049.pdf
  - Dates: published 14 December 2020; review date 14 December 2026.
  - Scope: listed NSW Health entities, including dental schools and clinics and public hospitals. It does not mention private practices.
  - Fluid: Table 1 says fluid may be discharged to the sewer depending on a liquid trade agreement between the health service and the water utility.
  - Sharps: containers must have a fill line marked on the outside, and sharps must never go in waste bags. It does not give a three-quarters figure.
  - Segregation: waste must be segregated at the point of generation, with colour coding and labelling per its tables. The table contents were not read, so no colour rule is confirmed.
- NSW EPA, Waste Classification Guidelines Part 1, EPA 2014/0796
  https://www.epa.nsw.gov.au/sites/default/files/140796-classify-waste.pdf
  - Date: November 2014.
  - Says clinical and related waste is special waste. Liquid clinical waste stays special waste. It does not mention sewer disposal and sets out no tracking or licensing duty for clinical waste.
- NSW EPA, "Clinical and related waste" page
  https://www.epa.nsw.gov.au/Your-environment/Waste/industrial-waste/clinical-and-related-waste
  - Date: "current as at 14 September 2026". Says NSW EPA now manages approvals for treatment methods, following 2023 changes. The body on collection was not readable.

**Outcome:** PARTIAL, NSW only. The pages do not support the current instruction text that "the Australian sources place clinical waste, fluid included, with licensed collection" as a general rule. NSW Health's directive allows sewer discharge for its listed entities under a trade agreement, and the EPA classification is silent on sewers. Other states remain unconfirmed.

**Proposed learner sentence (for the safetyAndRegulatory point):**
"In NSW, the EPA classifies clinical and related waste as special waste (Waste Classification Guidelines Part 1, EPA 2014/0796). NSW Health's directive PD2020_049 (published 14 December 2020, review date 14 December 2026) applies to listed NSW Health entities, not private practices, and allows fluid to go to the sewer only under a liquid trade agreement with the water utility. For a private practice, the local rule on fluid still needs checking with the regulator, and the practice's written waste plan applies."

**Decisions for the owner in this lesson (not made here):**
- The sentence in instruction[1] that "The Australian sources place clinical waste, fluid included, with licensed collection" is not supported by these pages and conflicts with PD2020_049 for NSW Health entities. Owner to decide whether to rewrite it.
- The "about three-quarters capacity" sharps figure in instruction[1] is not supported by PD2020_049, which uses a fill line. Owner to decide whether to keep it, and with what source.
- The EPA classification guideline is from 2014 and the EPA page refers to 2023 changes. Confirm it is still current before relying on it.
- AS/NZS 3816 colour rules remain unconfirmed.

---

## Summary of decisions taken in this proposal

1. Partial answers (mould, AS/NZS 5033 edition, clinical waste) are proposed as "partly confirmed" wording. Null URLs are replaced only where a page answers the claim.
2. The AS/NZS 5033 cleaning-clause claim stays unconfirmed.
3. Two NSW URLs need a canonical check before publishing: the NSW Government strata page (path contains "dcs-sandbox") and the OAIC employee records page (search gave the non-www form).
4. The DIP-01 conflict with the NSW Health directive is raised for the owner rather than resolved here.
