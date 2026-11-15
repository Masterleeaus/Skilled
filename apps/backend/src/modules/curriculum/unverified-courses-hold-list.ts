/**
 * Unverified courses hold list.
 *
 * Courses listed here carry a cost-rule verdict of UNCLEAR (affordability filter pass only, not educationally approved,
 * publishable false under SkilledAt.Work V3.0). planPlacements() skips them, so no track or course placement is written
 * for them until the owner removes the slug from this list after verification.
 *
 * Status: the owner approved all skilled courses on 2026-11-15 and removed the 31 slugs that were held here. The list is
 * kept, empty, so the hold mechanism in planPlacements() stays available. This approval is the owner's statement; no
 * expert sign-off document exists in the repo.
 *
 * Source of the removed entries: /home/claude/work/cost-rule/passed.json (verdict UNCLEAR, owner_override true). 31 slugs.
 */
export const UNVERIFIED_COURSES_HOLD_LIST: readonly string[] = [];
