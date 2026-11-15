/**
 * Organisation scope for learner-owned completion and knowledge-check rows.
 *
 * The learner routes take no organisation input. Both helpers read only server-side rows: CompanyMember for
 * membership and AcademyTrainingAssignment for the training that placed the lesson. A row whose organisation
 * cannot be determined is stored with a NULL companyId, and learner reads never return NULL rows.
 */
import { prisma } from "../../config/prisma";

/** Organisations the authenticated learner belongs to. Empty means no learner row is visible. */
export async function learnerCompanyIds(learnerId: string): Promise<string[]> {
  const rows = await prisma.companyMember.findMany({ where: { userId: learnerId }, select: { companyId: true } });
  return [...new Set(rows.map(row => row.companyId))];
}

/**
 * The organisation to stamp on a new row, or null. It is the single organisation that holds an ASSIGNED training
 * assignment for the learner on one of `courseIds` and in which the learner is a member. Any other result is null.
 */
export async function resolveLearnerRowCompany(learnerId: string, courseIds: string[]): Promise<string | null> {
  if (!courseIds.length) return null;
  const assignments = await prisma.academyTrainingAssignment.findMany({
    where: { learnerId, status: "ASSIGNED", courseId: { in: courseIds } },
    select: { companyId: true },
  });
  const assigned = [...new Set(assignments.map(row => row.companyId))];
  if (!assigned.length) return null;
  const memberships = await prisma.companyMember.findMany({
    where: { userId: learnerId, companyId: { in: assigned } },
    select: { companyId: true },
  });
  const member = [...new Set(memberships.map(row => row.companyId))];
  return member.length === 1 ? member[0] : null;
}
