/**
 * Unverified courses hold list.
 *
 * Courses listed here carry a cost-rule verdict of UNCLEAR (affordability filter pass only, not educationally approved,
 * publishable false under SkilledAt.Work V3.0). planPlacements() skips them, so no track or course placement is written
 * for them until the owner removes the slug from this list after verification.
 *
 * Source: /home/claude/work/cost-rule/passed.json (entries with verdict UNCLEAR, owner_override true). 31 slugs.
 */
export const UNVERIFIED_COURSES_HOLD_LIST: readonly string[] = [
  "appliance",
  "beauty",
  "commercial-and-office-cleaning",
  "dogwalk",
  "flat-pack-and-fixture-installation",
  "furniture",
  "garden-maintenance-and-clean-ups",
  "groom",
  "hair",
  "handyman",
  "healthcare-cleaning",
  "high-risk",
  "irrigation-servicing",
  "landscaping",
  "locksmith-and-door-installation",
  "medical-equipment-cleaning",
  "painting",
  "petsit",
  "plastering",
  "pond",
  "pool",
  "pressure-cleaning-all-heights",
  "pt",
  "real-estate-portfolio-management",
  "roof-soft-washing",
  "solar-panel-cleaning",
  "stone",
  "tiling",
  "timber",
  "window-cleaning-all-heights",
  "yoga",
];
