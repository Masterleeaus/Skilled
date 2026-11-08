/** Titan Academy approved business-context field contract. */
export const BUSINESS_LESSON_FIELDS = [
  "business.name",
  "business.display_name",
  "business.logo_url",
  "business.support_phone",
  "business.support_email",
  "business.service_area",
  "business.timezone",
  "services.enabled",
  "services.service_group",
  "services.vertical",
  "services.service_description",
  "equipment.assigned_items",
  "equipment.primary_tool",
  "equipment.inspection_checklist",
  "equipment.maintenance_schedule",
  "equipment.manufacturer_manual_url",
  "materials.approved_products",
  "materials.sds_links",
  "materials.handling_procedure",
  "materials.storage_procedure",
  "materials.waste_procedure",
  "safety.required_ppe",
  "safety.site_hazards",
  "safety.emergency_contact",
  "safety.incident_reporting_procedure",
  "safety.escalation_contact",
  "procedures.approved_sop",
  "procedures.prestart_checklist",
  "procedures.task_steps",
  "procedures.completion_checklist",
  "procedures.quality_standard",
  "jobs.scheduling_method",
  "jobs.arrival_procedure",
  "jobs.time_tracking",
  "jobs.photo_requirements",
  "jobs.signoff_procedure",
  "customers.communication_policy",
  "customers.complaint_escalation",
  "customers.access_instructions",
  "quality.inspection_checklist",
  "quality.defect_reporting",
  "quality.evidence_requirements",
  "pricing.pricing_method",
  "pricing.minimum_charge",
  "pricing.materials_cost_policy",
  "pricing.quoting_approval",
  "staff.role",
  "staff.supervisor_contact",
  "staff.authorised_tasks",
  "compliance.jurisdiction",
  "compliance.licence_requirements",
  "compliance.policy_reference",
  "assessment.business_question_set",
  "assessment.practical_equipment",
  "assessment.assessor_role",
  "assessment.signoff_requirements"
] as const;
export type BusinessLessonFieldKey = (typeof BUSINESS_LESSON_FIELDS)[number];
const fieldKeys: ReadonlySet<string> = new Set(BUSINESS_LESSON_FIELDS);
export function isBusinessLessonFieldKey(key: string): key is BusinessLessonFieldKey {
  return fieldKeys.has(key);
}
export type BusinessFieldRecord = { fieldKey: string; value: unknown; status: string; revision: number };
/** Fail closed: unapproved fields never appear in learner content. */
export function resolveApprovedBusinessFields(records: readonly BusinessFieldRecord[]): Readonly<Record<string, unknown>> {
  const resolved: Record<string, unknown> = Object.create(null);
  for (const row of records) {
    if (row.status === 'APPROVED' && isBusinessLessonFieldKey(row.fieldKey)) resolved[row.fieldKey] = row.value;
  }
  return Object.freeze(resolved);
}
/** Substitution is explicit and returns raw strings; UI must render as text, never HTML. */
export function resolveLessonText(template: string, fields: Readonly<Record<string, unknown>>): string {
  return template.replace(/\{\{business:([a-z_]+\.[a-z_]+)\}\}/g, (match, key: string) => {
    const value = fields[key];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : Array.isArray(value) && value.every(item => typeof item === 'string') ? value.join(', ') : match;
  });
}
