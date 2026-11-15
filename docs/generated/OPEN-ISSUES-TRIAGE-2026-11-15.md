# Open issue triage, 2026-11-15

Scope: the 54 open issues in Masterleeaus/Skilled on 2026-11-15, checked against `Main` and the open and merged PRs.

## Counts

- Closed with evidence (comment names PRs and file paths): 12
- Linked to an open PR or partly done, left open: 3 (#207, #161, #169)
- Implemented in a draft PR: 1 (#169, partial, `Refs`)
- Still open with a reason: 42 (including #169 and the 3 above)

## Closed with evidence

| Issue | Evidence |
| --- | --- |
| #158 Central service-decision client | PR #184 |
| #163 Link assertion signing key | PR #202 |
| #165 Field-services sync | PR #219 (documented DEFERRED skip) |
| #166 Node 22 and pnpm 10 docs | PRs #176, #216 |
| #167 ESLint unification | PR #215 |
| #148 Learner certificate page | PR #181 |
| #155 Central OIDC alignment | PR #180 and #134-#136, #142 |
| #204 Link assertions | PR #227, #202 |
| #205 Central OIDC sign-in | PRs #134-#136, #142, #228 |
| #206 Service decision client | PRs #145, #184, #227 |
| #208 Flags and signed events | PR #228 |
| #209 Service client credentials | PR #228 |

## Linked to open PRs or partly done

- #207 tenant model: open PR #240 (`fix(academy): scope learner completions ... to organisation`, refs #207).
- #161 domain and runtime config: PR #200 documents config; the production domain is an owner decision (#147).
- #169 MinIO pin: draft PR #253 pins the release tag; the digest pin is open.

## Still open, by theme

### Central and LMS integration

- #210 end-to-end check on shared PostgreSQL and Central. Needs a live database and a live Central.
- #71 Central sign-in umbrella. SSO is gated on purpose (PR #144). Activation needs readiness evidence.
- #68 shared company_id schema umbrella. Needs #210 and #207.
- #72 rebrand umbrella. Depends on #86 and the owner's wording.

### Plan P1 and deployment

- #175 production PostgreSQL version. Needs access to the host.
- #174 brand assets. Needs the Skilled mark file from the owner.
- #35 deployment rehearsal. Needs a staging server.
- #34 expert review of regulated content. Needs qualified reviewers (owner decision).
- #9 end-to-end verification. Report exists (`docs/E2E-VERIFY-2026-11-14.md`) with BLOCKED items.

### Tooling

- #169 digest pin for MinIO. Draft PR #253 covers the tag pin.

### Curriculum quality

- #17 drafts without usable instructional sections. Content authoring and editorial review.
- #19 drafts without measurable outcomes. Content authoring and editorial review.
- #20 unmapped lesson drafts. Partly covered by PR #116. Needs a fresh audit.
- #21 reconcile briefs with drafts. Identity map is a large content task.
- #24 review 487 transfer classifications. Only 231 sampled. Human review.
- #26 CI gate. Workflow exists, but `curriculum:ci` is `continue-on-error` (PR #216). Making it blocking needs the content approval decision.
- #86 legacy Titan Academy naming. 34 files still mention it. Replacement wording is an owner decision, and newer lesson work must be kept.

### New courses (one issue per group)

- #185 cleaning (15), #186 vehicles and furniture (3), #187 trades and maintenance (9), #188 outdoor and garden (7), #189 pet services (4), #190 personal services and beauty (5), #191 health and fitness (3), #192 property and hospitality (2), #193 education (2).
- #194 dog training, #195 makeup artistry, #196 mobile nails, #197 nutrition consultant, #198 tutoring, #199 short-stay host.
- Reason open: each course needs lessons, assessments, a passing answer key, a passing curriculum gate and a human reviewer. Several folders already exist under `curriculum/courses/`, but none is approved.
- The health, tutoring and nutrition courses need a qualified reviewer named by the owner.

### Owner decisions and verticals

- #147 owner decisions: hold list, draft-only verticals, reviewers. Cannot be closed by code.
- #152 tutoring, #153 makeup, #154 nails, #156 dog training, #157 short-stay, #159 nutrition. Draft verticals. Blocked by #147 and by content work.
- #160 wire six courses into mapping files. Depends on the six verticals.

## Decisions made in this triage

1. Closed issues only when Main has the code and tests for the acceptance criteria. Work done in merged PRs counts when Main has it.
2. #26 stays open. The informational gate is a deliberate state (PR #216), not a gap to close here.
3. #169: pinned to the tag local-dev already uses, not a digest, because no digest was readable from this environment.
4. No course content was written. Content needs human review under the issue rules.
5. The field-services route (#165) was not built. The owner decisions are still needed.
