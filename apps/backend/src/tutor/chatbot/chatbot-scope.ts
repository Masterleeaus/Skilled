/**
 * Shared error type and company-scope guard for the chatbot module.
 *
 * Every storage and service call takes companyId as its first argument. requireCompanyId() runs
 * at both layers, so a missing or malformed tenant fails closed even when a caller skips the route.
 */

/**
 * Desk's strict rule: a UUID and nothing else. Kept for Desk. The LMS does not use it for tenants.
 * See src/tutor/chatbot/CHANGES.md, decision 1.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** LMS tenant rule: a cuid-style id, letters and digits only, 20 to 30 characters, starting with a letter. */
const CUID_RE = /^[A-Za-z][A-Za-z0-9]{19,29}$/;

/** Desk's strict rule. True only for a string that is exactly a UUID. Not used for LMS tenants. */
export function isUuidCompanyId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** LMS tenant rule. True only for a string that is exactly a cuid-style id. */
export function isCuidCompanyId(value: unknown): value is string {
  return typeof value === "string" && CUID_RE.test(value);
}

/**
 * Accepts a cuid-style tenant id (the LMS Company id, used as-is) or a UUID (accepted so that
 * Desk-issued ids still pass). Rejects empty, non-string and malformed values.
 */
export function isCompanyId(value: unknown): value is string {
  return isCuidCompanyId(value) || isUuidCompanyId(value);
}

export class ChatbotError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ChatbotError";
    this.status = status;
  }
}

/** Returns the company id, or throws a 403 when it is absent or not a cuid-style id or a UUID. */
export function requireCompanyId(companyId: unknown): string {
  if (!isCompanyId(companyId)) {
    throw new ChatbotError("Company scope required", 403);
  }
  return companyId;
}
