import { canonicalJson, sha256Hex } from "../../utils/content-hash";

/**
 * Pure rules for editable template lessons (PASS42): field validation, document
 * assembly, content hashing and rubric evaluation. No database or HTTP access here.
 */

export const FIELD_TYPES = ["text", "longtext", "number", "currency", "date", "checklist", "table"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface TemplateField {
  fieldId: string;
  label: string;
  type: FieldType;
  prompt: string;
  guidance: string;
  required: boolean;
}
export interface EditableTemplate {
  templateId: string;
  title: string;
  purpose: string;
  fields: TemplateField[];
}
export interface OutputSection { heading: string; fieldIds: string[] }
export interface OutputDocumentDef { title: string; format: string; sections: OutputSection[]; footer: string }
export interface RubricCriterion { criterion: string; levels: { meets: string; does_not_meet: string } }

/** Stored value per field. Checklist is a list of items, table is a list of rows of cells. */
export type FieldValue = string | number | string[] | string[][] | null;
export type FieldValues = Record<string, FieldValue>;

export interface FieldError { fieldId: string; message: string }

/** Thrown when lesson JSON is structurally invalid. This is a content defect, not learner input. */
export class TemplateDefinitionError extends Error {
  constructor(message: string) {
    super(`Template lesson definition is invalid: ${message}`);
    this.name = "TemplateDefinitionError";
  }
}

/** Thrown when the output document does not place every field exactly once. */
export class DocumentAssemblyError extends Error {
  constructor(message: string) {
    super(`Document assembly failed: ${message}`);
    this.name = "DocumentAssemblyError";
  }
}

const TEXT_MAX: Record<"text" | "longtext", number> = { text: 500, longtext: 10000 };
const NUMBER_LIMIT = 1e12;
const CURRENCY_LIMIT = 1e9;
const CHECKLIST_MAX_ITEMS = 50;
const CHECKLIST_ITEM_MAX = 300;
const TABLE_MAX_ROWS = 100;
const TABLE_MAX_COLUMNS = 10;
const TABLE_CELL_MAX = 500;
const PLACEHOLDER = /\{\{business:[a-z_]+\.[a-z_]+\}\}/g;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/** Two decimal places at most, so currency cannot carry fractions of a cent. */
const isWholeCents = (value: number): boolean => Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

/** Normalises one raw value for one field. Returns null for "not provided". Throws FieldError-like messages via the returned error. */
function normaliseValue(field: TemplateField, raw: unknown): { value: FieldValue; error?: string } {
  if (raw === undefined || raw === null) return { value: null };
  switch (field.type) {
    case "text":
    case "longtext": {
      if (typeof raw !== "string") return { value: null, error: "must be text" };
      const trimmed = raw.trim();
      if (trimmed.length > TEXT_MAX[field.type]) return { value: null, error: `must be at most ${TEXT_MAX[field.type]} characters` };
      return { value: trimmed.length ? trimmed : null };
    }
    case "number": {
      if (typeof raw !== "number" || !Number.isFinite(raw)) return { value: null, error: "must be a number" };
      if (Math.abs(raw) > NUMBER_LIMIT) return { value: null, error: "is outside the allowed range" };
      return { value: raw };
    }
    case "currency": {
      if (typeof raw !== "number" || !Number.isFinite(raw)) return { value: null, error: "must be an amount" };
      if (raw < 0 || raw > CURRENCY_LIMIT) return { value: null, error: "must be between 0 and 1,000,000,000" };
      if (!isWholeCents(raw)) return { value: null, error: "must have at most two decimal places" };
      return { value: raw };
    }
    case "date": {
      if (typeof raw !== "string" || !isCalendarDate(raw)) return { value: null, error: "must be a date in YYYY-MM-DD form" };
      return { value: raw };
    }
    case "checklist": {
      if (!Array.isArray(raw) || !raw.every(item => typeof item === "string")) return { value: null, error: "must be a list of text items" };
      const items = (raw as string[]).map(item => item.trim()).filter(item => item.length > 0);
      if (items.length > CHECKLIST_MAX_ITEMS) return { value: null, error: `must have at most ${CHECKLIST_MAX_ITEMS} items` };
      if (items.some(item => item.length > CHECKLIST_ITEM_MAX)) return { value: null, error: `items must be at most ${CHECKLIST_ITEM_MAX} characters` };
      return { value: items.length ? items : null };
    }
    case "table": {
      if (!Array.isArray(raw) || !raw.every(row => Array.isArray(row) && row.every(cell => typeof cell === "string"))) {
        return { value: null, error: "must be a list of rows, each a list of text cells" };
      }
      const rows = (raw as string[][])
        .map(row => row.map(cell => cell.trim()))
        .filter(row => row.some(cell => cell.length > 0));
      if (rows.length > TABLE_MAX_ROWS) return { value: null, error: `must have at most ${TABLE_MAX_ROWS} rows` };
      if (rows.some(row => row.length > TABLE_MAX_COLUMNS)) return { value: null, error: `must have at most ${TABLE_MAX_COLUMNS} columns` };
      if (rows.some(row => row.some(cell => cell.length > TABLE_CELL_MAX))) return { value: null, error: `cells must be at most ${TABLE_CELL_MAX} characters` };
      return { value: rows.length ? rows : null };
    }
  }
}

/** Whether a normalised value counts as completed for a required field. */
function isEmptyValue(value: FieldValue): boolean {
  return value === null;
}

/**
 * Validates learner input against a template's field definitions.
 * mode "draft" checks types only. mode "submit" also enforces required fields.
 * Unknown field keys are rejected rather than silently dropped.
 */
export function validateFieldValues(
  fields: readonly TemplateField[],
  raw: unknown,
  mode: "draft" | "submit",
): { values: FieldValues; errors: FieldError[] } {
  if (!isPlainObject(raw)) return { values: {}, errors: [{ fieldId: "*", message: "fieldValues must be an object keyed by field" }] };
  const known = new Set(fields.map(f => f.fieldId));
  const errors: FieldError[] = Object.keys(raw)
    .filter(key => !known.has(key))
    .map(key => ({ fieldId: key, message: "is not a field of this template" }));
  const values: FieldValues = {};
  for (const field of fields) {
    const result = normaliseValue(field, raw[field.fieldId]);
    if (result.error) {
      errors.push({ fieldId: field.fieldId, message: result.error });
      continue;
    }
    values[field.fieldId] = result.value;
    if (mode === "submit" && field.required && isEmptyValue(result.value)) {
      errors.push({ fieldId: field.fieldId, message: "is required" });
    }
  }
  return { values, errors };
}

/** Stable JSON, shared with the lesson hash. Kept under this name so existing imports keep working. */
export const stableStringify = canonicalJson;

export function sha256(text: string): string {
  return sha256Hex(text);
}

export interface AssembledField { fieldId: string; label: string; type: FieldType; value: FieldValue }
export interface AssembledSection { heading: string; fields: AssembledField[] }
export interface AssembledDocument {
  templateId: string;
  title: string;
  format: string;
  sections: AssembledSection[];
  footer: string;
  unresolvedPlaceholders: string[];
}

/**
 * Builds the learner's document from outputDocument.sections. Every template field must
 * appear in exactly one section. A missing, duplicated or unknown field throws rather than
 * being dropped, so nothing the learner wrote can disappear from the issued document.
 */
export function assembleDocument(
  template: EditableTemplate,
  output: OutputDocumentDef,
  values: FieldValues,
  resolveText: (text: string) => string,
): { document: AssembledDocument; contentHash: string } {
  const byId = new Map(template.fields.map(f => [f.fieldId, f] as const));
  const placed = new Map<string, number>();
  for (const section of output.sections) {
    for (const fieldId of section.fieldIds) {
      if (!byId.has(fieldId)) throw new DocumentAssemblyError(`section "${section.heading}" references unknown field ${fieldId}`);
      placed.set(fieldId, (placed.get(fieldId) ?? 0) + 1);
    }
  }
  const missing = template.fields.map(f => f.fieldId).filter(id => !placed.has(id));
  if (missing.length) throw new DocumentAssemblyError(`fields not placed in any section: ${missing.join(", ")}`);
  const duplicated = [...placed].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicated.length) throw new DocumentAssemblyError(`fields placed more than once: ${duplicated.join(", ")}`);

  const sections: AssembledSection[] = output.sections.map(section => ({
    heading: resolveText(section.heading),
    fields: section.fieldIds.map(fieldId => {
      const field = byId.get(fieldId)!;
      return { fieldId, label: field.label, type: field.type, value: values[fieldId] ?? null };
    }),
  }));
  const title = resolveText(output.title);
  const footer = resolveText(output.footer);
  const unresolved = new Set<string>();
  for (const text of [title, footer, ...sections.map(s => s.heading)]) {
    for (const match of text.match(PLACEHOLDER) ?? []) unresolved.add(match);
  }
  const document: AssembledDocument = {
    templateId: template.templateId,
    title,
    format: output.format,
    sections,
    footer,
    unresolvedPlaceholders: [...unresolved].sort(),
  };
  return { document, contentHash: sha256(stableStringify(document)) };
}

export function hasUnresolvedPlaceholders(text: string): boolean {
  return new RegExp(PLACEHOLDER.source).test(text);
}

const FIELD_ID = /^f[0-9]+$/;

/**
 * Lesson-level placement. outputDocument is one object per lesson and covers the fields of every
 * template in it. Each field must appear in exactly one section, and each section may only name fields
 * that exist. Field IDs are unique across the lesson.
 */
export function checkLessonPlacement(templates: readonly EditableTemplate[], output: OutputDocumentDef): void {
  const all = templates.flatMap(t => t.fields.map(f => f.fieldId));
  const defined = new Map<string, number>();
  for (const id of all) defined.set(id, (defined.get(id) ?? 0) + 1);
  const clashing = [...defined].filter(([, count]) => count > 1).map(([id]) => id);
  if (clashing.length) throw new DocumentAssemblyError(`fields defined in more than one template of the lesson: ${clashing.join(", ")}`);
  const known = new Set(all);
  const placed = new Map<string, number>();
  for (const section of output.sections) {
    for (const fieldId of section.fieldIds) {
      if (!known.has(fieldId)) throw new DocumentAssemblyError(`section "${section.heading}" references unknown field ${fieldId}`);
      placed.set(fieldId, (placed.get(fieldId) ?? 0) + 1);
    }
  }
  const missing = all.filter(id => !placed.has(id));
  if (missing.length) throw new DocumentAssemblyError(`fields not placed in any section: ${missing.join(", ")}`);
  const duplicated = [...placed].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicated.length) throw new DocumentAssemblyError(`fields placed more than once: ${duplicated.join(", ")}`);
}

/** The part of a lesson's output document that belongs to one template. Empty sections are dropped. */
export function scopeOutputToTemplate(output: OutputDocumentDef, template: EditableTemplate, templateCount: number): OutputDocumentDef {
  const own = new Set(template.fields.map(f => f.fieldId));
  return {
    ...output,
    title: templateCount > 1 ? `${output.title} - ${template.title}` : output.title,
    sections: output.sections
      .map(section => ({ heading: section.heading, fieldIds: section.fieldIds.filter(id => own.has(id)) }))
      .filter(section => section.fieldIds.length > 0),
  };
}

function validateTemplateStructure(template: unknown): asserts template is EditableTemplate {
  if (!isPlainObject(template) || typeof template.templateId !== "string") throw new TemplateDefinitionError("a template has no templateId");
  const id = template.templateId;
  if (!Array.isArray(template.fields) || template.fields.length === 0) throw new TemplateDefinitionError(`${id} has no fields`);
  const seen = new Set<string>();
  for (const field of template.fields) {
    if (!isPlainObject(field) || typeof field.fieldId !== "string" || !FIELD_ID.test(field.fieldId)) throw new TemplateDefinitionError(`${id} has an invalid fieldId`);
    if (seen.has(field.fieldId)) throw new TemplateDefinitionError(`${id} repeats ${field.fieldId}`);
    seen.add(field.fieldId);
    if (!(FIELD_TYPES as readonly string[]).includes(field.type as string)) throw new TemplateDefinitionError(`${field.fieldId} has unknown type ${String(field.type)}`);
    if (typeof field.required !== "boolean") throw new TemplateDefinitionError(`${field.fieldId} must state required as true or false`);
  }
}

/**
 * Reads one template from a revision body and checks the whole lesson's structure. Structural faults
 * are content defects and raise TemplateDefinitionError, so a bad lesson cannot reach learners.
 */
export function readTemplateDefinition(body: unknown, templateId: string): {
  template: EditableTemplate;
  output: OutputDocumentDef;
  rubric: RubricCriterion[];
} {
  if (!isPlainObject(body) || body.lessonKind !== "template") throw new TemplateDefinitionError("lesson is not a template lesson");
  const raw = Array.isArray(body.editableTemplates) ? body.editableTemplates : [];
  if (!raw.length) throw new TemplateDefinitionError("lesson has no editableTemplates");
  raw.forEach(validateTemplateStructure);
  const templates = raw as EditableTemplate[];
  const template = templates.find(t => t.templateId === templateId);
  if (!template) throw new TemplateDefinitionError(`no template ${templateId}`);
  const output = body.outputDocument as OutputDocumentDef | undefined;
  if (!output || !Array.isArray(output.sections) || output.sections.length === 0) throw new TemplateDefinitionError("lesson has no outputDocument sections");
  if (typeof output.title !== "string" || typeof output.format !== "string" || typeof output.footer !== "string") {
    throw new TemplateDefinitionError("outputDocument needs title, format and footer");
  }
  try {
    checkLessonPlacement(templates, output);
  } catch (error) {
    if (error instanceof DocumentAssemblyError) throw new TemplateDefinitionError(error.message);
    throw error;
  }
  const rubric = Array.isArray(body.assessmentRubric) ? (body.assessmentRubric as RubricCriterion[]) : [];
  if (!rubric.length || rubric.some(c => typeof c?.criterion !== "string" || !c.levels)) throw new TemplateDefinitionError("assessmentRubric is missing or malformed");
  return { template, output: scopeOutputToTemplate(output, template, templates.length), rubric };
}

export type SignOffDecision = "SIGNED_OFF" | "CHANGES_REQUESTED";
export type RubricResult = "meets" | "does_not_meet";

/**
 * Checks assessor rubric results. Every criterion needs a result, unknown criteria are rejected,
 * and SIGNED_OFF is allowed only when every criterion is met.
 */
export function evaluateRubric(
  rubric: readonly RubricCriterion[],
  results: Record<string, RubricResult>,
  decision: SignOffDecision,
): { errors: string[] } {
  const errors: string[] = [];
  const names = new Set(rubric.map(c => c.criterion));
  for (const criterion of names) {
    if (!(criterion in results)) errors.push(`no result for criterion "${criterion}"`);
  }
  for (const key of Object.keys(results)) {
    if (!names.has(key)) errors.push(`"${key}" is not a criterion in the rubric`);
  }
  const notMet = Object.values(results).filter(r => r === "does_not_meet").length;
  if (decision === "SIGNED_OFF" && notMet > 0) errors.push("cannot sign off while a criterion is does_not_meet");
  if (decision === "CHANGES_REQUESTED" && notMet === 0 && errors.length === 0) errors.push("changes requested needs at least one does_not_meet criterion");
  return { errors };
}
