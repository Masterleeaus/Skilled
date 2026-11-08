# Construction course placement (owner decision 21)

Date: 2026-11-03. Script run once against curriculum/structure/COURSES-MODULES.json.

## Rule

- Lessons whose courseSlugs include "construction" and that had no placement in the construction course.
- Placed in the construction module with the same name as the lesson's moduleTitle, appended at the end of that module, status DRAFT, type from lessonType.
- Module names are matched exactly. No module was created. No existing placement was moved or removed. meta.highRiskModule unchanged.

## Counts

- Candidate lessons: 98
- Placed: 92
- Unmatched (not placed, logged below): 6
- meta.placements before: 5350, after: 5442

## Additions (lessonId, module)

| lessonId | module | title |
|---|---|---|
| ACE-02 | Shared: Marketing and sales | Discovering needs and qualifying a prospect without pressure |
| ACE-04 | Shared: Starting a business | Professional advisers: when to ask, and what to bring |
| BP-01 | Shared: Starting a business | How a cleaning business plan is structured |
| BP-02 | Shared: Marketing and sales | Customer needs and building trust in a cleaning business |
| BP-03 | Shared: Starting a business | SWOT analysis for a small cleaning business |
| BP-04 | Shared: Marketing and sales | Positioning on training and professionalism |
| BP-05 | Shared: Quoting and pricing | Pricing by hours per project |
| BP-06 | Shared: Starting a business | Break-even and sales forecast by stage |
| BP-07 | Shared: Growing and managing a team | Staffing in stages: the first team, then new teams |
| BST-01 | Shared: Job management and service delivery | Typical job prices and times: mean or median |
| BST-02 | Shared: Job management and service delivery | Spread and outliers in job times and invoices |
| BST-03 | Shared: Starting a business | Estimating a rate from a sample: repeat customers |
| BST-04 | Shared: Quality and job documentation | Comparing two methods with before-and-after data |
| BST-05 | Shared: Quoting and pricing | Forecasting monthly jobs from a seasonal pattern |
| CP-01 | Shared: Marketing and sales | Targeted search: finding the clients that fit your service |
| CP-02 | Shared: Marketing and sales | Networking: warm contacts, trade partners and local businesses |
| CP-03 | Shared: Marketing and sales | Online presence: community groups, profiles and consent-based content |
| CP-04 | Shared: Marketing and sales | Referrals and repeat work from existing clients |
| ECO-01 | Group (Cleaning & Hygiene): Safety and hazards | Site rules: approved products, plug-in equipment and reporting |
| ECO-02 | Group (Cleaning & Hygiene): Methods and technique | Colour-coded cloths: a business-set system that keeps areas apart |
| ECO-03 | Group (Cleaning & Hygiene): Methods and technique | Dusting and damp wiping: top-down order and controlled moisture |
| ECO-04 | Group (Cleaning & Hygiene): Methods and technique | Dry sweeping and mopping: route order, bucket position and drying |
| ECO-06 | Group (Cleaning & Hygiene): Safety and hazards | Stairs, balustrades and handrails: stable stance and safe layout |
| MP-01 | Shared: Starting a business | Defining target segments from customer data |
| MP-02 | Shared: Starting a business | Choosing marketing channels and measuring them |
| MP-03 | Shared: Starting a business | Referral incentives that respect consumer and spam rules |
| MP-04 | Shared: Quoting and pricing | Break-even analysis with a worked calculation |
| MP-05 | Shared: Starting a business | Building a sales forecast from stages |
| MP-06 | Shared: Starting a business | Setting an expense budget as a percentage of sales |
| MP-07 | Shared: Starting a business | Controls and KPIs: repeat business, satisfaction, revenue and expenses |
| MP-08 | Shared: Starting a business | Milestone planning with owners and dates |
| PRO-01 | Shared: Quoting and pricing | Scope of works for a commercial cleaning site |
| PRO-02 | Shared: Job management and service delivery | Reporting documents for a cleaning site |
| PRO-03 | Shared: Quality and job documentation | Incident and performance forms as one system |
| SHR-FIN-01 | Shared: Business operations and finance | Chart of accounts for a service business |
| SHR-FIN-02 | Shared: Business operations and finance | Keeping records for a service business |
| SHR-FIN-03 | Shared: Business operations and finance | Equipment, vehicles and depreciation for a service business |
| SHR-FIN-04 | Shared: Business operations and finance | From source document to journal and ledger |
| SHR-FIN-05 | Shared: Business operations and finance | Trial balance, adjusting entries and closing the books |
| SHR-PLN-02 | Shared: Starting a business | Defining business needs and the services to offer |
| SHR-PLN-03 | Shared: Starting a business | Planning how a service business earns and delivers |
| SHR-PLN-04 | Shared: Marketing and sales | Growth options and market share for a service business |
| SHR-PLN-05 | Shared: Marketing and sales | Preparing a marketing plan: mission, present position and goals before channels |
| SOL-01 | Shared: Starting a business | Designing your life and your freedom number |
| SOL-02 | Shared: Starting a business | Finding your service pillars and your market |
| SOL-03 | Shared: Quoting and pricing | Building an offer that justifies a higher rate |
| SOL-04 | Shared: Starting a business | Testing your offer before you charge full price |
| SOL-05 | Shared: Marketing and sales | Finding your first customers through direct, consent-based outreach |
| SOL-06 | Shared: Marketing and sales | Scaling up and running a time-limited campaign |
| SOL-07 | Shared: Business operations and finance | Documenting and automating the repetitive parts of your business |
| SOL-08 | Shared: Marketing and sales | Building your reputation as the expert in your trade |
| SOP-01 | Group (Cleaning & Hygiene): Safety and hazards | Chemical competency: reading labels and safety data sheets |
| SOP-04 | Group (Cleaning & Hygiene): Methods and technique | Mop sweeping hard floors |
| SOP-05 | Group (Cleaning & Hygiene): Methods and technique | Single-solution wet mopping |
| SOP-06 | Group (Cleaning & Hygiene): Methods and technique | Floor buffing with a rotary machine |
| SOP-07 | Group (Cleaning & Hygiene): Methods and technique | Suction (vacuum) cleaning of floors and carpets |
| SOP-08 | Group (Cleaning & Hygiene): Methods and technique | Wall washing |
| SOP-09 | Group (Cleaning & Hygiene): Methods and technique | Dusting, damp wiping, washing and polishing furniture and surfaces |
| SOP-10 | Group (Cleaning & Hygiene): Methods and technique | Cleaning toilets, wash basins, urinals and washrooms |
| SOP-11 | Group (Cleaning & Hygiene): Methods and technique | Spray buffing with a rotary machine |
| SOP-12 | Group (Cleaning & Hygiene): Methods and technique | Window cleaning from the ground and with extension equipment |
| SOP-13 | Group (Cleaning & Hygiene): Methods and technique | Stain removal: identify, test, treat and record |
| SOP-20 | Group (Cleaning & Hygiene): Methods and technique | Stripping, drying and reapplying emulsion polish on hard floors |
| SOP-21 | Group (Cleaning & Hygiene): Methods and technique | Machine scrubbing and drying with a wet suction machine |
| SOP-22 | Group (Cleaning & Hygiene): Safety and hazards | Litter picking on external grounds and entrances |
| SOP-23 | Group (Cleaning & Hygiene): Safety and hazards | Body fluid spill and sharps clean-up (high-risk: trained workers only) |
| SOP-24 | Group (Cleaning & Hygiene): Methods and technique | Cleaning stairs, landings, balustrades and handrails |
| SOP-25 | Group (Cleaning & Hygiene): Methods and technique | Cleaning passenger and goods lift interiors |
| SOP-27 | Group (Cleaning & Hygiene): Safety and hazards | Induction before cleaning work starts |
| SOP-28 | Group (Cleaning & Hygiene): Safety and hazards | Sharps and body fluids: policy, reporting and records |
| SOP-29 | Group (Cleaning & Hygiene): Safety and hazards | Manual handling for cleaning work |
| TPL-01 | Shared: Starting a business | Business plan (editable template) |
| TPL-02 | Shared: Starting a business | Freedom and cash plan (editable template) |
| TPL-03 | Shared: Marketing and sales | Marketing plan (editable template) |
| TPL-04 | Shared: Quoting and pricing | Quote and proposal (editable template) |
| TPL-05 | Shared: Job management and service delivery | Standard operating procedure (editable template) |
| TPL-06 | Shared: Job management and service delivery | Job checklist and sign-off (editable template) |
| TPL-07 | Shared: Quality and job documentation | Incident and damage report (editable template) |
| TPL-08 | Shared: Growing and managing a team | Staff onboarding and induction record (editable template) |
| TPL-09 | Shared: Growing and managing a team | Staff performance review (editable template) |
| TPL-10 | Shared: Customer communication and privacy | Customer complaint log and response (editable template) |
| TPL-11 | Shared: Quoting and pricing | Pricing and margin worksheet (editable template) |
| TPL-12 | Shared: Quoting and pricing | Cleaning proposal for a new client (editable template) |
| TPL-13 | Shared: Customer communication and privacy | Client service agreement (editable template) |
| TPL-14 | Shared: Job management and service delivery | Site brief and access sheet for each client (editable template) |
| TPL-15 | Shared: Quoting and pricing | Payment and overdue account schedule (editable template) |
| TPL-16 | Shared: Starting a business | Business plan outline for a cleaning business (editable template) |
| TPL-17 | Shared: Marketing and sales | Market, customer and competitor analysis (editable template) |
| YNS-01 | Shared: Marketing and sales | A focused niche and the fit test for choosing one |
| YNS-02 | Shared: Marketing and sales | Plus factors: combining your background into one offer |
| YNS-03 | Shared: Marketing and sales | Buying triggers: the reasons clients act, and how to speak to them honestly |
| YNS-04 | Shared: Marketing and sales | Testing a working niche and sharpening it with client response |

## Unmatched lessons (not placed)

| lessonId | moduleTitle | title |
|---|---|---|
| ECO-05 | Group (Cleaning & Hygiene): Equipment and materials | Vacuuming: inspect, clear, control the cord and shut down safely |
| SHR-PLN-01 | Shared: Customer communication and complaints | Client service and complaints for a service business |
| SOP-02 | Group (Cleaning & Hygiene): Equipment and materials | Safe use and care of electrical machines |
| SOP-03 | Group (Cleaning & Hygiene): Equipment and materials | Storing equipment, chemicals and consumables |
| SOP-26 | Group (Cleaning & Hygiene): Equipment and materials | Cleaning personal computers, keyboards and screens |
| SOP-30 | Group (Cleaning & Hygiene): Quality, evidence and handover | Cleaning audit: inspecting, recording and signing off a clean |
