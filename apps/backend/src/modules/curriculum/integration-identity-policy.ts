/**
 * Exact, company-scoped identity lookup for machine-to-machine learner checks.
 *
 * No lookup by email, and no fallback to a global identity. A legacy NULL
 * companyId row is invisible until explicitly reconciled by an operator.
 * Two matches are ambiguous and MUST NOT authorize access.
 */
export interface ScopedIdentityQuery {
  service: "field-services" | "ai-workforce";
  companyId: string;
  externalUserRef: string;
}
export interface ScopedIdentityRow {
  userId: string;
}
export type ScopedIdentityLookup = (
  where: ScopedIdentityQuery,
) => Promise<readonly ScopedIdentityRow[]>;

export async function resolveScopedIdentity(
  query: ScopedIdentityQuery,
  lookup: ScopedIdentityLookup,
): Promise<string | null> {
  if (!query.service || !query.companyId?.trim() || !query.externalUserRef?.trim()) return null;
  if (query.service !== "field-services" && query.service !== "ai-workforce") return null;
  // Database callers MUST enforce take:2 and select only userId.
  // This is a denial oracle, not a general identity search API.
  const matches = await lookup(query);
  if (!Array.isArray(matches) || matches.length !== 1) return null;
  const userId = matches[0]?.userId;
  return typeof userId === "string" && userId.trim().length > 0 ? userId : null;
}
