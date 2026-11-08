/**
 * Approval gate for assessment files (issue #16). The answer-key loader applies the same rule as the curriculum
 * publisher (curriculum-publisher.ts approvalProblem): a file's answer keys are loaded only when an approval record
 * names the lesson, is status "approved", carries the sha256 of the file's exact bytes (so any edit makes it stale),
 * names a real reviewer and has a past ISO reviewedAt.
 *
 * Pure functions only, with no Prisma import. The caller supplies the user lookup for reviewer IDs.
 */
import { createHash } from "node:crypto";

export type ApprovalRecords = Record<string, unknown>;

const PLACEHOLDER_REVIEWER = /^(tbd|todo|n\/?a|none|null|unknown|test|placeholder|changeme|pending|reviewer|admin|example|dummy|x+|-+)$/i;
const NAMED_REVIEWER = /^[A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*)+$/;
const USER_ID_SHAPE = /^c[a-z0-9]{20,30}$/;
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

/** Parses the approval file text. A file that is not a JSON object keyed by lesson ID is refused, never ignored. */
export function parseApprovalRecords(raw: string): ApprovalRecords {
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("assessment approval file must be a JSON object keyed by lesson ID");
  return parsed;
}

/**
 * Why no approval covers these exact file bytes, or null when one does. The reviewer must be a named person or a
 * user ID that exists in the database (`isKnownUserId`).
 */
export async function approvalProblem(
  lessonId: string,
  bytes: Buffer,
  approvals: ApprovalRecords,
  isKnownUserId: (userId: string) => Promise<boolean>,
): Promise<string | null> {
  const approval = Object.prototype.hasOwnProperty.call(approvals, lessonId) ? approvals[lessonId] : undefined;
  if (!isRecord(approval)) return "no approval record";
  if (approval.status !== "approved") return "approval status is not approved";
  if (approval.sha256 !== createHash("sha256").update(bytes).digest("hex")) return "approval does not match the file (sha256)";
  const reviewer = typeof approval.reviewer === "string" ? approval.reviewer.trim() : "";
  if (!reviewer || PLACEHOLDER_REVIEWER.test(reviewer)) return "reviewer is missing or a placeholder";
  if (!NAMED_REVIEWER.test(reviewer)) {
    const known = USER_ID_SHAPE.test(reviewer) && (await isKnownUserId(reviewer));
    if (!known) return "reviewer is neither a named person nor a known user ID";
  }
  const reviewedAt = typeof approval.reviewedAt === "string" ? approval.reviewedAt : "";
  if (!ISO_WITH_ZONE.test(reviewedAt) || !Number.isFinite(Date.parse(reviewedAt)) || Date.parse(reviewedAt) > Date.now()) {
    return "reviewedAt is not a parseable ISO date in the past";
  }
  return null;
}
