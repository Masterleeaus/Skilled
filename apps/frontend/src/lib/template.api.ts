import { api } from "@/lib/api-client";
import type { TemplateFieldDef } from "@/lib/template-form";

export interface RubricCriterion { criterion: string; levels: { meets: string; does_not_meet: string } }
export interface TemplateResponseSummary { status: "IN_PROGRESS" | "SUBMITTED" | "SIGNED_OFF"; fieldValues: Record<string, unknown>; submittedAt: string | null }
export interface IssuedDocumentSummary { id: string; version: number; contentHash: string; issuedAt: string | null }
export interface TemplateDefinition {
  templateId: string;
  revisionId: string;
  title: string;
  purpose: string;
  fields: TemplateFieldDef[];
  assessmentRubric: RubricCriterion[];
  response: TemplateResponseSummary | null;
  document: IssuedDocumentSummary | null;
}
export interface TemplateLessonState { lessonId: string; revisionId: string; templates: TemplateDefinition[] }

/** Field-level errors from the server (422) keyed by fieldId. Null when the failure is not a validation failure. */
export function fieldErrorsFrom(error: unknown): Record<string, string> | null {
  const response = (error as { response?: { status?: number; data?: { errors?: unknown } } })?.response;
  if (!response || response.status !== 422 || !Array.isArray(response.data?.errors)) return null;
  const out: Record<string, string> = {};
  for (const item of response.data.errors as Array<{ fieldId?: unknown; message?: unknown }>) {
    if (typeof item?.fieldId === "string" && typeof item?.message === "string") out[item.fieldId] = item.message;
  }
  return out;
}

export async function fetchTemplateLesson(lessonId: string, revisionId: string): Promise<TemplateLessonState> {
  const { data } = await api.get(`/academy/templates/lessons/${encodeURIComponent(lessonId)}/revisions/${encodeURIComponent(revisionId)}`);
  return data.data;
}

export async function saveTemplateDraft(lessonId: string, revisionId: string, templateId: string, fieldValues: Record<string, unknown>): Promise<void> {
  await api.put(`/academy/templates/lessons/${encodeURIComponent(lessonId)}/revisions/${encodeURIComponent(revisionId)}/templates/${encodeURIComponent(templateId)}/draft`, { fieldValues });
}

export async function submitTemplate(lessonId: string, revisionId: string, templateId: string, fieldValues: Record<string, unknown>): Promise<void> {
  await api.post(`/academy/templates/lessons/${encodeURIComponent(lessonId)}/revisions/${encodeURIComponent(revisionId)}/templates/${encodeURIComponent(templateId)}/submit`, { fieldValues });
}

/** The PDF is fetched with the bearer token, then saved from a blob URL. */
export async function downloadTemplateDocument(documentId: string): Promise<Blob> {
  const { data } = await api.get(`/academy/templates/documents/${encodeURIComponent(documentId)}/pdf`, { responseType: "blob" });
  return data as Blob;
}
