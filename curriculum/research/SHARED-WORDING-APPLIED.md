# Shared lesson wording applied (owner decision 3)

Date: 2026-11-03. Scope: `curriculum/shared/**/*.json`, learner text only. Source: `curriculum/research/SHARED-UNVERIFIED-PROPOSAL.md`. Held items: `curriculum/research/SHARED-HELD-150.md`.

## Counts

- Files changed: 281
- Deleted items: 50 (30 safety points where the status sentence was replaced by a plain step drawn from the same sentence; 20 removed: 17 summary lines, 3 common-error items removed whole)
- Rewritten items: 580 (includes 3 safety points with manual wording, see decision D3)
- Held: 150 (see SHARED-HELD-150.md)
- Knowledge checks, answer keys and correctIndex: not changed
- Checker: `python3 -I /home/claude/work/check.py` before and after: 0 problems, 932 lessons, no new problems

## Decisions made (for review)

- D1. Safety points whose only text was a status sentence: the sentence was replaced by a plain step taken from the same sentence (status clause removed, or the check wording kept as the instruction). Examples: `PBP-04` privacy point, `PBP-06` tax point. The owner rule for safety steps applied.
- D2. Non-safety items (summary lines, common errors) that were entirely status text were removed. For commonErrors, the whole item (error and prevention) was removed, because the error text was itself the status note.
- D3. Three safety points had broken output from the automatic rule and were written by hand: `fitness-business/ACE-02` safety point 0, `pool/PCS-02` safety point 2, `pool/PCS-03` safety point 0. In `pool/PCS-03`, the second sentence "Do not show a number that has not been confirmed." was kept unchanged as a learner rule (proposal category H-WORD), not deleted.
- D4. Claims with a status clause were removed by sentence. Some figures remain attributed to their source, for example `healthcare/OTI-04` (learner guide ceiling of 35 degrees), because the proposal kept sourced content. Owner may want to review these with the wider G2 list.
- D5. Edits were exact-string replacements inside each JSON file (other formatting left as found). Each file was re-read immediately before its edit. A file is written only if its JSON still parses after the edit.
- D6. 108 PV electrical-notice items in the proposal had already been rewritten by another agent before this edit. Nothing was applied to them. They are listed in SHARED-HELD-150.md section B.
- D7. Not touched: 44 status hits in fields outside the proposal (e.g. learningOutcomes, audience) and 23 hits using unconfirmed or not checked outside the proposal family. The proposal did not include them in the 630.

## Changes (file, path, old, new)

### `curriculum/shared/app/SFS-01.json`

- `instruction/1/body` (text changed)
  - Old: One job can have several visits: a first attendance to diagnose, a return to fit parts and a final check, for example. Each visit has its own window, duration and status. Equipment on site is kept as an asset, so a later repair can be traced to the right unit. Once the job's work is finished, the job feeds the service report and the invoice. The invoice step is outside the reference guide sections read for this lesson, so its link to the job has not yet been confirmed for Titan Zero Field and check with the relevant regulator before relying on this point.
  - New: One job can have several visits: a first attendance to diagnose, a return to fit parts and a final check, for example. Each visit has its own window, duration and status. Equipment on site is kept as an asset, so a later repair can be traced to the right unit. Once the job's work is finished, the job feeds the service report and the invoice.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-02.json`

- `instruction/1/body` (text changed)
  - Old: Oversized areas make scheduling slow and dispatch hard to manage. The reference guide suggests keeping an area to about fifty workers, about a thousand visits a day, and no more than twenty qualified workers for a single visit. Treat these as starting points to review, not as Australian standards; the right figures for Titan Zero Field have not yet been confirmed, so check with the relevant regulator before relying on this point. Membership records say which area a worker belongs to. A primary area is where the worker mostly works, usually near home. A secondary area is somewhere they can be sent when needed. A relocation area is a temporary home area for a set period. Each worker's home base needs a confirmed map point, or the app cannot calculate their travel.
  - New: Oversized areas make scheduling slow and dispatch hard to manage. The reference guide suggests keeping an area to about fifty workers, about a thousand visits a day, and no more than twenty qualified workers for a single visit. Treat these as starting points to review, not as Australian standards. Membership records say which area a worker belongs to. A primary area is where the worker mostly works, usually near home. A secondary area is somewhere they can be sent when needed. A relocation area is a temporary home area for a set period. Each worker's home base needs a confirmed map point, or the app cannot calculate their travel.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-03.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-04.json`

- `instruction/1/body` (text changed)
  - Old: A template change affects jobs created after the change. It does not rewrite jobs already open. The same applies to skills: adding a skill requirement to a template does not change jobs that already exist. Office staff should check open jobs after any template change that affects time or skills. A skill requirement is only enforced where the scheduler is set to check it. Without that check it works as a suggestion. How Titan Zero Field enforces skills has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A template change affects jobs created after the change. It does not rewrite jobs already open. The same applies to skills: adding a skill requirement to a template does not change jobs that already exist. Office staff should check open jobs after any template change that affects time or skills. A skill requirement is only enforced where the scheduler is set to check it. Without that check it works as a suggestion.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-05.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-06.json`

- `instruction/0/body` (text changed)
  - Old: An asset is a piece of equipment or a system at a customer's site that may need repeat service, such as an air conditioner, a pool pump or a commercial dishwasher. Recording assets gives each later job a history. An asset can sit under a parent, such as a plant room with several units beneath it. The reference guide sets limits on how large these groupings can grow. The limits that apply to Titan Zero Field have not yet been confirmed, so keep groupings to what the office can read at a glance and check with the relevant regulator before relying on this point.
  - New: An asset is a piece of equipment or a system at a customer's site that may need repeat service, such as an air conditioner, a pool pump or a commercial dishwasher. Recording assets gives each later job a history. An asset can sit under a parent, such as a plant room with several units beneath it. The reference guide sets limits on how large these groupings can grow.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-07.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-08.json`

- `instruction/0/body` (text changed)
  - Old: Priority tells the scheduler which visits matter most when the day is full. It can be a fixed value set on a job or a visit, or a calculated value, such as the days left before a due date. The scheduler looks at the visit's own priority first and falls back to the job's. When no free slot exists, a higher-priority visit can displace a lower one. Choose a small scale that the office can remember, and write down what each level means. The scale Titan Zero Field uses has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Priority tells the scheduler which visits matter most when the day is full. It can be a fixed value set on a job or a visit, or a calculated value, such as the days left before a due date. The scheduler looks at the visit's own priority first and falls back to the job's. When no free slot exists, a higher-priority visit can displace a lower one. Choose a small scale that the office can remember, and write down what each level means.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-09.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-10.json`

- `instruction/1/body` (text changed)
  - Old: Drip-feed dispatch sends visits singly. A later visit is held back until the visit in front of it is finished. This stops a worker being handed a long list that is likely to change, and it reduces confusion when the day shifts. Drip-feed takes more setting up than a full dispatch, but it limits the number of changes a worker must absorb. Whether Titan Zero Field supports drip-feed has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Drip-feed dispatch sends visits singly. A later visit is held back until the visit in front of it is finished. This stops a worker being handed a long list that is likely to change, and it reduces confusion when the day shifts. Drip-feed takes more setting up than a full dispatch, but it limits the number of changes a worker must absorb.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-11.json`

- `instruction/0/body` (text changed)
  - Old: Some workers, such as contractors, can only work an agreed amount in a period. You can record that as hours per period, for example eighty hours a month, or as a number of visits per period. Capacity records should match contract dates, and the dates should not overlap. The scheduler checks each day against capacity, and does not weigh the week or the month, so the office should review weekly totals by hand. How Titan Zero Field handles this has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Some workers, such as contractors, can only work an agreed amount in a period. You can record that as hours per period, for example eighty hours a month, or as a number of visits per period. Capacity records should match contract dates, and the dates should not overlap. The scheduler checks each day against capacity, and does not weigh the week or the month, so the office should review weekly totals by hand.
- `workedExamples/0/reasoning` (text changed)
  - Old: A capacity in hours per month records the limit. An exclusion on the site or customer record stops other workers being offered that home. The exact wording of exclusions in Titan Zero Field has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A capacity in hours per month records the limit. An exclusion on the site or customer record stops other workers being offered that home.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-12.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-13.json`

- `instruction/1/body` (text changed)
  - Old: An absence logs a block of days when a worker cannot take jobs, such as leave, training or sickness. Recording it stops the scheduler offering visits in that time, and the office can see gaps early. A daily route shows where a worker travelled. The planned route is what the scheduler expected, and the actual route is what the device recorded. Comparing the two helps the office spot unrealistic travel times. Tell workers about any location tracking before it starts. The legal requirements for this have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: An absence logs a block of days when a worker cannot take jobs, such as leave, training or sickness. Recording it stops the scheduler offering visits in that time, and the office can see gaps early. A daily route shows where a worker travelled. The planned route is what the scheduler expected, and the actual route is what the device recorded. Comparing the two helps the office spot unrealistic travel times. Tell workers about any location tracking before it starts.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-14.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-15.json`

- `instruction/0/body` (text changed)
  - Old: When a worker logs in, the app downloads the visits and related records assigned to them, so they can carry on without signal. This is called priming. The reference guide primes the worker's visits within a window around the current date, by default forty-five days either side, and notes that this window can be configured. Large volumes take longer. A network error stops priming, so the worker should run it again once they have signal. A worker who has not primed before going offline will not have the visits they need. Titan Zero Field's window has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: When a worker logs in, the app downloads the visits and related records assigned to them, so they can carry on without signal. This is called priming. The reference guide primes the worker's visits within a window around the current date, by default forty-five days either side, and notes that this window can be configured. Large volumes take longer. A network error stops priming, so the worker should run it again once they have signal. A worker who has not primed before going offline will not have the visits they need.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/app/SFS-16.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim. Any rule a business must follow has not yet been confirmed for this lesson.
  - New: This lesson covers app records and office process only. It does not grant, confirm or replace any licence, certificate or authority, and it makes no legal claim.

### `curriculum/shared/business-stats/BST-01.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Customer names and addresses should stay out of shared worksheets where possible. Privacy duties that apply to your business have not yet been confirmed and should be checked against current Australian privacy requirements before you rely on them.
  - New: Customer names and addresses should stay out of shared worksheets where possible.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: How long invoices and job records must be kept is set by Australian tax and privacy rules. That period has not yet been confirmed, and this lesson does not give tax or accounting advice, so check with the relevant regulator before relying on this point.
  - New: How long invoices and job records must be kept is set by Australian tax and privacy rules.

### `curriculum/shared/business-stats/BST-02.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Job notes that record customer or site details are subject to privacy duties. Those duties have not yet been confirmed and should be checked against current Australian requirements.
  - New: Job notes that record customer or site details are subject to privacy duties.

### `curriculum/shared/business-stats/BST-03.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Customer records are subject to privacy duties. Those duties, and how long records must be kept, have not yet been confirmed and should be checked against current Australian requirements.
  - New: Customer records are subject to privacy duties.

### `curriculum/shared/business-stats/BST-04.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Customer details in test records are subject to privacy duties. Those duties have not yet been confirmed and should be checked against current Australian requirements before records are shared.
  - New: Customer details in test records are subject to privacy duties.

### `curriculum/shared/business-stats/BST-05.json`

- `instruction/0/body` (text changed)
  - Old: Many home and commercial services rise and fall with the calendar. Pool and spa work, end-of-lease cleaning, gutter work and garden clean-ups each have busy months and quiet months, and the pattern tends to repeat from year to year. If you forecast next month by averaging the last few months as they stand, you will overshoot the quiet months and undershoot the busy ones. Two steps fix this. First, measure how each calendar month usually compares with an average month. Second, strip the seasonal effect out of recent months so you can see the underlying level of work, and then put the season back in when you forecast. The seasonal pattern in the examples is invented for this lesson. Any seasonal pattern for a given trade or region should be checked against your own records, because published patterns have not yet been confirmed for your area.
  - New: Many home and commercial services rise and fall with the calendar. Pool and spa work, end-of-lease cleaning, gutter work and garden clean-ups each have busy months and quiet months, and the pattern tends to repeat from year to year. If you forecast next month by averaging the last few months as they stand, you will overshoot the quiet months and undershoot the busy ones. Two steps fix this. First, measure how each calendar month usually compares with an average month. Second, strip the seasonal effect out of recent months so you can see the underlying level of work, and then put the season back in when you forecast. The seasonal pattern in the examples is invented for this lesson.
- `commonErrors/4/prevention` (text changed)
  - Old: Build the indices from your own records. Any published pattern has not yet been confirmed for your area and trade, so check with the relevant regulator before relying on this point.
  - New: Build the indices from your own records.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Rostering and staffing decisions based on a forecast must follow employment and work health and safety obligations. Those obligations have not yet been confirmed and are outside the scope of this lesson, so check with the relevant regulator before relying on this point.
  - New: Rostering and staffing decisions based on a forecast must follow employment and work health and safety obligations.

### `curriculum/shared/business/BPX-01.json`

- `instruction/2/body` (text changed)
  - Old: Employee wages, with the on-costs that attach to them, are an expense line. The owner's own living income is treated differently. In a sole trader structure, the owner's drawings are not a business expense in the same way, so the projection shows the profit available to the owner instead. A company structure pays its owner through salary or dividends, and the lines change again. The rates for superannuation and payroll tax, and how each applies to the owner, have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check them with a registered tax agent before the projection is used for pricing, borrowing or hiring decisions. Keep owner pay visible as its own line so that the person reading the plan can see what the business would have to earn to support the owner.
  - New: Employee wages, with the on-costs that attach to them, are an expense line. The owner's own living income is treated differently. In a sole trader structure, the owner's drawings are not a business expense in the same way, so the projection shows the profit available to the owner instead. A company structure pays its owner through salary or dividends, and the lines change again. Check them with a registered tax agent before the projection is used for pricing, borrowing or hiring decisions. Keep owner pay visible as its own line so that the person reading the plan can see what the business would have to earn to support the owner.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: GST treatment in a profit and loss: the ATO states that a business with GST turnover of $75,000 or more must register for GST (ATO GST registration page, checked 2026-11-02). How GST is shown on the statement has not yet been confirmed here and must be checked with an accountant.
  - New: GST treatment in a profit and loss: the ATO states that a business with GST turnover of $75,000 or more must register for GST (ATO GST registration page, checked 2026-11-02).
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Superannuation, payroll tax and income tax rates are not stated in this lesson and have not yet been confirmed, so check with the relevant regulator before relying on this point. Use current ATO and state revenue office rates, not sample plan rates.
  - New: Use current ATO and state revenue office rates, not sample plan rates.

### `curriculum/shared/business/BPX-02.json`

- `instruction/1/body` (text changed)
  - Old: Current assets are cash and items expected to turn into cash within about a year. For a trade business these are usually the bank balance, money owed by clients for completed and invoiced work, and materials held for jobs. Long-term assets include vehicles, tools and equipment, shown at their value after depreciation. Current liabilities are amounts due within about a year: supplier accounts, GST and other tax owing to the Australian Taxation Office, and the repayments due on a short-term loan. Long-term liabilities are borrowings repaid over more than a year, such as a vehicle loan or equipment finance. Equity for a sole trader is the owner's capital plus profit kept in the business, less drawings taken out. A company shows share capital and retained earnings instead. The tax treatment of each line has not yet been confirmed here and should be checked with a registered tax agent.
  - New: Current assets are cash and items expected to turn into cash within about a year. For a trade business these are usually the bank balance, money owed by clients for completed and invoiced work, and materials held for jobs. Long-term assets include vehicles, tools and equipment, shown at their value after depreciation. Current liabilities are amounts due within about a year: supplier accounts, GST and other tax owing to the Australian Taxation Office, and the repayments due on a short-term loan. Long-term liabilities are borrowings repaid over more than a year, such as a vehicle loan or equipment finance. Equity for a sole trader is the owner's capital plus profit kept in the business, less drawings taken out. A company shows share capital and retained earnings instead.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: GST and other tax owing appear as liabilities. The ATO states that a business with GST turnover of $75,000 or more must register for GST (ATO GST registration page, checked 2026-11-02). The timing and amount of GST payable have not yet been confirmed here and must be checked with a registered tax agent.
  - New: GST and other tax owing appear as liabilities. The ATO states that a business with GST turnover of $75,000 or more must register for GST (ATO GST registration page, checked 2026-11-02).
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Depreciation methods and the values to use for vehicles and tools have not yet been confirmed and must be checked against current ATO guidance or with a tax agent.
  - New: Depreciation methods and the values to use for vehicles and tools must be checked against current ATO guidance or with a tax agent.

### `curriculum/shared/business/BPX-03.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Interest, tax and wage rates change over time. Each rate in the register must carry the date it was checked, and any rate without a current source has not yet been confirmed. The rates in the sample plans used for this course are not Australian and are not used.
  - New: Interest, tax and wage rates change over time. The rates in the sample plans used for this course are not Australian and are not used.

### `curriculum/shared/business/BPX-04.json`

- `instruction/0/body` (text changed)
  - Old: A mobile trade business spends most of its working time at client sites, so the base is a place to store, load and plan rather than a place to meet clients. Three options are common: a home base, a rented workspace or a shared yard, and a sample plan may describe a rented office with a fitted workshop. Choose on function. The base needs secure storage for tools and stock, room to load a vehicle, and a place to do admin without clutter. A home base can be cheaper, but its use may be restricted by council, strata or landlord rules. Those rules have not yet been confirmed in this lesson and must be checked for the address before the base is chosen. Record the base, its cost, its access hours and the reason for the choice.
  - New: A mobile trade business spends most of its working time at client sites, so the base is a place to store, load and plan rather than a place to meet clients. Three options are common: a home base, a rented workspace or a shared yard, and a sample plan may describe a rented office with a fitted workshop. Choose on function. The base needs secure storage for tools and stock, room to load a vehicle, and a place to do admin without clutter. A home base can be cheaper, but its use may be restricted by council, strata or landlord rules. Record the base, its cost, its access hours and the reason for the choice.
- `instruction/1/body` (text changed)
  - Old: Tools, ladders, paint, fixings and consumables all need a defined place. Lockable storage protects both the stock and the client's property, and the vehicle should be secured whenever it is parked at the base. Keep chemicals and paints apart from food and from personal items, and store them according to their safety data sheet. The storage lessons “Storage, spills and disposal” and “Buying tools and equipment in stages” give the procedures in more detail. Tool theft and storage cover are insurance questions, and the policy wording has not yet been confirmed here, so check the policy before relying on it. A simple stock list kept at the base shows what has been used, what must be bought and what has gone missing.
  - New: Tools, ladders, paint, fixings and consumables all need a defined place. Lockable storage protects both the stock and the client's property, and the vehicle should be secured whenever it is parked at the base. Keep chemicals and paints apart from food and from personal items, and store them according to their safety data sheet. The storage lessons “Storage, spills and disposal” and “Buying tools and equipment in stages” give the procedures in more detail. A simple stock list kept at the base shows what has been used, what must be bought and what has gone missing.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Home-based business rules, lease conditions and strata or landlord restrictions have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. They must be checked for the specific address and the local council before a base is chosen.
  - New: They must be checked for the specific address and the local council before a base is chosen.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Tool theft cover, storage cover and vehicle security requirements depend on the policy wording and have not yet been confirmed here, so check with the relevant regulator before relying on this point. Read the policy and confirm what it covers before relying on it.
  - New: Read the policy and confirm what it covers before relying on it.
- `summary/3` (deleted item)
  - Old: Local rules, lease terms and insurance cover have not yet been confirmed until they are checked for the address and policy
  - New: [element removed]

### `curriculum/shared/business/BPX-05.json`

- `workedExamples/0/situation` (text changed)
  - Old: Hypothetical figures, not market data, taken from the examples in “Reading a profit and loss forecast” and “Reading a projected balance sheet”: annual sales of $240,000, gross profit of $168,000, net profit before tax of $22,100, current assets of $13,200, current liabilities of $5,900, total liabilities of $17,900, equity of $19,800 and receivables of $9,000. Tax has not yet been confirmed and not included in the net figure, so check with the relevant regulator before relying on this point.
  - New: Hypothetical figures, not market data, taken from the examples in “Reading a profit and loss forecast” and “Reading a projected balance sheet”: annual sales of $240,000, gross profit of $168,000, net profit before tax of $22,100, current assets of $13,200, current liabilities of $5,900, total liabilities of $17,900, equity of $19,800 and receivables of $9,000.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Ratio thresholds and industry benchmarks for Australian trade businesses have not been checked and have not yet been confirmed. Do not use a threshold from a sample plan or another country as a benchmark.
  - New: Do not use a threshold from a sample plan or another country as a benchmark.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Ratios based on figures that include GST, tax or superannuation treatments that have not yet been confirmed must be presented with that caveat. Confirm the treatment with a registered tax agent before using the ratios for lending or investment decisions.
  - New: Confirm the treatment with a registered tax agent before using the ratios for lending or investment decisions.

### `curriculum/shared/business/PBP-01.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: This lesson grants no licence, authority or accreditation for any service. Licence and authority requirements for each service have not yet been confirmed for Australia.
  - New: This lesson grants no licence, authority or accreditation for any service.

### `curriculum/shared/business/PBP-02.json`

- `instruction/3/body` (text changed)
  - Old: Trends such as demand for eco-friendly service, automated cleaners or online booking should be written with a source and a date. Regulatory points have not yet been confirmed here, so check with the relevant regulator before relying on this point. Pool barrier, registration, operator and environmental rules depend on the state, territory and council, and they are covered in the pool-standards and water-conservation lessons rather than in this market analysis.
  - New: Trends such as demand for eco-friendly service, automated cleaners or online booking should be written with a source and a date. Pool barrier, registration, operator and environmental rules depend on the state, territory and council, and they are covered in the pool-standards and water-conservation lessons rather than in this market analysis.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pool barrier, registration, operator and environmental rules that affect the market have not yet been confirmed for Australia in this lesson, so check with the relevant regulator before relying on this point.
  - New: Check pool barrier, registration, operator and environmental rules that affect the market with the relevant regulator before relying on this point.

### `curriculum/shared/business/PBP-03.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Tax treatment of prices, including any goods and services tax, has not yet been confirmed for Australia and must be checked before prices are published.
  - New: Tax treatment of prices, including any goods and services tax, must be checked before prices are published.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Pricing terms in a service agreement must be checked against Australian consumer law. That check has not yet been confirmed.
  - New: Pricing terms in a service agreement must be checked against Australian consumer law.

### `curriculum/shared/business/PBP-04.json`

- `instruction/1/body` (text changed)
  - Old: The most reliable source of pool work is often a referral from someone who already trusts the service. Property managers, real estate agents, builders, pool installers and other trades can refer clients. Set up each partner route in writing. State what the partner gets, what the business gets, and how referrals are logged. A referral reward must be a stated, lawful arrangement, and any payment to a referrer has not yet been confirmed for Australia and must be checked before it is offered.
  - New: The most reliable source of pool work is often a referral from someone who already trusts the service. Property managers, real estate agents, builders, pool installers and other trades can refer clients. Set up each partner route in writing. State what the partner gets, what the business gets, and how referrals are logged.
- `instruction/2/body` (text changed)
  - Old: Every marketing claim needs evidence. Words such as safe, chemical-free, eco-friendly, guaranteed, certified or the best must be avoided unless the business can show the evidence and the claim is accurate. Testimonials must be genuine, given with permission, and not invented. Australian consumer and advertising rules have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check each claim, and each advertising channel, before publication.
  - New: Every marketing claim needs evidence. Words such as safe, chemical-free, eco-friendly, guaranteed, certified or the best must be avoided unless the business can show the evidence and the claim is accurate. Testimonials must be genuine, given with permission, and not invented. Check each claim, and each advertising channel, before publication.
- `workedExamples/0/reasoning` (text changed)
  - Old: Do not publish the claim until the business can show evidence for it, and the wording is checked against the advertising rules, which have not yet been confirmed for Australia. Replace it with a claim the business can support, such as a description of its products and methods with a source for each.
  - New: Do not publish the claim until the business can show evidence for it, and the wording is checked against the advertising rules. Replace it with a claim the business can support, such as a description of its products and methods with a source for each.
- `workedExamples/1/reasoning` (text changed)
  - Old: Do not agree to the payment until the arrangement has been checked against the Australian rules, which have not yet been confirmed here. Record the offer and the check. Set out the referral route in writing once it is confirmed.
  - New: Do not agree to the payment until the arrangement has been checked against the Australian rules. Record the offer and the check. Set out the referral route in writing once it is confirmed.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Advertising, consumer and referral-payment rules for Australia have not yet been confirmed, so check with the relevant regulator before relying on this point. Each claim and each arrangement must be checked before use.
  - New: Each claim and each arrangement must be checked before use.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Customer details used in marketing must be handled in line with privacy rules, which have not yet been confirmed for Australia.
  - New: Customer details used in marketing must be handled in line with privacy rules.

### `curriculum/shared/business/PBP-05.json`

- `instruction/2/body` (text changed)
  - Old: The US guide suggests hiring through local advertisements and through people the owner knows. In Australia, employment obligations, including pay, leave, insurance and record keeping, and any worker licence or competence rule, have not yet been confirmed here and must be checked before anyone is engaged. Contractors and employees differ in status, so the distinction must be checked against Australian rules.
  - New: The US guide suggests hiring through local advertisements and through people the owner knows. Contractors and employees differ in status, so the distinction must be checked against Australian rules.
- `instruction/3/body` (text changed)
  - Old: List each item of equipment, its maintenance schedule and its storage. Include the vacuum and hoses, brushes, test equipment, the pump or filter tools, the vehicle and the chemical store. Test kits and gauges should be checked against the maker's instructions. Chemicals are stored separated by type, locked and away from fuel and people, and the vehicle carries them securely. The rules for storage and carriage have not yet been confirmed for Australia and are covered in “Pool chemical handling and storage at home” and “Pool chemicals: types, hazards and safe handling”, so check with the relevant regulator before relying on this point.
  - New: List each item of equipment, its maintenance schedule and its storage. Include the vacuum and hoses, brushes, test equipment, the pump or filter tools, the vehicle and the chemical store. Test kits and gauges should be checked against the maker's instructions. Chemicals are stored separated by type, locked and away from fuel and people, and the vehicle carries them securely.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Licence, registration and competence requirements for each pool service task have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. This lesson grants no licence or authority.
  - New: This lesson grants no licence or authority.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Chemical storage, carriage and disposal are subject to dangerous goods and workplace health and safety rules, which have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Chemical storage, carriage and disposal are subject to dangerous goods and workplace health and safety rules, so check with the relevant regulator before relying on this point.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Employment, insurance and record keeping obligations have not yet been confirmed for Australia and must be checked before anyone is engaged.
  - New: Employment, insurance and record keeping obligations must be checked before anyone is engaged.

### `curriculum/shared/business/PBP-06.json`

- `instruction/1/body` (text changed)
  - Old: Every forecast line rests on an assumption. For a pool business the main ones are the number of visits per week, the number of clients on each service, the average price per visit, the chemical and supply cost per visit, the travel time and cost, the labour cost, the insurance cost, the vehicle and equipment cost, the overheads and the owner's pay. Write each assumption, its value, its basis and its date. The method is taught in “Writing the assumptions register behind a projection”. Tax, including any goods and services tax, and insurance costs have not yet been confirmed for Australia until checked.
  - New: Every forecast line rests on an assumption. For a pool business the main ones are the number of visits per week, the number of clients on each service, the average price per visit, the chemical and supply cost per visit, the travel time and cost, the labour cost, the insurance cost, the vehicle and equipment cost, the overheads and the owner's pay. Write each assumption, its value, its basis and its date. The method is taught in “Writing the assumptions register behind a projection”.
- `instruction/4/body` (text changed)
  - Old: State the financing needs in two parts: the start-up costs, such as equipment, vehicle, initial supplies and registration fees, and the working capital needed to cover the time before cash comes in. For each need, state the amount it is built from, the source of the funds and the date needed. Loan terms and financing advice have not yet been confirmed in this lesson and should be checked with a suitable adviser.
  - New: State the financing needs in two parts: the start-up costs, such as equipment, vehicle, initial supplies and registration fees, and the working capital needed to cover the time before cash comes in. For each need, state the amount it is built from, the source of the funds and the date needed.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Tax treatment, including any goods and services tax, insurance costs and financing terms have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Check tax treatment, including any goods and services tax, insurance costs and financing terms with the relevant regulator before relying on this point.

### `curriculum/shared/business/PBP-TPL-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This template does not grant a licence, registration, certificate or authority for any pool service. Each licence and registration item has not yet been confirmed until checked with the Australian authority.
  - New: This template does not grant a licence, registration, certificate or authority for any pool service.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Tax, insurance, employment, advertising and privacy statements have not yet been confirmed for Australia until checked.
  - New: Tax, insurance, employment, advertising and privacy statements must be checked before use.

### `curriculum/shared/business/PROC-01.json`

- `instruction/1/body` (text changed)
  - Old: An output specification describes the result the buyer needs and leaves the method to the supplier. It usually names key performance indicators, such as the share of work passing inspection or the time taken to finish a task, and it states the standard each result must meet. A performance specification describes how the item must behave under stated conditions, for example the load it must carry, the noise it may make or the energy it may use, and the test that will prove it. A conformance specification describes the item in detail: the design, dimensions, materials, method or referenced standard that must be matched. Checking then means comparing what arrives with the description. Guides use these three terms differently, so write down the definitions your purchasing policy uses and state them in each request. A practical test is to ask who carries the design risk. If the buyer fixes the design and the design fails, the buyer carries that risk. If the buyer fixes the result, the supplier carries more of the risk and has more room to propose an efficient design. This lesson does not rely on an official definition of the three terms, which has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: An output specification describes the result the buyer needs and leaves the method to the supplier. It usually names key performance indicators, such as the share of work passing inspection or the time taken to finish a task, and it states the standard each result must meet. A performance specification describes how the item must behave under stated conditions, for example the load it must carry, the noise it may make or the energy it may use, and the test that will prove it. A conformance specification describes the item in detail: the design, dimensions, materials, method or referenced standard that must be matched. Checking then means comparing what arrives with the description. Guides use these three terms differently, so write down the definitions your purchasing policy uses and state them in each request. A practical test is to ask who carries the design risk. If the buyer fixes the design and the design fails, the buyer carries that risk. If the buyer fixes the result, the supplier carries more of the risk and has more room to propose an efficient design.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Whether a buyer's specification carries work health and safety duties for the people who will use the item has not yet been confirmed, so check with the relevant regulator before relying on this point. Check with the work health and safety regulator for the state or territory where the work is done.
  - New: Check with the work health and safety regulator for the state or territory where the work is done.

### `curriculum/shared/business/PROC-02.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson covers general cost and budget concepts and does not give tax advice. How purchases are treated for GST, depreciation or deductions has not yet been confirmed, so check with the relevant regulator before relying on this point. See the chart of accounts lesson “Chart of accounts for a service business”, and confirm the treatment with a registered tax agent.
  - New: This lesson covers general cost and budget concepts and does not give tax advice. See the chart of accounts lesson “Chart of accounts for a service business”, and confirm the treatment with a registered tax agent.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Wage and superannuation costs in a budget depend on current rules that this lesson does not check. Those rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Wage and superannuation costs in a budget depend on current rules that this lesson does not check.

### `curriculum/shared/business/PROC-03.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Competition-law and confidentiality obligations that apply when a private buyer uses supplier information have not yet been confirmed, so check with the relevant regulator before relying on this point. Take advice before sharing pricing between suppliers.
  - New: Take advice before sharing pricing between suppliers.

### `curriculum/shared/business/PROC-04.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: The finance.gov.au landing page for the rules shows a version dated 14 December 2020, which conflicts with the 2025 instrument that commences on 17 November 2025. This lesson uses the 2025 instrument. Whether a later version has been made has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The finance.gov.au landing page for the rules shows a version dated 14 December 2020, which conflicts with the 2025 instrument that commences on 17 November 2025. This lesson uses the 2025 instrument.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The tax treatment of equipment purchases, depreciation and GST in a cost-benefit analysis has not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm it with a registered tax agent before relying on any after-tax figure.
  - New: Confirm it with a registered tax agent before relying on any after-tax figure.

### `curriculum/shared/business/SHR-FIN-01.json`

- `workedExamples/0/reasoning` (text changed)
  - Old: On Monday, debit cash at bank and credit client deposits received in advance. This is a liability, because the work has not yet been done. On Thursday, when the job is completed, move the deposit out of the liability and into the service income account for the job amount. The balance is then recorded as trade debtors or as cash, depending on how the client pays. Whether GST applies at the point of the deposit has not yet been confirmed, so check the ATO rule on prepayments before you set up the account.
  - New: On Monday, debit cash at bank and credit client deposits received in advance. This is a liability, because the work has not yet been done. On Thursday, when the job is completed, move the deposit out of the liability and into the service income account for the job amount. The balance is then recorded as trade debtors or as cash, depending on how the client pays.

### `curriculum/shared/business/SHR-FIN-02.json`

- `instruction/0/body` (text changed)
  - Old: The ATO's record-keeping guidance says that most records are generally kept for 5 years. The period runs from the later of when the record was made or obtained, and when the transaction or related act was completed. Where a review period runs longer, the records must be kept until that period ends. For a service business, the records to keep include records of all cash and electronic transactions, including reconciled card and EFTPOS sales; records that support business expenses claimed as deductions; records of the business portion of an expense that also has private use, such as a vehicle or a phone; a separate GST ledger account where GST credits are claimed; and PAYG payment summaries for amounts withheld from payments. This is a teaching summary, not the full list, so check the ATO page for the complete list before you set the schedule. Payments to contractors also need careful records, but whether a particular contractor payment must be reported to the ATO depends on the business and has not yet been confirmed. Superannuation paid for staff is recorded against the payroll, and the general super guarantee rate for the period is 12.00 per cent from 1 July 2025.
  - New: The ATO's record-keeping guidance says that most records are generally kept for 5 years. The period runs from the later of when the record was made or obtained, and when the transaction or related act was completed. Where a review period runs longer, the records must be kept until that period ends. For a service business, the records to keep include records of all cash and electronic transactions, including reconciled card and EFTPOS sales; records that support business expenses claimed as deductions; records of the business portion of an expense that also has private use, such as a vehicle or a phone; a separate GST ledger account where GST credits are claimed; and PAYG payment summaries for amounts withheld from payments. This is a teaching summary, not the full list, so check the ATO page for the complete list before you set the schedule. Superannuation paid for staff is recorded against the payroll, and the general super guarantee rate for the period is 12.00 per cent from 1 July 2025.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Client records include personal information and photographs of a client's property. Whether the Privacy Act and any state or territory privacy law applies to this business has not yet been confirmed, so check with the relevant regulator before relying on this point. Keep client records secure, use them only for the job, and limit who can open them.
  - New: Client records include personal information and photographs of a client's property. Keep client records secure, use them only for the job, and limit who can open them.

### `curriculum/shared/business/SHR-FIN-03.json`

- `workedExamples/0/reasoning` (text changed)
  - Old: Record the $6,000 as an equipment asset in the register, not as an expense in the month of purchase. Using the straight-line method with no residual value, the example book charge is $1,200 a year ($6,000 divided by five), which is $100 a month. After one year the carrying amount is $4,800, the cost less the $1,200 accumulated depreciation. Whether the instant asset write-off lets the business deduct the full $6,000 in the year first used depends on the threshold and eligibility rules for that income year, which have not yet been confirmed here, so check with the relevant regulator before relying on this point. The tax agent should confirm that point, because the book entry and the tax claim may differ.
  - New: Record the $6,000 as an equipment asset in the register, not as an expense in the month of purchase. Using the straight-line method with no residual value, the example book charge is $1,200 a year ($6,000 divided by five), which is $100 a month. After one year the carrying amount is $4,800, the cost less the $1,200 accumulated depreciation. The tax agent should confirm that point, because the book entry and the tax claim may differ.

### `curriculum/shared/business/SHR-FIN-05.json`

- `workedExamples/0/reasoning` (text changed)
  - Old: Three of the twelve months have passed (October, November and December), so a quarter of the premium is used: $1,200 multiplied by 3/12 gives $300. Debit insurance expense for $300, so the period carries its share of the cost, and credit prepaid insurance for $300, which reduces the asset. The remaining $900 stays in prepaid insurance for the next nine months. If this adjustment is missed, expenses are understated and assets are overstated. This is a general accounting example; whether any tax deduction follows the same timing has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Three of the twelve months have passed (October, November and December), so a quarter of the premium is used: $1,200 multiplied by 3/12 gives $300. Debit insurance expense for $300, so the period carries its share of the cost, and credit prepaid insurance for $300, which reduces the asset. The remaining $900 stays in prepaid insurance for the next nine months. If this adjustment is missed, expenses are understated and assets are overstated.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson is general accounting teaching and is not tax advice. The tax treatment of depreciation, bad debts and prepayments has not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm it with a registered tax agent before the figures are used for a tax return.
  - New: This lesson is general accounting teaching and is not tax advice. Confirm it with a registered tax agent before the figures are used for a tax return.

### `curriculum/shared/caregiving/CGC-02.json`

- `instruction/2/body` (text changed)
  - Old: The five moments set out the points at which hands need cleaning: before touching a person; before a clean or aseptic task; after a risk of body fluid exposure and after removing gloves; after touching a person; and after touching the person's surroundings when you leave. The source credits this model to WHO. The attribution and wording have not been checked against WHO text, so they have not yet been confirmed in this lesson.
  - New: The five moments set out the points at which hands need cleaning: before touching a person; before a clean or aseptic task; after a risk of body fluid exposure and after removing gloves; after touching a person; and after touching the person's surroundings when you leave. The source credits this model to WHO.

### `curriculum/shared/caregiving/CGC-03.json`

- `instruction/2/body` (text changed)
  - Old: When food is prepared in a care setting, clean your hands at the start and finish of food preparation, keep your fingers off your hair and face, and keep hot items hot and chilled items cold. Store cooked and uncooked food apart, use separate utensils and boards, and wash utensils and surfaces after use. These are general points; food-safety rules for a specific setting have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: When food is prepared in a care setting, clean your hands at the start and finish of food preparation, keep your fingers off your hair and face, and keep hot items hot and chilled items cold. Store cooked and uncooked food apart, use separate utensils and boards, and wash utensils and surfaces after use.

### `curriculum/shared/caregiving/CGC-04.json`

- `instruction/1/body` (text changed)
  - Old: Blot the fluid using disposable paper towel or the product the procedure names. Where the procedure calls for a chlorine-releasing granular product, cover the spill and leave it for the contact time on the label. Collect the waste, bag it, clean the surface using hot, soapy water, dry it, and then dispose of towels and gloves. The source gives a bleach dilution and contact time, and this lesson does not reproduce them. The dilution and contact time must come from the approved product's label and the organisation's procedure. That check has not yet been confirmed against Australian guidance. Never mix cleaning products.
  - New: Blot the fluid using disposable paper towel or the product the procedure names. Where the procedure calls for a chlorine-releasing granular product, cover the spill and leave it for the contact time on the label. Collect the waste, bag it, clean the surface using hot, soapy water, dry it, and then dispose of towels and gloves. The source gives a bleach dilution and contact time, and this lesson does not reproduce them. The dilution and contact time must come from the approved product's label and the organisation's procedure. Never mix cleaning products.
- `instruction/2/body` (text changed)
  - Old: Never recap, bend or break a used needle. Handle the sharp by its barrel and place it straight into a puncture-resistant sharps container. Do not overfill the container. The source refers to container standards and a yellow labelling scheme. The current standard, container colour and labelling rules have not yet been confirmed in this lesson, so use the container your organisation supplies and check with the relevant regulator before relying on this point.
  - New: Never recap, bend or break a used needle. Handle the sharp by its barrel and place it straight into a puncture-resistant sharps container. Do not overfill the container. The source refers to container standards and a yellow labelling scheme.
- `instruction/3/body` (text changed)
  - Old: If blood or body fluid reaches your skin, rinse the skin under running water, wash it with lukewarm water and a mild soap, and tell the responsible person about it. Record it in the organisation's incident system and seek medical advice. The source names a specific incident form. Your organisation's form name and reporting timeline have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: If blood or body fluid reaches your skin, rinse the skin under running water, wash it with lukewarm water and a mild soap, and tell the responsible person about it. Record it in the organisation's incident system and seek medical advice. The source names a specific incident form.

### `curriculum/shared/chemicals/F13-L02.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Environmental and waste rules for products, including trade waste and water discharge limits, depend on the local council and water authority and have not yet been confirmed in this lesson.
  - New: Environmental and waste rules for products, including trade waste and water discharge limits, depend on the local council and water authority.

### `curriculum/shared/chemicals/F13-L05.json`

- `instruction/1/body` (text changed)
  - Old: Wash water from cleaning can carry product residue, oils, soil and detergent. Whether that water may go to a drain, a sewer, a stormwater drain or a garden depends on the rules of the council, the water authority and the state or territory. In many places, discharge to a stormwater drain is not allowed, and discharge to a sewer may need approval. These rules have not yet been confirmed in this lesson and must be checked for each location. Where there is no approved route, collect the water and refer it to the supervisor.
  - New: Wash water from cleaning can carry product residue, oils, soil and detergent. Whether that water may go to a drain, a sewer, a stormwater drain or a garden depends on the rules of the council, the water authority and the state or territory. In many places, discharge to a stormwater drain is not allowed, and discharge to a sewer may need approval. Where there is no approved route, collect the water and refer it to the supervisor.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Wastewater and trade waste discharge rules are set by councils, water authorities and state or territory laws. The specific rules for each location have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Wastewater and trade waste discharge rules are set by councils, water authorities and state or territory laws.

### `curriculum/shared/chemicals/custom-eco-cleaning-products-L03.json`

- `instruction/2/body` (text changed)
  - Old: A claim is what the packaging or sales material says. A verified criterion is a result that a recognised third party has tested against a stated standard, or a fact stated in the SDS and composition. When a product says it is certified or eco-friendly, ask what the claim refers to, which standard or test it rests on, who verified it, and whether that verification covers this formulation and this version. A manufacturer's self-declaration is useful information but is not the same as independent verification. A claim with no stated basis does not count as evidence and should not be repeated to a client. Whether a particular environmental or health claim has a legal meaning in your state or territory has not yet been confirmed in this lesson, so do not repeat such a claim as a legal assurance and check with the relevant regulator before relying on this point.
  - New: A claim is what the packaging or sales material says. A verified criterion is a result that a recognised third party has tested against a stated standard, or a fact stated in the SDS and composition. When a product says it is certified or eco-friendly, ask what the claim refers to, which standard or test it rests on, who verified it, and whether that verification covers this formulation and this version. A manufacturer's self-declaration is useful information but is not the same as independent verification. A claim with no stated basis does not count as evidence and should not be repeated to a client.
- `instruction/6/body` (text changed)
  - Old: This lesson does not authorise the use of any product for a regulated task. Labelling, approval and workplace-use rules depend on the state or territory and on the product, and they have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check the label, the SDS and the employer's approved products list before any use.
  - New: This lesson does not authorise the use of any product for a regulated task. Check the label, the SDS and the employer's approved products list before any use.
- `summary/6` (deleted item)
  - Old: This lesson does not authorise the use of any product for a regulated task, and the rules have not yet been confirmed where marked, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/chemicals/custom-eco-cleaning-products-L10.json`

- `instruction/6/body` (text changed)
  - Old: This lesson does not authorise the purchase, transport, storage or use of any regulated product. Requirements for storage separation, labelling, transport and disposal depend on the product, the quantities and the state or territory, and they have not yet been confirmed in this lesson beyond the general controls described here, so check with the relevant regulator before relying on this point. Check the label, the SDS and the employer's approved products list, and follow the local rules for disposing of residues.
  - New: This lesson does not authorise the purchase, transport, storage or use of any regulated product. Check the label, the SDS and the employer's approved products list, and follow the local rules for disposing of residues.
- `summary/5` (deleted item)
  - Old: This lesson does not authorise any regulated purchase, storage or disposal, and local rules have not yet been confirmed where marked, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/cleaning-guide/CL2-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Hazard controls in a written procedure are minimum controls. Where a state or territory WHS requirement or the site's procedure is stricter, follow the stricter requirement. The state-specific duties have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Hazard controls in a written procedure are minimum controls. Where a state or territory WHS requirement or the site's procedure is stricter, follow the stricter requirement.

### `curriculum/shared/cleaning-guide/CL2-02.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Certain height work, including work from powered platforms, can require a licence or authorisation in particular states and territories. This lesson grants no licence, and the state rule has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Certain height work, including work from powered platforms, can require a licence or authorisation in particular states and territories.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The reference document mentions ladder standards in general terms only, with no standard number given. The number has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The reference document mentions ladder standards in general terms only, with no standard number given.

### `curriculum/shared/cleaning-guide/CL2-03.json`

- `instruction/1/body` (text changed)
  - Old: Use only ladders that meet the Australian Standard the site specifies. The reference document refers to ladder standards in general terms without a number, so the standard number has not yet been confirmed here and check with the relevant regulator before relying on this point. Before each use, check the rungs or treads for looseness, and check screws, rivets, bolts, feet and locks for damage or looseness. Store ladders covered and supported so they do not sag. Remove a damaged ladder from service, tag it, and report it.
  - New: Use only ladders that meet the Australian Standard the site specifies. Before each use, check the rungs or treads for looseness, and check screws, rivets, bolts, feet and locks for damage or looseness. Store ladders covered and supported so they do not sag. Remove a damaged ladder from service, tag it, and report it.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Working at height may need a licence or authorisation in some states and territories, especially for powered platforms. This lesson does not grant any licence. The state requirement has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Working at height may need a licence or authorisation in some states and territories, especially for powered platforms. This lesson does not grant any licence.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The reference document refers to ladder standards without giving a number. The number has not yet been confirmed and must be checked before a site relies on it.
  - New: The reference document refers to ladder standards without giving a number.

### `curriculum/shared/cleaning-guide/CL2-04.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Solution dilution, dwell time and PPE are set by the product label and safety data sheet. Product-specific values have not yet been confirmed in this lesson and must be taken from the label.
  - New: Solution dilution, dwell time and PPE are set by the product label and safety data sheet.

### `curriculum/shared/cleaning-guide/CL2-05.json`

- `instruction/0/body` (text changed)
  - Old: Only a trained and authorised person may operate a ride-on sweeper. Before the first use, the operator reads the manufacturer's manual, knows where every control and attachment is and what it does, and works under supervision until the supervisor is satisfied. Passengers are never carried on the machine. This lesson does not give anyone authority to operate plant. Whether a state or territory licence or authorisation applies to this machine has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Only a trained and authorised person may operate a ride-on sweeper. Before the first use, the operator reads the manufacturer's manual, knows where every control and attachment is and what it does, and works under supervision until the supervisor is satisfied. Passengers are never carried on the machine. This lesson does not give anyone authority to operate plant.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This lesson does not grant authority to operate plant. Whether a state or territory licence or authorisation applies to this machine has not yet been confirmed here, so check with the relevant regulator before relying on this point. Check the local requirement and the manufacturer's manual before any operator is assigned.
  - New: This lesson does not grant authority to operate plant. Check the local requirement and the manufacturer's manual before any operator is assigned.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Exhaust fumes can make people dizzy or queasy. The ventilation the site needs for running the machine has not yet been confirmed here and must be set locally.
  - New: Exhaust fumes can make people dizzy or queasy.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Noise, vibration and sun exposure are hazards in the reference document. Hearing-protection and exposure requirements under Australian WHS rules have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Noise, vibration and sun exposure are hazards in the reference document.

### `curriculum/shared/cleaning-guide/CL2-06.json`

- `instruction/3/body` (text changed)
  - Old: Blowing by itself leaves debris heaped against walls, door sills and fire doors. Sweep each heap into a dustpan with a banister brush; then place what you have collected in the general waste container. Do not blow debris into drains, gutters or neighbouring spaces. The rules for drains and wastewater have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Blowing by itself leaves debris heaped against walls, door sills and fire doors. Sweep each heap into a dustpan with a banister brush; then place what you have collected in the general waste container. Do not blow debris into drains, gutters or neighbouring spaces.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Fire exits and stairwells must stay clear of debris and equipment. The fire-safety rules that apply to a particular site have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Fire exits and stairwells must stay clear of debris and equipment.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Blower use can expose the operator to noise, vibration and exhaust emissions. The hearing and respiratory requirements under Australian WHS rules have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Blower use can expose the operator to noise, vibration and exhaust emissions.

### `curriculum/shared/cleaning/C14-L01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: In Victoria, electrical installation work is carried out under an electrical licence from Energy Safe Victoria. A cleaner must not open, disconnect, repair or alter fixed electrical equipment or wiring. This lesson grants no electrical licence. Licence classes in other states have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: In Victoria, electrical installation work is carried out under an electrical licence from Energy Safe Victoria. A cleaner must not open, disconnect, repair or alter fixed electrical equipment or wiring. This lesson grants no electrical licence.

### `curriculum/shared/cleaning/C14-L04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: In Victoria, electrical installation work is carried out under an electrical licence from Energy Safe Victoria. A cleaner must not open, disconnect, repair or alter fixed electrical equipment or wiring. This lesson grants no electrical licence. Licence classes in other states have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: In Victoria, electrical installation work is carried out under an electrical licence from Energy Safe Victoria. A cleaner must not open, disconnect, repair or alter fixed electrical equipment or wiring. This lesson grants no electrical licence.

### `curriculum/shared/cleaning/C14-L05.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: In Victoria, electrical installation work is carried out under an electrical licence from Energy Safe Victoria. A cleaner must not open, disconnect, repair or alter fixed electrical equipment or wiring. This lesson grants no electrical licence. Licence classes in other states have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: In Victoria, electrical installation work is carried out under an electrical licence from Energy Safe Victoria. A cleaner must not open, disconnect, repair or alter fixed electrical equipment or wiring. This lesson grants no electrical licence.

### `curriculum/shared/cleaning/F07-L05.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Gasfitting work in Victoria is licensed work. It covers the construction, installation, replacement, repair, alteration, maintenance, testing or commissioning of any pipe, appliance, flue, fitting, apparatus, control or other item involved with the supply or use of gas and fitted downstream of the gas supply point. Cleaning, painting or preparation work on gas pipes or joints is excluded when it does not involve connecting, disconnecting or altering them. An electrician's licence from Energy Safe Victoria allows the holder to do electrical installation work in Victoria, and contracting for that work for profit or reward also needs Registered Electrical Contractor registration. This lesson grants no gas or electrical licence and does not authorise disconnecting or dismantling such equipment. Other states have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Gasfitting work in Victoria is licensed work. It covers the construction, installation, replacement, repair, alteration, maintenance, testing or commissioning of any pipe, appliance, flue, fitting, apparatus, control or other item involved with the supply or use of gas and fitted downstream of the gas supply point. Cleaning, painting or preparation work on gas pipes or joints is excluded when it does not involve connecting, disconnecting or altering them. An electrician's licence from Energy Safe Victoria allows the holder to do electrical installation work in Victoria, and contracting for that work for profit or reward also needs Registered Electrical Contractor registration. This lesson grants no gas or electrical licence and does not authorise disconnecting or dismantling such equipment.

### `curriculum/shared/cleaning/SOP-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Under the national model WHS approach, a business keeps a hazardous chemicals register with a current SDS for each listed chemical, readily accessible to workers. Confirm how your state or territory has adopted this position; the adoption detail has not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Under the national model WHS approach, a business keeps a hazardous chemicals register with a current SDS for each listed chemical, readily accessible to workers. Confirm how your state or territory has adopted this position.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Applying pesticides or other regulated substances may require a licence or authority in your state or territory. That has not yet been confirmed for each product in this lesson, so check with the relevant regulator before relying on this point. This lesson does not grant any licence or authority to apply, store or transport regulated substances.
  - New: Applying pesticides or other regulated substances may require a licence or authority in your state or territory. This lesson does not grant any licence or authority to apply, store or transport regulated substances.

### `curriculum/shared/cleaning/SOP-02.json`

- `instruction/1/body` (text changed)
  - Old: Each machine should carry a label showing when it was last tested and when the next test is due. The source calls this a PAT test. The Australian equivalent is an electrical test and tag regime for portable equipment, and the applicable standard and test interval have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Read the date on the label first. Then run your hand along the flex from the plug to the machine, looking for cuts, flattened sections, bare wires, or electrical tape standing in for a repair. Check the plug and pins for scorch marks, bent pins or cracks. Look at the casing for cracks, and check the bag or filter, because a blocked filter can make the machine overheat. The source requires a register listing all machines, so record the check.
  - New: Each machine should carry a label showing when it was last tested and when the next test is due. The source calls this a PAT test. Read the date on the label first. Then run your hand along the flex from the plug to the machine, looking for cuts, flattened sections, bare wires, or electrical tape standing in for a repair. Check the plug and pins for scorch marks, bent pins or cracks. Look at the casing for cracks, and check the bag or filter, because a blocked filter can make the machine overheat. The source requires a register listing all machines, so record the check.
- `instruction/2/body` (text changed)
  - Old: Before you plug in, make sure the socket switch is off. Plug in, then switch on. When you have finished, switch the socket off before you unplug the machine from the wall. Keep the flex behind you while you work, so you are never walking over it or dragging it through a wet area. Where a flex must cross a walkway, make the crossing safe with a cable cover or a clear route, and let the supervisor know. Check that the building has a protective device, such as a circuit breaker or safety switch, that cuts supply if a fault occurs; the device type required for your site has not yet been confirmed for your jurisdiction. The source states that circuit breakers are expected to be fitted.
  - New: Before you plug in, make sure the socket switch is off. Plug in, then switch on. When you have finished, switch the socket off before you unplug the machine from the wall. Keep the flex behind you while you work, so you are never walking over it or dragging it through a wet area. Where a flex must cross a walkway, make the crossing safe with a cable cover or a clear route, and let the supervisor know. Check that the building has a protective device, such as a circuit breaker or safety switch, that cuts supply if a fault occurs. The source states that circuit breakers are expected to be fitted.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: The source refers to PAT testing. The Australian requirement for testing and tagging portable electrical equipment has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check the applicable standard, the test interval and who may perform the test before you rely on any of these details.
  - New: The source refers to PAT testing. Check the applicable standard, the test interval and who may perform the test before you rely on any of these details.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Repairs to fixed wiring, power points, switchboards or building circuits are licensed electrical work. The licence class and state or territory rules have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point. Only a person holding the required licence may do that work. This lesson does not grant or describe any electrical licence, and cleaners must not repair or reconnect building wiring.
  - New: Repairs to fixed wiring, power points, switchboards or building circuits are licensed electrical work. Only a person holding the required licence may do that work. This lesson does not grant or describe any electrical licence, and cleaners must not repair or reconnect building wiring.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Lifting machines is a manual handling task. Use the team lifting method and any lifting aid the business provides. The exact model WHS manual handling wording has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Lifting machines is a manual handling task. Use the team lifting method and any lifting aid the business provides.

### `curriculum/shared/cleaning/SOP-03.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: The national model position requires a register of hazardous chemicals stored at the workplace, kept up to date and readily accessible, with a current SDS for each listed chemical. Segregation rules and quantity thresholds have not yet been confirmed for each state and territory, so check with the relevant regulator before relying on this point.
  - New: The national model position requires a register of hazardous chemicals stored at the workplace, kept up to date and readily accessible, with a current SDS for each listed chemical.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Fire exit and egress requirements come from building and fire rules that differ between states and territories. The exact requirements have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point. The working rule here is simple: an exit is never blocked.
  - New: Fire exit and egress requirements come from building and fire rules that differ between states and territories. The working rule here is simple: an exit is never blocked.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Lift heavy containers from the floor or below chest height where you can, using the business's manual handling procedure. The exact model WHS wording has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Lift heavy containers from the floor or below chest height where you can, using the business's manual handling procedure.

### `curriculum/shared/cleaning/SOP-04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: The source requires gloves when lifting large rubbish and chewing gum, because these may carry bacteria, and when checking the vacuum bag and filter. Your business's PPE rules govern the glove type; the specific requirement under state WHS law has not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: The source requires gloves when lifting large rubbish and chewing gum, because these may carry bacteria, and when checking the vacuum bag and filter.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Trip and slip hazards: sign-post wet areas and make trailing cables and open sockets safe before sweeping. The state WHS duty for the signage and the level of control has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Trip and slip hazards: sign-post wet areas and make trailing cables and open sockets safe before sweeping.

### `curriculum/shared/cleaning/SOP-05.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: A wet floor is a slip hazard until it is dry. Signposting and the level of control required under state WHS law have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: A wet floor is a slip hazard until it is dry.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Manual handling: keep sections manageable and avoid over-stretching. The exact model WHS wording has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Manual handling: keep sections manageable and avoid over-stretching.

### `curriculum/shared/cleaning/SOP-06.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Electrical equipment is tested and tagged as set out in “Safe use and care of electrical machines”. The Australian standard reference for that testing has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment is tested and tagged as set out in “Safe use and care of electrical machines”.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Only trained people use electrical equipment. The training record that must be kept under state WHS law has not yet been confirmed for this lesson.
  - New: Only trained people use electrical equipment.

### `curriculum/shared/cleaning/SOP-07.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Electrical test and tag requirements are set out in “Safe use and care of electrical machines”. The Australian standard reference for that testing has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Electrical test and tag requirements are set out in “Safe use and care of electrical machines”.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Dust exposure controls, and any monitoring they require under the exposure limits for your state or territory, have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point. Check the SDS for any product used with the vacuum.
  - New: Check the SDS for any product used with the vacuum.

### `curriculum/shared/cleaning/SOP-08.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Work at height: a wall above safe reach needs suitable access equipment and must follow the state or territory WHS rules for work at height, which have not yet been confirmed for this lesson. This lesson does not authorise height work.
  - New: This lesson does not authorise height work.

### `curriculum/shared/cleaning/SOP-09.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Telephones and other shared items: use a disinfectant approved for the surface and follow its label for contact time. The contact-time rules and the standard for hygiene on shared items have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Telephones and other shared items: use a disinfectant approved for the surface and follow its label for contact time.

### `curriculum/shared/cleaning/SOP-10.json`

- `instruction/0/body` (text changed)
  - Old: Washrooms carry some of the highest concentrations of germs in most buildings, and cleaners work close to them. The rule in the source is that equipment and materials used here are never used outside the washroom. That rule stops germs moving into kitchens and office surfaces. The task also happens in a space that customers may be using, so the cleaner must be courteous, careful and visible. The source names a hygiene areas standard from the British Institute of Cleaning Sciences framework. The clause-level requirement has not yet been confirmed in this lesson, and it is named here for reference only, so check with the relevant regulator before relying on this point.
  - New: Washrooms carry some of the highest concentrations of germs in most buildings, and cleaners work close to them. The rule in the source is that equipment and materials used here are never used outside the washroom. That rule stops germs moving into kitchens and office surfaces. The task also happens in a space that customers may be using, so the cleaner must be courteous, careful and visible. The source names a hygiene areas standard from the British Institute of Cleaning Sciences framework.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Infection control: wear gloves throughout, cover open cuts, and wash your hands at the end. The source links this to the risk of infectious disease. The Australian infection-control guideline that applies to cleaning washrooms has not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Infection control: wear gloves throughout, cover open cuts, and wash your hands at the end. The source links this to the risk of infectious disease.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Hygiene standard: the source names a hygiene areas standard from the British Institute of Cleaning Sciences framework. The name is referenced only. The clause and its requirements have not yet been confirmed and are not reproduced here, so check with the relevant regulator before relying on this point.
  - New: Hygiene standard: the source names a hygiene areas standard from the British Institute of Cleaning Sciences framework. The name is referenced only.

### `curriculum/shared/cleaning/SOP-11.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Electrical equipment is tested and tagged as set out in “Safe use and care of electrical machines”. The Australian standard reference for that testing has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment is tested and tagged as set out in “Safe use and care of electrical machines”.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Overspray and fumes: keep customers and property away from the work area and ventilate. Exposure limits from the Workplace Exposure Limits list, once adopted in your state or territory, apply to products used; the applicable limit has not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Overspray and fumes: keep customers and property away from the work area and ventilate.

### `curriculum/shared/cleaning/SOP-12.json`

- `instruction/5/body` (text changed)
  - Old: Working at height, including on ladders, platforms and rope-access systems, may require a specific training qualification or a licence in the state or territory where the work is done. The required training or licence, and the rules that apply to each state and territory, have not yet been confirmed in this lesson and must be checked before any height work is considered. This lesson does not grant a licence, a certificate or any authority to do height work. A worker who has completed this lesson must not carry out height work unless the required training or licence is held and the work is authorised.
  - New: Working at height, including on ladders, platforms and rope-access systems, may require a specific training qualification or a licence in the state or territory where the work is done. This lesson does not grant a licence, a certificate or any authority to do height work. A worker who has completed this lesson must not carry out height work unless the required training or licence is held and the work is authorised.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Working at height, including ladders, platforms and rope-access systems, may require specific training or a licence in the state or territory where the work is done. The required training or licence, and the rules for each state and territory, have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. This lesson does not grant any licence, certificate or authority for height work.
  - New: Working at height, including ladders, platforms and rope-access systems, may require specific training or a licence in the state or territory where the work is done. This lesson does not grant any licence, certificate or authority for height work.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Chemical use follows the label and the safety data sheet for the product. Dilution, contact time and protective equipment are set by the manufacturer. Do not mix products. The safety data sheet obligations that apply to your business in each state and territory have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Chemical use follows the label and the safety data sheet for the product. Dilution, contact time and protective equipment are set by the manufacturer. Do not mix products.

### `curriculum/shared/cleaning/SOP-13.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Chemical use follows the manufacturer's label and the safety data sheet for each product. Do not mix products, and do not use a product that is not on the approved list for the surface. The safety data sheet obligations for each state and territory have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Chemical use follows the manufacturer's label and the safety data sheet for each product. Do not mix products, and do not use a product that is not on the approved list for the surface.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Stain removal on building fabric, such as graffiti or staining on a structure, is not covered by this lesson. Any licence or authority that applies to that work in your state or territory has not yet been confirmed here, and this lesson does not grant it.
  - New: Stain removal on building fabric, such as graffiti or staining on a structure, is not covered by this lesson.

### `curriculum/shared/cleaning/SOP-20.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Stripper, polish and neutraliser are hazardous chemicals. Follow the label and safety data sheet for dilution, contact time, PPE and ventilation. Chemical handling duties under state and territory work health and safety laws have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Stripper, polish and neutraliser are hazardous chemicals. Follow the label and safety data sheet for dilution, contact time, PPE and ventilation.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Electrical equipment must be tested and tagged, or inspected, under the local rule. The source names PAT testing. The applicable Australian standard and test interval have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment must be tested and tagged, or inspected, under the local rule. The source names PAT testing.

### `curriculum/shared/cleaning/SOP-21.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Electrical equipment must be tested and tagged, or inspected, under the local rule, with the register kept up to date. The source names PAT testing. The applicable Australian standard and test interval have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment must be tested and tagged, or inspected, under the local rule, with the register kept up to date. The source names PAT testing.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Chemicals must be used as their label directs and the safety data sheet is available on site. Chemical handling duties under state and territory work health and safety laws have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Chemicals must be used as their label directs and the safety data sheet is available on site.

### `curriculum/shared/cleaning/SOP-22.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Work near vehicles must be barriered and marked, and high-visibility clothing worn. Traffic management duties under state and territory work health and safety rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Work near vehicles must be barriered and marked, and high-visibility clothing worn.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Chemicals used for disinfection must be used as their label directs, with the safety data sheet available on site. Chemical handling duties under state and territory law have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Chemicals used for disinfection must be used as their label directs, with the safety data sheet available on site.

### `curriculum/shared/cleaning/SOP-23.json`

- `instruction/5/body` (text changed)
  - Old: Put all soiled materials and used PPE into the clinical waste bag and seal the bag. The source procedure states that contaminated items are sent for incineration. The site's clinical waste route and any state or territory rules have not yet been confirmed and must be confirmed with the site before this lesson is used. Litter pickers, scoops and other reusable tools must be disinfected before they are used again. Wash your hands thoroughly after removing gloves, and put a fresh waterproof dressing on any plaster or wound that has been exposed. Keep colour coding for cloths and buckets so clean and contaminated items never mix.
  - New: Put all soiled materials and used PPE into the clinical waste bag and seal the bag. The source procedure states that contaminated items are sent for incineration. Litter pickers, scoops and other reusable tools must be disinfected before they are used again. Wash your hands thoroughly after removing gloves, and put a fresh waterproof dressing on any plaster or wound that has been exposed. Keep colour coding for cloths and buckets so clean and contaminated items never mix.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Clinical waste handling, including incineration, must follow the site's clinical waste route and the rules of the relevant state or territory. These rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Clinical waste handling, including incineration, must follow the site's clinical waste route and the rules of the relevant state or territory.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Disinfectants and cleaning chemicals must be used as the label directs, with the safety data sheet available on site. Chemical handling duties under state and territory work health and safety law have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Disinfectants and cleaning chemicals must be used as the label directs, with the safety data sheet available on site.

### `curriculum/shared/cleaning/SOP-24.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Electrical equipment must be tested and tagged, or inspected, under the local rule. The source names PAT testing; the applicable Australian standard and test interval have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment must be tested and tagged, or inspected, under the local rule.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Chemicals must be used as the label directs, with the safety data sheet available on site. Chemical handling duties under state and territory work health and safety laws have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Chemicals must be used as the label directs, with the safety data sheet available on site.

### `curriculum/shared/cleaning/SOP-25.json`

- `instruction/0/body` (text changed)
  - Old: This lesson covers cleaning the interior surfaces of a lift car, the landing door faces and tracks that can be reached safely, and the control panel surfaces. It does not cover opening the lift shaft, working in the lift pit or machine room, or adjusting or repairing any lift component. Those tasks are mechanical or electrical work that belongs to the lift service provider. Whether any part of that work needs a licence depends on the state or territory, and the requirement has not yet been confirmed, so check with the relevant regulator before relying on this point. Completing this lesson does not grant a licence or authority for that work.
  - New: This lesson covers cleaning the interior surfaces of a lift car, the landing door faces and tracks that can be reached safely, and the control panel surfaces. It does not cover opening the lift shaft, working in the lift pit or machine room, or adjusting or repairing any lift component. Those tasks are mechanical or electrical work that belongs to the lift service provider. Completing this lesson does not grant a licence or authority for that work.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Lift servicing, repair and work inside the shaft or machine room are outside this lesson. Any licence or authorisation for that work depends on the state or territory and has not yet been confirmed, so check with the relevant regulator before relying on this point. This lesson does not grant it.
  - New: Lift servicing, repair and work inside the shaft or machine room are outside this lesson. This lesson does not grant it.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Electrical equipment must be tested and tagged, or inspected, under the local rule. The source names PAT testing; the applicable Australian standard and test interval have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment must be tested and tagged, or inspected, under the local rule.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Chemicals must be used as their label directs, with the safety data sheet available on site. Chemical handling duties under state and territory work health and safety laws have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Chemicals must be used as their label directs, with the safety data sheet available on site.

### `curriculum/shared/cleaning/SOP-26.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Chemicals must be used as their label directs, with the safety data sheet available on site. Chemical handling duties under state and territory work health and safety laws have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Chemicals must be used as their label directs, with the safety data sheet available on site.

### `curriculum/shared/cleaning/SOP-27.json`

- `instruction/5/body` (text changed)
  - Old: Repeat the induction, or the part of it that has changed, after a change of task, a change of site, a new chemical or machine, a new hazard on the site, or any incident that shows the worker may not have understood something. A worker who was inducted for one task is not cleared for a different task until the part of the induction about that task has been covered and recorded. How often a routine refresher is run has not yet been confirmed in this lesson and is set by the business, so check with the relevant regulator before relying on this point.
  - New: Repeat the induction, or the part of it that has changed, after a change of task, a change of site, a new chemical or machine, a new hazard on the site, or any incident that shows the worker may not have understood something. A worker who was inducted for one task is not cleared for a different task until the part of the induction about that task has been covered and recorded.
- `instruction/6/body` (text changed)
  - Old: Work health and safety law in each state and territory sets the duties of a business to inform, instruct and train its workers. The specific duties, and whether any particular induction content or length is required for cleaning work, have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check them against the law of each jurisdiction before the induction is finalised.
  - New: Work health and safety law in each state and territory sets the duties of a business to inform, instruct and train its workers. Check them against the law of each jurisdiction before the induction is finalised.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The duty to inform, instruct and train workers, and any content or length an induction must meet in each state and territory, have not yet been confirmed in this lesson.
  - New: The duty to inform, instruct and train workers, and any content or length an induction must meet in each state and territory, must be checked against the rules that apply where the work is done.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Every injury, near miss and damage event is reported on the day under the business's own process. The reporting timeframes set by law have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Every injury, near miss and damage event is reported on the day under the business's own process.

### `curriculum/shared/cleaning/SOP-28.json`

- `instruction/3/body` (text changed)
  - Old: Sharps go into a rigid, labelled sharps container, and never into general waste or a loose sack. The container is set down where it cannot tip, and it is kept locked away between jobs. Body fluid waste and contaminated materials go into the clinical waste route the business uses. How that waste is stored, transported and treated is governed by rules that have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Sharps go into a rigid, labelled sharps container, and never into general waste or a loose sack. The container is set down where it cannot tip, and it is kept locked away between jobs. Body fluid waste and contaminated materials go into the clinical waste route the business uses.
- `instruction/5/body` (text changed)
  - Old: For each sharps or bodily fluid event, the supervisor records what happened, the clean-up that was done, who did it and what training they held, the disposal route, and any follow-up care that was arranged. The period for which these records are kept has not yet been confirmed in this lesson and is set by the business, so check with the relevant regulator before relying on this point.
  - New: For each sharps or bodily fluid event, the supervisor records what happened, the clean-up that was done, who did it and what training they held, the disposal route, and any follow-up care that was arranged.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Sharps and clinical waste must be contained and disposed of through the approved route. The rules for disposal, storage and transport in each state and territory have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Sharps and clinical waste must be contained and disposed of through the approved route.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The response after an exposure, including any testing, follow-up and notification duties, has not yet been confirmed in this lesson and must be set by the business under the rules of the relevant jurisdiction.
  - New: The response after an exposure, including any testing, follow-up and notification duties, must be set by the business under the rules of the relevant jurisdiction.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Any licence or authority needed to transport or dispose of regulated waste has not yet been confirmed in this lesson. This lesson does not grant one.
  - New: This lesson does not grant one.

### `curriculum/shared/cleaning/SOP-29.json`

- `instruction/0/body` (text changed)
  - Old: The uploaded source gives the title of a manual handling annex but not its text. The only manual handling statement in the source is a short line about keeping to manageable areas, and it is used here. The rest of this lesson is a general outline written by the team. Legal requirements, any load limit, and the business's own control measures have not yet been confirmed here and must be replaced from the annex text and checked against the law of each jurisdiction. This lesson grants no licence or certificate.
  - New: The uploaded source gives the title of a manual handling annex but not its text. The only manual handling statement in the source is a short line about keeping to manageable areas, and it is used here. The rest of this lesson is a general outline written by the team. This lesson grants no licence or certificate.
- `instruction/7/body` (text changed)
  - Old: The manual handling duties under work health and safety law, the code of practice that applies in each state and territory, and any load limit that applies have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. They must be checked before this policy is finalised.
  - New: They must be checked before this policy is finalised.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The manual handling duties in work health and safety law, the code of practice that applies, and any load limit in each state and territory have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Check the manual handling duties in work health and safety law, the code of practice that applies, and any load limit in each state and territory with the relevant regulator before relying on this point.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Reaching to a shelf or a surface that needs a ladder, platform or step is outside this lesson. Stop and report. The height rules that apply in each state and territory have not yet been confirmed here, and this lesson does not authorise any height work, so check with the relevant regulator before relying on this point.
  - New: Reaching to a shelf or a surface that needs a ladder, platform or step is outside this lesson. Stop and report.

### `curriculum/shared/cleaning/SOP-30.json`

- `instruction/0/body` (text changed)
  - Old: The uploaded source gives the title of a cleaning audit annex but not its text. This lesson is a general outline written by the team. The business's own audit form, its scoring method and its pass mark have not yet been confirmed here and must be taken from the annex once it is supplied. A completed audit is not a licence, a certificate or an authority for any regulated work.
  - New: The uploaded source gives the title of a cleaning audit annex but not its text. This lesson is a general outline written by the team. A completed audit is not a licence, a certificate or an authority for any regulated work.
- `instruction/4/body` (text changed)
  - Old: Record each defect separately, with its location, its type and a short description. Typical types include a smear, a missed area, a residue, damage, a safety issue and an equipment fault. Where the business uses a score, apply it the same way to every area. The scoring method, what each score means and the pass mark have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. A safety issue is never offset by a good score elsewhere. It is stopped and reported before anything else happens.
  - New: Record each defect separately, with its location, its type and a short description. Typical types include a smear, a missed area, a residue, damage, a safety issue and an equipment fault. Where the business uses a score, apply it the same way to every area. A safety issue is never offset by a good score elsewhere. It is stopped and reported before anything else happens.
- `instruction/7/body` (text changed)
  - Old: Sign an area off only when every defect has been resolved, or has been recorded with an agreed follow-up. The sign-off record names the area, the date, the auditor, the standard that was used, any open items and, where it applies, the customer representative. The period for which the record is kept has not yet been confirmed in this lesson and is set by the business, so check with the relevant regulator before relying on this point.
  - New: Sign an area off only when every defect has been resolved, or has been recorded with an agreed follow-up. The sign-off record names the area, the date, the auditor, the standard that was used, any open items and, where it applies, the customer representative.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Do not carry out electrical, height or other regulated work to correct a defect found in an audit. Report it instead. The licence and authority rules for that work have not yet been confirmed in this lesson, and this lesson does not grant any licence or authority.
  - New: Do not carry out electrical, height or other regulated work to correct a defect found in an audit. Report it instead.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The period for which audit records are kept, and any evidence rule that applies to audits, have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Check the period for which audit records are kept, and any evidence rule that applies to audits, with the relevant regulator before relying on this point.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Photographs of premises must not capture people or customer property beyond what the record needs. The rules on personal information and photographs in each state and territory have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Photographs of premises must not capture people or customer property beyond what the record needs.

### `curriculum/shared/cleaning/TJS-08.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Specific fire-safety duties and waste-handling rules vary by state or territory and have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Specific fire-safety duties and waste-handling rules vary by state or territory, so check with the relevant regulator before relying on this point.

### `curriculum/shared/cleaning/TJS-10.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Manual handling is a common source of injury. The methods here are general practice. Duties under the model WHS laws and state or territory rules have not yet been confirmed and must be checked.
  - New: Manual handling is a common source of injury. The methods here are general practice.

### `curriculum/shared/cleaning/TJS-18.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Dust can be a health hazard. Choose a mask suited to the type of dust and check the site's controls. Specific exposure limits and mask standards have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Dust can be a health hazard. Choose a mask suited to the type of dust and check the site's controls.

### `curriculum/shared/cleaning/construction-site-cleaning-L03.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Asbestos removal needs an asbestos removal licence. Victoria has Class A and Class B licences, and a small unlicensed allowance for non-friable asbestos only (an area of not more than 10 square metres in total, and a total time of not more than 1 hour in any period of 7 days which is cumulative across all employees). Friable asbestos has no such allowance. Removal above either limit needs a licence, and this lesson does not grant one. Queensland licences Class A and Class B, with no licence needed for 10 square metres or less of non-friable asbestos. New South Wales requires a Class B licence for more than 10 square metres of non-friable asbestos; the Class A and assessor licence positions have not yet been confirmed. This lesson does not grant any asbestos licence, and a cleaner must not remove, sweep up or clean up suspected asbestos.
  - New: Asbestos removal needs an asbestos removal licence. Victoria has Class A and Class B licences, and a small unlicensed allowance for non-friable asbestos only (an area of not more than 10 square metres in total, and a total time of not more than 1 hour in any period of 7 days which is cumulative across all employees). Friable asbestos has no such allowance. Removal above either limit needs a licence, and this lesson does not grant one. Queensland licences Class A and Class B, with no licence needed for 10 square metres or less of non-friable asbestos. This lesson does not grant any asbestos licence, and a cleaner must not remove, sweep up or clean up suspected asbestos.

### `curriculum/shared/cleaning/construction-site-cleaning-L05.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Electrical equipment used near water must be safe for that use and inspected. The electrical licence rules for work on equipment are not covered here and have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Electrical equipment used near water must be safe for that use and inspected.

### `curriculum/shared/cleaning/construction-site-cleaning-L11.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Asbestos removal needs an asbestos removal licence. Victoria has Class A and Class B licences, and a small unlicensed allowance for non-friable asbestos only (an area of not more than 10 square metres in total, and a total time of not more than 1 hour in any period of 7 days which is cumulative across all employees). Friable asbestos has no such allowance. Removal above either limit needs a licence. Queensland licences Class A and Class B, with no licence needed for 10 square metres or less of non-friable asbestos. New South Wales requires a Class B licence for more than 10 square metres of non-friable asbestos; the Class A and assessor licence positions have not yet been confirmed. This lesson does not grant any asbestos licence, and a cleaner must not remove, sweep up or clean up suspected asbestos.
  - New: Asbestos removal needs an asbestos removal licence. Victoria has Class A and Class B licences, and a small unlicensed allowance for non-friable asbestos only (an area of not more than 10 square metres in total, and a total time of not more than 1 hour in any period of 7 days which is cumulative across all employees). Friable asbestos has no such allowance. Removal above either limit needs a licence. Queensland licences Class A and Class B, with no licence needed for 10 square metres or less of non-friable asbestos. This lesson does not grant any asbestos licence, and a cleaner must not remove, sweep up or clean up suspected asbestos.

### `curriculum/shared/cleaning/kitchen-cleaning-L08.json`

- `instruction/2/body` (text changed)
  - Old: Internal duct cleaning and complex extraction systems are not routine work for a general cleaner. Do not enter or scrape powered ductwork, do not defeat fire suppression or interlocks, and do not remove access panels that the procedure does not allow you to remove. Where the system is complex, the work is referred to a competent specialist. Whether a particular extraction duct clean needs a specific licence or certificate depends on the state and the work, and it has not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point. This lesson does not grant any such licence or authority.
  - New: Internal duct cleaning and complex extraction systems are not routine work for a general cleaner. Do not enter or scrape powered ductwork, do not defeat fire suppression or interlocks, and do not remove access panels that the procedure does not allow you to remove. Where the system is complex, the work is referred to a competent specialist. This lesson does not grant any such licence or authority.

### `curriculum/shared/cleaning/warehouse-deep-cleaning-L10.json`

- `instruction/0/body` (text changed)
  - Old: Before any warehouse cleaning starts, review the documented work order, the named supervisor, the risk controls and the site movement plan. Pay particular attention to equipment authorisation and the condition of the surface. An instruction that has not been confirmed is treated as unresolved, not assumed to be safe.
  - New: Before any warehouse cleaning starts, review the documented work order, the named supervisor, the risk controls and the site movement plan. Pay particular attention to equipment authorisation and the condition of the surface.

### `curriculum/shared/customer/F11-L05.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Customer records contain personal information. The Office of the Australian Information Commissioner states the Privacy Act applies to businesses above $3 million AUD annual turnover, and small businesses at or below that level are generally outside it. The position for each business must be confirmed, as it has not yet been confirmed in this lesson.
  - New: Customer records contain personal information. The Office of the Australian Information Commissioner states the Privacy Act applies to businesses above $3 million AUD annual turnover, and small businesses at or below that level are generally outside it.

### `curriculum/shared/customer/F12-L05.json`

- `instruction/2/body` (text changed)
  - Old: A privacy breach occurs when personal information is lost, sent to the wrong person, or accessed without authority. If it happens, stop the activity that caused it where possible, recover the information if you can, and report it to the designated contact immediately. The business decides on any notification to the customer or the regulator. The Office of the Australian Information Commissioner states that the Privacy Act applies to organisations above the $3 million AUD annual turnover threshold, and that small businesses at or below that threshold are generally outside it. The current position, including any proposed change, has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: A privacy breach occurs when personal information is lost, sent to the wrong person, or accessed without authority. If it happens, stop the activity that caused it where possible, recover the information if you can, and report it to the designated contact immediately. The business decides on any notification to the customer or the regulator. The Office of the Australian Information Commissioner states that the Privacy Act applies to organisations above the $3 million AUD annual turnover threshold, and that small businesses at or below that threshold are generally outside it.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: The Office of the Australian Information Commissioner states that the Privacy Act applies to organisations above $3 million AUD annual turnover and that small businesses at or below that threshold are generally outside the Act. Proposed changes to the threshold have not yet been confirmed in this lesson, and the business must confirm its position before relying on the exemption.
  - New: The Office of the Australian Information Commissioner states that the Privacy Act applies to organisations above $3 million AUD annual turnover and that small businesses at or below that threshold are generally outside the Act.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Some sectors, such as healthcare, aged care and child-care, may have specific confidentiality rules. Those rules have not yet been confirmed in this lesson and must be checked for each setting.
  - New: Some sectors, such as healthcare, aged care and child-care, may have specific confidentiality rules.

### `curriculum/shared/equipment/high-access-window-cleaning-L06.json`

- `instruction/2/body` (text changed)
  - Old: Conductive poles can contact overhead power lines and transfer current to the operator. Before extending a pole, survey the area above and beside the work for overhead lines, service drops and any structure that could carry electricity. In New South Wales, the SafeWork NSW code (May 2026) sets 4.0 m for conductive materials near low-voltage overhead service lines, and 3.0 m for ordinary persons near lines up to 132,000 V; a water-fed pole is conductive. Clearances in other states have not yet been confirmed, so check with the relevant regulator before relying on this point. The rule is firm: if a line is within reach, or you cannot confirm the clearance, stop, keep the pole down, and refer the job to the network operator or a qualified person before continuing.
  - New: Conductive poles can contact overhead power lines and transfer current to the operator. Before extending a pole, survey the area above and beside the work for overhead lines, service drops and any structure that could carry electricity. In New South Wales, the SafeWork NSW code (May 2026) sets 4.0 m for conductive materials near low-voltage overhead service lines, and 3.0 m for ordinary persons near lines up to 132,000 V; a water-fed pole is conductive. The rule is firm: if a line is within reach, or you cannot confirm the clearance, stop, keep the pole down, and refer the job to the network operator or a qualified person before continuing.
- `instruction/4/body` (text changed)
  - Old: Wash water, detergent and any approved cleaning product must not run into stormwater. The NSW EPA stormwater guidance is listed in the research brief as PRIOR, not read, and council and state wastewater rules have not yet been confirmed. Use only products with a safety data sheet available on site. Choose the lowest-impact method the job allows and collect or divert runoff where the job plan requires it.
  - New: Wash water, detergent and any approved cleaning product must not run into stormwater. Use only products with a safety data sheet available on site. Choose the lowest-impact method the job allows and collect or divert runoff where the job plan requires it.
- `workedExamples/0/reasoning` (text changed)
  - Old: Do not start. The overhead line is within the possible reach of the pole. In New South Wales the 4.0 m figure for conductive material near a low-voltage line applies to the pole, and a line within that distance is not approached. Outside New South Wales the clearance has not yet been confirmed, so check with the relevant regulator before relying on this point. Keep the pole down, record the line and its position, and refer to the network operator or a qualified person. The job may resume only if the clearance is confirmed or the job is re-planned to keep the pole and any part of it away from the line.
  - New: Do not start. The overhead line is within the possible reach of the pole. In New South Wales the 4.0 m figure for conductive material near a low-voltage line applies to the pole, and a line within that distance is not approached. Keep the pole down, record the line and its position, and refer to the network operator or a qualified person. The job may resume only if the clearance is confirmed or the job is re-planned to keep the pole and any part of it away from the line.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Electrical contact with overhead lines when using conductive poles is a serious hazard. In New South Wales, the SafeWork NSW code (May 2026) sets 4.0 m for conductive materials near low-voltage overhead service lines and 3.0 m for ordinary persons near lines up to 132,000 V. Outside New South Wales the clearance has not yet been confirmed; confirm with the network operator or a qualified person before extending a pole near lines, and check with the relevant regulator before relying on this point.
  - New: Electrical contact with overhead lines when using conductive poles is a serious hazard. In New South Wales, the SafeWork NSW code (May 2026) sets 4.0 m for conductive materials near low-voltage overhead service lines and 3.0 m for ordinary persons near lines up to 132,000 V.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Chemicals and runoff: stormwater and wastewater rules are state-based. NSW EPA guidance is PRIOR and not re-read; council and other state rules have not yet been confirmed.
  - New: Chemicals and runoff: stormwater and wastewater rules are state-based.

### `curriculum/shared/fitness-business/ACE-01.json`

- `instruction/1/body` (text changed)
  - Old: As an employee, marketing, equipment and facility costs usually sit with the employer. Some employers provide training, uniforms or group class opportunities, and some invite trainers to comment on equipment and layout. The trade-offs are real. Employers may set dress and grooming standards, minimum hours and sales goals, and the pay for each session can be lower than an independent trainer could earn. The source gives a pay share as a percentage of the client fee. That figure is not used, because it is not an Australian benchmark. Australian pay rates, awards and conditions have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. The source's account of US employer tax reporting is NOT APPLICABLE in Australia and is not used.
  - New: As an employee, marketing, equipment and facility costs usually sit with the employer. Some employers provide training, uniforms or group class opportunities, and some invite trainers to comment on equipment and layout. The trade-offs are real. Employers may set dress and grooming standards, minimum hours and sales goals, and the pay for each session can be lower than an independent trainer could earn. The source gives a pay share as a percentage of the client fee. That figure is not used, because it is not an Australian benchmark. The source's account of US employer tax reporting is NOT APPLICABLE in Australia and is not used.
- `instruction/2/body` (text changed)
  - Old: Under a facility contract, the trainer pays a fee to use the space, per client or per month, and carries their own operating costs. The trainer also has no say over how the facility runs, so changes to the room, hours or policies are outside their control. The source suggests a newcomer may price a little under local competitors. That suggestion is not used here as a rule, because it has no Australian basis. Fees must cover the space, insurance, marketing, equipment, records and the trainer's own tax, so a rate that merely sounds cheap is not a plan. Training clients on a facility's premises without paying the facility is a serious breach. The source says this can lead to prosecution. The Australian legal position has not yet been confirmed in this lesson, but the contractual and ethical point stands, so check with the relevant regulator before relying on this point. The source also names a professional conduct code, which was not read for this lesson.
  - New: Under a facility contract, the trainer pays a fee to use the space, per client or per month, and carries their own operating costs. The trainer also has no say over how the facility runs, so changes to the room, hours or policies are outside their control. The source suggests a newcomer may price a little under local competitors. That suggestion is not used here as a rule, because it has no Australian basis. Fees must cover the space, insurance, marketing, equipment, records and the trainer's own tax, so a rate that merely sounds cheap is not a plan. Training clients on a facility's premises without paying the facility is a serious breach. The source says this can lead to prosecution. The source also names a professional conduct code, which was not read for this lesson.
- `instruction/3/body` (text changed)
  - Old: An independent trainer sets fees from their experience and from what the local market will pay. They carry all marketing costs, all travel time between clients' homes, any health questionnaires and client release forms, and all record-keeping. They must also meet their tax obligations on earned income. The Australian rules for ABN, GST, income tax on independent income, business registration and insurance have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Before you rely on any of them, check current official guidance, then speak with a registered accountant or an insurance broker (see “Professional advisers: when to ask, and what to bring”).
  - New: An independent trainer sets fees from their experience and from what the local market will pay. They carry all marketing costs, all travel time between clients' homes, any health questionnaires and client release forms, and all record-keeping. They must also meet their tax obligations on earned income. Before you rely on any of them, check current official guidance, then speak with a registered accountant or an insurance broker (see “Professional advisers: when to ask, and what to bring”).
- `instruction/4/body` (text changed)
  - Old: Compare the three models on six criteria: the monthly income you need, how stable that income is, how much control you have over hours and location, the travel and admin load, the marketing cost you carry, and the records you must keep. Then check the working arrangement itself. Whether a worker is an employee or a contractor depends on how the work is actually done, not on what the agreement calls it. The test is set out in “Deciding on your first team member”, and the Australian classification rules have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Compare the three models on six criteria: the monthly income you need, how stable that income is, how much control you have over hours and location, the travel and admin load, the marketing cost you carry, and the records you must keep. Then check the working arrangement itself. Whether a worker is an employee or a contractor depends on how the work is actually done, not on what the agreement calls it.
- `workedExamples/1/reasoning` (text changed)
  - Old: He should confirm the space arrangement in writing, including the fee, what it covers, the hours and the cancellation terms. He should price his sessions from his real costs, including the monthly fee, and he should not treat the source's pricing suggestion as a rule. Insurance and any Australian registration point have not yet been confirmed and need checking before the first session, so check with the relevant regulator before relying on this point.
  - New: He should confirm the space arrangement in writing, including the fee, what it covers, the hours and the cancellation terms. He should price his sessions from his real costs, including the monthly fee, and he should not treat the source's pricing suggestion as a rule.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Licence notice: this lesson does not grant any licence, certificate or registration for personal training work. Whether a trainer needs a particular licence or registration has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Licence notice: this lesson does not grant any licence, certificate or registration for personal training work.

### `curriculum/shared/fitness-business/ACE-02.json`

- `instruction/4/body` (text changed)
  - Old: Empathy is a skill. Name the feeling you heard, such as frustration or worry about starting again, and show that you understand it. Do not use fear, false deadlines or invented scarcity, and do not promise results you cannot show. Any statement about price, savings, results or availability must be true and checkable, because consumer law may apply to how a service is sold. The specific obligations for sales conduct have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Empathy is a skill. Name the feeling you heard, such as frustration or worry about starting again, and show that you understand it. Do not use fear, false deadlines or invented scarcity, and do not promise results you cannot show. Any statement about price, savings, results or availability must be true and checkable, because consumer law may apply to how a service is sold.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Follow-up contact by email or text: Spam Act requirements for consent and an unsubscribe option have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Follow-up contact by email or text: check the Spam Act requirements for consent and an unsubscribe option with the relevant regulator before relying on this point.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The source names a professional conduct code. That code was not read for this lesson, and its content has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The source names a professional conduct code.

### `curriculum/shared/fitness-business/ACE-04.json`

- `instruction/1/body` (text changed)
  - Old: The main structures are a sole trader, a partnership, a company and a franchise. Each one shapes who is liable for the business's debts and how much paperwork it takes. A lawyer should advise on the structure you choose, and an accountant should advise on the tax and cash consequences. The source describes the same set of structures, and treats a lawyer as essential for the founding documents of a company or partnership. The Australian rules for structures, registration and business names have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The main structures are a sole trader, a partnership, a company and a franchise. Each one shapes who is liable for the business's debts and how much paperwork it takes. A lawyer should advise on the structure you choose, and an accountant should advise on the tax and cash consequences. The source describes the same set of structures, and treats a lawyer as essential for the founding documents of a company or partnership.
- `instruction/2/body` (text changed)
  - Old: An accountant can help set up the records that show money coming in and going out. Ask for a simple system that records each invoice, expense and payment in one place, with a reference number on each. Keep the advice in writing. Tax registrations, reporting duties and the treatment of independent income in Australia have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: An accountant can help set up the records that show money coming in and going out. Ask for a simple system that records each invoice, expense and payment in one place, with a reference number on each. Keep the advice in writing.
- `instruction/4/body` (text changed)
  - Old: An insurance broker can compare policies and build cover around the risks of the work. Compare quotes on the same scope, limits, exclusions and conditions. A real estate agent can help find premises, and a lawyer should review a lease before you sign it. Contractors can carry out repair and maintenance of the premises you use. Insurance types, lease terms and contractor obligations in Australia have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: An insurance broker can compare policies and build cover around the risks of the work. Compare quotes on the same scope, limits, exclusions and conditions. A real estate agent can help find premises, and a lawyer should review a lease before you sign it. Contractors can carry out repair and maintenance of the premises you use.
- `workedExamples/0/reasoning` (text changed)
  - Old: He should take advice on the structure first, because the structure affects liability and paperwork. An accountant should then look at cash flow and the tax consequences. An insurance broker should compare cover for the studio and the work on the same scope. A lawyer should review the lease before he signs. He prepares a brief for each adviser and records the advice. The Australian detail for each step has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: He should take advice on the structure first, because the structure affects liability and paperwork. An accountant should then look at cash flow and the tax consequences. An insurance broker should compare cover for the studio and the work on the same scope. A lawyer should review the lease before he signs. He prepares a brief for each adviser and records the advice.

### `curriculum/shared/fitness-business/BRY-01.json`

- `instruction/2/body` (text changed)
  - Old: Words such as traditional, authentic, certified, lineage and original carry weight with clients, so each one needs evidence behind it. Keep the training certificate, the course record, the dates the work was completed, and a written account of any lineage you describe, including who taught you and what they taught you. If you cannot name the source of a term, do not use the term. Whether any of these words has a specific legal meaning in Australia has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Treat each one as a claim that must be true and provable, because consumer law may treat a misleading description of a service as a problem. Check the current Australian consumer law position before you rely on this point.
  - New: Words such as traditional, authentic, certified, lineage and original carry weight with clients, so each one needs evidence behind it. Keep the training certificate, the course record, the dates the work was completed, and a written account of any lineage you describe, including who taught you and what they taught you. If you cannot name the source of a term, do not use the term. Treat each one as a claim that must be true and provable, because consumer law may treat a misleading description of a service as a problem. Check the current Australian consumer law position before you rely on this point.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Claims about curing, treating or preventing a health condition can be regulated in Australia. The rules that apply to a yoga or fitness business have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Do not make such claims until they have been checked.
  - New: Claims about curing, treating or preventing a health condition can be regulated in Australia. Do not make such claims until they have been checked.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Consumer law may apply to advertising claims about training, style or results. The specific obligations for a yoga or fitness business have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Consumer law may apply to advertising claims about training, style or results.

### `curriculum/shared/fitness-business/BRY-02.json`

- `instruction/1/body` (text changed)
  - Old: Ideas, general styles and common poses are not owned by any one person. Anyone can teach a sequence of standing poses, combine two approaches, or teach at dawn. A specific brand name, a logo, a written program with its own wording, or recorded material you created may be capable of protection, depending on its form and how it is used. How these rules apply in Australia, including what registration is available, what it costs and whether a particular name can be registered, has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check the current guidance from the national intellectual property office and take advice from a qualified IP adviser before you file, rely on protection, or raise a complaint against another teacher. Overseas cases in which teachers have tried to protect a fixed class format have drawn public opposition. Those cases are historical and non-Australian, and they do not establish any Australian position.
  - New: Ideas, general styles and common poses are not owned by any one person. Anyone can teach a sequence of standing poses, combine two approaches, or teach at dawn. A specific brand name, a logo, a written program with its own wording, or recorded material you created may be capable of protection, depending on its form and how it is used. Check the current guidance from the national intellectual property office and take advice from a qualified IP adviser before you file, rely on protection, or raise a complaint against another teacher. Overseas cases in which teachers have tried to protect a fixed class format have drawn public opposition. Those cases are historical and non-Australian, and they do not establish any Australian position.
- `instruction/2/body` (text changed)
  - Old: Before a new class name appears on a website, a timetable or a flyer, run a name check. Search the public trademark register, search business names and domain names, and search the websites and social profiles of teachers in your area and online. Look for names that sound like yours, share its key word, or describe the same offer in a way that could confuse a client. A name that simply describes what the class is, rather than distinguishing it, is usually harder to own. Whether a descriptive name can be registered in Australia has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Record each search, its date and its result. If a conflict is possible, take advice before launch, because changing a name after signs are printed is expensive.
  - New: Before a new class name appears on a website, a timetable or a flyer, run a name check. Search the public trademark register, search business names and domain names, and search the websites and social profiles of teachers in your area and online. Look for names that sound like yours, share its key word, or describe the same offer in a way that could confuse a client. A name that simply describes what the class is, rather than distinguishing it, is usually harder to own. Record each search, its date and its result. If a conflict is possible, take advice before launch, because changing a name after signs are printed is expensive.
- `instruction/3/body` (text changed)
  - Old: If you write a course outline, a written program, a set of cueing notes or a recorded class, keep dated drafts and a note of who wrote each part. This record shows what you made and when. Whether it gives you any legal right in Australia has not yet been confirmed in this lesson, so do not treat it as proof of ownership and check with the relevant regulator before relying on this point. It is still good practice. It lets you explain how a class was built, it helps when a colleague you worked with later disputes a shared program, and it reduces the risk of reusing another teacher's written material by accident. Where you use shared material from someone else, get their written permission and keep it on file with {{business:compliance.policy_reference}}.
  - New: If you write a course outline, a written program, a set of cueing notes or a recorded class, keep dated drafts and a note of who wrote each part. This record shows what you made and when. It is still good practice. It lets you explain how a class was built, it helps when a colleague you worked with later disputes a shared program, and it reduces the risk of reusing another teacher's written material by accident. Where you use shared material from someone else, get their written permission and keep it on file with {{business:compliance.policy_reference}}.
- `workedExamples/1/reasoning` (text changed)
  - Old: Marco should check his own dated drafts and any earlier agreement about the shared work before he replies. Whether the document is protected, and whether his colleague may use it, has not yet been confirmed in this lesson, so he should take advice if the question matters to him and check with the relevant regulator before relying on this point. He should already have the dated drafts and a note of which parts he wrote. Agreeing in writing, with clear terms about use and credit, is the safer step.
  - New: Marco should check his own dated drafts and any earlier agreement about the shared work before he replies. He should already have the dated drafts and a note of which parts he wrote. Agreeing in writing, with clear terms about use and credit, is the safer step.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Trademark, design, copyright and patent rules in Australia have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Nothing here is legal advice. Take advice from a qualified adviser before you rely on any form of protection.
  - New: Nothing here is legal advice. Take advice from a qualified adviser before you rely on any form of protection.
- `summary/1` (text changed)
  - Old: Ideas and general terms are usually shared. Specific names and created material may be protectable, and the Australian position has not yet been confirmed here
  - New: Ideas and general terms are usually shared.

### `curriculum/shared/fitness-business/BRY-03.json`

- `instruction/1/body` (text changed)
  - Old: A value statement connects four things: who the class is for, what changes for them, how the method produces that change, and what they receive. Keep it specific enough to check. A statement such as 'a six-week beginner block for adults returning to exercise, with a written home plan and a progress check at week three' can be verified against the program. A statement that promises to transform a body or cure back pain cannot be verified, and it makes a health claim. Health and treatment claims can be regulated, and whether a particular claim is allowed in Australia has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Avoid outcome promises about health, injury or weight. Describe what the class does and what the client does in it.
  - New: A value statement connects four things: who the class is for, what changes for them, how the method produces that change, and what they receive. Keep it specific enough to check. A statement such as 'a six-week beginner block for adults returning to exercise, with a written home plan and a progress check at week three' can be verified against the program. A statement that promises to transform a body or cure back pain cannot be verified, and it makes a health claim. Avoid outcome promises about health, injury or weight. Describe what the class does and what the client does in it.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Health, injury, weight and treatment claims can be regulated in Australia. Whether a particular claim is allowed has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Do not publish outcome promises about health until they have been checked.
  - New: Health, injury, weight and treatment claims can be regulated in Australia. Do not publish outcome promises about health until they have been checked.

### `curriculum/shared/fitness-business/PTB-01.json`

- `instruction/2/body` (text changed)
  - Old: Every specialty leaves some enquiries outside its scope. Explain the fit and refer the person to a suitable provider, rather than deflecting without a reason. Declining someone because of age, disability, sex, race or another protected attribute can breach anti-discrimination law. The exact rules and any exceptions for fitness and therapy services have not yet been confirmed in this lesson and must be checked before you write refusal criteria. Health suitability is screened through its own process, not through the specialty.
  - New: Every specialty leaves some enquiries outside its scope. Explain the fit and refer the person to a suitable provider, rather than deflecting without a reason. Declining someone because of age, disability, sex, race or another protected attribute can breach anti-discrimination law. Health suitability is screened through its own process, not through the specialty.

### `curriculum/shared/fitness-business/PTB-02.json`

- `instruction/2/body` (text changed)
  - Old: Advertising must not mislead. Claims about results, such as weight loss, pain relief or body shape, need evidence you can show and must not promise outcomes that depend on the person. Testimonials and before-and-after images need the person's written permission and must reflect a real experience. The Australian Consumer Law turns on whether conduct is misleading or deceptive. How that applies to fitness and massage wording has not yet been confirmed here and must be checked against current ACCC guidance before publication.
  - New: Advertising must not mislead. Claims about results, such as weight loss, pain relief or body shape, need evidence you can show and must not promise outcomes that depend on the person. Testimonials and before-and-after images need the person's written permission and must reflect a real experience. The Australian Consumer Law turns on whether conduct is misleading or deceptive.
- `workedExamples/0/reasoning` (text changed)
  - Old: The guarantee and the outcome promise cannot be backed by evidence for every client, and the wording implies a treatment result. Replace it with what the session includes, state that results vary, and remove the guarantee. Check the final wording against ACCC guidance, which has not yet been confirmed here.
  - New: The guarantee and the outcome promise cannot be backed by evidence for every client, and the wording implies a treatment result. Replace it with what the session includes, state that results vary, and remove the guarantee. Check the final wording against ACCC guidance.

### `curriculum/shared/fitness-business/PTB-05.json`

- `instruction/2/body` (text changed)
  - Old: Training at a private gym, studio or a client's home is a commercial arrangement. The written agreement should state the revenue split, who pays for insurance and cleaning, access and cancellation terms, who holds client records, and what happens if the venue closes. The percentage a venue accepts is a negotiation, not a standard. For home visits, access, safety and workplace duties have not yet been confirmed for each state and territory and must be checked before the first visit.
  - New: Training at a private gym, studio or a client's home is a commercial arrangement. The written agreement should state the revenue split, who pays for insurance and cleaning, access and cancellation terms, who holds client records, and what happens if the venue closes. The percentage a venue accepts is a negotiation, not a standard.
- `workedExamples/0/reasoning` (text changed)
  - Old: The room fee, the referral arrangement, insurance, access hours, client records, and what happens if the clinic changes its services all need writing. Any referral payment must be disclosed and checked before it is agreed. Advice on professional-conduct and legal points has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The room fee, the referral arrangement, insurance, access hours, client records, and what happens if the clinic changes its services all need writing. Any referral payment must be disclosed and checked before it is agreed.
- `summary/2` (deleted item)
  - Old: Referral payments and insurance have not yet been confirmed until advice is obtained, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/fitness-business/PTB-07.json`

- `instruction/1/body` (text changed)
  - Old: Your network includes people who know your work well, people who know you a little, and people who know of you. List them and mark the closeness of each relationship. Note how each person could open a door: by referring a client, hosting a talk, or passing on your details. Record the consent status and the last contact date. Do not send promotional messages to the whole list. A personal message that promotes the business may still count as a commercial electronic message; how the Spam Act classifies individual messages has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Your network includes people who know your work well, people who know you a little, and people who know of you. List them and mark the closeness of each relationship. Note how each person could open a door: by referring a client, hosting a talk, or passing on your details. Record the consent status and the last contact date. Do not send promotional messages to the whole list.

### `curriculum/shared/fitness-business/PTB-08.json`

- `instruction/2/body` (text changed)
  - Old: Plan the room in zones, each sized for one group, with equipment within reach of that zone and clear walkways between zones. Crowding two groups into a small room, so that everyone works in one tight spot, makes coaching harder and raises the risk of collisions. Check the venue's and any council occupancy limits and fire egress rules. Exact limits for each venue have not yet been confirmed until checked.
  - New: Plan the room in zones, each sized for one group, with equipment within reach of that zone and clear walkways between zones. Crowding two groups into a small room, so that everyone works in one tight spot, makes coaching harder and raises the risk of collisions. Check the venue's and any council occupancy limits and fire egress rules.
- `workedExamples/0/reasoning` (text changed)
  - Old: Squeezing a second group into the corner creates the crowding and missed-coaching problem. The better decision is to run one zone at full quality, or to find a larger room or a second zone. The occupancy limit must be confirmed first; until then it has not yet been confirmed.
  - New: Squeezing a second group into the corner creates the crowding and missed-coaching problem. The better decision is to run one zone at full quality, or to find a larger room or a second zone.

### `curriculum/shared/fitness-business/PTB-09.json`

- `instruction/2/body` (text changed)
  - Old: Unlimited access makes each session seem less valuable and reduces the average income per session. Use session packs or memberships with clear terms, and state the expiry, cancellation and inclusion terms before sale. Those terms must be fair and not misleading. The consumer-law check has not yet been confirmed here and must be completed before publication.
  - New: Unlimited access makes each session seem less valuable and reduces the average income per session. Use session packs or memberships with clear terms, and state the expiry, cancellation and inclusion terms before sale. Those terms must be fair and not misleading.

### `curriculum/shared/fitness-business/PTB-12.json`

- `instruction/0/body` (text changed)
  - Old: Choose two or three measures linked to the goal, such as body weight, circumference measurements, or a repeatable performance test. Use the same method each time, at a consistent time of day and on a fixed schedule. Explain to the member what each measure shows and what it cannot show. Body-composition estimates vary between methods, so compare results only within one method. Record only what the member has agreed to have recorded, and store it securely. Privacy obligations have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Choose two or three measures linked to the goal, such as body weight, circumference measurements, or a repeatable performance test. Use the same method each time, at a consistent time of day and on a fixed schedule. Explain to the member what each measure shows and what it cannot show. Body-composition estimates vary between methods, so compare results only within one method. Record only what the member has agreed to have recorded, and store it securely.

### `curriculum/shared/fitness-business/PTB-13.json`

- `instruction/0/body` (text changed)
  - Old: A business name ought to describe the service and be memorable. Check that no other business already uses it, and whether it can be protected as a trade mark. The trade mark search has not yet been confirmed in this lesson and must be done on the IP Australia register or with an adviser. Avoid names that suggest a qualification, accreditation or affiliation you do not hold. A simple logo and a consistent set of colours build credibility more than an elaborate design.
  - New: A business name ought to describe the service and be memorable. Check that no other business already uses it, and whether it can be protected as a trade mark. Avoid names that suggest a qualification, accreditation or affiliation you do not hold. A simple logo and a consistent set of colours build credibility more than an elaborate design.
- `instruction/1/body` (text changed)
  - Old: Choose a legal structure, such as sole trader, partnership or company, with advice on liability and tax. An Australian Business Number, GST registration, business insurance and any industry registration are separate questions. The GST threshold, ABN timing and insurance needs have not yet been confirmed here and must be checked with the ATO, an accountant and an insurer before trading. On industry registration: an AUSactive page checked on 2026-11-02 describes a route into its Register of Exercise Professionals that requires a relevant qualification, current first aid and agreement to its code. The page does not say whether registration is required to work, so that point has not yet been confirmed and check with the relevant regulator before relying on this point.
  - New: Choose a legal structure, such as sole trader, partnership or company, with advice on liability and tax. An Australian Business Number, GST registration, business insurance and any industry registration are separate questions. On industry registration: an AUSactive page checked on 2026-11-02 describes a route into its Register of Exercise Professionals that requires a relevant qualification, current first aid and agreement to its code.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Industry registration: the AUSactive page checked on 2026-11-02 (https://ausactive.org.au/membership/personal_trainer/) describes a route to its Register of Exercise Professionals. Whether registration is required to work has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Industry registration: the AUSactive page checked on 2026-11-02 (https://ausactive.org.au/membership/personal_trainer/) describes a route to its Register of Exercise Professionals.

### `curriculum/shared/fitness-business/YNS-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Describing yourself as having specific experience, training or results must be accurate. Obligations under the Australian Consumer Law for service descriptions have not yet been confirmed in this lesson and have not been checked against an official source.
  - New: Describing yourself as having specific experience, training or results must be accurate.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Licence notice: this lesson does not cover licensed work and does not grant, confirm or replace any licence. A candidate niche must not be described as licensed work unless the licence is held. Licence requirements by state or territory have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Licence notice: this lesson does not cover licensed work and does not grant, confirm or replace any licence. A candidate niche must not be described as licensed work unless the licence is held.

### `curriculum/shared/fitness-business/YNS-02.json`

- `workedExamples/1/reasoning` (text changed)
  - Old: He can describe joinery training only with the certificate or course record in hand. He should say he repaints timber trim, not that he restores heritage structures, unless he holds evidence for that work. Whether any part of the work needs a licence has not yet been confirmed here, and he should check it before quoting for structural or building work.
  - New: He can describe joinery training only with the certificate or course record in hand. He should say he repaints timber trim, not that he restores heritage structures, unless he holds evidence for that work.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Describing a qualification, licence or experience you do not hold may mislead clients. Consumer law obligations for service descriptions in Australia have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Describing a qualification, licence or experience you do not hold may mislead clients.

### `curriculum/shared/fitness-business/YNS-03.json`

- `instruction/4/body` (text changed)
  - Old: A money claim, such as a saving or a return, needs the numbers behind it. A health claim needs more care still. A service can describe what a session includes and how it is run, but it should not claim to treat, cure or prevent any condition. It should point people with a health concern towards their own health provider. The rules for health and advertising claims in Australia have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Follow-up messages sent by email or text may also be covered by the Spam Act, which has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: A money claim, such as a saving or a return, needs the numbers behind it. A health claim needs more care still. A service can describe what a session includes and how it is run, but it should not claim to treat, cure or prevent any condition. It should point people with a health concern towards their own health provider. Follow-up messages sent by email or text may also be covered by the Spam Act.
- `workedExamples/1/reasoning` (text changed)
  - Old: A claim to fix back pain is a health and treatment claim, and the therapist has no evidence for it in this lesson. A safer message describes the relaxation session and what it includes, and invites clients with a back concern to see their own health provider first. The health-claim rules have not yet been confirmed here and should be checked before publication.
  - New: A claim to fix back pain is a health and treatment claim, and the therapist has no evidence for it in this lesson. A safer message describes the relaxation session and what it includes, and invites clients with a back concern to see their own health provider first.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Health claims: whether a service may describe a health benefit, and in what words, is governed by advertising rules that have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point. Do not make treatment, cure or prevention claims.
  - New: Do not make treatment, cure or prevention claims.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Spam Act: marketing messages sent by email or text may need consent and an unsubscribe option. The requirements have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Spam Act: marketing messages sent by email or text may need consent and an unsubscribe option.

### `curriculum/shared/fitness-business/YNS-04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Advertising a working niche to test it is subject to Australian Consumer Law obligations on claims and pricing. The specific obligations have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Advertising a working niche to test it is subject to Australian Consumer Law obligations on claims and pricing.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Follow-up messages to prospects sent by email or text may need consent and an unsubscribe option under the Spam Act. This has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Follow-up messages to prospects sent by email or text may need consent and an unsubscribe option under the Spam Act.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Licence notice: where the niche involves licensed work, this lesson does not grant or confirm any licence. Licence requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Licence notice: where the niche involves licensed work, this lesson does not grant or confirm any licence.

### `curriculum/shared/food-sanitation/FPS-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Food-area cleaning in Australia is regulated by state and territory food authorities and the Food Standards Code. The specific obligations that apply to a contract cleaner in each premises have not yet been confirmed and must be checked for the site before the lesson is relied on.
  - New: Food-area cleaning in Australia is regulated by state and territory food authorities and the Food Standards Code.

### `curriculum/shared/food-sanitation/FPS-02.json`

- `instruction/1/body` (text changed)
  - Old: The main classes are the halogens, a group that includes chlorine, bromine and iodine, plus phenol-based products and quaternary ammonium compounds. Chlorine-based products are among the most widely used in food settings. Iodine-based products can stain belts and other absorbent materials. Phenol-based products should not be used in food processing areas, because their odour can pass into food and the strong smell can hide whether a room has actually been cleaned. Quaternary ammonium compounds have a place in food processing, but their cost usually limits how much they are used. This phenol advice comes from a US source; whether any product is approved for a given Australian food setting has not yet been confirmed and must be checked against the label, the SDS and the site's approved list.
  - New: The main classes are the halogens, a group that includes chlorine, bromine and iodine, plus phenol-based products and quaternary ammonium compounds. Chlorine-based products are among the most widely used in food settings. Iodine-based products can stain belts and other absorbent materials. Phenol-based products should not be used in food processing areas, because their odour can pass into food and the strong smell can hide whether a room has actually been cleaned. Quaternary ammonium compounds have a place in food processing, but their cost usually limits how much they are used.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Phenol advice and the approval status of food-contact sanitisers in Australia have not yet been confirmed, so check with the relevant regulator before relying on this point. The lesson does not confirm that any named product is permitted.
  - New: The lesson does not confirm that any named product is permitted.

### `curriculum/shared/food-sanitation/FPS-03.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Detergent residue is a food-safety control. The acceptable residue level in Australian food premises has not yet been confirmed and must be set by the site's food-safety plan.
  - New: Detergent residue is a food-safety control.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Wastewater from detergent cleaning may fall under trade-waste rules. The rules differ between state and territory authorities and have not yet been confirmed for this lesson.
  - New: Wastewater from detergent cleaning may fall under trade-waste rules.

### `curriculum/shared/food-sanitation/FPS-04.json`

- `instruction/0/body` (text changed)
  - Old: Loose utensils and small parts are dipped into a sanitising solution or hot water for the period the procedure sets. Fixed plant, including belts, saws and tables, is sprayed with a hand-pumped unit in a small operation, or with a pressurised unit in a large facility. A hand-held spray bottle does table sanitising in a restaurant. For hot-water sanitising, Queensland Health's cleaning and sanitising guidance gives a hot-water temperature of 77 degrees Celsius held for a minimum of 30 seconds. That is a Queensland figure, not a national one, so temperature and time requirements in other states and territories, and under the national Food Standards Code, have not yet been confirmed in this lesson; the site's procedure and the product label set the method until they are confirmed and check with the relevant regulator before relying on this point.
  - New: Loose utensils and small parts are dipped into a sanitising solution or hot water for the period the procedure sets. Fixed plant, including belts, saws and tables, is sprayed with a hand-pumped unit in a small operation, or with a pressurised unit in a large facility. A hand-held spray bottle does table sanitising in a restaurant. For hot-water sanitising, Queensland Health's cleaning and sanitising guidance gives a hot-water temperature of 77 degrees Celsius held for a minimum of 30 seconds.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The Australian hot-water sanitising requirement, the approved temperature and the time for food-contact items have not yet been confirmed, so check with the relevant regulator before relying on this point. Use the site's food-safety plan and confirm before relying on any figure.
  - New: Use the site's food-safety plan and confirm before relying on any figure.

### `curriculum/shared/food-sanitation/FPS-05.json`

- `instruction/2/body` (text changed)
  - Old: Senior management carries the final accountability: it names a capable individual to run the pest programme and backs that person with resources. Anyone who applies a pesticide must use a product that is needed, apply it exactly as the label directs, and confirm that people, food and the environment are not put at risk. Pesticide use is not a task for an untrained cleaner. Pest-control licensing, and the state or territory rules for applying pesticides in food premises, have not yet been confirmed for this curriculum, so check with the relevant regulator before relying on this point. This lesson does not grant any licence or authority to apply a pesticide.
  - New: Senior management carries the final accountability: it names a capable individual to run the pest programme and backs that person with resources. Anyone who applies a pesticide must use a product that is needed, apply it exactly as the label directs, and confirm that people, food and the environment are not put at risk. Pesticide use is not a task for an untrained cleaner. This lesson does not grant any licence or authority to apply a pesticide.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pest-control licensing and the state or territory rules for applying pesticides in food premises have not yet been confirmed, so check with the relevant regulator before relying on this point. This lesson does not grant any licence or authority to apply a pesticide.
  - New: This lesson does not grant any licence or authority to apply a pesticide.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The US source states the responsibility principles; Australian application has not yet been confirmed and must be checked against the state or territory rules before the lesson is relied on.
  - New: The US source states the responsibility principles; Australian application must be checked against the state or territory rules before the lesson is relied on.
- `summary/3` (deleted item)
  - Old: Pesticide licensing in Australia has not yet been confirmed, and this lesson grants no licence, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/food-sanitation/FPS-06.json`

- `instruction/1/body` (text changed)
  - Old: Make every area used to handle or store food easy to reach for routine cleaning. Fix cabinets and equipment flush against a wall or floor where design permits, or leave a clear space of at least about 15 centimetres (six inches) so the floor and wall can be cleaned and inspected. Stock sits on pallets rather than the ground, with a gap of roughly 45 centimetres (18 inches) beneath it and space between it and the walls. That US source treats the spacing as a rule of thumb. It is not an Australian requirement, and whether any specific figure applies at an Australian site has not yet been confirmed, so check with the relevant regulator before relying on this point. Openings around pipes, drains and vents are sealed, and doors and openable windows get close-fitting screens.
  - New: Make every area used to handle or store food easy to reach for routine cleaning. Fix cabinets and equipment flush against a wall or floor where design permits, or leave a clear space of at least about 15 centimetres (six inches) so the floor and wall can be cleaned and inspected. Stock sits on pallets rather than the ground, with a gap of roughly 45 centimetres (18 inches) beneath it and space between it and the walls. That US source treats the spacing as a rule of thumb. Openings around pipes, drains and vents are sealed, and doors and openable windows get close-fitting screens.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The 18-inch and clearance figures come from a US extension source. Australian application at any site has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The 18-inch and clearance figures come from a US extension source.

### `curriculum/shared/food-sanitation/FPS-07.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Wash-down wastewater may need to meet trade-waste rules. These rules differ between state and territory authorities and have not yet been confirmed for this lesson.
  - New: Wash-down wastewater may need to meet trade-waste rules.

### `curriculum/shared/food-sanitation/FPS-08.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: The inspection structure described here is general practice. Any statutory inspection regime that applies to a specific Australian premises has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The inspection structure described here is general practice.

### `curriculum/shared/green/GCM-03.json`

- `instruction/0/body` (text changed)
  - Old: A chopping board holds food residue in its knife grooves and its surface, so a quick wipe is not enough. Because the board is used for food, the business's food-safety plan and the rules that apply to food-contact items matter as well as the cleaning method. This lesson covers the cleaning and drying steps for plastic boards as the source sets them out. It does not set food-premises requirements. Those have not yet been confirmed for this draft, and the business's food-safety plan, the state or territory food rules and the product label govern where they apply, so check with the relevant regulator before relying on this point.
  - New: A chopping board holds food residue in its knife grooves and its surface, so a quick wipe is not enough. Because the board is used for food, the business's food-safety plan and the rules that apply to food-contact items matter as well as the cleaning method. This lesson covers the cleaning and drying steps for plastic boards as the source sets them out. It does not set food-premises requirements.

### `curriculum/shared/handyman/HBM-02.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Customer records contain personal information. Keep them secure, limit who can see them, and check whether the Privacy Act 1988 applies to the business. Thresholds, exemptions and the current guidance have not yet been confirmed and must be checked with the Office of the Australian Information Commissioner.
  - New: Customer records contain personal information. Keep them secure, limit who can see them, and check whether the Privacy Act 1988 applies to the business.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Tax invoice content and the period for keeping records are set by Australian tax law. They have not yet been confirmed in this lesson and must be confirmed with the ATO or a registered tax agent before any template is treated as final.
  - New: Tax invoice content and the period for keeping records are set by Australian tax law.

### `curriculum/shared/handyman/HBM-03.json`

- `instruction/3/body` (text changed)
  - Old: Open a separate business bank account before the first invoice, and pay business costs and receive business income through it. Keep every receipt, and write down the business purpose of each purchase. Mixing personal and business money makes records hard to check and creates problems at tax time. Avoid funding the start with expensive debt where a cheaper option exists. Speak with a registered tax agent about which costs are deductible and how vehicle expenses are recorded. Those rules have not yet been confirmed in this lesson, because they depend on the business structure and on the owner's own circumstances, so check with the relevant regulator before relying on this point.
  - New: Open a separate business bank account before the first invoice, and pay business costs and receive business income through it. Keep every receipt, and write down the business purpose of each purchase. Mixing personal and business money makes records hard to check and creates problems at tax time. Avoid funding the start with expensive debt where a cheaper option exists. Speak with a registered tax agent about which costs are deductible and how vehicle expenses are recorded.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: The GST registration threshold is $75,000 of GST turnover, as the ATO states on its page checked on 2026-11-02. Deductions, vehicle expense methods and record-keeping periods are set by Australian tax law and have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check them with the ATO or a registered tax agent.
  - New: The GST registration threshold is $75,000 of GST turnover, as the ATO states on its page checked on 2026-11-02. Check them with the ATO or a registered tax agent.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: State and territory registration and licence fees differ between jurisdictions. They have not yet been confirmed in this lesson, so check each fee with the state authority before budgeting.
  - New: State and territory registration and licence fees differ between jurisdictions.

### `curriculum/shared/handyman/HBM-05.json`

- `instruction/0/body` (text changed)
  - Old: Insurance shifts the expense of a serious mistake or accident away from the owner and the client. A tradesperson can damage a client's property while working, and a member of the public can be hurt on a site. Those events can cost far more than a year of premiums. Insurance also builds trust, because many clients, property managers and councils ask for proof of cover before they engage a trade. The guide this lesson draws on describes general liability insurance and workers compensation. The Australian term for cover against claims from third parties for injury or property damage caused by the work is public liability insurance. Its cover limits and the rules on when it is required have not yet been confirmed, so read each policy wording and check the requirements with the client or authority in writing.
  - New: Insurance shifts the expense of a serious mistake or accident away from the owner and the client. A tradesperson can damage a client's property while working, and a member of the public can be hurt on a site. Those events can cost far more than a year of premiums. Insurance also builds trust, because many clients, property managers and councils ask for proof of cover before they engage a trade. The guide this lesson draws on describes general liability insurance and workers compensation. The Australian term for cover against claims from third parties for injury or property damage caused by the work is public liability insurance.
- `instruction/1/body` (text changed)
  - Old: Public liability insurance covers third-party claims for injury or property damage caused by the work. Workers compensation insurance covers employees for injuries at work. In Australia the requirement, the scheme and the premium basis are set by each state and territory, and they have not yet been confirmed here, so check with the relevant regulator before relying on this point. Professional indemnity cover may matter where the business gives advice or design work, and whether this business needs it has not yet been confirmed, so check with the relevant regulator before relying on this point. Tools and equipment cover and motor vehicle cover protect the business's assets. Choose the types that match the actual work, the people who will do it and the clients it serves. Then confirm each choice with the insurer or with an adviser who is authorised to give the advice.
  - New: Public liability insurance covers third-party claims for injury or property damage caused by the work. Workers compensation insurance covers employees for injuries at work. Tools and equipment cover and motor vehicle cover protect the business's assets. Choose the types that match the actual work, the people who will do it and the clients it serves. Then confirm each choice with the insurer or with an adviser who is authorised to give the advice.
- `instruction/2/body` (text changed)
  - Old: Obtain at least two quotes for the same scope of work. Compare the limit of cover, the excess, the exclusions, the work the policy says it covers, any restriction on height, roof or electrical work, the claims process and the renewal terms. A lower premium is not a better policy if it excludes the work you do. Cover for licensed work that the owner is not licensed to do is commonly excluded, which has not yet been confirmed for each insurer and each state, so check with the relevant regulator before relying on this point. Check that the person giving advice is authorised, which has not yet been confirmed. The ASIC register is the place to check it, and the check should be made on the ASIC site before any advice is accepted.
  - New: Obtain at least two quotes for the same scope of work. Compare the limit of cover, the excess, the exclusions, the work the policy says it covers, any restriction on height, roof or electrical work, the claims process and the renewal terms. A lower premium is not a better policy if it excludes the work you do. Check that the person giving advice is authorised. The ASIC register is the place to check it, and the check should be made on the ASIC site before any advice is accepted.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Whether public liability cover is required by law, or by a client, council or builder, has not yet been confirmed in this lesson. Ask the client or the authority in writing, and keep the answer on file.
  - New: Ask the client or the authority in writing, and keep the answer on file.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The requirement for workers compensation cover, the scheme and the premium basis differ between states and territories and have not yet been confirmed here, so check with the relevant regulator before relying on this point. The Fair Work workers compensation page was not retrieved in this check, because the site blocks automated retrieval. Confirm with the state authority before hiring.
  - New: The Fair Work workers compensation page was not retrieved in this check, because the site blocks automated retrieval. Confirm with the state authority before hiring.

### `curriculum/shared/handyman/HBM-06.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Licence and registration rules, fees and categories are set by each state and territory and have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. The existing “Scope, consent and trade boundaries” lesson and the state-by-state licence checks record the state positions, and each one should be confirmed before use.
  - New: The existing “Scope, consent and trade boundaries” lesson and the state-by-state licence checks record the state positions, and each one should be confirmed before use.

### `curriculum/shared/handyman/HBM-07.json`

- `instruction/3/body` (text changed)
  - Old: Tools are a business asset and are often stolen from vehicles. Keep the most valuable tools locked away, mark them with an identifier, and photograph them for the register. Check with the insurer whether tools and equipment are covered, and whether any storage condition applies to tools kept in a vehicle. Those conditions have not yet been confirmed for each policy and are covered further in “Insurance for property trade work in Australia”, so check with the relevant regulator before relying on this point.
  - New: Tools are a business asset and are often stolen from vehicles. Keep the most valuable tools locked away, mark them with an identifier, and photograph them for the register. Check with the insurer whether tools and equipment are covered, and whether any storage condition applies to tools kept in a vehicle.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Power tool and ladder safety rules, electrical testing requirements and any tool-specific licensing are set by state and territory work health and safety rules. They have not yet been confirmed in this lesson, so check the current rules before use.
  - New: Power tool and ladder safety rules, electrical testing requirements and any tool-specific licensing are set by state and territory work health and safety rules.

### `curriculum/shared/handyman/HBM-08.json`

- `instruction/1/body` (text changed)
  - Old: A letterbox drop puts a printed offer into homes on a chosen street or in a chosen suburb. Use a clear photo of the owner's own completed work, a short list of services and one way to respond. Check whether the local council allows distribution, and respect any no junk mail sign on a letterbox. Council distribution rules have not yet been confirmed. Track the number of letters delivered, the enquiries received and the jobs won, so the cost of each lead can be judged. Printed mail is not governed by the Spam Act 2003, but the content must still be accurate and must not imply a licence or an insurance cover the owner does not hold.
  - New: A letterbox drop puts a printed offer into homes on a chosen street or in a chosen suburb. Use a clear photo of the owner's own completed work, a short list of services and one way to respond. Check whether the local council allows distribution, and respect any no junk mail sign on a letterbox. Track the number of letters delivered, the enquiries received and the jobs won, so the cost of each lead can be judged. Printed mail is not governed by the Spam Act 2003, but the content must still be accurate and must not imply a licence or an insurance cover the owner does not hold.
- `instruction/3/body` (text changed)
  - Old: A vehicle sign with a phone number and a service area can generate calls at low cost, but state and territory rules on vehicle signage have not yet been confirmed here and must be checked. Business cards work well when handed over at the end of a job, with the client's permission to give them out. A simple web page with a short service list, photos of the owner's own work used with consent, and a contact method is enough to begin. Keep the business details accurate, because enquiries will check them.
  - New: Business cards work well when handed over at the end of a job, with the client's permission to give them out. A simple web page with a short service list, photos of the owner's own work used with consent, and a contact method is enough to begin. Keep the business details accurate, because enquiries will check them.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Council rules on leaflet distribution, vehicle advertising and signage have not yet been confirmed in this lesson and must be checked with the council or the state authority before use.
  - New: Council rules on leaflet distribution, vehicle advertising and signage must be checked with the council or the state authority before use.

### `curriculum/shared/handyman/HBM-09.json`

- `instruction/0/body` (text changed)
  - Old: Online platforms connect people who need work with tradespeople who respond to their requests. They can provide steady leads, but they also bring competition, lead fees, subscriptions and the time spent on bids that never turn into jobs. The guide this lesson draws on names several US sites. Those sites are not Australian services, and their fees and terms are not used here. Before joining any platform, find out whether it operates in the owner's area, what it charges, whether the charge is per lead, per job or by subscription, how it ranks profiles, and what its terms say about contact details. Check each point on the platform's own terms page. Every platform's terms have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Online platforms connect people who need work with tradespeople who respond to their requests. They can provide steady leads, but they also bring competition, lead fees, subscriptions and the time spent on bids that never turn into jobs. The guide this lesson draws on names several US sites. Those sites are not Australian services, and their fees and terms are not used here. Before joining any platform, find out whether it operates in the owner's area, what it charges, whether the charge is per lead, per job or by subscription, how it ranks profiles, and what its terms say about contact details. Check each point on the platform's own terms page.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Platform fees, terms, service availability and privacy statements have not yet been confirmed for each platform in this lesson, so check with the relevant regulator before relying on this point. Check them on each platform's own pages before joining.
  - New: Check them on each platform's own pages before joining.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Consumer law applies to advertising claims and to quotes under the Australian Consumer Law. Those rules have not yet been confirmed in this lesson, and should be confirmed with the ACCC or a legal adviser, so check with the relevant regulator before relying on this point.
  - New: Consumer law applies to advertising claims and to quotes under the Australian Consumer Law.

### `curriculum/shared/handyman/HBM-10.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Consumer guarantees, quoting obligations and the rules on advertising claims under the Australian Consumer Law have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check them with the ACCC or a legal adviser before using any warranty wording.
  - New: Check them with the ACCC or a legal adviser before using any warranty wording.

### `curriculum/shared/handyman/HBM-11.json`

- `instruction/2/body` (text changed)
  - Old: A package bundles a defined set of services into a regular arrangement at a set price. For example, a yearly property check with a fixed list of items, a set number of minor repairs and one price. The package must be clearly defined: what is included, what is excluded, what happens when extra work is needed, how often it runs and how the client can cancel. Under the Australian Consumer Law, terms must be fair and clear, which has not yet been confirmed and must be checked before a package is published. Check the margin of the package against the hourly rate and minimum charge (“Setting your hourly rate and minimum charge”), because a package that suits the client but does not cover the time loses money.
  - New: A package bundles a defined set of services into a regular arrangement at a set price. For example, a yearly property check with a fixed list of items, a set number of minor repairs and one price. The package must be clearly defined: what is included, what is excluded, what happens when extra work is needed, how often it runs and how the client can cancel. Check the margin of the package against the hourly rate and minimum charge (“Setting your hourly rate and minimum charge”), because a package that suits the client but does not cover the time loses money.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Package terms, cancellation rights and the rules on unfair terms have not yet been confirmed in this lesson, and must be checked before a package is published.
  - New: Package terms, cancellation rights and the rules on unfair terms must be checked before a package is published.

### `curriculum/shared/handyman/HBM-12.json`

- `instruction/3/body` (text changed)
  - Old: Short jobs can cost more in time than they earn, because travel and setup do not shrink with the size of the task. A minimum charge or a call-out fee covers the time needed to attend the site and start work. Set the minimum so that a short job still covers travel, setup and admin. State it before the visit, and explain it to the client in plain terms. Under the Australian Consumer Law, minimum and call-out charges must be clear and fair, which has not yet been confirmed and must be confirmed before the charge is published.
  - New: Short jobs can cost more in time than they earn, because travel and setup do not shrink with the size of the task. A minimum charge or a call-out fee covers the time needed to attend the site and start work. Set the minimum so that a short job still covers travel, setup and admin. State it before the visit, and explain it to the client in plain terms.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Price display, minimum and call-out charges, and fair terms are subject to the Australian Consumer Law. The requirements have not yet been confirmed in this lesson and must be confirmed before a price is published.
  - New: Price display, minimum and call-out charges, and fair terms are subject to the Australian Consumer Law.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The tax treatment of leave, superannuation and income for a self-employed owner depends on individual circumstances and has not yet been confirmed here, so check with the relevant regulator before relying on this point. Confirm it with a registered tax agent.
  - New: Confirm it with a registered tax agent.

### `curriculum/shared/handyman/HBM-13.json`

- `instruction/2/body` (text changed)
  - Old: Labour is the time for each task multiplied by the hourly rate from “Setting your hourly rate and minimum charge”, or the minimum charge if that is higher. Materials are the cost of each item, including delivery and an allowance for waste where the task needs one. A subcontract line is the quoted price of a licensed or specialist trade brought in, and the owner must check that the subcontractor holds the required licence and insurance before the line is added. Plans, permits and inspections must be checked with the authority that issues them, and their requirements have not yet been confirmed for each job type. Cleanup and waste disposal are costs too, and so are fuel and travel if they are not already in labour. Show each cost on its own line, so the client can see where the money goes.
  - New: Labour is the time for each task multiplied by the hourly rate from “Setting your hourly rate and minimum charge”, or the minimum charge if that is higher. Materials are the cost of each item, including delivery and an allowance for waste where the task needs one. A subcontract line is the quoted price of a licensed or specialist trade brought in, and the owner must check that the subcontractor holds the required licence and insurance before the line is added. Cleanup and waste disposal are costs too, and so are fuel and travel if they are not already in labour. Show each cost on its own line, so the client can see where the money goes.
- `workedExamples/0/reasoning` (text changed)
  - Old: The estimate should show the decking labour, the timber and fixings, the concrete, the skip-bin disposal and travel as separate lines. The plaster patch becomes a subcontract line only if the plasterer holds a licence for that work in the state or territory and the required insurance; otherwise it is referred to a licensed plasterer. Permit requirements for the footing have not yet been confirmed and must be checked with the local council before the estimate is sent.
  - New: The estimate should show the decking labour, the timber and fixings, the concrete, the skip-bin disposal and travel as separate lines. The plaster patch becomes a subcontract line only if the plasterer holds a licence for that work in the state or territory and the required insurance; otherwise it is referred to a licensed plasterer.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Permits, plans and inspections depend on the type of work and the local council or certifier. Their requirements have not yet been confirmed in this lesson and must be checked before the estimate is sent.
  - New: Permits, plans and inspections depend on the type of work and the local council or certifier.

### `curriculum/shared/handyman/HBM-14.json`

- `instruction/2/body` (text changed)
  - Old: Choose markup or margin as the method, apply it consistently to labour and materials, and state how the markup covers overheads and profit. Present the quote as separate lines for labour, materials, subcontracts, permits and cleanup, then the total. State whether the price includes GST. The ATO states that a GST turnover of $75,000 or more requires registration, as checked on 2026-11-02. Whether a particular quote must show GST separately has not yet been confirmed in this lesson. State the validity period, the inclusions and exclusions, any warranty or guarantee terms, the variation process and the payment terms.
  - New: Choose markup or margin as the method, apply it consistently to labour and materials, and state how the markup covers overheads and profit. Present the quote as separate lines for labour, materials, subcontracts, permits and cleanup, then the total. State whether the price includes GST. The ATO states that a GST turnover of $75,000 or more requires registration, as checked on 2026-11-02. State the validity period, the inclusions and exclusions, any warranty or guarantee terms, the variation process and the payment terms.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Consumer guarantees, quote and price display rules, and any requirement to show GST separately have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check them with the ACCC or the ATO before use.
  - New: Check them with the ACCC or the ATO before use.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: GST registration is required at a GST turnover of $75,000 or more, as the ATO states on its page checked on 2026-11-02. Other GST obligations depend on the business and have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: GST registration is required at a GST turnover of $75,000 or more, as the ATO states on its page checked on 2026-11-02.

### `curriculum/shared/handyman/HBM-15.json`

- `instruction/1/body` (text changed)
  - Old: Decide whether the person will be an employee or an independent contractor. The label in a contract does not decide the relationship. The way the work is done, who controls it, who supplies the tools, and whether the person works for others all matter. Employment obligations, including minimum pay under the applicable award or agreement, leave, superannuation, workers compensation and payroll tax, must be checked before any offer is made. The classification rules and the entitlements have not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm them with the Fair Work Ombudsman or a registered employment adviser.
  - New: Decide whether the person will be an employee or an independent contractor. The label in a contract does not decide the relationship. The way the work is done, who controls it, who supplies the tools, and whether the person works for others all matter. Employment obligations, including minimum pay under the applicable award or agreement, leave, superannuation, workers compensation and payroll tax, must be checked before any offer is made. Confirm them with the Fair Work Ombudsman or a registered employment adviser.
- `workedExamples/0/reasoning` (text changed)
  - Old: The plasterer may carry out licensed plastering work only within the licence category, and the owner must check that licence on the state register before making an offer. The labourer can support cleanup and general tasks, but cannot do licensed work. Before either offer, the owner should confirm the working arrangement and the entitlements, which have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The plasterer may carry out licensed plastering work only within the licence category, and the owner must check that licence on the state register before making an offer. The labourer can support cleanup and general tasks, but cannot do licensed work.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Employment classification, minimum pay, leave, superannuation, workers compensation, payroll tax and right-to-work checks have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Confirm each one with the relevant authority or a registered adviser before hiring.
  - New: Confirm each one with the relevant authority or a registered adviser before hiring.

### `curriculum/shared/handyman/HBM-16.json`

- `instruction/0/body` (text changed)
  - Old: Before the first working day, confirm the workers compensation cover for the employee in the state or territory where the work is done. The scheme, the premium and the requirement have not yet been confirmed and must be checked with the state scheme. Confirm that the business's public liability cover applies when an employee works on client sites, and check the policy conditions on supervision and licensed work. Keep the policy number and the certificate in the business file.
  - New: Before the first working day, confirm the workers compensation cover for the employee in the state or territory where the work is done. Confirm that the business's public liability cover applies when an employee works on client sites, and check the policy conditions on supervision and licensed work. Keep the policy number and the certificate in the business file.
- `instruction/1/body` (text changed)
  - Old: Register as an employer with the tax office and set up the payroll reporting the ATO requires. The reporting method has not yet been confirmed and must be confirmed. Pay the employee at least the minimum under the applicable award or agreement, and pay superannuation at the super guarantee rate. The ATO page checked on 2026-11-02 gives that rate as 12.00 per cent for 1 July 2026 to 30 June 2027. Tax withholding from wages follows rules that have not yet been confirmed here, so check with the relevant regulator before relying on this point. Payroll software or a payroll service can help, but the owner remains responsible for the payments. Late pay is the quickest route to losing a worker and to starting a dispute.
  - New: Register as an employer with the tax office and set up the payroll reporting the ATO requires. Pay the employee at least the minimum under the applicable award or agreement, and pay superannuation at the super guarantee rate. The ATO page checked on 2026-11-02 gives that rate as 12.00 per cent for 1 July 2026 to 30 June 2027. Payroll software or a payroll service can help, but the owner remains responsible for the payments. Late pay is the quickest route to losing a worker and to starting a dispute.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Workers compensation, payroll registration, withholding, superannuation timing and minimum pay are subject to Australian and state law. The super guarantee rate of 12.00 per cent for 1 July 2026 to 30 June 2027 is confirmed from the ATO page checked on 2026-11-02. The other requirements have not yet been confirmed and must be checked before hiring.
  - New: Workers compensation, payroll registration, withholding, superannuation timing and minimum pay are subject to Australian and state law. The super guarantee rate of 12.00 per cent for 1 July 2026 to 30 June 2027 is confirmed from the ATO page checked on 2026-11-02.

### `curriculum/shared/healthcare/ADA-01.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Australian guidance on zoning comes from the Dental Board's guidance and the NHMRC guideline. The Dental Board's text is named in the source, not reproduced here, and its current wording has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Australian guidance on zoning comes from the Dental Board's guidance and the NHMRC guideline.

### `curriculum/shared/healthcare/ADA-02.json`

- `instruction/1/body` (text changed)
  - Old: The source asks that water used to cool or irrigate during tooth preparation and scaling meet at least the national drinking-water standard. It sets a bacterial count limit for coolant water in non-surgical work, and a tighter limit when care is given to people whose immune defences are weakened. Surgical procedures use sterile water or saline. Test results are checked against those limits. The numbers are not repeated in this lesson, and the current limits and the national drinking-water reference have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: The source asks that water used to cool or irrigate during tooth preparation and scaling meet at least the national drinking-water standard. It sets a bacterial count limit for coolant water in non-surgical work, and a tighter limit when care is given to people whose immune defences are weakened. Surgical procedures use sterile water or saline. Test results are checked against those limits.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The source names Australian standards and state rules. Those are named only, and their current text has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The source names Australian standards and state rules.
- `summary/1` (deleted item)
  - Old: Quality limits and flushing practice come from the manufacturer and the protocol; the source's numbers have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/healthcare/ADA-03.json`

- `instruction/3/body` (text changed)
  - Old: Sharps containers stand upright, out of children's reach, and are never overfilled. The source asks for sealing at the fill line, or at roughly three-quarters capacity, followed by collection by a licensed waste contractor under local rules. The containers should meet the Australian sharps standards that the source names, which have not yet been confirmed here, so check with the relevant regulator before relying on this point. The cleaner hands sealed containers to the person responsible for collection and does not collect or transport them to a disposal site.
  - New: Sharps containers stand upright, out of children's reach, and are never overfilled. The source asks for sealing at the fill line, or at roughly three-quarters capacity, followed by collection by a licensed waste contractor under local rules. The cleaner hands sealed containers to the person responsible for collection and does not collect or transport them to a disposal site.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The source names Australian standards and state rules. Those are named only, and their current text has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The source names Australian standards and state rules.

### `curriculum/shared/healthcare/ADA-04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Waste rules vary by state, territory and council. This lesson does not state a rule for any location. The local rule and the practice's waste plan govern, and both have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Waste rules vary by state, territory and council. This lesson does not state a rule for any location.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The source names Australian standards and state rules. Those are named only, and their current text has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The source names Australian standards and state rules.

### `curriculum/shared/healthcare/ADA-05.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: The source is a general reference. The rules for each care facility and each state are set by the state rules and the facility, and have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The source is a general reference.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The source names Australian standards and state rules. Those are named only, and their current text has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The source names Australian standards and state rules.

### `curriculum/shared/healthcare/ADA-06.json`

- `safetyAndRegulatory/3/point` (text changed)
  - Old: The source names Australian standards and state rules. Those are named only, and their current text has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The source names Australian standards and state rules.

### `curriculum/shared/healthcare/DIP-01.json`

- `instruction/1/body` (text changed)
  - Old: The Malaysian section allows fluid from suction and blood to go to the sewer, and it caps how long a sharps bin may stay in use before it is closed and passed on for high-temperature destruction. The Australian sources place clinical waste, fluid included, with licensed collection, and close sharps containers at the fill line or at about three-quarters capacity. The Australian sources prevail for this set. The Malaysian section uses its own bag colours, which are not used here. Bag and container colours for clinical and general waste have not yet been confirmed for Australia; check AS/NZS 3816 with the local council or a licensed collector. The Malaysian statute references are not used.
  - New: The Malaysian section allows fluid from suction and blood to go to the sewer, and it caps how long a sharps bin may stay in use before it is closed and passed on for high-temperature destruction. The Australian sources place clinical waste, fluid included, with licensed collection, and close sharps containers at the fill line or at about three-quarters capacity. The Australian sources prevail for this set. The Malaysian section uses its own bag colours, which are not used here. The Malaysian statute references are not used.
- `instruction/3/body` (text changed)
  - Old: Do not pour clinical fluid down a drain because a document from another country allows it. Ask first. The local rule for fluid waste has not yet been confirmed in this lesson and must be verified with the practice and the state or territory authority.
  - New: Do not pour clinical fluid down a drain because a document from another country allows it. Ask first.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Australian waste and fluid rules are set by state and territory law and by local authorities. They have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Australian waste and fluid rules are set by state and territory law and by local authorities.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The source cites Malaysian statutes, which are not used here. Australian legal requirements have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The source cites Malaysian statutes, which are not used here.

### `curriculum/shared/healthcare/DIP-02.json`

- `safetyAndRegulatory/3/point` (text changed)
  - Old: The source cites Malaysian statutes, which are not used here. Australian legal requirements have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The source cites Malaysian statutes, which are not used here.

### `curriculum/shared/healthcare/DIP-03.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Imaging chemical disposal follows local rules. The Malaysian sewer route is not used, and the Australian requirement has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Imaging chemical disposal follows local rules.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Radiation safety rules are not covered in this lesson. They are set by the radiation authority in each state or territory, and have not yet been confirmed here.
  - New: Radiation safety rules are not covered in this lesson.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The source cites Malaysian statutes, which are not used here. Australian legal requirements have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The source cites Malaysian statutes, which are not used here.

### `curriculum/shared/healthcare/HCG-06.json`

- `instruction/3/body` (text changed)
  - Old: For these high-contact items the table names a medical-grade surface cleaner or detergent wipe, with a disinfectant added wherever a multi-resistant organism is in play. The product should carry a Therapeutic Goods Administration listing as a medical device in a stated class. The class wording and listing specifics have not yet been confirmed here and must be verified on the label.
  - New: For these high-contact items the table names a medical-grade surface cleaner or detergent wipe, with a disinfectant added wherever a multi-resistant organism is in play. The product should carry a Therapeutic Goods Administration listing as a medical device in a stated class.

### `curriculum/shared/healthcare/HCG-09.json`

- `instruction/0/body` (text changed)
  - Old: Carpets in lobbies and general patient zones get a daily vacuum run by a machine whose filter traps very fine particles, so dust does not drift back out. Deep cleaning happens on the schedule the facility sets, using a technique that throws up little mist and leaves little film. After a carpet spill, the guideline points to hot-water extraction; the Australian standard it names for that technique has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Carpets in lobbies and general patient zones get a daily vacuum run by a machine whose filter traps very fine particles, so dust does not drift back out. Deep cleaning happens on the schedule the facility sets, using a technique that throws up little mist and leaves little film.

### `curriculum/shared/healthcare/HCG-14.json`

- `instruction/3/body` (text changed)
  - Old: Disinfection inactivates most vegetative microbes via heat or chemicals, but falls short of sterility. Heat-resistant goods are generally steam-sterilised, whereas heat-sensitive goods need a low-temperature process. Validated sterilisation aims for a sterility assurance benchmark near one in a million (10 to the power minus six), and records prove each cycle ran. The guideline names the relevant standards; their current editions have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Disinfection inactivates most vegetative microbes via heat or chemicals, but falls short of sterility. Heat-resistant goods are generally steam-sterilised, whereas heat-sensitive goods need a low-temperature process. Validated sterilisation aims for a sterility assurance benchmark near one in a million (10 to the power minus six), and records prove each cycle ran.

### `curriculum/shared/healthcare/HCG-15.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Choose an antiseptic-approved product listed by the Therapeutic Goods Administration that complies with the named test standard. Its edition has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Choose an antiseptic-approved product listed by the Therapeutic Goods Administration that complies with the named test standard.

### `curriculum/shared/healthcare/HCG-18.json`

- `instruction/0/body` (text changed)
  - Old: Because Australia has no one nationwide meaning for clinical waste, facilities must follow the state or territory rules for clinical and associated waste, with reference to the Australian standard for that waste. This lesson therefore covers general principles only. Local specifics have not yet been confirmed here and must be verified on site.
  - New: Because Australia has no one nationwide meaning for clinical waste, facilities must follow the state or territory rules for clinical and associated waste, with reference to the Australian standard for that waste. This lesson therefore covers general principles only.

### `curriculum/shared/healthcare/HIP-01.json`

- `instruction/2/body` (text changed)
  - Old: The facility should stock tissues, lidded bins and hand cleaning products at the points where people need them. Your task is to spot an empty dispenser or an overflowing bin and report it. Never confront someone who is coughing. Pass the concern to your supervisor, who can apply the site policy. That policy may ask a symptomatic person to wear a mask and to keep a gap from other people in shared spaces. The source sets a specific gap distance. This lesson does not adopt it, since the NHMRC guideline governs and the Australian distance for shared areas has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The facility should stock tissues, lidded bins and hand cleaning products at the points where people need them. Your task is to spot an empty dispenser or an overflowing bin and report it. Never confront someone who is coughing. Pass the concern to your supervisor, who can apply the site policy. That policy may ask a symptomatic person to wear a mask and to keep a gap from other people in shared spaces. The source sets a specific gap distance.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Australian rules on distance and masking in shared areas have not yet been confirmed here, so check with the relevant regulator before relying on this point. Site policy and the NHMRC guideline govern.
  - New: Site policy and the NHMRC guideline govern.
- `summary/2` (deleted item)
  - Old: Distance and masking rules come from site policy and the NHMRC guideline; Australian figures have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/healthcare/HIP-04.json`

- `instruction/2/body` (text changed)
  - Old: Staff who may handle blood, other body fluids or sharps are expected to be protected against hepatitis B, and the source sets out a testing approach for people whose immune response to the vaccine is weak. The source also encourages staff without immunity to some other diseases to consider vaccination. The schedules are not copied into this lesson. The Australian immunisation schedules and the employer's occupational health requirements have not yet been confirmed here and must be checked by the employer.
  - New: Staff who may handle blood, other body fluids or sharps are expected to be protected against hepatitis B, and the source sets out a testing approach for people whose immune response to the vaccine is weak. The source also encourages staff without immunity to some other diseases to consider vaccination. The schedules are not copied into this lesson.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Vaccine schedules and the Australian requirements for healthcare workers have not yet been confirmed here, so check with the relevant regulator before relying on this point. The employer and the state health authority decide what applies.
  - New: The employer and the state health authority decide what applies.
- `summary/2` (deleted item)
  - Old: Vaccine rules and return-to-work decisions have not yet been confirmed here and depend on the employer and the state authority.
  - New: [element removed]

### `curriculum/shared/healthcare/HIP-05.json`

- `instruction/2/body` (text changed)
  - Old: Inform your supervisor and the IPC team straight away. Every exposure is logged and then followed through. The record needs the date and time, what you were doing, the type of fluid or tissue, how it reached you, how much and for how long, and the state of the skin. If a sharp was involved, record the device. Any testing of the person the fluid came from and of you follows clinical decisions, is confidential, and is set by occupational health and the treating clinicians. Preventive treatment after an exposure and its pathways have not yet been confirmed for Australian practice in this lesson, so check with the relevant regulator before relying on this point.
  - New: Inform your supervisor and the IPC team straight away. Every exposure is logged and then followed through. The record needs the date and time, what you were doing, the type of fluid or tissue, how it reached you, how much and for how long, and the state of the skin. If a sharp was involved, record the device. Any testing of the person the fluid came from and of you follows clinical decisions, is confidential, and is set by occupational health and the treating clinicians.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Preventive treatment after exposure and testing pathways for Australian workers have not yet been confirmed, so check with the relevant regulator before relying on this point. Follow the site's occupational health route and the state rules.
  - New: Follow the site's occupational health route and the state rules.
- `summary/2` (deleted item)
  - Old: The report records the details needed for follow-up; Australian pathways have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/healthcare/HLT-05.json`

- `instruction/2/body` (text changed)
  - Old: The guide expects waiting and public areas to hold tissues and a no-touch bin for used tissues. Hand-rub dispensers, which contain alcohol, should be placed where people actually need them, such as the doorway of a ward or next to a bed. Every sink should have soap and single-use paper towels. Posters and visual signs in the languages visitors use should be placed by area doorways as reminders. The guide also suggests asking visitors to report any airway infection on arrival, so that staff can help them practise cough etiquette. Anyone who is coughing should sit away from other people in the waiting room. The guide suggests about 1.5 metres; that figure has not yet been confirmed for Australian use, so follow the spacing your facility sets and check with the relevant regulator before relying on this point.
  - New: The guide expects waiting and public areas to hold tissues and a no-touch bin for used tissues. Hand-rub dispensers, which contain alcohol, should be placed where people actually need them, such as the doorway of a ward or next to a bed. Every sink should have soap and single-use paper towels. Posters and visual signs in the languages visitors use should be placed by area doorways as reminders. The guide also suggests asking visitors to report any airway infection on arrival, so that staff can help them practise cough etiquette. Anyone who is coughing should sit away from other people in the waiting room.

### `curriculum/shared/healthcare/HLT-06.json`

- `instruction/1/body` (text changed)
  - Old: Follow your workplace policy for cuts. Wash the area using soap and water first and dry it. Cover it with a waterproof dressing, or with gauze or a sterile bandage if a waterproof one is not available. Gloves go on over the dressing before any further task. Tell your supervisor about the cut before the next task starts. Replace the dressing daily, and sooner if it becomes wet or soiled. Creams should be used only as your doctor directs for a skin condition. The guide points to hand creams with a water base that are listed on the ARTG, the TGA listing database; check that listing for the product you use. The listing check has not yet been confirmed here.
  - New: Follow your workplace policy for cuts. Wash the area using soap and water first and dry it. Cover it with a waterproof dressing, or with gauze or a sterile bandage if a waterproof one is not available. Gloves go on over the dressing before any further task. Tell your supervisor about the cut before the next task starts. Replace the dressing daily, and sooner if it becomes wet or soiled. Creams should be used only as your doctor directs for a skin condition. The guide points to hand creams with a water base that are listed on the ARTG, the TGA listing database; check that listing for the product you use.

### `curriculum/shared/healthcare/HLT-07.json`

- `instruction/0/body` (text changed)
  - Old: Gowns and aprons protect clothing from body fluids and splashes, and they reduce the spread of organisms by direct contact. A gown has to resist fluid, and it is put on over ordinary clothing for clinical tasks. The learner guide cites a four-level scale for gown protection, taken from a US document, ANSI/AAMI PB70. That is not an Australian standard and has not yet been confirmed for this use, so choose gowns by the level the facility lists and check with the relevant regulator before relying on this point. A standard disposable apron has one grade; thicker aprons are used in kitchens. An apron should fit closely around the body. Fasten it at the rear, with the tie behind the neck, and never at the front, because a soiled knot can spread contamination. Change an apron after each client and as soon as it is soiled, and put it into the nearest appropriate bin.
  - New: Gowns and aprons protect clothing from body fluids and splashes, and they reduce the spread of organisms by direct contact. A gown has to resist fluid, and it is put on over ordinary clothing for clinical tasks. The learner guide cites a four-level scale for gown protection, taken from a US document, ANSI/AAMI PB70. A standard disposable apron has one grade; thicker aprons are used in kitchens. An apron should fit closely around the body. Fasten it at the rear, with the tie behind the neck, and never at the front, because a soiled knot can spread contamination. Change an apron after each client and as soon as it is soiled, and put it into the nearest appropriate bin.
- `instruction/1/body` (text changed)
  - Old: The guide sorts masks into three groups. Cloth-type masks offer little protection and the TGA does not regulate them, so do not use them where a fluid or droplet risk is listed. Surgical masks are regulated, and levels 1 to 3 reflect increasing fluid resistance, with the higher levels used in higher-risk areas. P2 and N95 respirators are tight-fitting, single-use devices; the guide says they need fit testing and must meet AS/NZS 1716, which has not yet been confirmed here. A surgical P2 or N95 respirator is the same but also resists fluid. Fit the mask as the manufacturer directs so that it covers the mouth and nose, and tighten it on the face. Keep your hands off the outer face of the mask while it is on. Discard a mask after use, and discard it straight away if it becomes wet. A mask should never sit around the throat or in a pocket between uses, and it is changed between clients.
  - New: The guide sorts masks into three groups. Cloth-type masks offer little protection and the TGA does not regulate them, so do not use them where a fluid or droplet risk is listed. Surgical masks are regulated, and levels 1 to 3 reflect increasing fluid resistance, with the higher levels used in higher-risk areas. A surgical P2 or N95 respirator is the same but also resists fluid. Fit the mask as the manufacturer directs so that it covers the mouth and nose, and tighten it on the face. Keep your hands off the outer face of the mask while it is on. Discard a mask after use, and discard it straight away if it becomes wet. A mask should never sit around the throat or in a pocket between uses, and it is changed between clients.
- `instruction/2/body` (text changed)
  - Old: Wear eye protection when there is a chance of blood or other body fluid splashing, and during any cleaning task where splashing is possible. Eye protection should give clear vision without fogging or distortion, sit snugly, and shield the sides and the front. Single-use eyewear goes in the bin after use, and reusable eyewear is cleaned after each use. The guide names AS/NZS 1337 part 1 for eye protection and AS/NZS 1336 for face shields; both have not yet been confirmed here, so check with the relevant regulator before relying on this point. A face shield gives wider protection across the whole face. It suits an exposure site, any chance of body fluid contact, a splash injury risk, or work with a person carrying a contagious organism. Remove eye protection by the headband or strap, never by touching the outside, which may be contaminated.
  - New: Wear eye protection when there is a chance of blood or other body fluid splashing, and during any cleaning task where splashing is possible. Eye protection should give clear vision without fogging or distortion, sit snugly, and shield the sides and the front. Single-use eyewear goes in the bin after use, and reusable eyewear is cleaned after each use. A face shield gives wider protection across the whole face. It suits an exposure site, any chance of body fluid contact, a splash injury risk, or work with a person carrying a contagious organism. Remove eye protection by the headband or strap, never by touching the outside, which may be contaminated.

### `curriculum/shared/healthcare/HLT-10.json`

- `instruction/3/body` (text changed)
  - Old: A two-step clean uses a detergent first, then a disinfectant. The guide names two disinfectant choices for the disinfection step after the detergent clean: a TGA-listed product for hospital use that works against viruses, or a chlorine product, for example sodium hypochlorite. A two-in-one clean relies on one product that merges both jobs: either a TGA-listed product effective against viruses, or a detergent blended with hypochlorite. Your facility policy chooses the approach. Follow the label for dilution and contact time. The guide gives no dilution figure, and some organisations do not allow bleach at all, so check the facility list rather than relying on memory. Whether a product is TGA-listed for this use has not yet been confirmed until the listing is checked.
  - New: A two-step clean uses a detergent first, then a disinfectant. The guide names two disinfectant choices for the disinfection step after the detergent clean: a TGA-listed product for hospital use that works against viruses, or a chlorine product, for example sodium hypochlorite. A two-in-one clean relies on one product that merges both jobs: either a TGA-listed product effective against viruses, or a detergent blended with hypochlorite. Your facility policy chooses the approach. Follow the label for dilution and contact time. The guide gives no dilution figure, and some organisations do not allow bleach at all, so check the facility list rather than relying on memory.

### `curriculum/shared/healthcare/HLT-11.json`

- `instruction/2/body` (text changed)
  - Old: Launder cloths after each use, and discard any that cannot be washed. Take a fresh cloth into every new area. Reusable mop heads are washed hot after each use. The learner guide gives a laundering temperature of 90 degrees Celsius, which has not yet been confirmed for this use and is not adopted here; follow the laundering standard your facility sets, so check with the relevant regulator before relying on this point. Non-disposable items, for example stethoscopes, medical equipment, hoists, slings, walking frames, trolleys and trays, are cleaned between each client. Use the manufacturer instructions for the product and method, and check the product before you apply it, because the manufacturer may list unsuitable methods and products. Protective wraps and covers can shield awkward items like keyboards, and each one is replaced between clients.
  - New: Launder cloths after each use, and discard any that cannot be washed. Take a fresh cloth into every new area. Reusable mop heads are washed hot after each use. Non-disposable items, for example stethoscopes, medical equipment, hoists, slings, walking frames, trolleys and trays, are cleaned between each client. Use the manufacturer instructions for the product and method, and check the product before you apply it, because the manufacturer may list unsuitable methods and products. Protective wraps and covers can shield awkward items like keyboards, and each one is replaced between clients.

### `curriculum/shared/healthcare/HLT-12.json`

- `instruction/3/body` (text changed)
  - Old: Blood-borne viruses such as hepatitis B, hepatitis C and HIV can be transmitted through contact with blood. Prompt reporting lets the employer arrange counselling, testing and treatment where these are needed. Decisions about testing timing, follow-up and treatment belong to clinicians and the workplace occupational health process. The guide gives follow-up timing for testing; that timing has not yet been confirmed and is not adopted here, so check with the relevant regulator before relying on this point. Keep the identity of the source person private, and share it only with those who need it for the response.
  - New: Blood-borne viruses such as hepatitis B, hepatitis C and HIV can be transmitted through contact with blood. Prompt reporting lets the employer arrange counselling, testing and treatment where these are needed. Decisions about testing timing, follow-up and treatment belong to clinicians and the workplace occupational health process. Keep the identity of the source person private, and share it only with those who need it for the response.

### `curriculum/shared/healthcare/HLT-13.json`

- `instruction/1/body` (text changed)
  - Old: Spotting a hazard at work means you are obliged to report it. The guide treats this as a legal duty. Write up a hazard report, then hand it to the supervisor or the WHS representative. The duties under work health and safety law vary by state and territory, so the exact duty has not yet been confirmed here and check with the relevant regulator before relying on this point. A hazard report should give the type of hazard, its location, the risk it poses, who is at risk and the action taken. For urgent hazards, speak to the supervisor first and then complete the written report.
  - New: Spotting a hazard at work means you are obliged to report it. The guide treats this as a legal duty. Write up a hazard report, then hand it to the supervisor or the WHS representative. A hazard report should give the type of hazard, its location, the risk it poses, who is at risk and the action taken. For urgent hazards, speak to the supervisor first and then complete the written report.

### `curriculum/shared/healthcare/OTI-01.json`

- `instruction/2/body` (text changed)
  - Old: Beyond the baseline, the same document also lists extra measures for three routes, and gives size figures for two of them. The learner guide gives no size figures for those routes. The figures have not yet been confirmed for Australian use, and this lesson does not rely on them, so check with the relevant regulator before relying on this point. The additional measures for a particular case come from the theatre infection-control plan that the clinical team sets. The learner guide lists possible measures such as isolation, special ventilation, enhanced cleaning and extra protective items (see “Enhanced cleaning under added controls for infection spread” and “Terminal cleaning after transmission-based precautions”).
  - New: Beyond the baseline, the same document also lists extra measures for three routes, and gives size figures for two of them. The learner guide gives no size figures for those routes. The additional measures for a particular case come from the theatre infection-control plan that the clinical team sets. The learner guide lists possible measures such as isolation, special ventilation, enhanced cleaning and extra protective items (see “Enhanced cleaning under added controls for infection spread” and “Terminal cleaning after transmission-based precautions”).
- `commonErrors/1/prevention` (text changed)
  - Old: Use the case plan and the learner guide. The size figures have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Use the case plan and the learner guide.

### `curriculum/shared/healthcare/OTI-02.json`

- `instruction/4/body` (text changed)
  - Old: Sharps containers must be approved, puncture-resistant and water-proof, clearly labelled, and usable with one hand. The learner guide names AS 4031 for these containers, which has not yet been confirmed here, so check with the relevant regulator before relying on this point. The theatre document says to close a container when it is three-quarters full. That figure is not an Australian rule and is not adopted. Use the facility fill line. Do not reopen a sealed container, and do not place a sharps container where it blocks cleaning. Sharps waste leaves the site with a licensed operator, who destroys it by incineration.
  - New: Sharps containers must be approved, puncture-resistant and water-proof, clearly labelled, and usable with one hand. The theatre document says to close a container when it is three-quarters full. That figure is not an Australian rule and is not adopted. Use the facility fill line. Do not reopen a sealed container, and do not place a sharps container where it blocks cleaning. Sharps waste leaves the site with a licensed operator, who destroys it by incineration.

### `curriculum/shared/healthcare/OTI-03.json`

- `instruction/1/body` (text changed)
  - Old: Scrubbed staff face the greatest splash risk. The theatre document recommends fluid-resistant face masks, which give both an airborne barrier and splash protection. For heavy contamination it advises gowns that are impermeable, with waterproof sleeves that reach well down the arm and a front panel covering the full length of the body; for scrubbed staff losing a lot of fluid it suggests plastic aprons; and for the eyes it names goggles or a face shield that covers the whole face. It names AS 3789.6 for gown fabric; that name has not yet been confirmed here, so check with the relevant regulator before relying on this point. Everyone who wears protective items is trained in their fit and use, and the equipment is checked, maintained and restocked so that it is always available.
  - New: Scrubbed staff face the greatest splash risk. The theatre document recommends fluid-resistant face masks, which give both an airborne barrier and splash protection. For heavy contamination it advises gowns that are impermeable, with waterproof sleeves that reach well down the arm and a front panel covering the full length of the body; for scrubbed staff losing a lot of fluid it suggests plastic aprons; and for the eyes it names goggles or a face shield that covers the whole face. Everyone who wears protective items is trained in their fit and use, and the equipment is checked, maintained and restocked so that it is always available.

### `curriculum/shared/healthcare/OTI-04.json`

- `instruction/3/body` (text changed)
  - Old: Wipe blood and any other organic matter from kit, walls and floors promptly. Before instruments travel to central processing in a sealed container, knock off heavy soil in the theatre. Use mechanical washing where practicable. If machine washing is not possible, wash by hand in a basin of warm detergent solution, never beneath a running tap. The learner guide sets a ceiling of thirty-five degrees for preliminary cleaning. That figure has not yet been confirmed here and is quoted only as the learner guide own figure, so check with the relevant regulator before relying on this point. Immerse instruments before scrubbing, and never scrub them while any part of them sits above the water.
  - New: Wipe blood and any other organic matter from kit, walls and floors promptly. Before instruments travel to central processing in a sealed container, knock off heavy soil in the theatre. Use mechanical washing where practicable. If machine washing is not possible, wash by hand in a basin of warm detergent solution, never beneath a running tap. The learner guide sets a ceiling of thirty-five degrees for preliminary cleaning. Immerse instruments before scrubbing, and never scrub them while any part of them sits above the water.

### `curriculum/shared/job-management/TPL-06.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pre-start hazard checks are a control, not paperwork. If a hazard cannot be managed, the affected task does not start. Requirements for specific tasks have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Pre-start hazard checks are a control, not paperwork. If a hazard cannot be managed, the affected task does not start.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Some tasks on a job may be licensed or authorised work. The checklist records that the person was authorised. It does not grant or confirm a licence, and the licence requirement for each task has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Some tasks on a job may be licensed or authorised work. The checklist records that the person was authorised.

### `curriculum/shared/marketing/BP-02.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Customer information, including names, addresses, access codes, keys and photos, should be collected only where needed, kept secure, and not used for other purposes without consent. Privacy Act 1988 obligations apply to some small businesses depending on turnover and other factors; whether they apply to your business has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Customer information, including names, addresses, access codes, keys and photos, should be collected only where needed, kept secure, and not used for other purposes without consent.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Advertising claims about cleaning results, environmental impact or safety must be accurate. Australian consumer law applies to advertising. The specific guidance has not yet been confirmed and must be checked before claims are published.
  - New: Advertising claims about cleaning results, environmental impact or safety must be accurate. Australian consumer law applies to advertising.

### `curriculum/shared/marketing/BP-04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Advertising claims about products, safety and environmental benefit are subject to Australian consumer law. The specific requirements and guidance have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Advertising claims about products, safety and environmental benefit are subject to Australian consumer law.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Chemicals must be used as stated on the label and the safety data sheet, with the PPE listed there. Mixing products, or using them outside their stated uses, is a hazard. Follow the state or territory work health and safety rules for hazardous chemicals; the local detail has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Chemicals must be used as stated on the label and the safety data sheet, with the PPE listed there. Mixing products, or using them outside their stated uses, is a hazard. Follow the state or territory work health and safety rules for hazardous chemicals.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Rules on vehicle signage and vehicle advertising vary by state or territory and have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Rules on vehicle signage and vehicle advertising vary by state or territory, so check with the relevant regulator before relying on this point.

### `curriculum/shared/marketing/CP-01.json`

- `workedExamples/0/reasoning` (text changed)
  - Old: He can approach the strata manager about the common-area works, because the notice is public and the contact details are published for business use. The message names the notice, says how he learned of it, offers one specific item he could handle on the same visit, and asks one question. Because it is an email, he checks the Spam Act requirements in current ACMA guidance before sending, since the exact wording has not yet been confirmed, so check with the relevant regulator before relying on this point. He does not contact individual owners or tenants using any private details, and he does not enter the common area without an invitation.
  - New: He can approach the strata manager about the common-area works, because the notice is public and the contact details are published for business use. The message names the notice, says how he learned of it, offers one specific item he could handle on the same visit, and asks one question. He does not contact individual owners or tenants using any private details, and he does not enter the common area without an invitation.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Commercial electronic messages, including email and text, are regulated by the Spam Act 2003 (Cth). ACMA publishes guidance on it. The exact wording of the requirements has not yet been confirmed, so read the current ACMA guidance before you send any message and check with the relevant regulator before relying on this point.
  - New: Commercial electronic messages, including email and text, are regulated by the Spam Act 2003 (Cth). ACMA publishes guidance on it.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Information on a public listing or a public notice is not permission to contact a person about anything. Use only contact details published for business use, keep them secure, and stop using them when someone objects. The privacy law requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Information on a public listing or a public notice is not permission to contact a person about anything. Use only contact details published for business use, keep them secure, and stop using them when someone objects.

### `curriculum/shared/marketing/CP-02.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Referral rewards and partner payments may carry tax, contract and insurance implications. Check the arrangement with an adviser before you start. The rules that apply have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Referral rewards and partner payments may carry tax, contract and insurance implications. Check the arrangement with an adviser before you start.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Contact details collected at events or meetings are personal information. Use them only for the purpose the person agreed to. The privacy law requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Contact details collected at events or meetings are personal information. Use them only for the purpose the person agreed to.

### `curriculum/shared/marketing/CP-03.json`

- `instruction/4/body` (text changed)
  - Old: An email list lets you contact people who chose to hear from you again. Offer a useful resource, such as a seasonal checklist, in exchange for an email address, and make the sign-up a clear, separate choice that is not pre-ticked. The sign-up should say what you will send and how often. Every commercial message must identify you as the sender and include a working way to unsubscribe, and you should act on each unsubscribe promptly. The rules come from the Spam Act 2003 (Cth) and ACMA guidance. The wording used has not yet been confirmed, so check current ACMA guidance before you launch the list. “Finding your first customers through direct, consent-based outreach” covers consent and spam rules in more detail.
  - New: An email list lets you contact people who chose to hear from you again. Offer a useful resource, such as a seasonal checklist, in exchange for an email address, and make the sign-up a clear, separate choice that is not pre-ticked. The sign-up should say what you will send and how often. Every commercial message must identify you as the sender and include a working way to unsubscribe, and you should act on each unsubscribe promptly. The rules come from the Spam Act 2003 (Cth) and ACMA guidance. “Finding your first customers through direct, consent-based outreach” covers consent and spam rules in more detail.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Commercial electronic messages, including email, are regulated by the Spam Act 2003 (Cth). The requirements have not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm them against current ACMA guidance before sending.
  - New: Commercial electronic messages, including email, are regulated by the Spam Act 2003 (Cth). Confirm them against current ACMA guidance before sending.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Do not advertise licensed or authorised work that you do not hold the licence for, such as electrical, gas or other restricted work. This lesson does not grant any licence, and the state and territory rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Do not advertise licensed or authorised work that you do not hold the licence for, such as electrical, gas or other restricted work.

### `curriculum/shared/marketing/CP-04.json`

- `instruction/0/body` (text changed)
  - Old: The best time to ask for a review or referral is after the client has confirmed that the result is right, usually at sign-off or when the invoice is paid. Ask in one sentence, name the next step you would like, such as a review or the name of one person who might need the service, and make it easy to decline. Record what you asked and what the client said. Do not write reviews for clients, do not screen unhappy clients out of requests in a way that hides complaints, and check the terms of any review platform before offering any incentive. Those platform terms have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The best time to ask for a review or referral is after the client has confirmed that the result is right, usually at sign-off or when the invoice is paid. Ask in one sentence, name the next step you would like, such as a review or the name of one person who might need the service, and make it easy to decline. Record what you asked and what the client said. Do not write reviews for clients, do not screen unhappy clients out of requests in a way that hides complaints, and check the terms of any review platform before offering any incentive.
- `instruction/2/body` (text changed)
  - Old: Schedule a check-in after a period that suits the work. For a clean or a repair this may be about ninety days. For a pool or a garden it may be after the next seasonal visit. The check asks whether the result still holds, whether anything has changed and whether there is other work to quote. Keep it short and useful, record what the client said, and close the loop with a reply. If the check is sent by email or text, it is a commercial message, and the electronic message rules in “Online presence: community groups, profiles and consent-based content” apply. Those rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Schedule a check-in after a period that suits the work. For a clean or a repair this may be about ninety days. For a pool or a garden it may be after the next seasonal visit. The check asks whether the result still holds, whether anything has changed and whether there is other work to quote. Keep it short and useful, record what the client said, and close the loop with a reply. If the check is sent by email or text, it is a commercial message, and the electronic message rules in “Online presence: community groups, profiles and consent-based content” apply.
- `instruction/4/body` (text changed)
  - Old: A referral reward works best when the client knows the terms before they refer someone. Decide what you will offer, such as a credit on the next service or a small thank-you, and write down the condition for payment, which is normally that the referred person has completed a paid job. Tell the referrer the terms, keep a record of each referral and whether the reward was paid, and never promise a reward you cannot deliver. Keep the arrangement simple and fair. Check any cash-based reward, and its tax or contract effect, with an adviser before you start. The rules that apply have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A referral reward works best when the client knows the terms before they refer someone. Decide what you will offer, such as a credit on the next service or a small thank-you, and write down the condition for payment, which is normally that the referred person has completed a paid job. Tell the referrer the terms, keep a record of each referral and whether the reward was paid, and never promise a reward you cannot deliver. Keep the arrangement simple and fair. Check any cash-based reward, and its tax or contract effect, with an adviser before you start.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Review platforms and referral programmes can have their own rules on incentives. Check those rules before offering any reward. The platform rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Review platforms and referral programmes can have their own rules on incentives. Check those rules before offering any reward.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Check-in and re-contact messages sent by email or text are commercial electronic messages under the Spam Act 2003 (Cth). The requirements have not yet been confirmed, so check current ACMA guidance.
  - New: Check-in and re-contact messages sent by email or text are commercial electronic messages under the Spam Act 2003 (Cth).

### `curriculum/shared/marketing/MP-01.json`

- `instruction/4/body` (text changed)
  - Old: A segment is only useful if you know roughly how many people or businesses fit it. Count from a source you can name and date, such as a local council figure, an official statistical release or your own records, and write the year beside the number. Then apply a growth assumption and show the arithmetic. Compound growth over a number of years is calculated as the end value divided by the start value, raised to the power of one over the number of years, minus one. The sample plan this lesson draws on gave a potential-customer count and a growth rate for an earlier United States market. Those figures are removed here: they are not Australian and are not current. Use the method only: a start count, an end count, the number of years and a growth rate calculated from a source you can name and date. Any Australian market size has not yet been confirmed in this lesson and must come from a dated source.
  - New: A segment is only useful if you know roughly how many people or businesses fit it. Count from a source you can name and date, such as a local council figure, an official statistical release or your own records, and write the year beside the number. Then apply a growth assumption and show the arithmetic. Compound growth over a number of years is calculated as the end value divided by the start value, raised to the power of one over the number of years, minus one. The sample plan this lesson draws on gave a potential-customer count and a growth rate for an earlier United States market. Those figures are removed here: they are not Australian and are not current. Use the method only: a start count, an end count, the number of years and a growth rate calculated from a source you can name and date.

### `curriculum/shared/marketing/MP-02.json`

- `instruction/3/body` (text changed)
  - Old: A channel can only be measured if each enquiry is tagged. Ask every new customer at booking how they heard about you, and record the answer against a fixed list such as brochure, club, referral, newspaper, website or other. Keep the other category small and review it each month. Unexplained budget lines hide the same problem. The sample plan put most of its budget into a single line labelled only other, so that line could not be judged until it was broken into named activities. The plan's amounts are removed here because they are United States figures. Australian budget benchmarks have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: A channel can only be measured if each enquiry is tagged. Ask every new customer at booking how they heard about you, and record the answer against a fixed list such as brochure, club, referral, newspaper, website or other. Keep the other category small and review it each month. Unexplained budget lines hide the same problem. The sample plan put most of its budget into a single line labelled only other, so that line could not be judged until it was broken into named activities. The plan's amounts are removed here because they are United States figures.
- `instruction/4/body` (text changed)
  - Old: Set a target for each measure, such as a maximum cost per new customer, and review the channel table on a fixed day each month. The sample plan set a marketing objective for reducing its customer acquisition cost each year. That was an early 2000s United States target, and its size is removed here. Use the wording only: a direction, a size and a period. Any Australian target size has not yet been confirmed until it is set from your own records, so check with the relevant regulator before relying on this point. Each review should end with a decision for each channel: keep, change or stop, recorded with its reason.
  - New: Set a target for each measure, such as a maximum cost per new customer, and review the channel table on a fixed day each month. The sample plan set a marketing objective for reducing its customer acquisition cost each year. That was an early 2000s United States target, and its size is removed here. Use the wording only: a direction, a size and a period. Each review should end with a decision for each channel: keep, change or stop, recorded with its reason.

### `curriculum/shared/marketing/MP-03.json`

- `instruction/3/body` (text changed)
  - Old: Before a referral scheme goes live, check three things. First, an electronic message that promotes a service can be a commercial electronic message under the Spam Act 2003 (Cth), and that includes a message a customer forwards on the business's behalf. Second, reward terms and promotional claims must not mislead customers under the Australian Consumer Law. Third, some reward or prize schemes can fall under state or territory promotion rules. The specifics of each rule have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Check them against current official sources before any scheme goes live, and record the check and its date.
  - New: Before a referral scheme goes live, check three things. First, an electronic message that promotes a service can be a commercial electronic message under the Spam Act 2003 (Cth), and that includes a message a customer forwards on the business's behalf. Second, reward terms and promotional claims must not mislead customers under the Australian Consumer Law. Third, some reward or prize schemes can fall under state or territory promotion rules. Check them against current official sources before any scheme goes live, and record the check and its date.
- `summary/2` (text changed)
  - Old: Check the consumer and messaging rules before launch. Their specifics have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Check the consumer and messaging rules before launch.

### `curriculum/shared/marketing/SHR-PLN-04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Growth into a new service or a new market may need a licence, a registration, a change to the insurance policy or a different contract. This lesson does not grant any authority to do regulated work, and those requirements have not yet been confirmed here.
  - New: Growth into a new service or a new market may need a licence, a registration, a change to the insurance policy or a different contract.

### `curriculum/shared/marketing/TPL-03.json`

- `instruction/1/body` (text changed)
  - Old: Start from the target customer table in the business plan. For each segment, write what the customer needs, where they look for a provider and why they would pick this business over another. Then choose three channels that reach those people. For each channel, state the reason, the cost basis (a fee, staff time or materials) and the person responsible. Direct contact should only go to people who have agreed to receive it or who already have a relationship with the business. Electronic messaging and privacy rules apply to outreach. The requirements have not yet been confirmed, so check current federal rules before running any campaign.
  - New: Start from the target customer table in the business plan. For each segment, write what the customer needs, where they look for a provider and why they would pick this business over another. Then choose three channels that reach those people. For each channel, state the reason, the cost basis (a fee, staff time or materials) and the person responsible. Direct contact should only go to people who have agreed to receive it or who already have a relationship with the business. Electronic messaging and privacy rules apply to outreach.

### `curriculum/shared/nhs-sop/NHS-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: The Australian reference for infection control in healthcare and residential care is the NHMRC guideline (2019 edition), as cited in the existing aged-care lessons. This lesson does not restate the guideline's clauses. The specific clause on environmental cleaning has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The Australian reference for infection control in healthcare and residential care is the NHMRC guideline (2019 edition), as cited in the existing aged-care lessons. This lesson does not restate the guideline's clauses.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The UK cleaning procedure uses UK-only standards, inspection programmes, colour codes and cleaning frequencies. None of these are applied as Australian facts in this lesson. Australian equivalents for each have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The UK cleaning procedure uses UK-only standards, inspection programmes, colour codes and cleaning frequencies. None of these are applied as Australian facts in this lesson.

### `curriculum/shared/nhs-sop/NHS-02.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Enhanced work often uses stronger products, plug-in machines or work above floor level. Follow the product label, the safety data sheet and the site rules for each. The state or territory WHS duties that apply to this work have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Enhanced work often uses stronger products, plug-in machines or work above floor level. Follow the product label, the safety data sheet and the site rules for each.

### `curriculum/shared/nhs-sop/NHS-03.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: The WHS duties that apply to the business, the principal contractor and the contractor are set out in the general duties lesson (shared/team/“WHS duties and consultation”, checked 2026-11-02 as recorded there). Who holds each duty on a particular site has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The WHS duties that apply to the business, the principal contractor and the contractor are set out in the general duties lesson (shared/team/“WHS duties and consultation”, checked 2026-11-02 as recorded there).
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Some specialist tasks, such as work at height on powered platforms or work with certain hazardous materials, may need a licence or authorisation in some states and territories. This lesson does not grant or confirm any licence. The state rule has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Some specialist tasks, such as work at height on powered platforms or work with certain hazardous materials, may need a licence or authorisation in some states and territories. This lesson does not grant or confirm any licence.

### `curriculum/shared/nhs-sop/NHS-04.json`

- `instruction/1/body` (text changed)
  - Old: Attending a session shows the person received information. Competence is the demonstrated ability to carry out a task to the standard, and a supervisor records it by observation. The UK source refers to certificated competence through a UK qualification. That qualification is not an Australian one, and an Australian equivalent has not yet been confirmed here, so check with the relevant regulator before relying on this point. This lesson therefore uses observation-based competence records, which work in any setting.
  - New: Attending a session shows the person received information. Competence is the demonstrated ability to carry out a task to the standard, and a supervisor records it by observation. The UK source refers to certificated competence through a UK qualification. This lesson therefore uses observation-based competence records, which work in any setting.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: The UK source names its own training stages and a UK qualification. The qualification is not an Australian one and is not used in this lesson. Australian nationally recognised training pathways for cleaning have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: The UK source names its own training stages and a UK qualification. The qualification is not an Australian one and is not used in this lesson.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The WHS duty to inform, train and supervise workers is set out in the general duties lesson (shared/team/“WHS duties and consultation”). The specific training duty for each site has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The WHS duty to inform, train and supervise workers is set out in the general duties lesson (shared/team/“WHS duties and consultation”).

### `curriculum/shared/operations/F13-L01.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Discharge of wash water and waste is regulated by councils, water authorities and state or territory rules, which have not yet been confirmed in this lesson.
  - New: Discharge of wash water and waste is regulated by councils, water authorities and state or territory rules.

### `curriculum/shared/operations/F13-L04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Water-use restrictions and trade waste discharge rules are set by water authorities, councils and state or territory law, and must be checked for each location. They have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Water-use restrictions and trade waste discharge rules are set by water authorities, councils and state or territory law, and must be checked for each location.

### `curriculum/shared/operations/F18-L01.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Transport of some products may be subject to dangerous goods rules in some states and territories. Those rules have not yet been confirmed in this lesson and must be checked before transport.
  - New: Transport of some products may be subject to dangerous goods rules in some states and territories.

### `curriculum/shared/operations/F20-L06.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Equipment must be maintained so that it is safe, and an item with a safety-related fault must not be used until it is repaired or retired, under the model work health and safety duties. Specific maintenance and retirement requirements depend on the equipment and the state or territory and have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Equipment must be maintained so that it is safe, and an item with a safety-related fault must not be used until it is repaired or retired, under the model work health and safety duties.

### `curriculum/shared/operations/MP-05.json`

- `instruction/3/body` (text changed)
  - Old: Add the segment totals and confirm that they equal the grand total. The sample plan's forecast figures are removed here because they are United States figures from the early 2000s. Use the check only: add the segment totals, confirm they equal the grand total, then compare growth from year to year using your own dated figures. Australian forecast figures and growth benchmarks have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Add the segment totals and confirm that they equal the grand total. The sample plan's forecast figures are removed here because they are United States figures from the early 2000s. Use the check only: add the segment totals, confirm they equal the grand total, then compare growth from year to year using your own dated figures.

### `curriculum/shared/operations/MP-06.json`

- `instruction/2/body` (text changed)
  - Old: Divide the total for a cost group by the sales for the same year. The same plan's marketing budget rose as a share of sales over the period. Its percentages are removed here because they are United States figures. The share rises when the budget grows faster than sales, and that pattern is worth questioning in any plan. Australian budget percentages for cleaning businesses have not yet been confirmed and are not given in this lesson, so check with the relevant regulator before relying on this point.
  - New: Divide the total for a cost group by the sales for the same year. The same plan's marketing budget rose as a share of sales over the period. Its percentages are removed here because they are United States figures. The share rises when the budget grows faster than sales, and that pattern is worth questioning in any plan.

### `curriculum/shared/operations/MP-07.json`

- `instruction/4/body` (text changed)
  - Old: The sample plan set a quarterly objective for repeat customers. That rate is removed here as a United States figure. Compounding is the point: a rate applied each period multiplies, it does not simply add. Targets are easy to misread, so check whether each is per period, compounded or measured against the same base. Any Australian target rate has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: The sample plan set a quarterly objective for repeat customers. That rate is removed here as a United States figure. Compounding is the point: a rate applied each period multiplies, it does not simply add. Targets are easy to misread, so check whether each is per period, compounded or measured against the same base.

### `curriculum/shared/operations/PRO-02.json`

- `instruction/2/body` (text changed)
  - Old: A usable form has a reference number, a date, the site, the name of the person completing it, the item or task, the quantity or result, and a signature or initials. Limit each form to what its question needs. Put the most important field first. Use tick boxes for routine answers and free text only for exceptions. Avoid personal identifiers you do not need. The sample incident and appraisal forms include a personal number field. Do not copy a national identity number field into any form unless a clear legal need has been confirmed, which has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A usable form has a reference number, a date, the site, the name of the person completing it, the item or task, the quantity or result, and a signature or initials. Limit each form to what its question needs. Put the most important field first. Use tick boxes for routine answers and free text only for exceptions. Avoid personal identifiers you do not need. The sample incident and appraisal forms include a personal number field. Do not copy a national identity number field into any form unless a clear legal need has been confirmed.
- `instruction/5/body` (text changed)
  - Old: The sample uses reference codes made from an operations prefix, a form type and a number. A numbering pattern works only if one person controls it. Keep a form register with the reference, the current version, the owner, the frequency, the place where completed forms are filed and the retention period. Retention periods depend on record-keeping rules, which have not yet been confirmed, so check with the relevant regulator before relying on this point. Withdraw old versions from the site and date every new version.
  - New: The sample uses reference codes made from an operations prefix, a form type and a number. A numbering pattern works only if one person controls it. Keep a form register with the reference, the current version, the owner, the frequency, the place where completed forms are filed and the retention period. Withdraw old versions from the site and date every new version.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Forms can hold personal information, including names, contact details and health-related notes. Collect only what is needed, store it securely, and limit access. Whether the Privacy Act 1988 applies to your business depends on turnover and other factors, and has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Forms can hold personal information, including names, contact details and health-related notes. Collect only what is needed, store it securely, and limit access.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Record-keeping and retention periods for workplace, payroll and tax records have not yet been confirmed, so check with the relevant regulator before relying on this point. Check with the relevant authority before setting any retention period.
  - New: Record-keeping and retention periods for workplace. Check with the relevant authority before setting any retention period.

### `curriculum/shared/operations/TPL-05.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Where a task is licensed or authorised, the SOP must name the authorisation requirement. The SOP does not grant or confirm it. The authorising body and its requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Where a task is licensed or authorised, the SOP must name the authorisation requirement. The SOP does not grant or confirm it.

### `curriculum/shared/operations/additional-specialist-services-L01.json`

- `instruction/5/body` (text changed)
  - Old: Licence notice: This lesson does not grant a licence, permit or authority to do any work. Some tasks that appear in a service request need a licence, a permit or a specific authorisation in some states and territories. Which licence applies to a given task has not yet been confirmed in this lesson, so check the rules for the state or territory where the work is done and any rules your employer or insurer has set. Completing this lesson does not make a worker competent or authorised for any regulated task.
  - New: Licence notice: This lesson does not grant a licence, permit or authority to do any work. Some tasks that appear in a service request need a licence, a permit or a specific authorisation in some states and territories. Completing this lesson does not make a worker competent or authorised for any regulated task.
- `summary/5` (deleted item)
  - Old: This lesson does not grant any licence or authority for regulated work, and licence rules have not yet been confirmed where marked.
  - New: [element removed]

### `curriculum/shared/outdoor-garden/garden-cleanups-L06.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Electrical work licensing differs between states and territories. Which tasks need a licence, and which licence class applies, has not been confirmed for each jurisdiction in this draft.
  - New: Electrical work licensing differs between states and territories.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Overhead power lines are a serious electrocution hazard. Safe Work Australia's general guide sets the no-go zone around overhead electric lines as one that no one may enter without written approval from the electricity supply authority, and it says distances for other zones depend on a written risk assessment. This guide is dated July 2014 and its current status has not been confirmed.
  - New: Overhead power lines are a serious electrocution hazard. Safe Work Australia's general guide sets the no-go zone around overhead electric lines as one that no one may enter without written approval from the electricity supply authority, and it says distances for other zones depend on a written risk assessment.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Whether RCD protection is required for a given outdoor outlet, extension lead or tool, and any state rule on that requirement, has not yet been confirmed, so check with the relevant regulator before relying on this point. Check the applicable state or territory rule and the tool manufacturer's instructions.
  - New: Check the applicable state or territory rule and the tool manufacturer's instructions.

### `curriculum/shared/outdoor-garden/garden-cleanups-L07.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: Many Australian native animals and their habitats are protected. The Victorian rules are set out in the point above. Rules in other states and territories have not yet been confirmed, so check with the relevant regulator before relying on this point. Refer any protected-species issue to the supervisor and a competent specialist.
  - New: Many Australian native animals and their habitats are protected. The Victorian rules are set out in the point above. Refer any protected-species issue to the supervisor and a competent specialist.

### `curriculum/shared/outdoor-garden/garden-cleanups-L09.json`

- `instruction/0/body` (text changed)
  - Old: Garden and landscape work moves plants, soil, seed and fragments from one property to another. Weeds and pests spread when a seed head is shaken off, a cutting is dropped in a green-waste bin, or a boot carries soil into the next yard. Some plants are declared or restricted because they damage native bushland, waterways, crops or infrastructure. A declared plant may need to be reported, controlled or destroyed under specific rules, and moving it may be an offence. The rules are set by each state and territory and by local government, and their lists differ. The lists, movement limits and disposal methods in this lesson have not yet been confirmed for each jurisdiction, so check with the relevant regulator before relying on this point. Your job on site is to recognise the risk, stop the spread, and refer the decision to someone with the authority to make it. Identifying a plant is not the same as having authority to remove or treat it.
  - New: Garden and landscape work moves plants, soil, seed and fragments from one property to another. Weeds and pests spread when a seed head is shaken off, a cutting is dropped in a green-waste bin, or a boot carries soil into the next yard. Some plants are declared or restricted because they damage native bushland, waterways, crops or infrastructure. A declared plant may need to be reported, controlled or destroyed under specific rules, and moving it may be an offence. The rules are set by each state and territory and by local government, and their lists differ. Your job on site is to recognise the risk, stop the spread, and refer the decision to someone with the authority to make it. Identifying a plant is not the same as having authority to remove or treat it.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Declared and restricted plant lists, movement rules, reporting duties and disposal methods are set by each state or territory and by local government. They have not yet been confirmed and must be checked for each job location.
  - New: Declared and restricted plant lists, movement rules, reporting duties and disposal methods are set by each state or territory and by local government.

### `curriculum/shared/outdoor-garden/garden-cleanups-L10.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Waste acceptance rules, transport requirements, manifest or booking requirements and the rules for treated timber, liquids and sharps vary by state, territory and local council. They have not yet been confirmed and must be checked for each location.
  - New: Waste acceptance rules, transport requirements, manifest or booking requirements and the rules for treated timber, liquids and sharps vary by state, territory and local council.

### `curriculum/shared/pool/PCS-01.json`

- `instruction/0/body` (text changed)
  - Old: The US start-up guide lists the basic items a pool service carries: pool cleaning tools, the chemical products for pool treatment, a vehicle large enough to carry supplies, business cards, invoices, contract forms, a diary, a laptop and a printer. Those practical items apply in Australia too. Add a test kit for sanitiser and pH, a net and skimmer, a vacuum and hoses, brushes, spare seals, and the storage needed to keep chemicals apart from each other and from the vehicle's fuel and from people. The vehicle must carry the chemicals securely. The requirements for carrying dangerous goods in a vehicle have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: The US start-up guide lists the basic items a pool service carries: pool cleaning tools, the chemical products for pool treatment, a vehicle large enough to carry supplies, business cards, invoices, contract forms, a diary, a laptop and a printer. Those practical items apply in Australia too. Add a test kit for sanitiser and pH, a net and skimmer, a vacuum and hoses, brushes, spare seals, and the storage needed to keep chemicals apart from each other and from the vehicle's fuel and from people. The vehicle must carry the chemicals securely.
- `instruction/1/body` (text changed)
  - Old: The US guide tells the reader to find out which business licence is needed at the local council office. It also says that a licence protects the business legally, lets it buy supplies at trade prices, and makes clients more inclined to hire. Those points describe US local government and US practice, and they do not apply in Australia. In Australia the registration, licence or competence needed for pool work depends on the state or territory, the council, the kind of pool and the task. Those requirements have not yet been confirmed in this lesson and must be checked with the relevant authority. This lesson grants no licence and no registration, and it should never be read as implying either.
  - New: The US guide tells the reader to find out which business licence is needed at the local council office. It also says that a licence protects the business legally, lets it buy supplies at trade prices, and makes clients more inclined to hire. Those points describe US local government and US practice, and they do not apply in Australia. In Australia the registration, licence or competence needed for pool work depends on the state or territory, the council, the kind of pool and the task. This lesson grants no licence and no registration, and it should never be read as implying either.
- `instruction/2/body` (text changed)
  - Old: The US guide describes several training courses for pool operators and technicians, and it lists their fees and certificate terms. Those courses, their certificates, their fees and their validity periods are US-specific. None of them is used or endorsed here. Their names are not repeated as recommendations. Completing any course in Australia is not, by itself, a licence or an authority to operate a pool. Whether any course is needed for a pool operator role in Australia has not yet been confirmed, so check with the relevant regulator before relying on this point. See “Licences, permissions and restricted work” for the general licence rules.
  - New: The US guide describes several training courses for pool operators and technicians, and it lists their fees and certificate terms. Those courses, their certificates, their fees and their validity periods are US-specific. None of them is used or endorsed here. Their names are not repeated as recommendations. Completing any course in Australia is not, by itself, a licence or an authority to operate a pool. See “Licences, permissions and restricted work” for the general licence rules.
- `instruction/3/body` (text changed)
  - Old: The US guide suggests hiring through local advertisements, through friends and family with pool experience, and by using additional help once the business grows. Employment obligations in Australia, including pay, insurance and record keeping, have not yet been confirmed here, so check with the relevant regulator before relying on this point. The guide also suggests delivering business cards to acquaintances, approaching apartment communities, condominium managers, real estate agents and banks that hold properties with pools, and advertising in local newspapers. Those are reasonable channels, and the advertising claims rules that apply to each channel have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. “Marketing, referrals and retention for pool service work” covers the marketing plan.
  - New: The US guide suggests hiring through local advertisements, through friends and family with pool experience, and by using additional help once the business grows. The guide also suggests delivering business cards to acquaintances, approaching apartment communities, condominium managers, real estate agents and banks that hold properties with pools, and advertising in local newspapers. “Marketing, referrals and retention for pool service work” covers the marketing plan.
- `workedExamples/0/reasoning` (text changed)
  - Old: A course certificate is not a licence or an authority to treat water for a client. Whether any course or registration is needed for the planned work has not yet been confirmed and must be checked with the relevant authority. Record the request, mark the treatment work as not yet permitted, and refer to the licence checks.
  - New: A course certificate is not a licence or an authority to treat water for a client. Record the request, mark the treatment work as not yet permitted, and refer to the licence checks.
- `workedExamples/1/reasoning` (text changed)
  - Old: Advise against it. Chemicals must be kept apart from each other and from fuel and people, and the vehicle must carry them securely. The carriage and storage rules have not yet been confirmed for Australia, so the operator should check them before using the vehicle for chemicals. Record the advice.
  - New: Advise against it. Chemicals must be kept apart from each other and from fuel and people, and the vehicle must carry them securely. Record the advice.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: The US guide's licence advice is not applicable in Australia. The business registration, licence or competence needed for pool work has not yet been confirmed and must be checked with the relevant state, territory or council authority.
  - New: The US guide's licence advice is not applicable in Australia.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: US pool operator courses, fees and certificates are not applicable to Australia and are not endorsed. Any Australian training requirement has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: US pool operator courses, fees and certificates are not applicable to Australia and are not endorsed.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Carriage and storage of pool chemicals in vehicles are subject to dangerous goods rules that have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Carriage and storage of pool chemicals in vehicles are subject to dangerous goods rules, so check with the relevant regulator before relying on this point.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Employment, insurance and advertising rules have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Check employment, insurance and advertising rules with the relevant regulator before relying on this point.

### `curriculum/shared/pool/PCS-02.json`

- `instruction/1/body` (text changed)
  - Old: Draft the agreement in a word processor so you can copy and keep it. The guide advises that it should be easy to read, free of errors, and printed for signing. Include the date, the business name and address, the contact details, and the registration or business number held. Where no number is confirmed, leave the field blank rather than inventing one. The guide also asks for the number on every form; the Australian requirement has not yet been confirmed until checked.
  - New: Draft the agreement in a word processor so you can copy and keep it. The guide advises that it should be easy to read, free of errors, and printed for signing. Include the date, the business name and address, the contact details, and the registration or business number held. Where no number is confirmed, leave the field blank rather than inventing one.
- `instruction/3/body` (text changed)
  - Old: State the price for the service, a breakdown if one is needed, and the payment terms: whether payment is monthly, weekly or fortnightly, the method, and how long the client must pay. Price each extra task separately and agree it in writing before it is done. Do not state any price in a template; set your own prices from your costs, as “Pricing pool visits and service packages” describes. Payment terms that apply to consumers in Australia, including any rights to cancel or vary, have not yet been confirmed here and must be checked before use.
  - New: State the price for the service, a breakdown if one is needed, and the payment terms: whether payment is monthly, weekly or fortnightly, the method, and how long the client must pay. Price each extra task separately and agree it in writing before it is done. Do not state any price in a template; set your own prices from your costs, as “Pricing pool visits and service packages” describes.
- `instruction/5/body` (text changed)
  - Old: The agreement should not promise a safety outcome, such as safe water or a compliant barrier, that the service cannot deliver. Insurance cover for the business, public liability and the pool, and any warranty, have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Template contracts and online contract tools named in the guide are US services and are not endorsed. Any template used in Australia must be checked against Australian law by a suitable adviser before use.
  - New: The agreement should not promise a safety outcome, such as safe water or a compliant barrier, that the service cannot deliver. Template contracts and online contract tools named in the guide are US services and are not endorsed. Any template used in Australia must be checked against Australian law by a suitable adviser before use.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Consumer rights, cancellation, variation, payment terms, insurance and warranty clauses have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Each must be checked before use.
  - New: Consumer rights, cancellation, variation, payment terms, insurance and warranty clauses must be checked before use.

### `curriculum/shared/pool/PCS-03.json`

- `instruction/0/body` (text changed)
  - Old: The US guide advises that invoices are used to bill clients and that each form should carry the business's contact information and a licence number. An invoice in Australia should show the business name, contact details, the date, a unique invoice number, the client, a description of the service and the price, and the total. Whether a business number and a goods and services tax treatment must appear, and how, has not yet been confirmed for Australia. Do not add a number to an invoice that you have not confirmed.
  - New: The US guide advises that invoices are used to bill clients and that each form should carry the business's contact information and a licence number. An invoice in Australia should show the business name, contact details, the date, a unique invoice number, the client, a description of the service and the price, and the total. Do not add a number to an invoice that you have not confirmed.
- `instruction/2/body` (text changed)
  - Old: The US guide advises keeping copies of every business dealing, including enquiries about the services, in a file that can be accessed when needed. Use one file per client, with the agreement, the visit records, the invoices, the payments and any correspondence. Keep a calendar of visits so that each visit can be matched to its record. Retain records for the period the Australian rules require, which has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The US guide advises keeping copies of every business dealing, including enquiries about the services, in a file that can be accessed when needed. Use one file per client, with the agreement, the visit records, the invoices, the payments and any correspondence. Keep a calendar of visits so that each visit can be matched to its record.
- `instruction/3/body` (text changed)
  - Old: Customer records contain names, addresses, phone numbers and access details, such as gate codes. Limit access to people who need it, store records securely, and share customer details only for the service. Australian privacy obligations and any notification duties have not yet been confirmed and must be checked before records are shared or stored in a new system.
  - New: Customer records contain names, addresses, phone numbers and access details, such as gate codes. Limit access to people who need it, store records securely, and share customer details only for the service.
- `workedExamples/1/reasoning` (text changed)
  - Old: Do not add a licence number. A registration or licence that has not been confirmed must not be shown as held. Use the business name and the confirmed contact details, and leave any business number field blank until checked against the authority.
  - New: Do not add a licence number. Use the business name and the confirmed contact details, and leave any business number field blank until checked against the authority.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Business number, licence and goods and services tax treatment on invoices have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Do not show a number that has not been confirmed.
  - New: Check business number, licence and goods and services tax treatment on invoices with the relevant regulator before relying on this point. Do not show a number that has not been confirmed.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Privacy, notification and record retention duties have not yet been confirmed for Australia and must be checked before customer records are stored or shared.
  - New: Privacy, notification and record retention duties must be checked before customer records are stored or shared.
- `commonErrors/0/error` (deleted item)
  - Old: Showing a licence or registration number that has not been confirmed
  - New: [item removed]

### `curriculum/shared/pool/PFM-01.json`

- `instruction/2/body` (text changed)
  - Old: A sand filter takes suspended matter above the waterline. It does not disinfect the pool. Disinfection is a separate step, and the chemistry must be kept in balance for the water to stay clear. Chemistry decisions rest with a qualified pool service or the operator. The manufacturer also states a minimum circulation volume per day. That figure is set for the product and for local health rules, so it is not used in this lesson, and the Australian requirement has not yet been confirmed and check with the relevant regulator before relying on this point.
  - New: A sand filter takes suspended matter above the waterline. It does not disinfect the pool. Disinfection is a separate step, and the chemistry must be kept in balance for the water to stay clear. Chemistry decisions rest with a qualified pool service or the operator. The manufacturer also states a minimum circulation volume per day.
- `safetyAndRegulatory/6/point` (text changed)
  - Old: The minimum circulation requirement and the design of the filtration system are set by local health rules and the operator plan. The product manual figure is not used here, and the Australian requirement has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The minimum circulation requirement and the design of the filtration system are set by local health rules and the operator plan.
- `safetyAndRegulatory/7/point` (text changed)
  - Old: This lesson does not grant a licence for pressure equipment or plumbing work. Australian licensing has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: This lesson does not grant a licence for pressure equipment or plumbing work.

### `curriculum/shared/pool/PFM-02.json`

- `instruction/4/body` (text changed)
  - Old: The manual asks that pool chemicals never be stored within a stated distance of the pump, filter or valve, and that they be kept cool, dry and well ventilated. Fumes and spills from chemicals corrode filter and pump parts, and weakened parts can come loose. The distance in the manual is product-specific and is not used here. The Australian separation rule has not yet been confirmed, and “Pool chemical handling and storage at home” sets out the storage practice, so check with the relevant regulator before relying on this point.
  - New: The manual asks that pool chemicals never be stored within a stated distance of the pump, filter or valve, and that they be kept cool, dry and well ventilated. Fumes and spills from chemicals corrode filter and pump parts, and weakened parts can come loose. The distance in the manual is product-specific and is not used here.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Chemical fumes and spills cause corrosive attack. Store chemicals a set distance from the filter unit, pump, and valve, in a ventilated place that stays cool and dry. The distance has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Chemical fumes and spills cause corrosive attack. Store chemicals a set distance from the filter unit, pump, and valve, in a ventilated place that stays cool and dry.
- `safetyAndRegulatory/5/point` (text changed)
  - Old: Installation of pressure equipment and plumbing requires qualified persons under Australian rules, which have not yet been confirmed, so check with the relevant regulator before relying on this point. This lesson grants no licence.
  - New: This lesson grants no licence.

### `curriculum/shared/pool/PFM-04.json`

- `safetyAndRegulatory/5/point` (text changed)
  - Old: The handling, storage and disposal of cleaning chemicals are subject to dangerous goods and work health and safety rules that have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. This lesson grants no licence or permit.
  - New: This lesson grants no licence or permit.

### `curriculum/shared/pool/PFM-05.json`

- `instruction/1/body` (text changed)
  - Old: The manufacturer asks for a residual current device at the supply point. It also describes bonding that ties the motor, the metal parts of the pool, metal conduit and any metal pipework to a single common conductor. That document refers to a United States electrical code, which does not apply in Australia. Its conductor sizes, breaker ratings and voltage-drop tables are specific to the product and to the US, and they are not used here. Australian requirements for protective devices, bonding and the wiring of pool equipment have not yet been confirmed, and a licensed electrician must confirm them on site.
  - New: The manufacturer asks for a residual current device at the supply point. It also describes bonding that ties the motor, the metal parts of the pool, metal conduit and any metal pipework to a single common conductor. That document refers to a United States electrical code, which does not apply in Australia. Its conductor sizes, breaker ratings and voltage-drop tables are specific to the product and to the US, and they are not used here.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: A suitable residual current device must be fitted at the supply point of the unit. The manual's requirement references a United States code that does not apply in Australia. The Australian requirement has not yet been confirmed and must be confirmed by a licensed electrical worker.
  - New: A suitable residual current device must be fitted at the supply point of the unit. The manual's requirement references a United States code that does not apply in Australia.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Bonding of the motor and metal parts of the pool, metal conduit and any metal piping is product- and code-specific. The conductor size in the manual is not applicable in Australia and has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Bonding of the motor and metal parts of the pool, metal conduit and any metal piping is product- and code-specific.
- `safetyAndRegulatory/8/point` (text changed)
  - Old: Electrical connection, wiring, bonding and motor replacement are licensed work. This lesson grants no electrical licence. Australian licensing has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Electrical connection, wiring, bonding and motor replacement are licensed work. This lesson grants no electrical licence.

### `curriculum/shared/pool/PFM-06.json`

- `instruction/3/body` (text changed)
  - Old: The manufacturer's shutdown steps are written for freezing climates. They cover backwashing, setting the valve to winterise, removing the drain plug, draining the pump body and pipework, and protecting the equipment from the weather. Whether frost is a risk depends on the site, and the frost-protection steps have not yet been confirmed for each Australian location, so check with the relevant regulator before relying on this point. Where a shutdown is required, follow the operator's written instruction. Keep the valve on winterise during shutdown so the diverter does not press against its seal.
  - New: The manufacturer's shutdown steps are written for freezing climates. They cover backwashing, setting the valve to winterise, removing the drain plug, draining the pump body and pipework, and protecting the equipment from the weather. Where a shutdown is required, follow the operator's written instruction. Keep the valve on winterise during shutdown so the diverter does not press against its seal.
- `safetyAndRegulatory/6/point` (text changed)
  - Old: Motor servicing is for a motor service centre. Pressure-component repairs are licensed or restricted work under Australian rules, which have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Motor servicing is for a motor service centre.
- `summary/2` (deleted item)
  - Old: Frost and antifreeze rules depend on the site climate and the operator's written instruction, and have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/pool/PHM-01.json`

- `safetyAndRegulatory/3/point` (text changed)
  - Old: This lesson does not grant a licence or authority for chemical, electrical, gas or heater work. Licensing for those tasks in Australia has not yet been confirmed and must be checked with the state or territory regulator before any such task is taken on.
  - New: This lesson does not grant a licence or authority for chemical, electrical, gas or heater work.

### `curriculum/shared/pool/PHM-02.json`

- `instruction/3/body` (text changed)
  - Old: Gates, covers, alarms, moving floors and fences all depend on people. A gate has to be closed and locked, a safety cover has to be placed over the pool once nobody is using it, and a moving floor has to be locked in position. The handbook states that no single product is a foolproof safety device. Treat every barrier as one layer and never describe a pool as safe because it has a cover, fence or device. Barrier design, height, gate and alarm requirements are set by state, territory and council rules. Those rules have not yet been confirmed, so check with the relevant regulator before relying on this point. The pool-standards lessons that cover them are not part of this set.
  - New: Gates, covers, alarms, moving floors and fences all depend on people. A gate has to be closed and locked, a safety cover has to be placed over the pool once nobody is using it, and a moving floor has to be locked in position. The handbook states that no single product is a foolproof safety device. Treat every barrier as one layer and never describe a pool as safe because it has a cover, fence or device. Barrier design, height, gate and alarm requirements are set by state, territory and council rules. The pool-standards lessons that cover them are not part of this set.
- `instruction/5/body` (text changed)
  - Old: The handbook suggests that the owner ask an insurer about public liability cover for the pool plus its equipment. Insurance types and requirements for Australia have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Give the owner drowning-prevention advice in writing, date it, and record the owner's response. Do not give legal or liability advice.
  - New: The handbook suggests that the owner ask an insurer about public liability cover for the pool plus its equipment. Give the owner drowning-prevention advice in writing, date it, and record the owner's response. Do not give legal or liability advice.
- `safetyAndRegulatory/5/point` (text changed)
  - Old: Barrier, fencing, gate and alarm rules have not yet been confirmed for Australia and vary by state, territory and council. This lesson grants no authority to inspect or certify a barrier.
  - New: This lesson grants no authority to inspect or certify a barrier.
- `safetyAndRegulatory/6/point` (text changed)
  - Old: Insurance requirements, including public liability, have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Check insurance requirements, including public liability, with the relevant regulator before relying on this point.

### `curriculum/shared/pool/PHM-03.json`

- `instruction/0/body` (text changed)
  - Old: A sand filter holds back the fine material that the skimmer plus the baskets let through. Water moves down through a bed of sand, then climbs a central pipe on its way back. Debris builds up in the bed over time, the gauge reading goes up, and the return flow shrinks. The UK handbook behind this lesson asks for a daily turnover in the bathing season and gives run times for it. Those times are UK guidance, so they are not used here and they have not yet been confirmed for Australia and check with the relevant regulator before relying on this point. The product manual sets a minimum turnover of its own and defers to local health rules. The operator plan and the equipment maker's manual are the references for run time.
  - New: A sand filter holds back the fine material that the skimmer plus the baskets let through. Water moves down through a bed of sand, then climbs a central pipe on its way back. Debris builds up in the bed over time, the gauge reading goes up, and the return flow shrinks. The UK handbook behind this lesson asks for a daily turnover in the bathing season and gives run times for it. The product manual sets a minimum turnover of its own and defers to local health rules. The operator plan and the equipment maker's manual are the references for run time.
- `safetyAndRegulatory/6/point` (text changed)
  - Old: This lesson does not grant a licence for plumbing, gas or pressure-equipment work. Licensing for that work in Australia has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: This lesson does not grant a licence for plumbing, gas or pressure-equipment work.

### `curriculum/shared/pool/PHM-06.json`

- `instruction/2/body` (text changed)
  - Old: Never move a one chemical into the container meant for another product, and never reuse a used container from a different product. Keep the chemicals in a dry, cool, lockable place and separate each type from the others. The product manual for the filter asks for pool chemicals to be kept a stated distance from the filter, the pump together with the valve. That distance is given in imperial units in the manual, is specific to that product, and has not yet been confirmed for Australia; check the product's own storage rules and its safety data sheet. Keep the store ventilated and away from fuel and heat.
  - New: Never move a one chemical into the container meant for another product, and never reuse a used container from a different product. Keep the chemicals in a dry, cool, lockable place and separate each type from the others. The product manual for the filter asks for pool chemicals to be kept a stated distance from the filter, the pump together with the valve. Keep the store ventilated and away from fuel and heat.
- `instruction/4/body` (text changed)
  - Old: Handling, carrying and storing pool chemicals in quantity can fall under dangerous goods and workplace health and safety rules, which have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. This lesson does not grant a licence, permit or authority to handle, store or transport dangerous goods, and it does not replace the operator's instruction or the product's safety data sheet. Treatment decisions are covered in “Disinfection chemistry and pH interpretation” and “Dosing systems and chlorine-gas prevention”.
  - New: This lesson does not grant a licence, permit or authority to handle, store or transport dangerous goods, and it does not replace the operator's instruction or the product's safety data sheet. Treatment decisions are covered in “Disinfection chemistry and pH interpretation” and “Dosing systems and chlorine-gas prevention”.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Store chemicals in a dry, cool storage that can be locked, separated by type. Keep pool chemicals a set distance from the filter unit, pump, and valve. The distance in the product manual has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Store chemicals in a dry, cool storage that can be locked, separated by type. Keep pool chemicals a set distance from the filter unit, pump, and valve.
- `safetyAndRegulatory/6/point` (text changed)
  - Old: Handling, storage, transport and disposal of pool chemicals are subject to dangerous goods and work health and safety rules that have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. This lesson grants no licence or permit.
  - New: This lesson grants no licence or permit.

### `curriculum/shared/pool/PHM-07.json`

- `instruction/2/body` (text changed)
  - Old: A gas heater has an isolator on the control panel, its own on and off switch, a thermostat, and a gas tap on the supply. Three safety devices protect it. An over-temperature thermostat shuts the heater down when it overheats and resets when it cools. A gas safety shut-off valve closes the supply if the pilot or flame goes out, and the heater then has to be relit. A pressure switch stops the heater when water flow stops and resets once flow returns. Never bypass, tape over or alter these devices. The UK handbook says gas heaters must be fitted by a registered gas fitter under the current rules, including flue size and position, the gas feed and ventilation. Australian rules for that work have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A gas heater has an isolator on the control panel, its own on and off switch, a thermostat, and a gas tap on the supply. Three safety devices protect it. An over-temperature thermostat shuts the heater down when it overheats and resets when it cools. A gas safety shut-off valve closes the supply if the pilot or flame goes out, and the heater then has to be relit. A pressure switch stops the heater when water flow stops and resets once flow returns. Never bypass, tape over or alter these devices. The UK handbook says gas heaters must be fitted by a registered gas fitter under the current rules, including flue size and position, the gas feed and ventilation.
- `instruction/4/body` (text changed)
  - Old: Gas installation, gas connection and flue work are limited to licensed or registered persons. Electrical connection of any heater needs a licensed electrician, who should confirm the supply before installation. Oil and boiler work needs the appropriate qualified trade. This lesson grants no licence, registration or authority to install, connect, service, repair or adjust a heater. Licensing for each of these trades in Australia has not yet been confirmed and must be checked with the relevant state or territory regulator.
  - New: Gas installation, gas connection and flue work are limited to licensed or registered persons. Electrical connection of any heater needs a licensed electrician, who should confirm the supply before installation. Oil and boiler work needs the appropriate qualified trade. This lesson grants no licence, registration or authority to install, connect, service, repair or adjust a heater.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Gas heaters has to be fitted by a registered gas fitter under the current regulations. Flue size, position, gas supply and ventilation are part of that work. The UK requirement is noted; Australian gas-fitting licensing has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Gas heaters has to be fitted by a registered gas fitter under the current regulations. Flue size, position, gas supply and ventilation are part of that work.
- `safetyAndRegulatory/5/point` (text changed)
  - Old: Oil flues must not end near windows or boundaries. Confirm the siting against the applicable rules, which have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Oil flues must not end near windows or boundaries. Confirm the siting against the applicable rules.

### `curriculum/shared/pool/PHM-08.json`

- `safetyAndRegulatory/5/point` (text changed)
  - Old: Wiring, drive and controls of power-operated covers are electrical work. Refer them to a licensed electrician. Australian requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Wiring, drive and controls of power-operated covers are electrical work. Refer them to a licensed electrician.

### `curriculum/shared/pool/PHM-09.json`

- `safetyAndRegulatory/4/point` (text changed)
  - Old: Electrical, gas and heater repairs are restricted to licensed persons. This lesson does not grant that licence. Australian licensing rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Electrical, gas and heater repairs are restricted to licensed persons. This lesson does not grant that licence.

### `curriculum/shared/pool/POM-01.json`

- `safetyAndRegulatory/4/point` (text changed)
  - Old: Textbook numbers and component details are generic or US-based and have not yet been confirmed for Australia until checked against the manufacturer and the operator plan.
  - New: Textbook numbers and component details are generic or US-based and must be checked against the manufacturer and the operator plan.

### `curriculum/shared/pool/POM-02.json`

- `instruction/2/body` (text changed)
  - Old: The sources in this set disagree about target ranges for free chlorine and for pH. The textbook gives generic figures, the UK handbook gives figures for UK pools, and the manufacturer manual gives figures for its own product. None of them is an Australian standard, and this lesson does not set a target. The target for an Australian pool comes from the operator plan and from applicable Australian guidance, which has not yet been confirmed, so check with the relevant regulator before relying on this point. Refer any doubt to the operator.
  - New: The sources in this set disagree about target ranges for free chlorine and for pH. The textbook gives generic figures, the UK handbook gives figures for UK pools, and the manufacturer manual gives figures for its own product. None of them is an Australian standard, and this lesson does not set a target. Refer any doubt to the operator.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Avoid using a textbook, foreign or US target as an Australian target. Target values have not yet been confirmed for Australia and must come from the operator plan.
  - New: Avoid using a textbook, foreign or US target as an Australian target.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Water treatment for a public, commercial or licensed pool may require a licence or authority. This lesson grants none. Australian requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Water treatment for a public, commercial or licensed pool may require a licence or authority. This lesson grants none.

### `curriculum/shared/pool/POM-03.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Do not run a powered tool near the water without a suitable residual current protection, and check the power supply for the tool. The Australian requirement has not yet been confirmed and is set by “Electrical connection, bonding and motor safety for a pool pump”, so check with the relevant regulator before relying on this point.
  - New: Do not run a powered tool near the water without a suitable residual current protection, and check the power supply for the tool.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Brush choice, finish guidance and tool suitability for a specific pool are set by the manufacturer. US guide statements have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Brush choice, finish guidance and tool suitability for a specific pool are set by the manufacturer.

### `curriculum/shared/pool/POM-04.json`

- `instruction/0/body` (text changed)
  - Old: The textbook lists several products used to clean and treat pool water: granular or tablet forms of a chlorine donor, namely trichloroisocyanuric acid and sodium dichloroisocyanurate, which dissolves quickly; hydrochloric acid, liquid chlorine, and an alum-based clarifier. Chlorine donors kill bacteria and algae. Acids lower pH and clean surfaces. Alum is a clarifier that makes fine particles clump so the filter can catch them. The textbook gives a chlorine content for one of the products. That figure has not yet been confirmed for Australia and is not used here, so check with the relevant regulator before relying on this point. Each product has its own hazards, and its safety data sheet is the reference.
  - New: The textbook lists several products used to clean and treat pool water: granular or tablet forms of a chlorine donor, namely trichloroisocyanuric acid and sodium dichloroisocyanurate, which dissolves quickly; hydrochloric acid, liquid chlorine, and an alum-based clarifier. Chlorine donors kill bacteria and algae. Acids lower pH and clean surfaces. Alum is a clarifier that makes fine particles clump so the filter can catch them. The textbook gives a chlorine content for one of the products. Each product has its own hazards, and its safety data sheet is the reference.
- `instruction/4/body` (text changed)
  - Old: Handling, carrying and storing pool chemicals in quantity can fall under dangerous goods and workplace health and safety rules, which have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. This lesson grants no licence or permit to handle, store or carry dangerous goods, and it does not replace the operator's instruction or the safety data sheet.
  - New: This lesson grants no licence or permit to handle, store or carry dangerous goods, and it does not replace the operator's instruction or the safety data sheet.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Storage and handling of pool chemicals in quantity are subject to dangerous goods and work health and safety rules that have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Storage and handling of pool chemicals in quantity are subject to dangerous goods and work health and safety rules, so check with the relevant regulator before relying on this point.

### `curriculum/shared/pool/PSA-01.json`

- `instruction/4/body` (text changed)
  - Old: This is an official South Australian source, and it takes priority over informal, foreign or generic pool advice that conflicts with it. Its figures are aimed at public facilities in SA. Whether the same figures bind a private pool in SA has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Other states and territories have their own rules, and none of them have been checked here. A site operator plan must not conflict with the regulations. Completing this lesson does not give anyone authority to operate a pool.
  - New: This is an official South Australian source, and it takes priority over informal, foreign or generic pool advice that conflicts with it. Its figures are aimed at public facilities in SA. Other states and territories have their own rules, and none of them have been checked here. A site operator plan must not conflict with the regulations. Completing this lesson does not give anyone authority to operate a pool.

### `curriculum/shared/pool/PSA-11.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Public health notification duties for pool-related illness have not yet been confirmed for South Australia in this lesson, so check with the relevant regulator before relying on this point. Follow the operator's written process.
  - New: Follow the operator's written process.

### `curriculum/shared/pool/PVB-01.json`

- `instruction/4/body` (text changed)
  - Old: In Victoria, building pools, spas and their barriers is governed by the Building Act 1993 and the 2018 Building Regulations, which together adopt the NCC. The note points to the 2012 edition of AS 1926.1 for barriers. That text was not read for this lesson, so the standard is cited by name only and its current edition has not yet been confirmed and check with the relevant regulator before relying on this point. Failing to follow the rules during building work is an offence under section sixteen of the Building Act, as the note explains.
  - New: In Victoria, building pools, spas and their barriers is governed by the Building Act 1993 and the 2018 Building Regulations, which together adopt the NCC. The note points to the 2012 edition of AS 1926.1 for barriers. Failing to follow the rules during building work is an offence under section sixteen of the Building Act, as the note explains.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The rules are Victorian. Other states and territories, and the current edition of AS 1926.1, have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The rules are Victorian.

### `curriculum/shared/quality/PRO-03.json`

- `instruction/2/body` (text changed)
  - Old: The sample offers three levels of action: a verbal warning, a written warning, and suspension with referral to human resources. The levels exist for a reason, but each step needs a procedure and a record. Suspension and dismissal carry legal requirements that have not yet been confirmed, and they should be handled with a qualified adviser, so check with the relevant regulator before relying on this point. For most first incidents the right response is feedback, a retraining step and a dated note. Record the response and the reason for it.
  - New: The sample offers three levels of action: a verbal warning, a written warning, and suspension with referral to human resources. The levels exist for a reason, but each step needs a procedure and a record. For most first incidents the right response is feedback, a retraining step and a dated note. Record the response and the reason for it.
- `instruction/3/body` (text changed)
  - Old: An injury, a near miss, a chemical exposure or damage to a client's property is first a safety event. It must be reported, treated and recorded under the workplace safety procedure before any discipline is considered. A disciplinary form does not replace an injury record. Whether an incident must be notified to the state or territory work health and safety regulator has not yet been confirmed and must be checked.
  - New: An injury, a near miss, a chemical exposure or damage to a client's property is first a safety event. It must be reported, treated and recorded under the workplace safety procedure before any discipline is considered. A disciplinary form does not replace an injury record.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Workplace injury and notifiable incident reporting duties apply under state and territory work health and safety laws. Whether a specific event must be notified to the regulator has not yet been confirmed.
  - New: Workplace injury and notifiable incident reporting duties apply under state and territory work health and safety laws.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Disciplinary, suspension and dismissal steps are subject to employment law, including the Fair Work Act 2009 and any applicable award or agreement. These requirements have not yet been confirmed, so check with the relevant regulator before relying on this point. Seek advice from a qualified adviser before any suspension or dismissal.
  - New: Disciplinary, suspension and dismissal steps are subject to employment law, including the Fair Work Act 2009 and any applicable award or agreement. Seek advice from a qualified adviser before any suspension or dismissal.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Health information and performance records are personal information. Handle them securely and limit access. Privacy obligations have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Health information and performance records are personal information. Handle them securely and limit access.

### `curriculum/shared/quality/TPL-07.json`

- `instruction/2/body` (text changed)
  - Old: Follow-up actions turn the report into change. Each action needs an owner, a due date and a closed date, and it should address the cause rather than only the symptom. Check the business incident procedure for who must be told and when. Whether a particular incident must be notified to a regulator depends on the state or territory and on the type of incident. That has not yet been confirmed, so check the current rules with the regulator or a qualified adviser. The report exists to decide what will change, not to assign blame.
  - New: Follow-up actions turn the report into change. Each action needs an owner, a due date and a closed date, and it should address the cause rather than only the symptom. Check the business incident procedure for who must be told and when. Whether a particular incident must be notified to a regulator depends on the state or territory and on the type of incident. The report exists to decide what will change, not to assign blame.

### `curriculum/shared/quality/additional-specialist-services-L12.json`

- `instruction/6/body` (text changed)
  - Old: Licence notice: This lesson does not grant any licence, certificate or authority to perform regulated work, and it does not qualify a worker to sign off licensed work. Whether a specialist must hold a particular licence or registration for a given task depends on the state or territory and has not yet been confirmed in this lesson. Check the licence rules where the work takes place, and make the referral to a provider who holds the relevant authority.
  - New: Licence notice: This lesson does not grant any licence, certificate or authority to perform regulated work, and it does not qualify a worker to sign off licensed work. Check the licence rules where the work takes place, and make the referral to a provider who holds the relevant authority.

### `curriculum/shared/quoting/BP-05.json`

- `instruction/1/body` (text changed)
  - Old: Take the total cost of running the business over a period and divide it by the productive hours in that period. Total cost includes wages with on-costs such as leave and superannuation, vehicle running costs, equipment, consumables, insurance, administration and premises. Productive hours are the hours a crew is doing chargeable work, not the paid hours on a roster. If you pay for 40 hours and 30 of them are chargeable, the cost per productive hour is higher than the hourly wage. Entitlements and on-cost rates depend on the award or agreement that applies, which has not yet been confirmed and must be checked before any figure is used.
  - New: Take the total cost of running the business over a period and divide it by the productive hours in that period. Total cost includes wages with on-costs such as leave and superannuation, vehicle running costs, equipment, consumables, insurance, administration and premises. Productive hours are the hours a crew is doing chargeable work, not the paid hours on a roster. If you pay for 40 hours and 30 of them are chargeable, the cost per productive hour is higher than the hourly wage.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: This is pricing guidance only. Australian consumer law and state or territory fair trading rules apply to quotes and to pricing representations. The specific requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: This is pricing guidance only. Australian consumer law and state or territory fair trading rules apply to quotes and to pricing representations.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Pay rates, allowances and on-costs must follow the award or enterprise agreement that applies to each worker. Which instrument applies, and the current rates, have not yet been confirmed and must be checked with the Fair Work Ombudsman or a qualified adviser before any rate is used.
  - New: Pay rates, allowances and on-costs must follow the award or enterprise agreement that applies to each worker.

### `curriculum/shared/quoting/MP-04.json`

- `instruction/3/body` (text changed)
  - Old: Write the inputs first, each with its source and date. Then compute the contribution margin. Then divide the fixed costs by it. Finally convert the result into a number of jobs at your average job price. The sample plan's fixed cost and variable cost figures are removed here because they are United States figures from 2002. Its break-even figures did not reconcile with its own inputs, so none of them is used. The method is the check: divide fixed costs by the contribution margin, then test the result against inputs you can source. Australian cost figures have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Write the inputs first, each with its source and date. Then compute the contribution margin. Then divide the fixed costs by it. Finally convert the result into a number of jobs at your average job price. The sample plan's fixed cost and variable cost figures are removed here because they are United States figures from 2002. Its break-even figures did not reconcile with its own inputs, so none of them is used. The method is the check: divide fixed costs by the contribution margin, then test the result against inputs you can source.

### `curriculum/shared/quoting/PRO-01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Acid-based products must not be used on surfaces that the safety data sheet and surface guidance do not approve, and must be used with the PPE listed on the safety data sheet. Chemical handling duties under state and territory work health and safety rules apply; the local detail has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Acid-based products must not be used on surfaces that the safety data sheet and surface guidance do not approve, and must be used with the PPE listed on the safety data sheet.

### `curriculum/shared/safety/RAS-01.json`

- `instruction/0/body` (text changed)
  - Old: A risk assessment turns a list of hazards into a decision about what to do first. A hazard that scores high needs a different response from one that scores low, and the score is what lets a supervisor see where effort and authority should go. The register this lesson is built on scores every hazard twice: once for the risk as it stands with the routine controls in place, and once for the residual risk after any further controls are added. Scoring is a trained judgement, written down, so everyone on the team uses the same method and a second person can follow the reasoning. The scheme is a business choice. It is not a legal formula, and whether any particular scheme meets a duty under work health and safety law has not yet been confirmed for each state and territory, so check with the relevant regulator before relying on this point.
  - New: A risk assessment turns a list of hazards into a decision about what to do first. A hazard that scores high needs a different response from one that scores low, and the score is what lets a supervisor see where effort and authority should go. The register this lesson is built on scores every hazard twice: once for the risk as it stands with the routine controls in place, and once for the residual risk after any further controls are added. Scoring is a trained judgement, written down, so everyone on the team uses the same method and a second person can follow the reasoning. The scheme is a business choice.
- `summary/3` (deleted item)
  - Old: The scheme is a business method and does not, by itself, meet any legal duty; that point has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/safety/RAS-03.json`

- `instruction/2/body` (text changed)
  - Old: After the controls are chosen, the hazard is re-scored with the controls in place. This is the residual risk. A residual score that is lower than the starting score is only credible when each control is in place and working. A control that is listed but never shown to the crew, never supplied, or never checked is not in place, and the residual score must not count it. If the residual score is the same as or higher than the starting score, the controls have not worked, and the task must not start until the controls are redefined and re-assessed. The duty to eliminate or minimise risks, and how that duty applies to ranking in a given state or territory, has not yet been confirmed and needs checking against the law where the work happens, so check with the relevant regulator before relying on this point. Completing this lesson does not make a learner the person who decides on controls for a business.
  - New: After the controls are chosen, the hazard is re-scored with the controls in place. This is the residual risk. A residual score that is lower than the starting score is only credible when each control is in place and working. A control that is listed but never shown to the crew, never supplied, or never checked is not in place, and the residual score must not count it. If the residual score is the same as or higher than the starting score, the controls have not worked, and the task must not start until the controls are redefined and re-assessed. Completing this lesson does not make a learner the person who decides on controls for a business.

### `curriculum/shared/safety/RAS-04.json`

- `instruction/2/body` (text changed)
  - Old: When a spill happens, stop the task and keep people away from the area. Use the spill kit and the personal protective equipment named in the register for that product, and only if the operative is trained for the task. Do not rely on a general rule about what to pour onto a spill. Some products must not be diluted with water, and the right response depends on the chemical. Read the spill section of the safety data sheet for that product and follow it. Once the spill is contained, clear it into a closable container, label the container and record the event. Report the spill to the supervisor and note whether the product needs to go to a specific waste stream under local rules, which has not yet been confirmed for each state and territory and must be checked. A spill that cannot be contained with the controls in the register is escalated, and the area is left closed until someone trained has dealt with it.
  - New: When a spill happens, stop the task and keep people away from the area. Use the spill kit and the personal protective equipment named in the register for that product, and only if the operative is trained for the task. Do not rely on a general rule about what to pour onto a spill. Some products must not be diluted with water, and the right response depends on the chemical. Read the spill section of the safety data sheet for that product and follow it. Once the spill is contained, clear it into a closable container, label the container and record the event. A spill that cannot be contained with the controls in the register is escalated, and the area is left closed until someone trained has dealt with it.

### `curriculum/shared/safety/RAS-06.json`

- `instruction/0/body` (text changed)
  - Old: A falls hazard on stairs comes from a missed step, a slippery nosing, a loose stair rod, debris on a landing, or a load carried in a way that blocks sight of the next step. The register treats stair cleaning as a job with its own written plan, so the stair work must follow that plan and not memory. Stair and landing spaces are used with the handrail in hand, and the lift is used where it is the approved access route for the task and the load. Stair and landing lighting is checked before work starts. Bulk items, bins and equipment are not stored on stairs or landings, because they force people to step around them. A damaged stair, handrail or tread is reported to the supervisor and the facilities team, and the affected section stays closed until it is checked. The building owner or duty holder is responsible for maintaining the stairs; the crew's duty is to report and to keep the stairs clear. The allocation of that duty under state and territory law has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A falls hazard on stairs comes from a missed step, a slippery nosing, a loose stair rod, debris on a landing, or a load carried in a way that blocks sight of the next step. The register treats stair cleaning as a job with its own written plan, so the stair work must follow that plan and not memory. Stair and landing spaces are used with the handrail in hand, and the lift is used where it is the approved access route for the task and the load. Stair and landing lighting is checked before work starts. Bulk items, bins and equipment are not stored on stairs or landings, because they force people to step around them. A damaged stair, handrail or tread is reported to the supervisor and the facilities team, and the affected section stays closed until it is checked. The building owner or duty holder is responsible for maintaining the stairs; the crew's duty is to report and to keep the stairs clear.
- `instruction/2/body` (text changed)
  - Old: Elevated work is done only by people who hold training and authorisation from the business for that equipment and that height. This lesson does not authorise anyone to do elevated work and is not a licence or a certificate for that work. Some access equipment and some elevated work may be subject to licensing or to specific rules under state and territory law, and that has not yet been confirmed, so check with the relevant regulator before relying on this point. The register cites a South African standard for elevated-work equipment, which does not apply in Australia and is not carried into this lesson. The Australian standard that applies to step equipment has not yet been confirmed and must be checked before any equipment is chosen.
  - New: Elevated work is done only by people who hold training and authorisation from the business for that equipment and that height. This lesson does not authorise anyone to do elevated work and is not a licence or a certificate for that work. The register cites a South African standard for elevated-work equipment, which does not apply in Australia and is not carried into this lesson.

### `curriculum/shared/safety/RAS-07.json`

- `instruction/1/body` (text changed)
  - Old: Dry sweeping is not used where a damp or wet method can do the job, because it lifts dust into the air. Dusting uses a damp or dry-wipe method chosen for the surface, and the dust is captured on the cloth rather than dispersed. Work top to bottom, so dust falls onto surfaces that are cleaned later. Where a vacuum is needed, use a vacuum with a HEPA filter if the register requires one for the area, and keep its filters and bags in good condition so that fine dust is not blown back into the room. WARNING: Do not blow dust into the air to clear it, and do not shake a cloth or duster in an occupied room. Eye protection is worn where the register requires it, and it must meet the standard the register names for that task. The Australian standard that applies has not yet been confirmed and must be checked.
  - New: Dry sweeping is not used where a damp or wet method can do the job, because it lifts dust into the air. Dusting uses a damp or dry-wipe method chosen for the surface, and the dust is captured on the cloth rather than dispersed. Work top to bottom, so dust falls onto surfaces that are cleaned later. Where a vacuum is needed, use a vacuum with a HEPA filter if the register requires one for the area, and keep its filters and bags in good condition so that fine dust is not blown back into the room. WARNING: Do not blow dust into the air to clear it, and do not shake a cloth or duster in an occupied room. Eye protection is worn where the register requires it, and it must meet the standard the register names for that task.

### `curriculum/shared/safety/RAS-08.json`

- `instruction/0/body` (text changed)
  - Old: Fixed wiring, permanent systems and fixtures are installed, tested and maintained by the building's duty holder and by the people who are licensed or authorised to do that work. The cleaning register tells crew not to touch, alter or interfere with wiring, cables or electrical systems, and to report damage, defects and failures to the supervisor and building facilities team straight away. The reason is that a cleaner who opens a fitting, moves a cable or wets a switch can cause a shock or a fire, and a visual check cannot show whether a system is safe to touch. WARNING: Do not open a switchboard, a power point, a light fitting or a data cabinet, and do not move a cable that appears to be live or damaged. Stop, keep others away and report it. Licence notice: fixed electrical work is licensed or authorised work in many places, and this lesson does not grant any electrical licence or authority to do it. The legal position in each state and territory has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Fixed wiring, permanent systems and fixtures are installed, tested and maintained by the building's duty holder and by the people who are licensed or authorised to do that work. The cleaning register tells crew not to touch, alter or interfere with wiring, cables or electrical systems, and to report damage, defects and failures to the supervisor and building facilities team straight away. The reason is that a cleaner who opens a fitting, moves a cable or wets a switch can cause a shock or a fire, and a visual check cannot show whether a system is safe to touch. WARNING: Do not open a switchboard, a power point, a light fitting or a data cabinet, and do not move a cable that appears to be live or damaged. Stop, keep others away and report it. Licence notice: fixed electrical work is licensed or authorised work in many places, and this lesson does not grant any electrical licence or authority to do it.
- `instruction/1/body` (text changed)
  - Old: Portable equipment brought to site is tested before it arrives, using the formal testing process the business uses for portable equipment, which the register refers to as PAT testing and which is commonly called test and tagging in Australia. The testing method, the interval and the applicable standard have not yet been confirmed and must be checked for the business. Before each use, the operative inspects the machine: the cord, the plug, the casing, the guards and the tag. A defective machine is not used. It is tagged as not fit for use, withdrawn and reported to the supervisor. Crew are trained in the safe use of each machine and follow the manufacturer's instructions. Equipment is never used in a way that the manufacturer does not allow, and sockets and leads are never overloaded.
  - New: Portable equipment brought to site is tested before it arrives, using the formal testing process the business uses for portable equipment, which the register refers to as PAT testing and which is commonly called test and tagging in Australia. Before each use, the operative inspects the machine: the cord, the plug, the casing, the guards and the tag. A defective machine is not used. It is tagged as not fit for use, withdrawn and reported to the supervisor. Crew are trained in the safe use of each machine and follow the manufacturer's instructions. Equipment is never used in a way that the manufacturer does not allow, and sockets and leads are never overloaded.

### `curriculum/shared/safety/RAS-09.json`

- `instruction/1/body` (text changed)
  - Old: Contact with human waste or bodily fluids is a biological hazard. It can spread infection through the mouth, nose, eyes or a cut. The register allows routine crew to clean up small amounts after training, using personal protective equipment and a segregated area. The steps are to keep occupants away from the area, to scrape residues into a closable container, to clean the surface with detergent first, and only then to disinfect. Heavily soiled furnishings may need to be sealed for handling as clinical waste, and whether a given item counts as clinical waste under state or territory waste rules has not yet been confirmed, so check with the relevant regulator before relying on this point. Wash the hands and forearms with warm water and soap, and dry them with disposable towels or a hot-air dryer, after removing the protective equipment. Do not eat, drink or smoke in the area. A cut or graze is covered with a waterproof dressing and washed at once with soap and running water.
  - New: Contact with human waste or bodily fluids is a biological hazard. It can spread infection through the mouth, nose, eyes or a cut. The register allows routine crew to clean up small amounts after training, using personal protective equipment and a segregated area. The steps are to keep occupants away from the area, to scrape residues into a closable container, to clean the surface with detergent first, and only then to disinfect. Wash the hands and forearms with warm water and soap, and dry them with disposable towels or a hot-air dryer, after removing the protective equipment. Do not eat, drink or smoke in the area. A cut or graze is covered with a waterproof dressing and washed at once with soap and running water.

### `curriculum/shared/safety/RAS-10.json`

- `instruction/0/body` (text changed)
  - Old: An infection reaches a person through a route. Usually the route is a contaminated surface, cloth or body fluid, then the hands, then the mouth, nose or eyes. The register's infectious disease entry is based on that route. Its controls work on each step: keeping surfaces clean and disinfecting them in the right order, washing the hands before eating and after touching a contaminated surface, using protective equipment as the register names it, bagging contaminated cloths and equipment, and making sure the work area has good ventilation. The entry was written as a dated document, and its guidance reflects public health advice from the time it was written. The register's historical self-isolation period and any other time-limited advice are not carried into this lesson. WARNING: Current public health advice must be checked with the relevant state or territory health authority before any infection entry is written or changed. That current advice has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: An infection reaches a person through a route. Usually the route is a contaminated surface, cloth or body fluid, then the hands, then the mouth, nose or eyes. The register's infectious disease entry is based on that route. Its controls work on each step: keeping surfaces clean and disinfecting them in the right order, washing the hands before eating and after touching a contaminated surface, using protective equipment as the register names it, bagging contaminated cloths and equipment, and making sure the work area has good ventilation. The entry was written as a dated document, and its guidance reflects public health advice from the time it was written. The register's historical self-isolation period and any other time-limited advice are not carried into this lesson. WARNING: Current public health advice must be checked with the relevant state or territory health authority before any infection entry is written or changed.
- `instruction/2/body` (text changed)
  - Old: Rats and mice are common in service-area waste rooms and near waterways. Their urine can carry the bacteria that cause leptospirosis, which is spread when contaminated water or damp soil reaches a cut, a graze, the eyes or the mouth. The register treats the risk as higher where water collects or where the waste area is near a river. The controls are that the crew has been taught about the water-related hazard, that protective equipment and washing facilities are on site, that cuts and grazes are covered with a waterproof dressing or gloves before work starts, and that any cut is washed at once with soap and running water and covered. Hands, face and forearms are washed before food, drink, cigarettes or phone use. WARNING: Avoid standing water in a waste area unless the controls in the register are in place. Report any rodent sighting or droppings to the building facilities team and do not pick up a dead animal with bare hands. Current Australian public health guidance on leptospirosis has not yet been confirmed and must be checked.
  - New: Rats and mice are common in service-area waste rooms and near waterways. Their urine can carry the bacteria that cause leptospirosis, which is spread when contaminated water or damp soil reaches a cut, a graze, the eyes or the mouth. The register treats the risk as higher where water collects or where the waste area is near a river. The controls are that the crew has been taught about the water-related hazard, that protective equipment and washing facilities are on site, that cuts and grazes are covered with a waterproof dressing or gloves before work starts, and that any cut is washed at once with soap and running water and covered. Hands, face and forearms are washed before food, drink, cigarettes or phone use. WARNING: Avoid standing water in a waste area unless the controls in the register are in place. Report any rodent sighting or droppings to the building facilities team and do not pick up a dead animal with bare hands.

### `curriculum/shared/safety/RAS-11.json`

- `instruction/1/body` (text changed)
  - Old: Powered floor machines, such as rotary and scrubbing machines, can cause impact, entanglement and crush injuries, and their cords and hoses can cause trips. Pressurised water and steam equipment can cause burns, eye injury and skin puncture from a high-pressure jet. A jet can penetrate skin even when it looks harmless, and a hose can whip if the connection fails. Vacuum cleaners can cause entanglement with cords and hoses, and their motors and cables can overheat. The register's controls include battery equipment where possible, a test record for each electrical machine, inspection before every use, guards and protective features kept in place as the manufacturer requires, a service schedule, and a defect procedure that withdraws a machine and labels it unfit. The standards for pressure equipment and for eye protection in Australia have not yet been confirmed and must be checked for each machine.
  - New: Powered floor machines, such as rotary and scrubbing machines, can cause impact, entanglement and crush injuries, and their cords and hoses can cause trips. Pressurised water and steam equipment can cause burns, eye injury and skin puncture from a high-pressure jet. A jet can penetrate skin even when it looks harmless, and a hose can whip if the connection fails. Vacuum cleaners can cause entanglement with cords and hoses, and their motors and cables can overheat. The register's controls include battery equipment where possible, a test record for each electrical machine, inspection before every use, guards and protective features kept in place as the manufacturer requires, a service schedule, and a defect procedure that withdraws a machine and labels it unfit.

### `curriculum/shared/safety/RAS-12.json`

- `instruction/1/body` (text changed)
  - Old: Repeated exposure to noise from machines can cause hearing loss that builds slowly and is often not noticed until it is well established. The register requires a noise assessment wherever the noise level passes an exposure action value, which is a term taken from another jurisdiction. The value that applies in Australia has not yet been confirmed and must be checked. Where a noise assessment is required, low-noise equipment is chosen when buying, machines are serviced and maintained in working order, and defective machines are withdrawn. Health monitoring is carried out, and operatives report symptoms such as ringing or muffled hearing themselves. Hearing protection is used where the assessment requires it.
  - New: Repeated exposure to noise from machines can cause hearing loss that builds slowly and is often not noticed until it is well established. The register requires a noise assessment wherever the noise level passes an exposure action value, which is a term taken from another jurisdiction. Where a noise assessment is required, low-noise equipment is chosen when buying, machines are serviced and maintained in working order, and defective machines are withdrawn. Health monitoring is carried out, and operatives report symptoms such as ringing or muffled hearing themselves. Hearing protection is used where the assessment requires it.
- `instruction/2/body` (text changed)
  - Old: Hand-arm vibration comes from holding and guiding handheld or floor machines for long periods. Over time it can damage the nerves and blood supply in the hands and arms. The register requires a vibration assessment where equipment use passes the exposure action value, which is also taken from another jurisdiction and has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Low-vibration equipment is selected, machines are serviced and inspected both before and after each session, and defective equipment is withdrawn. Gloves to the standard named in the register are provided. Operatives are told about the effects of vibration, and they report tingling, numbness, pale or white fingers, or reduced grip early, so the task can be changed before harm becomes permanent.
  - New: Hand-arm vibration comes from holding and guiding handheld or floor machines for long periods. Over time it can damage the nerves and blood supply in the hands and arms. Low-vibration equipment is selected, machines are serviced and inspected both before and after each session, and defective equipment is withdrawn. Gloves to the standard named in the register are provided. Operatives are told about the effects of vibration, and they report tingling, numbness, pale or white fingers, or reduced grip early, so the task can be changed before harm becomes permanent.
- `summary/3` (deleted item)
  - Old: The Australian action values have not yet been confirmed and must be checked.
  - New: [element removed]

### `curriculum/shared/safety/RAS-13.json`

- `instruction/2/body` (text changed)
  - Old: Poor light causes misjudged footing, missed hazards and slips. The register asks for daytime work where it is practical, and for sufficient light levels in any area where work is done. Existing building lighting is supplied and kept in repair by the client, and task lighting is brought in where the crew identifies a need. Operatives do not work where the lighting level presents a danger. A route that is dark is reported and is not used until it has been lit or closed. Where work must be done in low light, the crew checks the route beforehand, uses task lights, and works with a second person nearby. The lighting provisions in the building's duty holder obligations under state and territory law have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Poor light causes misjudged footing, missed hazards and slips. The register asks for daytime work where it is practical, and for sufficient light levels in any area where work is done. Existing building lighting is supplied and kept in repair by the client, and task lighting is brought in where the crew identifies a need. Operatives do not work where the lighting level presents a danger. A route that is dark is reported and is not used until it has been lit or closed. Where work must be done in low light, the crew checks the route beforehand, uses task lights, and works with a second person nearby.

### `curriculum/shared/safety/RAS-14.json`

- `instruction/1/body` (text changed)
  - Old: Harassment and violence can come from the public, residents, site staff or others. The register's approach is to stop the work, secure the area, inform the client, the building facilities team and the business head office, and be polite. The operative does not retaliate or try to make the situation worse, because a calm response is the one most likely to end it. The business investigates a reported incident, and notifies the client and any regulator where appropriate. Whether a notification is required, and to which authority, has not yet been confirmed for each state and territory. WARNING: Leave the area as soon as it is safe to do so. Do not confront anyone, do not block a door, and do not stay in a place where you feel unsafe.
  - New: Harassment and violence can come from the public, residents, site staff or others. The register's approach is to stop the work, secure the area, inform the client, the building facilities team and the business head office, and be polite. The operative does not retaliate or try to make the situation worse, because a calm response is the one most likely to end it. The business investigates a reported incident, and notifies the client and any regulator where appropriate. WARNING: Leave the area as soon as it is safe to do so. Do not confront anyone, do not block a door, and do not stay in a place where you feel unsafe.

### `curriculum/shared/safety/RAS-15.json`

- `instruction/2/body` (text changed)
  - Old: Welfare facilities are the toilets, hand washing, drinking water, rest areas and first aid cover that crew need during the working day. The register requires the client's premises to be inspected before workers are placed there, so that adequate welfare arrangements and provisions are confirmed. Crew wash the face and arms before food, drink, cigarettes, phone use or medication, and cover any cut or graze with a waterproof dressing before starting work. Soap, towels and a first aid kit are stocked on site. The minimum welfare facilities required by law for each workplace have not yet been confirmed for each state and territory, and must be checked before the client's premises are accepted for work.
  - New: Welfare facilities are the toilets, hand washing, drinking water, rest areas and first aid cover that crew need during the working day. The register requires the client's premises to be inspected before workers are placed there, so that adequate welfare arrangements and provisions are confirmed. Crew wash the face and arms before food, drink, cigarettes, phone use or medication, and cover any cut or graze with a waterproof dressing before starting work. Soap, towels and a first aid kit are stocked on site.

### `curriculum/shared/safety/RAS-16.json`

- `instruction/1/body` (text changed)
  - Old: Once a register is approved, every person who will work under it is briefed on it. A briefing covers the hazards and controls that apply to the tasks, the protective equipment, the chemical use, the infection controls and the reporting arrangements. Short team briefings on safety, chemicals, infection control and protective equipment are the usual format, and each one is recorded with the date, the topics, the people present and the questions raised. The briefing record asks each operative to acknowledge receipt and comprehension of the document, and to commit to its controls and to the directions of the supervisor and the facilities team. WARNING: A briefing record shows that a briefing took place. It does not show that a control works, and it does not transfer responsibility from the business. Verify each control on site. The legal effect of any signature on a briefing record has not yet been confirmed and must be checked.
  - New: Once a register is approved, every person who will work under it is briefed on it. A briefing covers the hazards and controls that apply to the tasks, the protective equipment, the chemical use, the infection controls and the reporting arrangements. Short team briefings on safety, chemicals, infection control and protective equipment are the usual format, and each one is recorded with the date, the topics, the people present and the questions raised. The briefing record asks each operative to acknowledge receipt and comprehension of the document, and to commit to its controls and to the directions of the supervisor and the facilities team. WARNING: A briefing record shows that a briefing took place. It does not show that a control works, and it does not transfer responsibility from the business. Verify each control on site.
- `summary/3` (deleted item)
  - Old: The legal effect of signatures and the retention period have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: [element removed]

### `curriculum/shared/safety/RAS-17.json`

- `instruction/0/body` (text changed)
  - Old: This worksheet is a fill-in document. As you work through it, you complete each field in turn, and the system then assembles your entries into one finished site risk assessment for the site file. You are not given model answers, and the finished document contains only what you have written. The worksheet follows the method taught in “Scoring a hazard: likelihood, severity and the risk band”, “Walking a site and writing a hazard entry”, “Ranking controls and checking residual risk” and “Reviewing, briefing and signing off a risk assessment”: scope first, then a hazard register scored for likelihood and severity, controls chosen by rank, residual risk checked, actions and holds recorded, and the crew briefed. An assessor reviews the assembled document against the rubric and signs it off. Completing the worksheet does not give anyone a licence or authority to do regulated work, and it does not meet any legal duty; those points have not yet been confirmed for each state and territory.
  - New: This worksheet is a fill-in document. As you work through it, you complete each field in turn, and the system then assembles your entries into one finished site risk assessment for the site file. You are not given model answers, and the finished document contains only what you have written. The worksheet follows the method taught in “Scoring a hazard: likelihood, severity and the risk band”, “Walking a site and writing a hazard entry”, “Ranking controls and checking residual risk” and “Reviewing, briefing and signing off a risk assessment”: scope first, then a hazard register scored for likelihood and severity, controls chosen by rank, residual risk checked, actions and holds recorded, and the crew briefed. An assessor reviews the assembled document against the rubric and signs it off.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: This worksheet does not grant a licence, certificate or authority for any regulated work, and completing it does not meet a legal duty. The legal requirements for a site risk assessment in each state and territory have not yet been confirmed and must be checked.
  - New: This worksheet does not grant a licence, certificate or authority for any regulated work, and completing it does not meet a legal duty.

### `curriculum/shared/safety/WAH-01.json`

- `instruction/1/body` (text changed)
  - Old: The sources in this pack do not agree on a trigger height. One training deck uses one fixed height figure as its trigger for height work. A contractor procedure applies fall protection from a fixed height, stated in imperial units. A third source takes a wider view and counts any position from which someone could be hurt by falling, including positions below ground level, and it treats the route up and down as part of the task. None of these figures is an Australian legal trigger. In New South Wales, a separate rule requires a construction safe work method statement where someone could fall more than two metres; that rule is confirmed in the project licence matrix, but it is not a general trigger for every service job. The rule for other work in each state and territory has not yet been confirmed here, so check with the relevant regulator before relying on this point. A business should therefore set its working rule from its own risk assessment and a checked state rule, and leave out any figure it has not checked.
  - New: The sources in this pack do not agree on a trigger height. One training deck uses one fixed height figure as its trigger for height work. A contractor procedure applies fall protection from a fixed height, stated in imperial units. A third source takes a wider view and counts any position from which someone could be hurt by falling, including positions below ground level, and it treats the route up and down as part of the task. None of these figures is an Australian legal trigger. In New South Wales, a separate rule requires a construction safe work method statement where someone could fall more than two metres; that rule is confirmed in the project licence matrix, but it is not a general trigger for every service job. A business should therefore set its working rule from its own risk assessment and a checked state rule, and leave out any figure it has not checked.
- `instruction/3/body` (text changed)
  - Old: A tool, a bucket, a length of flashing or a piece of glass that drops from height can seriously injure a person below. The controls are practical. Keep tools in pouches or on lanyards, keep materials well clear of the edge, cone or barricade the area beneath the work, and tell anyone below before anything is raised or lowered. Hand lines and purpose-built containers are safer than throwing items up or down. The sources differ on the distance to keep clear and on canopy size; those figures have not yet been confirmed for Australia, so the exclusion zone belongs in the job plan and check with the relevant regulator before relying on this point.
  - New: A tool, a bucket, a length of flashing or a piece of glass that drops from height can seriously injure a person below. The controls are practical. Keep tools in pouches or on lanyards, keep materials well clear of the edge, cone or barricade the area beneath the work, and tell anyone below before anything is raised or lowered. Hand lines and purpose-built containers are safer than throwing items up or down.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Trigger heights differ between jurisdictions and between sources. The height figures in the sources are not Australian rules and have not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm the state or territory rule before relying on any trigger figure.
  - New: Trigger heights differ between jurisdictions and between sources. Confirm the state or territory rule before relying on any trigger figure.

### `curriculum/shared/safety/WAH-02.json`

- `instruction/2/body` (text changed)
  - Old: The order above is a working ranking for this course. Where a business writes the control into a formal risk register, it should map each control to the level of the hierarchy used in the state or territory where the work happens. The national wording and each state's framing have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. The practical rule holds regardless: a personal harness is the lowest of the physical choices and is never a substitute for a guardrail or a ground-based method that can be used.
  - New: The order above is a working ranking for this course. Where a business writes the control into a formal risk register, it should map each control to the level of the hierarchy used in the state or territory where the work happens. The practical rule holds regardless: a personal harness is the lowest of the physical choices and is never a substitute for a guardrail or a ground-based method that can be used.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The Victorian ranking is taken from a regulator page checked on 2026-11-02. The national model wording and the other states' framing have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The Victorian ranking is taken from a regulator page checked on 2026-11-02.

### `curriculum/shared/safety/WAH-03.json`

- `instruction/3/body` (text changed)
  - Old: An arrest system stops a fall over a distance. That distance adds the free fall before the lanyard becomes taut, the stretch of the energy absorber, the length of the lanyard itself, the height of the worker from the attachment point to their feet, and a safety margin. Sources describe these terms, and one asks how far a worker could fall with a lanyard attached. The Australian method and the figures used in that example have not yet been confirmed, so check with the relevant regulator before relying on this point. Use the calculation method in the business's approved procedure, and check the result against the manufacturer's stated figures before choosing the connector.
  - New: An arrest system stops a fall over a distance. That distance adds the free fall before the lanyard becomes taut, the stretch of the energy absorber, the length of the lanyard itself, the height of the worker from the attachment point to their feet, and a safety margin. Sources describe these terms, and one asks how far a worker could fall with a lanyard attached. Use the calculation method in the business's approved procedure, and check the result against the manufacturer's stated figures before choosing the connector.
- `instruction/4/body` (text changed)
  - Old: A worker who is off to one side of the anchor can swing into a structure when they fall. One source describes placing the device vertically above the work area and limiting the swing to a sector above the anchor. The angle figure has not yet been confirmed, so check with the relevant regulator before relying on this point. Position the anchor so the worker stays within the swing limit, or use another anchor or method.
  - New: A worker who is off to one side of the anchor can swing into a structure when they fall. One source describes placing the device vertically above the work area and limiting the swing to a sector above the anchor. Position the anchor so the worker stays within the swing limit, or use another anchor or method.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The figures for arrest systems in this lesson (rated loads, free-fall and swing limits, connector strength and the clearance example) come from non-Australian sources and have not yet been confirmed, so check with the relevant regulator before relying on this point. Use the manufacturer's figures and the Australian standard once it has been checked.
  - New: Use the manufacturer's figures and the Australian standard once it has been checked.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: AS/NZS 1891.4 is listed as the reference for selection, use and maintenance of arrest equipment. Its text was not read for this lesson, and its requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: AS/NZS 1891.4 is listed as the reference for selection, use and maintenance of arrest equipment.

### `curriculum/shared/safety/WAH-04.json`

- `instruction/6/body` (text changed)
  - Old: Clean equipment with the method the maker recommends and let it dry in the shade rather than in direct sunlight. A non-Australian source gives a service life and a shelf life; those figures are not used here. Those figures have not yet been confirmed for Australia, and the manufacturer's stated life governs, so check with the relevant regulator before relying on this point. Record the in-service date, the serial or item number, each inspection, and the date of any withdrawal.
  - New: Clean equipment with the method the maker recommends and let it dry in the shade rather than in direct sunlight. A non-Australian source gives a service life and a shelf life; those figures are not used here. Record the in-service date, the serial or item number, each inspection, and the date of any withdrawal.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The service life and shelf life figures come from a non-Australian source and have not yet been confirmed, so check with the relevant regulator before relying on this point. Use the manufacturer's stated life.
  - New: Use the manufacturer's stated life.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The periodic examination intervals named in the sources have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Set the interval from the manufacturer's instructions and the business's approved procedure.
  - New: Set the interval from the manufacturer's instructions and the business's approved procedure.

### `curriculum/shared/safety/WAH-05.json`

- `instruction/0/body` (text changed)
  - Old: A ladder gets a person to a place. It is not a good place to work from for long, and two of the sources treat ladders as a significant route into falls from elevation. This lesson sets out a decision path. First, can the task be done without climbing? Second, is a ladder suitable? Third, if a ladder is used, can it be set up and used safely? A ladder suits short, light work. One source sets a short time limit per position, which has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: A ladder gets a person to a place. It is not a good place to work from for long, and two of the sources treat ladders as a significant route into falls from elevation. This lesson sets out a decision path. First, can the task be done without climbing? Second, is a ladder suitable? Third, if a ladder is used, can it be set up and used safely? A ladder suits short, light work.
- `instruction/2/body` (text changed)
  - Old: Set up on a firm, level base. Where the ground is soft or sloped, use levelling feet or do not use that ladder. Keep doors and walkways clear, or block them off. Where a ladder can be fixed at the upper end, secure it, and where it cannot be secured, have a second person foot it while the worker climbs. For a leaning ladder, use the angle the maker states. One source gives a set-out ratio, and that figure has not yet been confirmed; the maker's label governs, so check with the relevant regulator before relying on this point. A non-Australian source also asks that the top of a straight ladder extend above the landing. The extension amount has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Set up on a firm, level base. Where the ground is soft or sloped, use levelling feet or do not use that ladder. Keep doors and walkways clear, or block them off. Where a ladder can be fixed at the upper end, secure it, and where it cannot be secured, have a second person foot it while the worker climbs. For a leaning ladder, use the angle the maker states. A non-Australian source also asks that the top of a straight ladder extend above the landing.
- `instruction/5/body` (text changed)
  - Old: Inspect the ladder before each use and again afterwards. Check the rails for bends, splits, twists or breaks. Check the rungs or steps for bends, cracks or missing parts. Check the joints, bolts, rivets and hinges for tightness, the locks, spreaders and safety bars for function, and the feet and levellers for wear. A ladder that fails any check is removed, tagged and reported. Keep inspection records for ladders in regular use. One source requires regular inspections on site; the interval has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Inspect the ladder before each use and again afterwards. Check the rails for bends, splits, twists or breaks. Check the rungs or steps for bends, cracks or missing parts. Check the joints, bolts, rivets and hinges for tightness, the locks, spreaders and safety bars for function, and the feet and levellers for wear. A ladder that fails any check is removed, tagged and reported. Keep inspection records for ladders in regular use.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The angle ratio, the landing extension, the time limit per position and the fall-protection trigger come from non-Australian sources and have not yet been confirmed, so check with the relevant regulator before relying on this point. Use the maker's label and the Australian ladder standard once checked.
  - New: Use the maker's label and the Australian ladder standard once checked.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: AS 1892 series (portable ladders) is listed as the Australian ladder standard family. The parts were seen in store listings and their text was not read; their requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: AS 1892 series (portable ladders) is listed as the Australian ladder standard family.

### `curriculum/shared/safety/WAH-06.json`

- `instruction/1/body` (text changed)
  - Old: Erecting, altering and dismantling a scaffold are specialist tasks. One source says these should be done only by a qualified scaffold erector. In New South Wales, only licensed scaffolders may erect, alter or dismantle a scaffold where the fall risk exceeds four metres; that rule is confirmed in the project licence matrix. The position in other states and territories has not yet been confirmed, so check with the relevant regulator before relying on this point. Do not remove ties, braces, guardrails or boards to make a task easier. One source warns that tampering with scaffold components can lead to prosecution and fines, and the same principle applies in any state.
  - New: Erecting, altering and dismantling a scaffold are specialist tasks. One source says these should be done only by a qualified scaffold erector. In New South Wales, only licensed scaffolders may erect, alter or dismantle a scaffold where the fall risk exceeds four metres; that rule is confirmed in the project licence matrix. Do not remove ties, braces, guardrails or boards to make a task easier. One source warns that tampering with scaffold components can lead to prosecution and fines, and the same principle applies in any state.
- `instruction/2/body` (text changed)
  - Old: A scaffold should carry a tag showing whether it can be used safely, who checked it and when. One source requires a green tag, checked recently; the interval has not yet been confirmed for Australia. A competent individual should check a new or changed scaffold before it is used, and the handover should come with a completion certificate. A tag that is out of date, missing or red means the scaffold is not used until a competent individual has checked it again.
  - New: A scaffold should carry a tag showing whether it can be used safely, who checked it and when. A competent individual should check a new or changed scaffold before it is used, and the handover should come with a completion certificate. A tag that is out of date, missing or red means the scaffold is not used until a competent individual has checked it again.
- `instruction/3/body` (text changed)
  - Old: Walk the whole structure before the first use each day, and again after any change, impact or storm. Check the base is level and stable and that the uprights are vertical. Check that every horizontal member is rigid at each joint, and that diagonal bracing is in place. The platform must be fully boarded, the boards secured, and there must be no gap through which a person or tool could fall. One source sets a minimum number of boards for a platform, which has not yet been confirmed, so check with the relevant regulator before relying on this point. Check the handrails, the mid-rails and the toe boards at every open edge, and check that access is by a suitable ladder that extends above the landing, not by climbing the frame. Look for overhead lines, unsafe fixings and anything hanging from the structure.
  - New: Walk the whole structure before the first use each day, and again after any change, impact or storm. Check the base is level and stable and that the uprights are vertical. Check that every horizontal member is rigid at each joint, and that diagonal bracing is in place. The platform must be fully boarded, the boards secured, and there must be no gap through which a person or tool could fall. Check the handrails, the mid-rails and the toe boards at every open edge, and check that access is by a suitable ladder that extends above the landing, not by climbing the frame. Look for overhead lines, unsafe fixings and anything hanging from the structure.
- `instruction/4/body` (text changed)
  - Old: A mobile tower is often safer than a ladder, and the sources recommend one where safer access is not available. Before erection, check that the castors roll freely, that the components are sound, and that the brakes and locks work. On a suspended floor, check that the floor can carry the load. Before use, the tower must be vertical and square, the platform must be fully boarded, the outriggers placed properly and locked in position, the wheels locked, and the tower tagged. The sources give a height above which stabilisers are required and another above which the tower is tied off, and they require the aluminium quantity schedule from the maker to be followed. Those height figures have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. The control is what matters: stabilise and tie the tower where the maker and the risk assessment require it.
  - New: A mobile tower is often safer than a ladder, and the sources recommend one where safer access is not available. Before erection, check that the castors roll freely, that the components are sound, and that the brakes and locks work. On a suspended floor, check that the floor can carry the load. Before use, the tower must be vertical and square, the platform must be fully boarded, the outriggers placed properly and locked in position, the wheels locked, and the tower tagged. The sources give a height above which stabilisers are required and another above which the tower is tied off, and they require the aluminium quantity schedule from the maker to be followed. The control is what matters: stabilise and tie the tower where the maker and the risk assessment require it.
- `instruction/6/body` (text changed)
  - Old: Keep the erection certificate, the tags, the inspection records and the component list for each scaffold or tower. One source expects an inspection at regular intervals, recorded on a form. That interval has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point.
  - New: Keep the erection certificate, the tags, the inspection records and the component list for each scaffold or tower. One source expects an inspection at regular intervals, recorded on a form.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Licence notice: in New South Wales, only licensed scaffolders may erect, alter or dismantle a scaffold where the fall risk exceeds four metres (confirmed in the project licence matrix). The position in other states and territories has not yet been confirmed, so check with the relevant regulator before relying on this point. This lesson does not grant any licence, certificate or competence to erect, alter or dismantle scaffolding.
  - New: Licence notice: in New South Wales, only licensed scaffolders may erect, alter or dismantle a scaffold where the fall risk exceeds four metres (confirmed in the project licence matrix). This lesson does not grant any licence, certificate or competence to erect, alter or dismantle scaffolding.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: AS 4576 (Guidelines for scaffolding) and the AS/NZS 1576 series are listed as Australian references. Their text was not read for this lesson, and their requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: AS 4576 (Guidelines for scaffolding) and the AS/NZS 1576 series are listed as Australian references.

### `curriculum/shared/safety/WAH-07.json`

- `instruction/2/body` (text changed)
  - Old: Before the first use each day, walk round the machine. Look at the wheels and tyres, the toe boards plus the guardrails, any hydraulic leak, the structure, the hoses and the wiring. Check that the controls work from the base and from the basket, as the maker's instructions describe, and that the emergency controls at the base work. Check the safe working load and the number of occupants the platform allows, and check that the labels and decals are present and readable. A machine with a defect that affects safety is tagged and kept from use. The inspection intervals named in the sources, which include daily, periodic and third-party checks, have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Use the maker's schedule and the business's records.
  - New: Before the first use each day, walk round the machine. Look at the wheels and tyres, the toe boards plus the guardrails, any hydraulic leak, the structure, the hoses and the wiring. Check that the controls work from the base and from the basket, as the maker's instructions describe, and that the emergency controls at the base work. Check the safe working load and the number of occupants the platform allows, and check that the labels and decals are present and readable. A machine with a defect that affects safety is tagged and kept from use. Use the maker's schedule and the business's records.
- `instruction/3/body` (text changed)
  - Old: Look up before a boom is unfolded. Overhead lines, other equipment, branches and structures can contact the platform. Treat every overhead line as live until its owner or the network confirms otherwise. Check the ground: the machine must stand on a firm and flat base, and the worker should look for buried services, soft or loose ground and holes. Walk the route before driving, and watch where the machine is heading. Wind is a hazard that can tip a platform, and the wind limit is set by the maker. The clearance distances from overhead lines are set by the business plan and the network rules, and they have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Look up before a boom is unfolded. Overhead lines, other equipment, branches and structures can contact the platform. Treat every overhead line as live until its owner or the network confirms otherwise. Check the ground: the machine must stand on a firm and flat base, and the worker should look for buried services, soft or loose ground and holes. Walk the route before driving, and watch where the machine is heading. Wind is a hazard that can tip a platform, and the wind limit is set by the maker.
- `instruction/6/body` (text changed)
  - Old: Stop, and lower the platform, if a control becomes unreliable, a warning light or alarm activates, the ground moves, the wind rises, a person is hurt, or a line is contacted. If the platform contacts a power line, the business's emergency procedure applies. The power must be isolated before anyone moves or touches the machine. This lesson does not set the full line-contact procedure, which must come from the business plan and the network's guidance, and which has not yet been confirmed here.
  - New: Stop, and lower the platform, if a control becomes unreliable, a warning light or alarm activates, the ground moves, the wind rises, a person is hurt, or a line is contacted. If the platform contacts a power line, the business's emergency procedure applies. The power must be isolated before anyone moves or touches the machine.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: The inspection intervals, the wind and tipping limits and the line-contact procedure have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. The business plan and the maker's documents govern until they are checked.
  - New: The business plan and the maker's documents govern until they are checked.

### `curriculum/shared/safety/WAH-08.json`

- `instruction/2/body` (text changed)
  - Old: The edge is usually the main fall risk. The sources set guard heights, and those figures have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Where an edge is unprotected, use a guardrail, a parapet at a safe height, a scaffold or work platform, a warning line with a restraint or arrest measure behind it, or a safety net. Where a warning line is used, anyone working between the line and the edge needs a harness and fall arrest. The distance from the edge to the line is set by the approved standard, which has not yet been confirmed here, so check with the relevant regulator before relying on this point. Cover or guard every skylight, roof light and opening before work near it starts.
  - New: The edge is usually the main fall risk. Where an edge is unprotected, use a guardrail, a parapet at a safe height, a scaffold or work platform, a warning line with a restraint or arrest measure behind it, or a safety net. Where a warning line is used, anyone working between the line and the edge needs a harness and fall arrest. Cover or guard every skylight, roof light and opening before work near it starts.
- `instruction/5/body` (text changed)
  - Old: Wet, icy, windy or hot weather changes the risk. One source says that wet, windy or icy conditions can make footing and control much harder, so controls must be applied. Stop roof work in gusty wind, rain or ice, and reassess after any change. The lightning distances in one source are a project rule, and the threshold for a business has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Wet, icy, windy or hot weather changes the risk. One source says that wet, windy or icy conditions can make footing and control much harder, so controls must be applied. Stop roof work in gusty wind, rain or ice, and reassess after any change.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The roof edge heights in the sources, the warning-line distance and the lightning distances come from non-Australian sources and have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The roof edge heights in the sources, the warning-line distance and the lightning distances come from non-Australian sources, so check with the relevant regulator before relying on this point.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The Safe Work Australia falls code is the national reference for falls at workplaces. Only its title and model status were read here; its hierarchy and height trigger have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The Safe Work Australia falls code is the national reference for falls at workplaces.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: NSW: a new code for work on roofs of commercial and industrial buildings took effect in May 2026. The part read excludes residential roofs and did not address soft washing or gutter cleaning. Its application to service work has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: NSW: a new code for work on roofs of commercial and industrial buildings took effect in May 2026. The part read excludes residential roofs and did not address soft washing or gutter cleaning.

### `curriculum/shared/safety/WAH-09.json`

- `instruction/1/body` (text changed)
  - Old: A guardrail system is a top rail, a mid-rail and a toe board. Guardrail heights and loads are set out in the sources, and the figures they give are not Australian. The mid-rail sits halfway up between the top rail and the working surface, and the toe board stops materials sliding off. The top rail is expected to resist a push at any spot on its upper edge, and the mid-rail a push along its length, without failing. Those load figures have not yet been confirmed, so check with the relevant regulator before relying on this point. The control holds whatever the figure: the rail must be complete, fixed, at the right height, able to stop a body pushing against it, and inspected before first use and after any impact.
  - New: A guardrail system is a top rail, a mid-rail and a toe board. Guardrail heights and loads are set out in the sources, and the figures they give are not Australian. The mid-rail sits halfway up between the top rail and the working surface, and the toe board stops materials sliding off. The top rail is expected to resist a push at any spot on its upper edge, and the mid-rail a push along its length, without failing. The control holds whatever the figure: the rail must be complete, fixed, at the right height, able to stop a body pushing against it, and inspected before first use and after any impact.
- `instruction/2/body` (text changed)
  - Old: An opening is a gap in a floor, roof, deck or wall. Cover it with a cover that is secured against wind and against being moved, and mark it clearly. One source requires a cover to carry a load well above the weight that will cross it; that figure has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Before any cover is removed, barricade the area so that no one steps into the opening. Skylights and roof lights are openings too, and they need a rail or a strong cover. Wall openings at height need a guardrail, a barrier or another fall control. One source sets a fixed height for this, which has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: An opening is a gap in a floor, roof, deck or wall. Cover it with a cover that is secured against wind and against being moved, and mark it clearly. Before any cover is removed, barricade the area so that no one steps into the opening. Skylights and roof lights are openings too, and they need a rail or a strong cover. Wall openings at height need a guardrail, a barrier or another fall control.
- `instruction/5/body` (text changed)
  - Old: Protruding reinforcing steel and the unprotected ends of scaffold tubes create a fall and impalement hazard. Cap or cover each end before work near it. Excavations with straight sides and an unprotected drop also need protection. For trenches, the national excavation code from Safe Work Australia (2015) says a trench 1.5 metres or deeper needs its walls held up by supports, benching or battering, wherever a cave-in could bury a person, whatever the depth (national model code; state adoption to be checked). That is a trench-support duty, not a guardrail height, so the guardrail trigger height for an unprotected edge has not yet been confirmed for Australia and check with the relevant regulator before relying on this point. Where workers must stand close to an unprotected excavation edge, they need a restraint or lifeline arrangement.
  - New: Protruding reinforcing steel and the unprotected ends of scaffold tubes create a fall and impalement hazard. Cap or cover each end before work near it. Excavations with straight sides and an unprotected drop also need protection. For trenches, the national excavation code from Safe Work Australia (2015) says a trench 1.5 metres or deeper needs its walls held up by supports, benching or battering, wherever a cave-in could bury a person, whatever the depth (national model code; state adoption to be checked). Where workers must stand close to an unprotected excavation edge, they need a restraint or lifeline arrangement.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The guardrail heights and loads, the cover load, the net drop distance, the excavation trigger and the wall-opening height figure come from non-Australian sources and have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The guardrail heights and loads, the cover load, the net drop distance, the excavation trigger and the wall-opening height figure come from non-Australian sources, so check with the relevant regulator before relying on this point.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The national falls code is listed for falls at workplaces (see “What counts as height work and how falls happen”). Its hierarchy and any edge-protection height were not read in full, and the state effect of the code has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The national falls code is listed for falls at workplaces (see “What counts as height work and how falls happen”).

### `curriculum/shared/safety/WAH-10.json`

- `instruction/0/body` (text changed)
  - Old: A worker held in a harness after a fall can be injured by the arrest itself, and can become unconscious while still suspended. The sources describe a condition often called suspension trauma. It can follow when a person hangs motionless, with circulation affected in the legs, and the person may faint. One source gives time markers for fainting and for death. Those figures come from a non-Australian source and have not yet been confirmed, so check with the relevant regulator before relying on this point. The response does not depend on the exact timing. The rescue must be fast, and the plan must exist before the work starts.
  - New: A worker held in a harness after a fall can be injured by the arrest itself, and can become unconscious while still suspended. The sources describe a condition often called suspension trauma. It can follow when a person hangs motionless, with circulation affected in the legs, and the person may faint. One source gives time markers for fainting and for death. The response does not depend on the exact timing. The rescue must be fast, and the plan must exist before the work starts.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: The suspension time figures come from a non-Australian source and have not yet been confirmed, so check with the relevant regulator before relying on this point. The rescue must be fast whatever the exact figures.
  - New: The rescue must be fast whatever the exact figures.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Rescue methods and equipment are not taught by this lesson. Rescue training from a recognised provider is needed, and the Australian requirements for rescue training have not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Rescue methods and equipment are not taught by this lesson.

### `curriculum/shared/safety/WAH-11.json`

- `instruction/1/body` (text changed)
  - Old: A height assessment covers the task and its duration, the positions and heights, the access route, the surfaces and their condition, the equipment and its inspection, the people and their training, the weather and its limits, the rescue arrangement, the public and people below, and the stop-work conditions. Record each hazard as one line, with the likelihood and severity scores used in the business's scheme (see “Scoring a hazard: likelihood, severity and the risk band”), the control, and the residual risk (see “Ranking controls and checking residual risk”). The scheme is a business choice, and its legal weight has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A height assessment covers the task and its duration, the positions and heights, the access route, the surfaces and their condition, the equipment and its inspection, the people and their training, the weather and its limits, the rescue arrangement, the public and people below, and the stop-work conditions. Record each hazard as one line, with the likelihood and severity scores used in the business's scheme (see “Scoring a hazard: likelihood, severity and the risk band”), the control, and the residual risk (see “Ranking controls and checking residual risk”).
- `safetyAndRegulatory/3/point` (text changed)
  - Old: NSW: a construction work method statement is required where someone could fall more than two metres (confirmed for NSW, construction work). Whether it applies to other service work has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: NSW: a construction work method statement is required where someone could fall more than two metres (confirmed for NSW, construction work).
- `commonErrors/1/error` (deleted item)
  - Old: Scoring the risk after a control that has not been checked.
  - New: [item removed]

### `curriculum/shared/safety/WAH-TPL-01.json`

- `safetyAndRegulatory/2/point` (text changed)
  - Old: The gap limit, the clearance factors, the inspection intervals and the tower and guardrail figures carried in the source form and sources 2 to 4 have not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Use the business's approved method and the Australian standard once checked.
  - New: Use the business's approved method and the Australian standard once checked.

### `curriculum/shared/standards/HSE-04.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: The Irish time frames have not yet been confirmed for Australia and are left out of this lesson, so check with the relevant regulator before relying on this point. The facility's own time frames apply.
  - New: The facility's own time frames apply.

### `curriculum/shared/standards/HSE-05.json`

- `instruction/2/body` (text changed)
  - Old: Dry microfibre mops after use. The method lets a damp mop stay for a short time only, under a time limit that has not yet been confirmed for Australia, so check with the relevant regulator before relying on this point. Because it is hard to monitor a damp mop, the safer rule is to dry it after use. Microfibre can also take a long time to dry when net bags constrict the mops during washing.
  - New: Dry microfibre mops after use. Because it is hard to monitor a damp mop, the safer rule is to dry it after use. Microfibre can also take a long time to dry when net bags constrict the mops during washing.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Laundering temperatures and the Australian laundry standard have not yet been confirmed for current use, so check with the relevant regulator before relying on this point. Check the supplier's instructions and facility policy.
  - New: Check the supplier's instructions and facility policy.

### `curriculum/shared/standards/HSE-07.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Employment conditions and the workforce arrangements described in the Irish manual are employer matters. Australian fair work and state rules apply, and have not yet been confirmed for application here, so check with the relevant regulator before relying on this point.
  - New: Employment conditions and the workforce arrangements described in the Irish manual are employer matters.

### `curriculum/shared/standards/HSE-08.json`

- `instruction/3/body` (text changed)
  - Old: The manual cites European procurement law, Irish tax and social insurance certificates and Irish professional registers. These do not apply in Australia. Use Australian procurement rules and state requirements, which have not yet been confirmed in detail here, so check with the relevant regulator before relying on this point.
  - New: The manual cites European procurement law, Irish tax and social insurance certificates and Irish professional registers. These do not apply in Australia. Use Australian procurement rules and state requirements.

### `curriculum/shared/standards/HSE-09.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Electrical safety, detector interaction and warm-up times follow the manufacturer's instructions and Australian electrical rules. Local detail has not yet been confirmed here, so check with the relevant regulator before relying on this point.
  - New: Electrical safety, detector interaction and warm-up times follow the manufacturer's instructions and Australian electrical rules.

### `curriculum/shared/standards/SAH-11.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: The 2016 policy guideline is named only. Its content has not yet been confirmed for this lesson and should be checked before use.
  - New: The 2016 policy guideline is named only.

### `curriculum/shared/starting-business/BP-01.json`

- `instruction/5/body` (text changed)
  - Old: The sample plan proposes a home-based start for the first six months. Before you run any business from a residence, check what your local council allows, what your home and vehicle insurance covers, and what your lease or strata rules say. These rules differ between councils and states, so the detail has not yet been confirmed and must be checked locally.
  - New: The sample plan proposes a home-based start for the first six months. Before you run any business from a residence, check what your local council allows, what your home and vehicle insurance covers, and what your lease or strata rules say.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Work health and safety duties apply to a business from its first job. Model WHS laws have been adopted in each state and territory, with local differences. Detailed requirements have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Work health and safety duties apply to a business from its first job. Model WHS laws have been adopted in each state and territory, with local differences.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Business registration, ABN and GST registration, council home-business rules and insurance such as public liability cover have not yet been confirmed. Check with the relevant Australian authority or a qualified adviser before relying on them.
  - New: Check with the relevant Australian authority or a qualified adviser before relying on them.

### `curriculum/shared/starting-business/BP-06.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: This is forecasting guidance only. Tax treatment, GST registration, superannuation and the treatment of owner drawings have not yet been confirmed, so check with the relevant regulator before relying on this point. Check with the Australian Taxation Office or a registered tax agent before relying on any figure.
  - New: This is forecasting guidance only. Check with the Australian Taxation Office or a registered tax agent before relying on any figure.

### `curriculum/shared/starting-business/F11-L01.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Licensed and regulated work includes electrical installation work, gasfitting, asbestos removal, and some work at height and with elevating work platforms. In Victoria, WorkSafe lists a boom-type elevating work platform operation licence (WP) as a high risk work licence class, and says that a scissor lift does not need a high risk work licence (WorkSafe Victoria page, reviewed 30 June 2026). Victoria's WP class has no boom-length threshold. In New South Wales and Queensland, the WP licence applies where the boom length is 11 metres or more, so a shorter boom may not need it in those states (SafeWork NSW page; WorkSafe Queensland page). Other work-at-height requirements have not yet been confirmed for this lesson, so check with the relevant regulator before relying on this point.
  - New: Licensed and regulated work includes electrical installation work, gasfitting, asbestos removal, and some work at height and with elevating work platforms. In Victoria, WorkSafe lists a boom-type elevating work platform operation licence (WP) as a high risk work licence class, and says that a scissor lift does not need a high risk work licence (WorkSafe Victoria page, reviewed 30 June 2026). Victoria's WP class has no boom-length threshold. In New South Wales and Queensland, the WP licence applies where the boom length is 11 metres or more, so a shorter boom may not need it in those states (SafeWork NSW page; WorkSafe Queensland page).

### `curriculum/shared/starting-business/SHR-PLN-03.json`

- `workedExamples/0/reasoning` (text changed)
  - Old: Variable cost per visit is AUD 17 (6 + 9 + 2, invented). The contribution per visit is AUD 73 (90 less 17, invented). Fixed costs of AUD 1,350 divided by AUD 73 is about 18.5, so the model needs 19 visits a month to cover fixed costs (invented figures). At 12 visits the total contribution is AUD 876 (12 x 73, invented), which leaves a shortfall of AUD 474 against fixed costs, so the plan does not hold at the expected volume. The main dependency is the owner: one person does every visit, and one illness cancels a day's bookings. A fallback, such as a relief groomer or a waiting list, has a cost that must be added to the model before it is tested. The test is to offer a fixed number of booking slots to a set number of nearby prospective clients (for example, 30 invented clients over four weeks) and record how many book. The owner should commit to the van finance only if bookings reach the volume the model needs. Insurance, any licence and any animal-handling rule have not yet been confirmed in this example and must be checked separately.
  - New: Variable cost per visit is AUD 17 (6 + 9 + 2, invented). The contribution per visit is AUD 73 (90 less 17, invented). Fixed costs of AUD 1,350 divided by AUD 73 is about 18.5, so the model needs 19 visits a month to cover fixed costs (invented figures). At 12 visits the total contribution is AUD 876 (12 x 73, invented), which leaves a shortfall of AUD 474 against fixed costs, so the plan does not hold at the expected volume. The main dependency is the owner: one person does every visit, and one illness cancels a day's bookings. A fallback, such as a relief groomer or a waiting list, has a cost that must be added to the model before it is tested. The test is to offer a fixed number of booking slots to a set number of nearby prospective clients (for example, 30 invented clients over four weeks) and record how many book. The owner should commit to the van finance only if bookings reach the volume the model needs.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Insurance cover, including public liability and any cover a specific service needs, has not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm the cover for each service with an insurer or broker before the cost is put in the model.
  - New: Confirm the cover for each service with an insurer or broker before the cost is put in the model.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: How GST, income tax and any other tax apply to your prices, income and cost records has not yet been confirmed, so check with the relevant regulator before relying on this point. Check with the Australian Taxation Office or a registered tax adviser before deciding whether your prices include or exclude GST.
  - New: Check with the Australian Taxation Office or a registered tax adviser before deciding whether your prices include or exclude GST.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Rules on how prices must be displayed or quoted to clients have not yet been confirmed. Check the Australian Consumer Law requirements, which apply in every state and territory, before publishing prices.
  - New: Check the Australian Consumer Law requirements, which apply in every state and territory, before publishing prices.

### `curriculum/shared/starting-business/TPL-02.json`

- `instruction/1/body` (text changed)
  - Old: Keep three lists apart. Personal costs are what you spend to live. Business costs are what the business spends to operate, which can include vehicle running costs, tools, consumables not charged to customers, insurance, phone and software, and bank fees. The set-aside is money held back for tax and any other obligation you carry. This template does not tell you what rate to use. Obligations depend on how the business is set up and on the registrations it holds, and they have not yet been confirmed, so confirm them with a registered tax agent or another qualified adviser and check with the relevant regulator before relying on this point. Add a cash buffer expressed as a number of months, so that a slow month does not force a price cut.
  - New: Keep three lists apart. Personal costs are what you spend to live. Business costs are what the business spends to operate, which can include vehicle running costs, tools, consumables not charged to customers, insurance, phone and software, and bank fees. The set-aside is money held back for tax and any other obligation you carry. This template does not tell you what rate to use. Add a cash buffer expressed as a number of months, so that a slow month does not force a price cut.

### `curriculum/shared/starting-business/additional-specialist-services-L04.json`

- `instruction/2/body` (text changed)
  - Old: Before accepting, describe the task in plain words, with the location, the materials and the method. Ask whether any part of it involves electrical wiring or fittings, gas, plumbing, structural change, roof or height access, the removal or disturbance of building materials, or a product or process that needs a special permit. Where the answer is yes or you are unsure, the task is restricted until you have checked the licence rules for the state or territory, the site owner's permission and your employer's written authority. Repairing electrical wiring is licensed work in New South Wales, where the licensing rules name repairing as part of electrical wiring work. The rules in other states and territories have not yet been confirmed in this lesson, so treat electrical repair as restricted everywhere until it is checked.
  - New: Before accepting, describe the task in plain words, with the location, the materials and the method. Ask whether any part of it involves electrical wiring or fittings, gas, plumbing, structural change, roof or height access, the removal or disturbance of building materials, or a product or process that needs a special permit. Where the answer is yes or you are unsure, the task is restricted until you have checked the licence rules for the state or territory, the site owner's permission and your employer's written authority. Repairing electrical wiring is licensed work in New South Wales, where the licensing rules name repairing as part of electrical wiring work.
- `instruction/3/body` (text changed)
  - Old: A customer may ask a cleaner to remove a section of suspected asbestos-containing wall lining, or to dust, sand or scrape a surface that may contain it. Treat the material as hazardous until a competent person identifies it. Do not cut, scrape, sand, drill, sweep dry or otherwise disturb it, and do not carry out tests that would expose anyone to fibres. Keep other people out of the area, record what you saw and what the client reported, and refer the work to an appropriately authorised provider. The licence classes and removal rules differ between states and territories, and the details have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: A customer may ask a cleaner to remove a section of suspected asbestos-containing wall lining, or to dust, sand or scrape a surface that may contain it. Treat the material as hazardous until a competent person identifies it. Do not cut, scrape, sand, drill, sweep dry or otherwise disturb it, and do not carry out tests that would expose anyone to fibres. Keep other people out of the area, record what you saw and what the client reported, and refer the work to an appropriately authorised provider.
- `instruction/6/body` (text changed)
  - Old: Licence notice: This lesson does not grant the right to perform any licensed, permitted or restricted work, and it does not make the learner a licence holder. A high risk work licence for boom-type elevating work platforms applies where the boom is 11 metres or more in New South Wales and Queensland, so a shorter boom may not need it in those states. Victoria's WP class has no boom-length threshold. Whether any cleaning-specific work needs a licence has not yet been confirmed in every state and territory checked. Work above ground level from ladders, scaffolds or platforms is restricted and needs your employer's written authorisation, and the licence rules where you work must be checked before it starts.
  - New: Licence notice: This lesson does not grant the right to perform any licensed, permitted or restricted work, and it does not make the learner a licence holder. A high risk work licence for boom-type elevating work platforms applies where the boom is 11 metres or more in New South Wales and Queensland, so a shorter boom may not need it in those states. Victoria's WP class has no boom-length threshold. Work above ground level from ladders, scaffolds or platforms is restricted and needs your employer's written authorisation, and the licence rules where you work must be checked before it starts.
- `workedExamples/1/reasoning` (text changed)
  - Old: No. Repairing electrical wiring is licensed work in New South Wales, and the rules in other states and territories have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. The cleaner removes the repair from the job, tells the client it is outside the cleaning scope and recommends a licensed electrician. The cleaner does not open the fitting or test it, and records the request and the client's response. The cleaning booking is not permission for any electrical work.
  - New: No. The cleaner removes the repair from the job, tells the client it is outside the cleaning scope and recommends a licensed electrician. The cleaner does not open the fitting or test it, and records the request and the client's response. The cleaning booking is not permission for any electrical work.
- `summary/5` (deleted item)
  - Old: This lesson does not grant any licence or authority, and licence rules have not yet been confirmed where marked.
  - New: [element removed]

### `curriculum/shared/team/BP-07.json`

- `instruction/5/body` (text changed)
  - Old: The sample plan names employee turnover as a threat. Turnover has causes you can change: pay, rostering, the quality of induction, supervision, feedback and whether the work is valued. Pay and conditions must follow the award or agreement that applies to each worker. Which instrument applies has not yet been confirmed and must be checked before any offer is made.
  - New: The sample plan names employee turnover as a threat. Turnover has causes you can change: pay, rostering, the quality of induction, supervision, feedback and whether the work is valued. Pay and conditions must follow the award or agreement that applies to each worker.
- `instruction/6/body` (text changed)
  - Old: Whether a worker is an employee or a contractor affects pay, superannuation, insurance, tax and how much control you have over the work. The sample plan does not address this. Decide the classification by examining the actual working arrangement, not the label alone, and record your reasons. The rules have not yet been confirmed and should be checked with a qualified adviser.
  - New: Whether a worker is an employee or a contractor affects pay, superannuation, insurance, tax and how much control you have over the work. The sample plan does not address this. Decide the classification by examining the actual working arrangement, not the label alone, and record your reasons.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Under model WHS laws adopted in each state and territory, a business has duties to its workers, including information, training, instruction and supervision. The local detail has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Under model WHS laws adopted in each state and territory, a business has duties to its workers, including information, training, instruction and supervision.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Where clients include schools, aged care or other services involving children or vulnerable people, state or territory screening requirements may apply to staff. These requirements have not yet been confirmed and must be checked before staff are placed.
  - New: Where clients include schools, aged care or other services involving children or vulnerable people, state or territory screening requirements may apply to staff.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Award or enterprise agreement coverage, minimum pay, leave, superannuation and worker classification have not yet been confirmed, so check with the relevant regulator before relying on this point. Check with the Fair Work Ombudsman or a qualified adviser.
  - New: Check with the Fair Work Ombudsman or a qualified adviser.

### `curriculum/shared/team/F12-L01.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Workers compensation and tax treatment of contractors differ between states and territories and must be checked for each location. The specific position in other jurisdictions has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point.
  - New: Workers compensation and tax treatment of contractors differ between states and territories and must be checked for each location.

### `curriculum/shared/team/F12-L02.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Employers have record-keeping and pay obligations under national and state law and under any applicable award or agreement. The specific requirements, retention periods and penalty rates have not yet been confirmed in this lesson and must be checked with the Fair Work Ombudsman or the relevant state authority.
  - New: Employers have record-keeping and pay obligations under national and state law and under any applicable award or agreement.
- `commonErrors/1/error` (deleted item)
  - Old: Setting pay from a rate that has not been checked against the current rules.
  - New: [item removed]

### `curriculum/shared/team/F12-L03.json`

- `instruction/2/body` (text changed)
  - Old: Under the model laws, a PCBU must consult workers on matters that affect their health and safety. Consultation means sharing information, listening to the views of workers, taking those views into account, and telling workers what has been decided. Safe Work Australia's guidance on the PCBU duty points to further guidance on consultation with multiple duty holders. The steps, the forms and the requirements for consultation must be confirmed for the relevant state or territory, and have not yet been confirmed in this lesson beyond the general principle.
  - New: Under the model laws, a PCBU must consult workers on matters that affect their health and safety. Consultation means sharing information, listening to the views of workers, taking those views into account, and telling workers what has been decided. Safe Work Australia's guidance on the PCBU duty points to further guidance on consultation with multiple duty holders.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: The detailed consultation requirements, the forms and the penalties differ between states and territories and have not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. This lesson does not state those requirements.
  - New: This lesson does not state those requirements.

### `curriculum/shared/team/F12-L04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Anti-discrimination and harassment laws apply at the Commonwealth, state and territory levels, with different protected attributes and reporting bodies. The specific obligations for each business have not yet been confirmed in this lesson and must be checked.
  - New: Anti-discrimination and harassment laws apply at the Commonwealth, state and territory levels, with different protected attributes and reporting bodies.

### `curriculum/shared/team/TPL-08.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Completing this record does not give a licence, certificate or authority to do regulated work. Any licence or authorisation a task requires is held by the person and issued by the relevant authority. Requirements by state or territory have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Completing this record does not give a licence, certificate or authority to do regulated work. Any licence or authorisation a task requires is held by the person and issued by the relevant authority.

### `curriculum/shared/team/TPL-09.json`

- `instruction/2/body` (text changed)
  - Old: Where a standard is not met, write a plan with one or two actions the person can take, the support the business will provide, a measure that shows improvement, and a due date. Agree the plan with the person rather than handing it to them. Set the next review date. If a performance concern is serious or repeated, the business disciplinary procedure and the employment obligations that apply must be followed. Those obligations have not yet been confirmed, so check them before taking any formal step.
  - New: Where a standard is not met, write a plan with one or two actions the person can take, the support the business will provide, a measure that shows improvement, and a due date. Agree the plan with the person rather than handing it to them. Set the next review date. If a performance concern is serious or repeated, the business disciplinary procedure and the employment obligations that apply must be followed.

### `curriculum/shared/team/additional-specialist-services-L10.json`

- `instruction/6/body` (text changed)
  - Old: Licence notice: This lesson does not grant any licence, permit or authority to perform regulated work, and coordinating work on a site does not authorise any task within it. Whether particular tasks on a site need a licence depends on the state or territory and has not yet been confirmed in this lesson, so check with the relevant regulator before relying on this point. Work health and safety laws in each state and territory place duties on businesses that share a workplace to work together, but the exact requirements have not yet been confirmed here, so check the rules that apply where you work.
  - New: Licence notice: This lesson does not grant any licence, permit or authority to perform regulated work, and coordinating work on a site does not authorise any task within it.
- `summary/5` (deleted item)
  - Old: This lesson does not grant any licence or authority, and the coordination rules have not yet been confirmed where marked.
  - New: [element removed]

### `curriculum/shared/templates/TPL-12.json`

- `instruction/2/body` (text changed)
  - Old: A reference is a person who has agreed that a prospective client may contact them. Ask each person before their name goes into the proposal, and record the date and what they are willing to talk about. A testimonial written for a different service, a different business or a different year should be labelled as such, or left out. Edited, merged or invented testimonials could breach the misleading-conduct rules of the Australian Consumer Law. That point has not yet been confirmed in this lesson and must be checked before any testimonial is used.
  - New: A reference is a person who has agreed that a prospective client may contact them. Ask each person before their name goes into the proposal, and record the date and what they are willing to talk about. A testimonial written for a different service, a different business or a different year should be labelled as such, or left out. Edited, merged or invented testimonials could breach the misleading-conduct rules of the Australian Consumer Law.
- `instruction/3/body` (text changed)
  - Old: List the products and methods the team uses, and the surface or task each one suits. A product list with no purpose attached adds length without giving the client anything to check. Environmental and health claims are the highest-risk part of this section. Words such as natural, non-toxic, non-hazardous or eco-friendly need evidence the business holds, such as a product label, a safety data sheet or a certification, and the claim must match what that evidence says. Where the evidence is thin, describe what the business does instead, for example which products are used on which surfaces and which are avoided. The rules that govern environmental claims have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: List the products and methods the team uses, and the surface or task each one suits. A product list with no purpose attached adds length without giving the client anything to check. Environmental and health claims are the highest-risk part of this section. Words such as natural, non-toxic, non-hazardous or eco-friendly need evidence the business holds, such as a product label, a safety data sheet or a certification, and the claim must match what that evidence says. Where the evidence is thin, describe what the business does instead, for example which products are used on which surfaces and which are avoided.
- `instruction/4/body` (text changed)
  - Old: Show each price in Australian dollars and state that the amounts include GST. Each line in the price table needs a unit, such as per visit, per hour, per room or per square metre, and a quantity that matches the scope. The line totals are the rate multiplied by the quantity, and the total is the sum of the lines less any offer. An offer is only a genuine discount if the business charges the full amount for the same service on other occasions. Write the offer with its condition and its end date. The rules on price display and discounts under the Australian Consumer Law have not yet been confirmed here, so check with the relevant regulator before relying on this point. The ATO sets the registration threshold at $75,000 of GST turnover for most businesses ($150,000 for non-profit organisations), so a business below that level is not required to register. Check the GST rate and how GST must appear on a quote with the Australian Taxation Office or a qualified adviser.
  - New: Show each price in Australian dollars and state that the amounts include GST. Each line in the price table needs a unit, such as per visit, per hour, per room or per square metre, and a quantity that matches the scope. The line totals are the rate multiplied by the quantity, and the total is the sum of the lines less any offer. An offer is only a genuine discount if the business charges the full amount for the same service on other occasions. Write the offer with its condition and its end date. The ATO sets the registration threshold at $75,000 of GST turnover for most businesses ($150,000 for non-profit organisations), so a business below that level is not required to register. Check the GST rate and how GST must appear on a quote with the Australian Taxation Office or a qualified adviser.
- `workedExamples/0/reasoning` (text changed)
  - Old: The fortnightly visit and its price can be stated directly from the scope and the pricing worksheet. The 'free first clean' is a genuine offer only if the business charges the same amount for that service on other occasions, so the wording needs the condition and an end date, and the price table should show the full price before the offer. The 'fully guaranteed' line has no condition and no route for a complaint. It should be replaced with a statement of how a concern is raised, the response time the business can meet, and a reference to the complaint steps in the agreement. Whether any of this wording breaches consumer guarantee or misleading-conduct rules has not yet been confirmed and must be checked.
  - New: The fortnightly visit and its price can be stated directly from the scope and the pricing worksheet. The 'free first clean' is a genuine offer only if the business charges the same amount for that service on other occasions, so the wording needs the condition and an end date, and the price table should show the full price before the offer. The 'fully guaranteed' line has no condition and no route for a complaint. It should be replaced with a statement of how a concern is raised, the response time the business can meet, and a reference to the complaint steps in the agreement.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Public liability cover and any cover a client asks to see have not yet been confirmed for each state and territory, so check with the relevant regulator before relying on this point. Record only the cover the business holds.
  - New: Record only the cover the business holds.

### `curriculum/shared/templates/TPL-13.json`

- `instruction/2/body` (text changed)
  - Old: A fixed-hours clause says the client pays for a reserved number of team hours for each visit. Write three things: the reserved hours, the team size, and the rule for finishing early or running over. A team of two working for two hours is not the same as one person working for four hours, and the agreement should say which unit is used. The scope is an activity list that the client can check, and the clause states that the reserved block is the basis of the fee and does not guarantee a result. If the team cannot finish in the reserved time, the clause says what the client is told, how any extra time is approved and how it is charged. Extra time and extra work are agreed in writing before they begin. The consumer rules that apply to a fixed block of hours have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A fixed-hours clause says the client pays for a reserved number of team hours for each visit. Write three things: the reserved hours, the team size, and the rule for finishing early or running over. A team of two working for two hours is not the same as one person working for four hours, and the agreement should say which unit is used. The scope is an activity list that the client can check, and the clause states that the reserved block is the basis of the fee and does not guarantee a result. If the team cannot finish in the reserved time, the clause says what the client is told, how any extra time is approved and how it is charged. Extra time and extra work are agreed in writing before they begin.
- `instruction/3/body` (text changed)
  - Old: The source sets its own notice periods for cancellation by either party and for schedule details. Those choices belong to one business and are not a standard. Set the notice periods your business can meet from its own roster, and write them as whole numbers of days. Test each one with a single question: could the roster absorb a change at this notice? A period the business cannot meet will not protect it when a job is lost. Where a client's notice is short and the business cannot refill the visit, the clause states the fee and the situation exactly, so that the client knows what applies. Whether any cancellation or change fee is fair under consumer law has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The source sets its own notice periods for cancellation by either party and for schedule details. Those choices belong to one business and are not a standard. Set the notice periods your business can meet from its own roster, and write them as whole numbers of days. Test each one with a single question: could the roster absorb a change at this notice? A period the business cannot meet will not protect it when a job is lost. Where a client's notice is short and the business cannot refill the visit, the clause states the fee and the situation exactly, so that the client knows what applies.
- `instruction/5/body` (text changed)
  - Old: State who the team are, whether they are employees or subcontractors, and how new team members are trained and supervised. Write the position for this business, and leave it blank until checked. The insurance field lists each policy held, the type of cover, the insurer, the policy number and the expiry date. The licence field lists each licence or registration held that applies to the work, and the state or territory where it applies. Do not list a licence the business does not hold. The governing-law field names the state or territory whose law applies, which is the one where the business operates. The legal wording of that clause has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: State who the team are, whether they are employees or subcontractors, and how new team members are trained and supervised. Write the position for this business, and leave it blank until checked. The insurance field lists each policy held, the type of cover, the insurer, the policy number and the expiry date. The licence field lists each licence or registration held that applies to the work, and the state or territory where it applies. Do not list a licence the business does not hold. The governing-law field names the state or territory whose law applies, which is the one where the business operates.
- `workedExamples/0/reasoning` (text changed)
  - Old: The schedule clause should say who supplies the schedule, in what form, and how many days before each visit it is needed. A booking platform's calendar is not the client's written instruction, so the agreement should require written confirmation from the client, not a screenshot alone. The clause should then say what happens when the source of the schedule changes: the client sends the new time as a written message, and the business confirms whether it can meet the new time within its notice period. The notice period is set from the business's own roster. Whether any fee applies to a changed time has not yet been confirmed and must be checked before the clause is used.
  - New: The schedule clause should say who supplies the schedule, in what form, and how many days before each visit it is needed. A booking platform's calendar is not the client's written instruction, so the agreement should require written confirmation from the client, not a screenshot alone. The clause should then say what happens when the source of the schedule changes: the client sends the new time as a written message, and the business confirms whether it can meet the new time within its notice period. The notice period is set from the business's own roster.
- `workedExamples/1/reasoning` (text changed)
  - Old: The damage clause applies first: the team member phones the office straight away and leaves a note, and the office follows up in writing to agree the remedy. Moving a chair to reach a shelf may be outside the exclusions for work above a set height, which means the exclusion clause and the business's own risk assessment should be checked. The remedy is repair or replacement, or a value agreed in writing. The agreement does not say the client waives every claim, because a waiver of that kind has not yet been confirmed against consumer guarantees, so check with the relevant regulator before relying on this point.
  - New: The damage clause applies first: the team member phones the office straight away and leaves a note, and the office follows up in writing to agree the remedy. Moving a chair to reach a shelf may be outside the exclusions for work above a set height, which means the exclusion clause and the business's own risk assessment should be checked. The remedy is repair or replacement, or a value agreed in writing.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Payment, late-fee, interest, debt-recovery and lien terms vary by state and territory and are not set in this template. They are handled in “Payment and overdue account schedule”, and every term there has not yet been confirmed until checked.
  - New: Payment, late-fee, interest, debt-recovery and lien terms vary by state and territory and are not set in this template.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Height and manual handling limits must come from the business's risk assessment and the work health and safety requirements that apply in the state or territory. The values have not yet been confirmed in this template, so check with the relevant regulator before relying on this point.
  - New: Height and manual handling limits must come from the business's risk assessment and the work health and safety requirements that apply in the state or territory.

### `curriculum/shared/templates/TPL-14.json`

- `instruction/1/body` (text changed)
  - Old: Record how the team gets in: a key held by the office, a lock box, a code, or the client present. Record where the access detail is kept, not the detail itself. A full alarm code or key number written into an open file creates a security exposure for the household and for the firm. The brief can say that the alarm arrangement is held in the business's secure record, and the code is kept in the approved store. Record who may give instructions on the day, and what the team does if access fails: which number to call, and that the team does not wait outside for an unknown period. Access and keys are personal and security information about the client, so the business confirms its obligations under the Privacy Act 1988, whose application to a small business has not yet been confirmed and check with the relevant regulator before relying on this point.
  - New: Record how the team gets in: a key held by the office, a lock box, a code, or the client present. Record where the access detail is kept, not the detail itself. A full alarm code or key number written into an open file creates a security exposure for the household and for the firm. The brief can say that the alarm arrangement is held in the business's secure record, and the code is kept in the approved store. Record who may give instructions on the day, and what the team does if access fails: which number to call, and that the team does not wait outside for an unknown period.
- `instruction/3/body` (text changed)
  - Old: Each animal in the home is listed with its usual location and whether it is secured during the visit. Ask about every animal at each visit, including animals the client says are no trouble. Animals can act differently when the household is out, so the brief records what the client expects. If an animal appears to threaten the team, the team does not enter, and the office contacts the client. Any fee for that visit is the one the agreement states, and that fee has not yet been confirmed under consumer rules, so check with the relevant regulator before relying on this point. The business does not provide childcare or pet care, and this is listed as an exclusion. The arrangement for children and visitors is recorded, together with the business's policy on who may be in the home during the work.
  - New: Each animal in the home is listed with its usual location and whether it is secured during the visit. Ask about every animal at each visit, including animals the client says are no trouble. Animals can act differently when the household is out, so the brief records what the client expects. If an animal appears to threaten the team, the team does not enter, and the office contacts the client. The business does not provide childcare or pet care, and this is listed as an exclusion. The arrangement for children and visitors is recorded, together with the business's policy on who may be in the home during the work.
- `workedExamples/0/reasoning` (text changed)
  - Old: The alarm entry records that the arrangement is held in the secure record and that the client confirms it is off or changed before each visit. The code itself is not written in the brief. The lock box entry records where the box is and who holds its key, not the combination. For the dog, the entry records its usual location, whether it is secured during the visit, and what the client has said about its behaviour. The client's statement is not an observation, so the office confirms the dog's behaviour with the client in writing before the first visit. The team rule says the team does not enter if an animal appears to be a threat, and the office contacts the client. The fee for that visit is the one the agreement states, and whether it is fair under consumer law has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: The alarm entry records that the arrangement is held in the secure record and that the client confirms it is off or changed before each visit. The code itself is not written in the brief. The lock box entry records where the box is and who holds its key, not the combination. For the dog, the entry records its usual location, whether it is secured during the visit, and what the client has said about its behaviour. The client's statement is not an observation, so the office confirms the dog's behaviour with the client in writing before the first visit. The team rule says the team does not enter if an animal appears to be a threat, and the office contacts the client.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Work health and safety: the business must identify and control site hazards, and the controls must come from a documented risk assessment. The model work health and safety laws as adopted in each state and territory have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Work health and safety: the business must identify and control site hazards, and the controls must come from a documented risk assessment.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Animals: where an animal may threaten the team, the team withdraws and the office acts. The rule and any fee are set by the business and the agreement. Fee and withdrawal rules under consumer law have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Animals: where an animal may threaten the team, the team withdraws and the office acts. The rule and any fee are set by the business and the agreement.

### `curriculum/shared/templates/TPL-15.json`

- `instruction/1/body` (text changed)
  - Old: State when an invoice is issued, for example at the end of each visit or at the start of each month, how it is sent, and the number of days allowed for payment. The due period is a commercial choice. It should be one the business can justify, and it must be set in line with the rules in the business's own state or territory. Write the basis for the number in one plain sentence, and leave the number out until the check is recorded. The invoice itself should list the business name, the ABN, the date, a description of the work, the quantity, the GST component where it is required, and the amount due. An invoice missing these items makes the schedule harder to follow, and the invoice content rules have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: State when an invoice is issued, for example at the end of each visit or at the start of each month, how it is sent, and the number of days allowed for payment. The due period is a commercial choice. It should be one the business can justify, and it must be set in line with the rules in the business's own state or territory. Write the basis for the number in one plain sentence, and leave the number out until the check is recorded. The invoice itself should list the business name, the ABN, the date, a description of the work, the quantity, the GST component where it is required, and the amount due.
- `instruction/2/body` (text changed)
  - Old: Show the amount including GST and state that the amounts include GST. The schedule says when the GST component is shown on the invoice. The GST rate, the registration threshold and the content of a tax invoice have not yet been confirmed here and must be confirmed with the Australian Taxation Office or a qualified adviser. The GST statement must match the statement on the proposal (“Cleaning proposal for a new client”) and in the agreement (“Client service agreement”).
  - New: Show the amount including GST and state that the amounts include GST. The schedule says when the GST component is shown on the invoice. The GST statement must match the statement on the proposal (“Cleaning proposal for a new client”) and in the agreement (“Client service agreement”).
- `instruction/3/body` (text changed)
  - Old: List only the methods the client has agreed to, such as bank transfer, card or a payment link, and say how each one is used. Do not request payment in a way the client has not agreed to. If a surcharge applies to a method, it is shown clearly before the client pays. Whether a surcharge is permitted, and how it must be disclosed, has not yet been confirmed. Cash and cheque payments, where the business still accepts them, are recorded in the same way as other payments and given a receipt.
  - New: List only the methods the client has agreed to, such as bank transfer, card or a payment link, and say how each one is used. Do not request payment in a way the client has not agreed to. If a surcharge applies to a method, it is shown clearly before the client pays. Cash and cheque payments, where the business still accepts them, are recorded in the same way as other payments and given a receipt.
- `instruction/4/body` (text changed)
  - Old: An overdue account needs a sequence, not a threat. Write each step with the day it happens, starting with a reminder. A common sequence is a reminder, a second reminder that states the amount and the due date, a call or a written notice, and then a decision on whether further visits are paused. Each step records what the business will do and how the client can resolve the matter. Whether each step is lawful, and how much written notice a pause in service needs, have not yet been confirmed, so check with the relevant regulator before relying on this point. Before any formal recovery step, the business takes advice. This schedule does not include property liens, judgments, collection costs or attorney fees, because these come from another country's form and need a qualified adviser to check in any Australian setting.
  - New: An overdue account needs a sequence, not a threat. Write each step with the day it happens, starting with a reminder. A common sequence is a reminder, a second reminder that states the amount and the due date, a call or a written notice, and then a decision on whether further visits are paused. Each step records what the business will do and how the client can resolve the matter. Before any formal recovery step, the business takes advice. This schedule does not include property liens, judgments, collection costs or attorney fees, because these come from another country's form and need a qualified adviser to check in any Australian setting.
- `instruction/5/body` (text changed)
  - Old: A late fee or interest charge is not included by default. If the business wants one, it must be set in a way the rules of its state or territory permit and disclosed in advance, and it is left out until checked. The source's fixed late fee and annual interest rate are not carried over. A gratuity is optional. If the business accepts one, the schedule says how it is handled and that it is never a condition of service. The tax treatment of gratuities has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: A late fee or interest charge is not included by default. If the business wants one, it must be set in a way the rules of its state or territory permit and disclosed in advance, and it is left out until checked. The source's fixed late fee and annual interest rate are not carried over. A gratuity is optional. If the business accepts one, the schedule says how it is handled and that it is never a condition of service.
- `instruction/6/body` (text changed)
  - Old: Record what the business does when a payment fails, such as a declined card, a reversed transfer or a returned cheque. The first step is a reminder with a request for a new payment. A fee for a failed payment has not yet been confirmed and is included only after its check is recorded.
  - New: Record what the business does when a payment fails, such as a declined card, a reversed transfer or a returned cheque. The first step is a reminder with a request for a new payment.
- `workedExamples/0/reasoning` (text changed)
  - Old: The business has a recorded due period and an accepted method, so the first step is a dated check of what has been received and what the client sent. The reminder waits until the transfer is traced. If the payment reached the wrong account, the business corrects its records and tells the client in writing what has been received. No late fee, interest or recovery step applies while the account is being traced. Whether any charge could apply later has not yet been confirmed and must be checked against the state or territory rules before it appears in the schedule.
  - New: The business has a recorded due period and an accepted method, so the first step is a dated check of what has been received and what the client sent. The reminder waits until the transfer is traced. If the payment reached the wrong account, the business corrects its records and tells the client in writing what has been received. No late fee, interest or recovery step applies while the account is being traced.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: GST rate, registration, the content of a tax invoice, and the tax treatment of gratuities have not yet been confirmed, so check with the relevant regulator before relying on this point. Confirm with the Australian Taxation Office or a qualified adviser before relying on any statement.
  - New: Confirm with the Australian Taxation Office or a qualified adviser before relying on any statement.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: Debt recovery: state and territory rules on reminders, notices, pausing services and any court or tribunal process have not yet been confirmed, so check with the relevant regulator before relying on this point. The business takes advice before any formal recovery step.
  - New: The business takes advice before any formal recovery step.
- `safetyAndRegulatory/4/point` (text changed)
  - Old: Client payment details kept in records are personal information. Whether the Privacy Act 1988 applies to the business has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Client payment details kept in records are personal information.
- `summary/3` (deleted item)
  - Old: A charge that has not been checked is left out of the schedule.
  - New: [element removed]

### `curriculum/shared/templates/TPL-16.json`

- `procedure/2` (text changed)
  - Old: Describe the business's location, start date and legal structure, leaving the legal structure blank if it has not been checked.
  - New: Describe the business's location, start date and legal structure.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Legal structure, employment or contractor status, and the application of the Privacy Act 1988 to the business have not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Check legal structure, employment or contractor status, and the application of the Privacy Act 1988 to the business with the relevant regulator before relying on this point.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: For GST, the ATO sets the registration threshold at $75,000 of GST turnover for most businesses, and $150,000 a year or more for non-profit organisations (ATO page last updated 14 September 2026). Whether this business must register is a check against its own turnover and must be confirmed with the ATO. Financial projections, the GST rate, income tax, superannuation and owner drawings have not yet been confirmed, so check with the relevant regulator before relying on this point. Take advice from a qualified adviser before relying on any figure in the financial section.
  - New: For GST, the ATO sets the registration threshold at $75,000 of GST turnover for most businesses, and $150,000 a year or more for non-profit organisations (ATO page last updated 14 September 2026). Whether this business must register is a check against its own turnover and must be confirmed with the ATO. Take advice from a qualified adviser before relying on any figure in the financial section.

### `curriculum/shared/templates/TPL-17.json`

- `safetyAndRegulatory/1/point` (text changed)
  - Old: Customer details collected for research, such as names and addresses, are personal information. Whether the Privacy Act 1988 applies to the business has not yet been confirmed, so check with the relevant regulator before relying on this point.
  - New: Customer details collected for research, such as names and addresses, are personal information.

### `curriculum/shared/validation/CPV-01.json`

- `commonErrors/3/prevention` (text changed)
  - Old: Use the reasoning, and check the Australian requirements for the site, which have not yet been confirmed here.
  - New: Use the reasoning, and check the Australian requirements for the site.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.

### `curriculum/shared/validation/CPV-02.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Pharmaceutical validation protocols are a regulated activity for medicines manufacturers. Whether any similar requirement applies to an Australian business has not yet been confirmed, so check with the relevant regulator before relying on this point. This lesson does not grant any licence or authority.
  - New: Pharmaceutical validation protocols are a regulated activity for medicines manufacturers. This lesson does not grant any licence or authority.

### `curriculum/shared/validation/CPV-03.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.

### `curriculum/shared/validation/CPV-04.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.

### `curriculum/shared/validation/CPV-05.json`

- `workedExamples/0/reasoning` (text changed)
  - Old: The team writes the basis for the limit, compares it with what the chosen test can detect, sets a separate detergent limit, and confirms the limit with the responsible person. Australian allergen and food-safety rules for the line have not yet been confirmed and must be checked first.
  - New: The team writes the basis for the limit, compares it with what the chosen test can detect, sets a separate detergent limit, and confirms the limit with the responsible person.
- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Allergen cross-contact limits in Australian food premises have not yet been confirmed and are not set by this lesson, so check with the relevant regulator before relying on this point.
  - New: Allergen cross-contact limits in Australian food premises are not set by this lesson, so check with the relevant regulator before relying on this point.

### `curriculum/shared/validation/CPV-06.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.

### `curriculum/shared/validation/CPV-07.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.
- `safetyAndRegulatory/2/point` (text changed)
  - Old: Trade-waste rules for rinse water and any test waste have not yet been confirmed and differ between state and territory authorities.
  - New: Trade-waste rules for rinse water and any test waste differ between state and territory authorities.
- `safetyAndRegulatory/3/point` (text changed)
  - Old: The acceptable residue level for food-contact equipment in Australia has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the site's food-safety plan.
  - New: Use the site's food-safety plan.

### `curriculum/shared/validation/CPV-08.json`

- `safetyAndRegulatory/0/point` (text changed)
  - Old: Pharmaceutical CGMP rules, FDA and EU references: non-Australian; the Australian regulatory position for this topic has not yet been confirmed, so check with the relevant regulator before relying on this point. Use the practice content only.
  - New: Use the practice content only.
- `safetyAndRegulatory/1/point` (text changed)
  - Old: Pharmaceutical validation reports are regulated documents for medicines makers. Whether any similar report is required for an Australian business has not yet been confirmed, so check with the relevant regulator before relying on this point. This lesson does not grant any licence or authority.
  - New: Pharmaceutical validation reports are regulated documents for medicines makers. This lesson does not grant any licence or authority.

