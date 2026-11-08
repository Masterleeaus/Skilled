# Regulation matrix notes: personal, fitness and pet services, national

Status: research draft for team review. Not legal advice. Every row in REGULATION-MATRIX-NATIONAL.csv has a source name, source URL, page date shown and date checked. All pages were read on 2026-11-02.

Companion file: REGULATION-MATRIX-NATIONAL.csv (186 data rows: 84 carried forward from the Victorian-first matrix, 102 new).

## 1. Scope and what changed

- Businesses (from DECISIONS.md): mobile hairdressing and barbering (including colour and bleach); mobile beauty (including injectables flagged as a scope decision); mobile massage; personal and fitness training; yoga and Pilates; dog walking; pet and house sitting; mobile pet grooming; pet transport.
- Jurisdictions: all eight states and territories. Victoria rows are carried forward unchanged from REGULATION-MATRIX.csv and were not re-verified in this pass. NSW and QLD rows from that file are also carried forward unchanged. New NSW and QLD rows sit beside them with NAT- IDs, and the NAT row governs where they differ.
- New rows (NAT- prefix): NT 15, SA 16, TAS 15, ACT 15, WA 16, NSW 8, QLD 15, plus 2 national model-WHS rows (NAT-CHEM-01 and NAT-CHEM-02). Carried-forward rows: NSW 13, QLD 10, VIC 61.
- Required items for NSW, QLD, WA, SA, TAS, ACT and NT: licence or registration; council or state registration; insurance expectations; chemical rules; health screening duties; home-visit rules; and whether house sitting counts as boarding. Each is covered where a source was read. Where none was read, the row is UNCONFIRMED.

## 2. Method and status key

- Sources: state and territory government pages, regulators (WorkSafe, icare, ReturnToWorkSA, WorkCover), and council pages. Council pages describe one council only and are marked COUNCIL-SPECIFIC. ABLIS (business.gov.au) listings are secondary copies of council or government text and are flagged where used. Industry bodies are SECONDARY.
- CONFIRMED: an official page was read and the finding follows it. COUNCIL-SPECIFIC: one council only. SECONDARY: industry or news source. UNCONFIRMED: not found, not read, or the wording was too loose to rely on.
- Where a row is "not checked in this pass", the source columns show "-" as the Victorian file does. No source is claimed for a gap.
- Several official pages could not be fetched because they were not on the session allowlist (for example, WA Health skin penetration, the Tasmanian health risk page, and the ACT Health page). Search-result links on the same organisations were used instead. Where only a title was read, the row says so.
- Findings are paraphrased from the source text. Quotations are not used.

## 3. Summary against the seven requested items

| Jurisdiction | Licence or registration | Council or state registration | Insurance | Chemicals | Health screening | Home or mobile visits | House sitting as boarding |
|---|---|---|---|---|---|---|---|
| NT | Hair, beauty and body art need state registration with NT Health; fees 91 and 141 dollars (CONFIRMED). Massage, PT and yoga UNCONFIRMED. | State (NT Health) for hair and beauty. Council kennel licences seen by title only. | Employers with workers must arrange a policy (CONFIRMED). | National model WHS (CHEM-01); NT specifics UNCONFIRMED. | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED |
| SA | State duty under Public Health Act 2011 for hair and skin penetration (CONFIRMED). No state registration described. | Council notification forms (Port Augusta, COUNCIL-SPECIFIC). Burnside kennel registration (COUNCIL-SPECIFIC). | ReturnToWorkSA registration within 14 days of employing workers (CONFIRMED). | National model WHS; SA specifics UNCONFIRMED. | Guideline referenced, not read (UNCONFIRMED). | UNCONFIRMED | Burnside registration covers kennels; in-home sitting UNCONFIRMED. |
| TAS | Hairdressing and beauty not named in the public health risk list (UNCONFIRMED). Injectables are Schedule 4 and need nurse authorisation (CONFIRMED). | Council premises registration exists for risk activities (Hobart). Scope for hair and beauty UNCONFIRMED. | Policy or self-insure; sole traders not addressed (CONFIRMED for employers). | National model WHS. | UNCONFIRMED | UNCONFIRMED (injectables supervision question open) | UNCONFIRMED |
| ACT | Hair and massage need no infection-control licence; skin penetration does (CONFIRMED). Beauty-only UNCONFIRMED. | ACT Government licence for boarding establishments under Part 3A (CONFIRMED). | WorkSafe ACT employer rule (CONFIRMED). | National model WHS. | Infection Control Code of Practice 2005 applies (CONFIRMED). | Mobile skin penetration covered (CONFIRMED); home UNCONFIRMED. | Boarding licence applies to premises; in-home UNCONFIRMED. |
| WA | Hair guidance under Public Health Act 2016; no state licence described (CONFIRMED). | Home-based operators must contact local government (CONFIRMED). Council kennel licence, 200 dollars (COUNCIL-SPECIFIC). | WorkCover WA employer policy (CONFIRMED). Sole traders and contractors not addressed. | Guideline points on colour and bleach (CONFIRMED) plus national. | No formal screening required (CONFIRMED). | Mobile covered by guideline section 13.1 (CONFIRMED). | UNCONFIRMED (kennel licence scope not stated). |
| NSW | NSW Health: hair not regulated under skin penetration rules unless piercing (existing row, CONFIRMED). | Ryde says hair, beauty and skin penetration premises must register (COUNCIL-SPECIFIC, body text not retrieved). | icare: employers with workers; sole traders with no workers need no policy (CONFIRMED). | National model WHS. | Code No 5 daily checks and vaccination for boarding (CONFIRMED). | Vehicle or temporary structure must notify council (existing row, CONFIRMED). | Code No 5 does not clearly cover house sitting (UNCONFIRMED). |
| QLD | Hair and beauty need no licence; higher-risk services need a council licence (Gold Coast, Townsville; CONFIRMED). | Councils issue higher-risk licences, renewed yearly (Townsville). | WorkCover Qld employer rule (CONFIRMED). | National model WHS. | Qld Health medicines duties for injectables (CONFIRMED); screening UNCONFIRMED. | Mobile higher-risk operations must be licensed (CONFIRMED); home UNCONFIRMED. | Council kennel and cattery approvals (titles seen); in-home UNCONFIRMED. |

## 4. Items for team decision

1. Cosmetic injectables scope (mobile beauty). The evidence differs by place:
   - Queensland: Gold Coast City Council treats cosmetic injectables as implanting substances under the skin, which is a higher-risk licensable service (NAT-MBEAU-QLD-02). Townsville's list includes implanting substances but does not name injectables.
   - Queensland Health says all cosmetic injectable businesses must follow the medicines laws (NAT-MBEAU-QLD-03).
   - Tasmania: botulinum toxin and deoxycholic acid are Schedule 4. Non-registered people are not authorised to administer them for cosmetic use (NAT-MBEAU-TAS-02). Mobile rules are open (NAT-MBEAU-TAS-03).
   - Victoria: the Department of Health lists EHO guidance on injectables (existing MBEAU-VIC-03).
   - Other jurisdictions: not confirmed.
   - Suggested handling, for review: keep injectables out of mobile beauty lessons until the team decides scope. If they are included, DECISIONS.md requires a licence notice in each lesson that covers licensed work.
2. Qualification conflict in Queensland. The existing row MBEAU-QLD-01 cites HLTINF005 as a competency requirement for higher-risk operators. Townsville says its sheet names no competency, and the Gold Coast page does not name HLTINF005 either. NAT-MBEAU-QLD-04 is open. The source needs to be found before the row is used.
3. Tasmania Act citation. The Tasmanian guideline page names the Workers Rehabilitation and Compensation Act 1998, while a legislation listing shows the 1988 Act (NAT-ALL-TAS-01). Check the correct citation.
4. Mobile and home-visit positions. Mobile rules were found in WA (guideline section 13.1), NSW (vehicle or temporary structure), ACT (skin penetration), and QLD (higher-risk mobile operations must be licensed). Home-based positions are UNCONFIRMED almost everywhere. Treat "mobile" and "home" as gaps, not exemptions.
5. Dog walking as a business. No state licence for dog walking was found in any new jurisdiction. Council permits for commercial dog walking were found only in Victoria (existing rows). Brisbane's dog permit page does not cover walking businesses. Dog walking should be treated as council-dependent.
6. House sitting as boarding. No jurisdiction confirms that in-home house sitting counts as boarding. The NSW code, the ACT boarding definition and the SA Burnside registration all tie boarding to premises or kennels. Treat house sitting as UNCONFIRMED everywhere.

## 5. Gaps not covered in this pass

- Working with Children Checks for children's classes (fitness, yoga, dog walking with child clients). The Victorian rows exist. Equivalent rules for NSW, QLD, WA, SA, TAS, ACT and NT were not researched.
- Public liability and professional indemnity minimums at state level. Only council minimums were found (Holdfast Bay 20 million and 5 million dollars; Hornsby 20 million dollars).
- Pet grooming in most jurisdictions. Pet transport beyond NSW (Code No 1) and the ACT and NT livestock or restraint positions.
- Personal training and yoga in WA, TAS, ACT, NT and QLD. Only NSW (Hornsby) and SA (Holdfast Bay) council permits were read.
- Council detail beyond the sample: one or two councils per state. Fee schedules were read only where printed on the page.
- Victoria rows were not re-verified.
- State WHS adoption was not checked per state. The chemical row (NAT-CHEM-01) is the model position from Safe Work Australia.

## 6. Source issues

- Safe Work Australia's PCBU information sheet on working from home is blocked by robots rules. The working-from-home duties page was read instead (NAT-CHEM-02). It does not cover client homes.
- Many ABLIS pages carry a 13 September 2017 metadata date. Where that date is the only one, the page date is shown as such and the content may be older or newer than it appears.
- The Ryde (NSW) registration page body was not retrieved. Its registration statement comes from the page's description and has a missing word. Treat it as a lead.
- NT registration page: no Act or regulation named.
- Several council pages show no date. Fees labelled 2026-27 are the only date signal.
- Queensland: Business Queensland's animal welfare code list (last reviewed 25 August 2025) names no companion animal boarding or transport code. Absence on one page is not proof of no code.
- Titles seen in search but not read are marked as leads in the notes column, not as findings.

## 7. Decisions taken for review

- Treated "must register" or "must notify" statements on council pages as COUNCIL-SPECIFIC, not state-wide, even where the wording is general.
- Treated the absence of a licence on an official page as UNCONFIRMED where the page does not claim to be complete (NT, TAS, ACT pet pages).
- Treated the ACT pet business page's list as the licensed set (boarding and pet shops). Dog walking and pet sitting are recorded as not listed, not as exempt.
- Treated the Gold Coast massage and beauty positions as CONFIRMED for Gold Coast's reading of the Act only. Other councils are not represented.
- Kept Victorian rows unchanged. Where a NAT row updates a carried NSW or QLD row, both are kept and the NAT row governs.
- Used the national model WHS position for chemicals as one row (jurisdiction "NAT (model WHS)") rather than repeating it for each state. State adoption is flagged.

## 8. Memory and context

No stored user memory was used for this task. Nothing from memory appears in the matrix or notes.
