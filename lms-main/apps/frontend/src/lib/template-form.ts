/**
 * Conversion between text inputs and the typed payload the server validates.
 * Pure functions, so they can be tested without rendering. The server remains the authority on types.
 */
export type TemplateFieldType = "text" | "longtext" | "number" | "currency" | "date" | "checklist" | "table";
export interface TemplateFieldDef { fieldId: string; label: string; type: TemplateFieldType; prompt: string; guidance: string; required: boolean }

export type FormValues = Record<string, string>;

const isEmptyText = (value: string | undefined) => (value ?? "").trim().length === 0;

/** Table input: one row per line, cells separated by a vertical bar. */
export function parseTableText(text: string): string[][] {
  return text
    .split("\n")
    .map(line => line.split("|").map(cell => cell.trim()))
    .filter(row => row.some(cell => cell.length > 0));
}
export function formatTableRows(rows: unknown): string {
  if (!Array.isArray(rows)) return "";
  return rows.map(row => (Array.isArray(row) ? row.map(cell => String(cell)).join(" | ") : "")).join("\n");
}

/** Checklist input: one item per line. */
export function parseChecklistText(text: string): string[] {
  return text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
}

/** Saved server values back into input text. */
export function initialFormValues(fields: readonly TemplateFieldDef[], saved: Record<string, unknown> | null | undefined): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const value = saved?.[field.fieldId];
    if (value === null || value === undefined) values[field.fieldId] = "";
    else if (field.type === "checklist" && Array.isArray(value)) values[field.fieldId] = value.map(String).join("\n");
    else if (field.type === "table") values[field.fieldId] = formatTableRows(value);
    else values[field.fieldId] = String(value);
  }
  return values;
}

/** Input text into the payload. Empty input becomes null, which the server treats as not provided. */
export function toPayload(fields: readonly TemplateFieldDef[], form: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = form[field.fieldId] ?? "";
    switch (field.type) {
      case "text":
      case "longtext":
      case "date":
        payload[field.fieldId] = isEmptyText(raw) ? null : raw.trim();
        break;
      case "number":
      case "currency": {
        if (isEmptyText(raw)) {
          payload[field.fieldId] = null;
          break;
        }
        const parsed = Number(raw);
        // Non-numeric text is sent as typed so the server reports the field error.
        payload[field.fieldId] = Number.isFinite(parsed) ? parsed : raw.trim();
        break;
      }
      case "checklist": {
        const items = parseChecklistText(raw);
        payload[field.fieldId] = items.length ? items : null;
        break;
      }
      case "table": {
        const rows = parseTableText(raw);
        payload[field.fieldId] = rows.length ? rows : null;
        break;
      }
    }
  }
  return payload;
}

/** Labels of required fields that are still empty. Used for a quick check before submit. */
export function missingRequiredLabels(fields: readonly TemplateFieldDef[], form: FormValues): string[] {
  const payload = toPayload(fields, form);
  return fields.filter(field => field.required && (payload[field.fieldId] === null || payload[field.fieldId] === undefined)).map(field => field.label);
}
