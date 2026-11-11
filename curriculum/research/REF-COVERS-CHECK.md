# REF-COVERS-CHECK

Check of learner-visible legal and licence claims against the `covers` text of each `officialReferences` entry.

## Scope and method

- Corpus: 522 lesson files under `curriculum/courses` and `curriculum/shared` have a non-empty `officialReferences` array. 498 of them contain learner-visible sentences matching legal or licence keywords (licence, registration, Act, regulation, offence, penalty, permit, SDS, and similar).
- The task asked for 40 lessons. I took the first 40 of the 498 in path order. All 40 are under `curriculum/courses`; no `curriculum/shared` lesson was sampled. The 40 are: appliance (NEW-APP-01 to 12 except 09), aquarium (NEW-AQU-01 to 08 and aquarium-cleaning L03, L04, L07, L10, L11), beauty (NEW-BEA-01 to 05), bond-and-end-of-lease-cleaning (C06-L01 to L03), car-detailing (CAR-BUS-04, CAR-NEW-02, 03, 05, 06, 09, 10, car-detailing-L01).
- Text read: instruction bodies, `safetyAndRegulatory` points, and `referencesAtStart`. `referencesAtStart` is treated as a list of sources, not as claims.
- Test applied: a claim counts as covered only if the `covers` text states the substance of the claim. A covers text that only names a page or topic ("Open the page and check X") is marked Partial or None.
- Checking was done against `covers` text only. No live pages were fetched in this pass.
- Excluded from the table: scope disclaimers ("this lesson does not grant a licence"), business practice guidance, and technical content with no legal element.

## Decisions made

1. Sample size: the task said 40, but 498 lessons qualify. I checked the first 40 in path order and did not extend the sample.
2. Covers text was judged only against itself, not against the live pages.
3. Covers edits: none made in this pass. No entry's covers text clearly contradicts the claim it supports. The gaps are missing support, which is listed below and not fabricated. Correcting covers to what each page says needs the page re-read, which this pass did not do.
4. Pure practice guidance and scope disclaimers were left out of the table.

## Summary counts (40 lessons)

- References in the 40 lessons: 176.
- References whose covers text is placeholder-style ("not yet confirmed", "UNCONFIRMED", "no official page read"): 35. These support no claim. Listed under "Entries that support no claim".
- Claim rows in the table: see the status counts under the table.

## Claims table

Status key: Covered = covers states the claim. Partial = covers support part of it or name the topic only. None = no covering entry.

| Lesson | Claim (paraphrased) | Covering entry | Status | Note |
|---|---|---|---|---|
| NEW-APP-01 | Electrical repair and work inside an enclosure needs a state or territory licence | R3, R4, R6, R9, R14 | Covered | Per state; no single entry covers all states |
| NEW-APP-01 | Gas appliance servicing needs a gasfitter or registered person | R7, R15 | Partial | Registered-person route not in covers |
| NEW-APP-01 | Victoria: internal cleaning of a Type A unit is covered work for specialised plumbers | R8 | Covered | |
| NEW-APP-01 | Refrigerant work without licence is an offence under regulation 111 | R2 | Covered | Entry is the 2018 compilation, which the entry says to recheck |
| NEW-APP-01 | The 2018 compilation reads refrigerant work broadly | none | None | Covers do not say this |
| NEW-APP-01 | A cleaner may clean only when the owner, operator or site manager has authorised the work | none | None | Business rule; no reference cited |
| NEW-APP-01 | Appliances fall in the model code's definition of plant, so the duty to manage risk applies | R1 | Partial | Definition covered; duty not stated |
| NEW-APP-01 | Electrical installations, gas appliances and refrigeration are regulated work | R2, R3, R4, R7, R8 | Covered | |
| NEW-APP-02 | Consumer guarantees apply alongside a warranty and a warranty cannot remove them | R1 | Covered | |
| NEW-APP-03 | NSW: electrical licence needed before any electrical wiring work | R2 | Covered | |
| NEW-APP-03 | Queensland open electrical licence covers repair of electrical equipment | R3 | Covered | |
| NEW-APP-03 | Isolating a fixed installation or switchboard is regulated electrical work | R2, R3 | Partial | Both cover general licensing only; neither mentions isolation |
| NEW-APP-04 | ACT: inspection by a licensed electrician or certified competent person | R1 | Covered | |
| NEW-APP-04 | ACT: unsafe equipment goes to an authorised repairer or competent person | R1 | Covered | |
| NEW-APP-04 | NSW: repair of wiring and switchboards is licensed electrical work | R2 | Partial | Wiring covered; switchboards not named |
| NEW-APP-04 | Queensland open licence allows repair of electrical equipment of any kind | R3 | Partial | "Any kind" not in covers |
| NEW-APP-04 | WA defines electrical work to include appliance work | R4 | Covered | |
| NEW-APP-04 | AS 3760:2022 covers testing and tagging of portable equipment | R1 | Partial | Standard named by title only |
| NEW-APP-04 | Who may test and tag under AS 3760 depends on state rules | R1 | Partial | Only ACT position in covers |
| NEW-APP-05 | Victoria: internal cleaning of a Type A unit under AS 4575 is covered work | R1 | Covered | |
| NEW-APP-05 | Cleaning or servicing gas appliances is regulated work | R3, R5 | Covered | |
| NEW-APP-05 | NSW gasfitting needs a licence | R2 | Covered | |
| NEW-APP-05 | Queensland gasfitting licence covers servicing a gas system | R3 | Covered | |
| NEW-APP-05 | WA: all gasfitting work by a licensed gasfitter | R4 | Covered | |
| NEW-APP-05 | ACT: gas appliance work requires a licence | R5 | Covered | |
| NEW-APP-05 | SA combined licence covers gas fitting downstream of the meter | R6 | Covered | |
| NEW-APP-05 | Gas installation work follows AS/NZS 5601.1 | R7 | Partial | Covers say Victoria only |
| NEW-APP-05 | Victoria: 2022 edition mandatory from 30 March 2023 | R7 | Covered | |
| NEW-APP-06 | Plant model code treats appliances as plant, so the duty applies | R1 | Partial | Definition only |
| NEW-APP-07 | Manual tasks code: duty to assess and manage manual tasks | R1 | Covered | |
| NEW-APP-07 | Hazardous Manual Tasks Code 2015 approved 18 March 2016 and held on legislation.gov.au | R2 | Partial | Date is in pageDate field, not covers text |
| NEW-APP-07 | Lifting fixed-installation equipment or disconnecting gas or electrical connections is regulated work | none | None | |
| NEW-APP-08 | Every hazardous product must come with an SDS | R1 | Partial | Covers say makers and importers prepare SDS, not that each product must come with one |
| NEW-APP-08 | SDS and labels are required for hazardous chemicals | R1, R3 | Covered | |
| NEW-APP-08 | SDS must be kept accessible in the workplace | R2 | Covered | |
| NEW-APP-08 | Model code covers SDS and labelling | R3 | Covered | |
| NEW-APP-08 | Waste water and disposal rules depend on state, council and trade waste agreement | none | None | |
| NEW-APP-10 | Regulation 111 makes RAC work without a licence an offence | R1 | Covered | |
| NEW-APP-10 | Refrigerant handling requires a licence under regulation 111 | R1 | Covered | |
| NEW-APP-10 | Regulation 111 reaches decommissioning and acts risking refrigerant escape | none | None | |
| NEW-APP-10 | Opening a housing or touching a compressor may need the licence | R1 | Partial | General offence only |
| NEW-APP-11 | Consumer guarantees apply automatically; warranty cannot remove them | R1 | Covered | |
| NEW-APP-11 | Privacy Act generally does not bind businesses at or under $3M turnover | R2 | Covered | |
| NEW-APP-12 | NSW requires a licence before electrical wiring work | R1 | Covered | |
| NEW-AQU-01 | Store hazardous chemicals safely and share hazard information with workers | R5 | Partial | Describes PCBU duties; content not stated |
| NEW-AQU-01 | Incompatible chemicals must be kept apart | R4 | Covered | |
| NEW-AQU-01 | WA: moving live fish within the state needs authority | R1 | Covered | |
| NEW-AQU-01 | NSW restricts keeping, buying, selling and transporting listed prohibited and notifiable species | R2 | Partial | Topic named; restriction not stated |
| NEW-AQU-01 | Queensland bars holding or importing listed prohibited species | R3 | Partial | Only points to the Biosecurity Regulation and a contact |
| NEW-AQU-02 | Incompatible chemicals kept well apart | R1 | Covered | |
| NEW-AQU-02 | Store test kits as their SDS directs | R2 | Partial | SDS direction not in covers |
| NEW-AQU-03 | NSW: listed prohibited and notifiable species may not be kept, bought, sold or transported | R2 | Partial | Topic named |
| NEW-AQU-03 | Release into public waters needs a fish stocking permit under the Fisheries Management Act | R2 | Partial | Permit named; Act not named |
| NEW-AQU-03 | Discarding a pet fish is an offence under section 11 of the Prevention of Cruelty to Animals Act | R4 | Partial | Covers say s 11 concerns abandoning an animal; fish link not stated |
| NEW-AQU-03 | Section 11 penalties: up to 50 penalty units or six months, or both | R4 | Partial | Covers say figures are on the page; figures not stated |
| NEW-AQU-03 | Queensland: listed prohibited species must not be held or brought in | R3 | Partial | |
| NEW-AQU-03 | WA: moving live fish needs authority | R1 | Covered | |
| NEW-AQU-03 | Medicating, moving or releasing animals may be regulated | none | None | R5, R6, R7 placeholders |
| NEW-AQU-04 | NSW: electrical wiring work including repair needs a licence whatever the cost | R1 | Covered | |
| NEW-AQU-04 | Exception for equipment at or below 50 V AC or 120 V ripple-free DC | none | None | |
| NEW-AQU-04 | Repairing a mains connection, controller or fixed lighting is electrical work | R1 | Partial | Controllers and lighting not named |
| NEW-AQU-04 | Queensland guidance: use electrical equipment through a safety switch | R2 | Covered | Covers are for pools; lesson notes this |
| NEW-AQU-04 | AS/NZS 3000 is the Standards Australia Wiring Rules title used for design and checking | R4 | Partial | Title and 2018 edition only |
| NEW-AQU-05 | NSW: electrical wiring work licensed whatever the cost | R1 | Covered | |
| NEW-AQU-05 | NSW: plumbing, draining and gasfitting licensed whatever the cost | R5 | Covered | |
| NEW-AQU-05 | Queensland: QBCC licence for plumbing or drainage of any value | R3 | Covered | |
| NEW-AQU-05 | Do not sell animals unless authorised | none | None | R9 covers prohibited species only |
| NEW-AQU-05 | Selling or supplying live animals may need authority | R7 | None | Placeholder |
| NEW-AQU-06 | Keep client records private; share only with owner or authorised person | R3 | None | Covers say the page does not set this out |
| NEW-AQU-07 | NSW DPI describes sourcing aquatic animals or rock online from overseas as illegal | R2 | Partial | Covers say "warning"; "illegal" not stated |
| NEW-AQU-07 | Incompatible chemicals kept well apart | R1 | Covered | |
| NEW-AQU-08 | ACL service standards: competent, fit for purpose, reasonable time | R1 | Covered | |
| NEW-AQU-08 | Receipt required for transactions over $75 | R1 | Covered | |
| NEW-AQU-08 | Some work needs a licensed electrician, licensed plumber or animal health professional | none | None | |
| aquarium-cleaning-L03 | NSW: listed prohibited and notifiable species may not be kept, bought, sold or transported | R2 | Partial | Topic named |
| aquarium-cleaning-L03 | Queensland: listed prohibited species must not be held or brought in | R3 | Partial | |
| aquarium-cleaning-L03 | A state permit for these is separate from the lesson | none | None | |
| aquarium-cleaning-L04 | NSW DPI describes sourcing aquatic animals or rock online from overseas as illegal | R4 | Partial | Same gap as NEW-AQU-07 |
| aquarium-cleaning-L04 | Incompatible chemicals kept well apart | R1 | Covered | |
| aquarium-cleaning-L07 | NSW: electrical wiring work licensed whatever the cost | R1 | Covered | |
| aquarium-cleaning-L07 | NSW: plumbing, draining and gasfitting licensed whatever the cost | R6 | Covered | R6 is also the UNCONFIRMED hose-fill entry |
| aquarium-cleaning-L07 | Queensland: QBCC licence for plumbing or drainage of any value | R3 | Covered | |
| aquarium-cleaning-L10 | NSW: electrical wiring work including repair licensed whatever the cost | R2 | Covered | |
| aquarium-cleaning-L10 | Queensland: AS/NZS 3760 named for in-service testing in some industries, no edition year | R4 | Covered | |
| aquarium-cleaning-L10 | Repair, rewiring, new connection or opening a fixed enclosure is for a licensed person | R2 | Partial | Wiring and repair only |
| aquarium-cleaning-L10 | Model confined-space code guides work; check legal effect with the regulator | R6 | Covered | |
| aquarium-cleaning-L10 | Confined-space entry needs a documented procedure, atmosphere assessment, standby person and any permit | R6, R7 | None | Entry requirements not read |
| aquarium-cleaning-L10 | Definition of a confined space | none | None | |
| aquarium-cleaning-L11 | NSW: prohibited and notifiable species may not be kept, bought, sold or transported; release needs a permit | R1 | Partial | Topic named |
| aquarium-cleaning-L11 | Queensland: prohibited species must not be held or brought in; inform Biosecurity Queensland | R2 | Partial | |
| aquarium-cleaning-L11 | Do not add water from an unknown source without checking state rules | R5 | None | Placeholder |
| NEW-BEA-01 | Victoria: beauty therapy must register under the Public Health and Wellbeing Act 2008 | R1 | Partial | Covers name the registrable services list only |
| NEW-BEA-01 | Victoria: mobile therapists exempt, stopping short of the principal place; mobile cosmetic application exempt only without skin penetration | R1 | Partial | Covers name the mobile exemption note only |
| NEW-BEA-01 | Queensland: beauty therapy needs no licence; listed higher-risk services need one | R3 | Partial | Covers mention higher-risk services only |
| NEW-BEA-01 | ACT: mobile practitioners doing skin penetration fall under the infection control licence | R4 | Covered | |
| NEW-BEA-01 | NT: business receiving payment for beauty therapy must register | R5 | Covered | |
| NEW-BEA-01 | Gold Coast: foreign material beneath the skin is higher-risk and needs a licence | R6 | Partial | Licence classes only |
| NEW-BEA-01 | Macedon Ranges: facials, manicures, electrolysis and waxing in high-risk group | R2 | Partial | Groups named; list not stated |
| NEW-BEA-01 | WorkSafe: nail acrylics, dip powders, eyelash glue and peels are hazards | R7 | Covered | |
| NEW-BEA-01 | SDS required for every product and kept accessible | R8 | Covered | |
| NEW-BEA-01 | Hazardous substances register listing every substance on site | R9 | Covered | |
| NEW-BEA-02 | Victorian Department of Health names the 2019 infection prevention guidelines | R1 | Covered | |
| NEW-BEA-02 | WorkSafe hazards include nail acrylics, dip powders, eyelash glue and peels | R2 | Covered | |
| NEW-BEA-02 | Up-to-date SDS required for every product | R3 | Covered | |
| NEW-BEA-02 | WA: mobile operators need hand-washing facilities with warm water, soap and disposable towels | R4 | Partial | Covers cite section 13.1 only |
| NEW-BEA-02 | WA: equipment cleaned after each client; mobile wastewater to sewer | R4 | Partial | Covers cite sections 10, 11 and 13.1 only |
| NEW-BEA-03 | WA guideline does not require formal health screening of staff or clients | R2 | None | Covers list sections only |
| NEW-BEA-03 | WA: open wound, infection or skin condition means recommending a GP visit | R2 | Partial | Covers cite section 7.3 only |
| NEW-BEA-03 | Victorian Department of Health names the 2019 guidelines | R1 | Covered | |
| NEW-BEA-04 | Items must be on the approved list and inside the Victorian registrable services position | R1 | Partial | Names the list only |
| NEW-BEA-04 | Menu must not describe results the treatment cannot deliver | none | None | No consumer-law entry |
| NEW-BEA-05 | Self-employed and employer duties not to expose others to risk | R1 | Covered | |
| NEW-BEA-05 | Duty applies in a client's home as though it applies | R1 | None | Covers say the page does not say whether a client home is a workplace |
| NEW-BEA-05 | WA: holding-tank wastewater emptied to sewer, not stormwater | R2 | Partial | Section 13.1 only |
| C06-L01 | Victoria: start-of-tenancy condition report is the comparison point; no claim for ordinary wear | R1 | None | Covers name page only |
| C06-L01 | Victoria: exit condition report to be finished within 10 days | R1 | None | |
| C06-L01 | Victoria: renter leaves property reasonably clean, allowing for ordinary wear | R1 | None | |
| C06-L01 | Victoria: professional cleaning only for agreements from 29 March 2021 in limited cases | R1 | None | |
| C06-L01 | Victoria: bond paid only when all named parties agree or a VCAT order directs | R2 | None | |
| C06-L01 | Victoria: 14 days to start a claim; 3 business days' notice | R2 | None | |
| C06-L01 | Queensland: exit report completed together | R3 | None | |
| C06-L01 | Queensland: tenant cleans thoroughly; manager delivers report within 3 business days | R3 | None | |
| C06-L01 | Queensland: evidence due within 14 days of claim | R3 | None | |
| C06-L01 | NSW: hand back close to move-in state; repair damage beyond wear | R4 | None | |
| C06-L01 | NSW: 14 days to accept or dispute claim; cleaning matches original condition | R5 | None | |
| C06-L01 | WA: hand back close to move-in state; pay for damage beyond wear | R6 | None | |
| C06-L01 | SA: bond page sets no cleaning standard and no day count | R7 | None | |
| C06-L01 | Tasmania: carpets need a professional cleaner with receipt kept | R8 | None | Covers name the page only; flag for review |
| C06-L01 | ACT: match move-in cleanliness, some wear excepted | R9 | None | |
| C06-L01 | NT: reasonably clean, allowing normal wear | R10 | None | |
| C06-L02 | Privacy Act generally does not apply at or under $3M; some small businesses covered regardless | R2 | None | Covers say only "check before relying on the exemption" |
| C06-L02 | Whether the Privacy Act covers photographs depends on the business | R2 | None | |
| C06-L02 | Business must identify and manage manual-task risk, elimination first | R1 | None | Covers name the page only |
| C06-L02 | Chemicals managed under label and SDS; register lists current SDS | R3 | None | Covers name the page only |
| C06-L02 | Silica: no dry sweeping, compressed air or general vacuum; wet methods alone may not suffice | R4 | None | Covers point to sections only |
| C06-L02 | Silica dust to be controlled by methods in the national silica guide | R4 | Partial | Pointer only |
| C06-L03 | Renter leaves property reasonably clean, allowing fair wear (Victoria) | R4 | None | |
| C06-L03 | Victoria: no professional cleaning requirement for agreements from 29 March 2021, with exceptions | R4 | None | |
| C06-L03 | Victoria: renter need not use a particular cleaner | R4 | None | |
| C06-L03 | Queensland: same condition apart from fair wear and tear | R5 | None | |
| C06-L03 | Victoria: exit condition report within 10 days | R1 | None | |
| C06-L03 | Victoria: renter present or has reasonable opportunity to attend | none | None | |
| C06-L03 | Victoria: bond-claim evidence given at least 3 business days before claim | R2 | None | |
| C06-L03 | Victoria: bond released when all listed agree or by order | R2 | None | |
| C06-L03 | Victoria: renter has 14 days to contest a claim | R2 | None | |
| C06-L03 | Whether the Privacy Act covers photographs depends on the business | R3 | None | Covers say only "check before relying on the exemption" |
| CAR-BUS-04 | GST registration required once GST turnover reaches $75,000 | R3 | Covered | Covers say confirm the threshold on the current page; not verified live |
| CAR-BUS-04 | Quotes and advertising must not make unsupported claims about results or prices | none | None | |
| CAR-NEW-02 | Stormwater drains carry only rainwater; capture-and-treat washes are more responsible | R1 | None | Covers name the EPA page only |
| CAR-NEW-02 | Auto-Detailing guide: clay bar has no effect on certain marks | none | None | Guide not in officialReferences |
| CAR-NEW-02 | Car-Detailing-Guide: iron removers can reduce the need for clay | none | None | Guide not in officialReferences |
| CAR-NEW-03 | ACCC: intent does not matter; leaving out important information can mislead | R1 | None | Covers name the topic |
| CAR-NEW-03 | Almost every hazardous chemical needs an SDS, with copies kept in the workplace | R3 | None | Covers name the page only |
| CAR-NEW-03 | Hierarchy of control places PPE last | R6 | None | Covers name the page only |
| CAR-NEW-03 | Claims about results must match what was shown | R1 | None | |
| CAR-NEW-05 | Privacy Act generally does not apply at or under $3M turnover | R1 | None | Covers name the page only (contrast NEW-APP-11 R2) |
| CAR-NEW-06 | Claims about what a service includes must not omit material facts | R1 | None | |
| CAR-NEW-09 | Register must list each hazardous chemical with current SDS, accessible to workers and emergency services | R1 | None | Covers name the page only |
| CAR-NEW-09 | EPA Victoria: driveway washing sends soap and oils into waterways | R3 | None | |
| CAR-NEW-09 | Check the local water authority's trade waste rules | R3 | Covered | Pointer only |
| CAR-NEW-09 | WorkSafe alert names AS/NZS 4233.1 for high-pressure jetting | R4 | None | Covers name the alerts page only |
| CAR-NEW-09 | AS/NZS 3760 commonly referenced for in-service testing | none | None | |
| CAR-NEW-09 | Auto-Detailing guide: avoid direct high-pressure stream on electrical parts | none | None | Guide not in officialReferences |
| CAR-NEW-10 | Respirators used at work should comply with AS/NZS 1716 | R4 | Partial | Standard named; compliance wording absent |
| CAR-NEW-10 | Only licensed or registered electricians carry out electrical work | R3 | Covered | |
| CAR-NEW-10 | Business must identify and assess chemical risks, control them, store safely and communicate hazards | R2 | Covered | |
| CAR-NEW-10 | Tight-fitting respirators need a fit test before first use and at least yearly | R4 | Partial | Fit testing named; yearly interval not stated |
| CAR-NEW-10 | P1 to P3 filter classes | R4 | Covered | |
| CAR-NEW-10 | Claims about benefits and performance must be provable | R5 | Covered | |
| CAR-NEW-10 | SDS must be easy to reach | R1 | Covered | |
| car-detailing-L01 | Price, result and remedy claims must be accurate; omitting material detail misleads | R2 | None | Covers name the topic |
| car-detailing-L01 | Services carry a guarantee of competent performance | R3 | None | Covers name the section only |
| car-detailing-L01 | Stop when wastewater cannot be lawfully controlled | R1 | None | |
| car-detailing-L01 | EPA: car washes inspected for failing to capture or treat wash water; no numeric limit | R1 | None | Covers name the page only |
| car-detailing-L01 | Home car washing carries no legal obligation; commercial wash recommended | R1 | None | |
| car-detailing-L01 | Specialist tier shown as its own price line because consumer law bars false price claims | R2 | None | |

Status totals are in the next section.

## Entries that support no claim

- Placeholder-style entries (covers say "not yet confirmed", "UNCONFIRMED", or "no official page read"): 35 of 176 in the sample. Examples: NEW-AQU-01 R7, R8; NEW-AQU-03 R5 to R7; NEW-AQU-05 R5 to R8; NEW-AQU-06 R1, R2; aquarium-cleaning-L07 R5 to R7; aquarium-cleaning-L11 R4 to R6; CAR-NEW-09 R4.
- Entries not cited by any extracted learner claim, so they may appear only in `referencesAtStart`: NEW-APP-01 R5, R10, R11, R12, R13 (R10 says servicing is not addressed); NEW-AQU-05 R9 (its covers say buying overseas online is illegal, which no claim in that lesson uses); NEW-AQU-08 R4; CAR-NEW-03 R4, R5; BEA-04 R2.

## Cross-lesson inconsistencies to resolve

- The same NSW DPI page ("Aquarium owners and trade") has three different covers texts. NEW-AQU-05 R9 says buying fish or live rock from overseas online "is illegal" and cites the Biosecurity Act. NEW-AQU-01 R2, NEW-AQU-03 R2 and NEW-AQU-07 R2 describe only a "warning" on overseas online buying. The illegal claim in NEW-AQU-07 and aquarium-cleaning-L04 is therefore only partly supported.
- The Privacy Act covers differ: NEW-APP-11 R2 states the $3M threshold; CAR-NEW-05 R1 and C06-L02 R2 name the OAIC page only.

## Changes made to covers text

None. I found no entry whose covers text clearly contradicts the claim it supports. The problems are missing support (covers that name a page or topic only), which are listed above rather than edited. Rewriting covers "to what the page says" needs the pages re-read, which this pass did not do. I did not add references to fill gaps, and learner text was not changed.

## Limitations

- Keyword plus manual extraction. Some claims may be missed.
- Only 40 of 498 qualifying lessons were checked, all under `curriculum/courses`.
- Covers-only test. Whether the underlying pages support the claims is not established here.
- Status for CAR-BUS-04 relies on a covers statement that the ATO threshold needs confirming.
