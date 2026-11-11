/**
 * Licence notices come from lesson JSON: each safetyAndRegulatory point with licenceNotice === true.
 * Pure function so it can be tested without rendering.
 */
export const LICENCE_NOTICE_TITLE = "Warning: this lesson does not grant a licence";
export const LICENCE_NOTICE_BODY = "Completing this lesson does not give you a licence, certificate or authority to do licensed or regulated work. The points below describe what a licence covers and that this lesson does not grant one.";

export function licenceNoticePoints(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const items = (body as Record<string, unknown>).safetyAndRegulatory;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is { point: unknown; licenceNotice: unknown } => !!item && typeof item === "object")
    .filter(item => item.licenceNotice === true && typeof item.point === "string" && item.point.trim().length > 0)
    .map(item => (item.point as string).trim());
}
