import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  assembleDocument,
  DocumentAssemblyError,
  evaluateRubric,
  readTemplateDefinition,
  stableStringify,
  TemplateDefinitionError,
  validateFieldValues,
  type EditableTemplate,
  type OutputDocumentDef,
  type TemplateField,
} from "./template.model";

const field = (fieldId: string, type: TemplateField["type"], required = true): TemplateField => ({
  fieldId, label: `Label ${fieldId}`, type, prompt: "p", guidance: "g", required,
});

const fields: TemplateField[] = [
  field("f1", "text"),
  field("f2", "longtext"),
  field("f3", "number"),
  field("f4", "currency"),
  field("f5", "date"),
  field("f6", "checklist"),
  field("f7", "table"),
  field("f8", "text", false),
];
const template: EditableTemplate = { templateId: "TPL-99-T01", title: "Test", purpose: "Test purpose", fields };
const output: OutputDocumentDef = {
  title: "{{business:business.display_name}} schedule",
  format: "sop",
  sections: [
    { heading: "Scope", fieldIds: ["f1", "f2"] },
    { heading: "Numbers", fieldIds: ["f3", "f4", "f5"] },
    { heading: "Lists", fieldIds: ["f6", "f7", "f8"] },
  ],
  footer: "Contact {{business:business.support_email}}.",
};
const complete = {
  f1: "Scope text", f2: "Longer text", f3: 14, f4: 120.5, f5: "2026-02-28",
  f6: ["Item one", "Item two"], f7: [["Method", "Use"]], f8: null,
};

describe("validateFieldValues", () => {
  it("accepts a complete, correctly typed submission and trims text", () => {
    const { values, errors } = validateFieldValues(fields, { ...complete, f1: "  Scope text  " }, "submit");
    expect(errors).toEqual([]);
    expect(values.f1).toBe("Scope text");
    expect(values.f4).toBe(120.5);
  });

  it("rejects text that is not a string and numbers that are not numbers", () => {
    const { errors } = validateFieldValues(fields, { f1: 12, f3: "14" }, "draft");
    expect(errors).toEqual(expect.arrayContaining([
      { fieldId: "f1", message: "must be text" },
      { fieldId: "f3", message: "must be a number" },
    ]));
  });

  it("rejects NaN and infinite numbers", () => {
    expect(validateFieldValues(fields, { f3: Number.NaN }, "draft").errors).toEqual([{ fieldId: "f3", message: "must be a number" }]);
    expect(validateFieldValues(fields, { f3: Infinity }, "draft").errors).toEqual([{ fieldId: "f3", message: "must be a number" }]);
  });

  it("limits currency to whole cents and non-negative amounts", () => {
    expect(validateFieldValues(fields, { f4: 1.234 }, "draft").errors).toEqual([{ fieldId: "f4", message: "must have at most two decimal places" }]);
    expect(validateFieldValues(fields, { f4: -5 }, "draft").errors).toEqual([{ fieldId: "f4", message: "must be between 0 and 1,000,000,000" }]);
    expect(validateFieldValues(fields, { f4: 0.1 + 0.2 }, "draft").errors).toEqual([]);
  });

  it("requires a real calendar date in YYYY-MM-DD form", () => {
    expect(validateFieldValues(fields, { f5: "2026-02-30" }, "draft").errors).toEqual([{ fieldId: "f5", message: "must be a date in YYYY-MM-DD form" }]);
    expect(validateFieldValues(fields, { f5: "28/02/2026" }, "draft").errors).toHaveLength(1);
    expect(validateFieldValues(fields, { f5: "2028-02-29" }, "draft").errors).toEqual([]);
  });

  it("drops empty checklist items and rejects non-text items", () => {
    const ok = validateFieldValues(fields, { f6: ["  a ", "", "b"] }, "draft");
    expect(ok.values.f6).toEqual(["a", "b"]);
    expect(validateFieldValues(fields, { f6: [1, 2] }, "draft").errors).toEqual([{ fieldId: "f6", message: "must be a list of text items" }]);
  });

  it("requires table rows to be lists of text cells", () => {
    expect(validateFieldValues(fields, { f7: ["flat", "list"] }, "draft").errors).toEqual([
      { fieldId: "f7", message: "must be a list of rows, each a list of text cells" },
    ]);
    expect(validateFieldValues(fields, { f7: [["a", "b"], ["", ""]] }, "draft").values.f7).toEqual([["a", "b"]]);
  });

  it("rejects keys that are not fields of the template instead of dropping them", () => {
    const { errors } = validateFieldValues(fields, { ...complete, f99: "stray" }, "draft");
    expect(errors).toEqual([{ fieldId: "f99", message: "is not a field of this template" }]);
  });

  it("rejects a non-object body", () => {
    expect(validateFieldValues(fields, "nope", "draft").errors[0].fieldId).toBe("*");
    expect(validateFieldValues(fields, ["f1"], "draft").errors[0].fieldId).toBe("*");
  });
});

describe("required-field enforcement", () => {
  it("flags every required field left empty on submit", () => {
    const { errors } = validateFieldValues(fields, { f1: "   ", f6: [], f7: [] }, "submit");
    const required = errors.filter(e => e.message === "is required").map(e => e.fieldId).sort();
    expect(required).toEqual(["f1", "f2", "f3", "f4", "f5", "f6", "f7"]);
  });

  it("does not require optional fields", () => {
    const { errors } = validateFieldValues(fields, complete, "submit");
    expect(errors.find(e => e.fieldId === "f8")).toBeUndefined();
  });

  it("does not enforce required fields on a draft save", () => {
    expect(validateFieldValues(fields, {}, "draft").errors).toEqual([]);
  });
});

describe("assembleDocument", () => {
  const resolve = (text: string) => text.replace("{{business:business.display_name}}", "Acme Cleaning").replace("{{business:business.support_email}}", "hi@example.test");

  it("places every field exactly once, under its section heading", () => {
    const { document } = assembleDocument(template, output, complete, resolve);
    const placed = document.sections.flatMap(s => s.fields.map(f => f.fieldId));
    expect(placed.sort()).toEqual(fields.map(f => f.fieldId).sort());
    expect(new Set(placed).size).toBe(placed.length);
    expect(document.sections[0]).toEqual(expect.objectContaining({ heading: "Scope" }));
    expect(document.sections[0].fields.map(f => f.fieldId)).toEqual(["f1", "f2"]);
    expect(document.sections[0].fields[0].value).toBe("Scope text");
  });

  it("keeps an optional empty field in the document as null, not dropped", () => {
    const { document } = assembleDocument(template, output, complete, resolve);
    const optional = document.sections[2].fields.find(f => f.fieldId === "f8");
    expect(optional).toEqual(expect.objectContaining({ value: null }));
  });

  it("fails loudly when a field is missing from every section", () => {
    const missing: OutputDocumentDef = { ...output, sections: [{ heading: "Scope", fieldIds: ["f1", "f2"] }] };
    expect(() => assembleDocument(template, missing, complete, resolve)).toThrow(DocumentAssemblyError);
    expect(() => assembleDocument(template, missing, complete, resolve)).toThrow(/fields not placed in any section: f3, f4, f5, f6, f7, f8/);
  });

  it("fails loudly when a field is placed twice", () => {
    const twice: OutputDocumentDef = { ...output, sections: [...output.sections, { heading: "Again", fieldIds: ["f1"] }] };
    expect(() => assembleDocument(template, twice, complete, resolve)).toThrow(/placed more than once: f1/);
  });

  it("fails loudly when a section names an unknown field", () => {
    const unknown: OutputDocumentDef = { ...output, sections: [...output.sections, { heading: "Ghost", fieldIds: ["f42"] }] };
    expect(() => assembleDocument(template, unknown, complete, resolve)).toThrow(/unknown field f42/);
  });

  it("resolves business placeholders and reports those it could not resolve", () => {
    const { document } = assembleDocument(template, output, complete, resolve);
    expect(document.title).toBe("Acme Cleaning schedule");
    expect(document.footer).toBe("Contact hi@example.test.");
    expect(document.unresolvedPlaceholders).toEqual([]);
    const unresolved = assembleDocument(template, output, complete, text => text);
    expect(unresolved.document.unresolvedPlaceholders).toEqual(["{{business:business.display_name}}", "{{business:business.support_email}}"]);
  });

  it("gives identical content an identical hash and a changed value a different hash", () => {
    const a = assembleDocument(template, output, complete, resolve).contentHash;
    const b = assembleDocument(template, output, { ...complete }, resolve).contentHash;
    const c = assembleDocument(template, output, { ...complete, f1: "Changed" }, resolve).contentHash;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes independently of object key order", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1 }));
  });
});

describe("readTemplateDefinition", () => {
  const body = (overrides: Record<string, unknown> = {}) => ({
    lessonKind: "template",
    editableTemplates: [template],
    outputDocument: output,
    assessmentRubric: [{ criterion: "Complete", levels: { meets: "m", does_not_meet: "d" } }],
    ...overrides,
  });

  it("reads a well-formed template lesson", () => {
    const result = readTemplateDefinition(body(), "TPL-99-T01");
    expect(result.template.fields).toHaveLength(8);
    expect(result.rubric).toHaveLength(1);
  });

  it("refuses a lesson that is not a template lesson", () => {
    expect(() => readTemplateDefinition(body({ lessonKind: "standard" }), "TPL-99-T01")).toThrow(TemplateDefinitionError);
  });

  it("refuses an output document that drops a field, so a bad lesson cannot reach learners", () => {
    const dropped = { ...output, sections: [{ heading: "Scope", fieldIds: ["f1"] }] };
    expect(() => readTemplateDefinition(body({ outputDocument: dropped }), "TPL-99-T01")).toThrow(/not placed/);
  });

  it("refuses an unknown field type and a repeated fieldId", () => {
    const badType = { ...template, fields: [{ ...fields[0], type: "essay" }] };
    expect(() => readTemplateDefinition(body({ editableTemplates: [badType] }), "TPL-99-T01")).toThrow(/unknown type essay/);
    const repeated = { ...template, fields: [fields[0], fields[0]] };
    expect(() => readTemplateDefinition(body({ editableTemplates: [repeated] }), "TPL-99-T01")).toThrow(/repeats f1/);
  });

  it("refuses a missing rubric", () => {
    expect(() => readTemplateDefinition(body({ assessmentRubric: [] }), "TPL-99-T01")).toThrow(/assessmentRubric/);
  });

  it("reads every real template lesson in the curriculum and places every field once", () => {
    const root = resolve(__dirname, "../../../../../curriculum");
    if (!existsSync(root)) return;
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".json") && !entry.name.includes(".assessment.")) files.push(full);
      }
    };
    walk(root);
    let checked = 0;
    for (const file of files) {
      const json = JSON.parse(readFileSync(file, "utf8")) as { lessonKind?: string; editableTemplates?: Array<{ templateId: string }> };
      if (json.lessonKind !== "template") continue;
      for (const item of json.editableTemplates ?? []) {
        const result = readTemplateDefinition(json, item.templateId);
        const placed = result.output.sections.flatMap(s => s.fieldIds);
        expect(placed.length, `${file} ${item.templateId}`).toBe(result.template.fields.length);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("lesson-level output documents", () => {
  const t1: EditableTemplate = { templateId: "T-1", title: "First", purpose: "p", fields: [field("f1", "text"), field("f2", "text")] };
  const t2: EditableTemplate = { templateId: "T-2", title: "Second", purpose: "p", fields: [field("f3", "date")] };
  const lesson = (sections: OutputDocumentDef["sections"]) => ({
    lessonKind: "template",
    editableTemplates: [t1, t2],
    outputDocument: { title: "Record", format: "form", sections, footer: "End" },
    assessmentRubric: [{ criterion: "C", levels: { meets: "m", does_not_meet: "d" } }],
  });

  it("gives each template only the sections that hold its own fields, with the title suffixed", () => {
    const body = lesson([{ heading: "A", fieldIds: ["f1", "f2"] }, { heading: "B", fieldIds: ["f3"] }]);
    const second = readTemplateDefinition(body, "T-2");
    expect(second.output.sections).toEqual([{ heading: "B", fieldIds: ["f3"] }]);
    expect(second.output.title).toBe("Record - Second");
    const first = readTemplateDefinition(body, "T-1");
    expect(first.output.sections).toEqual([{ heading: "A", fieldIds: ["f1", "f2"] }]);
  });

  it("refuses a lesson where a field of one template is placed in no section", () => {
    const body = lesson([{ heading: "A", fieldIds: ["f1", "f2"] }]);
    expect(() => readTemplateDefinition(body, "T-1")).toThrow(/fields not placed in any section: f3/);
  });

  it("refuses a section that names a field no template defines", () => {
    const body = lesson([{ heading: "A", fieldIds: ["f1", "f2", "f3", "f9"] }]);
    expect(() => readTemplateDefinition(body, "T-1")).toThrow(/unknown field f9/);
  });

  it("refuses a field id reused across templates in one lesson", () => {
    const clash: EditableTemplate = { templateId: "T-3", title: "Third", purpose: "p", fields: [field("f1", "text")] };
    const body = { ...lesson([{ heading: "A", fieldIds: ["f1", "f2", "f3"] }]), editableTemplates: [t1, t2, clash] };
    expect(() => readTemplateDefinition(body, "T-1")).toThrow(/defined in more than one template of the lesson: f1/);
  });
});

describe("evaluateRubric", () => {
  const rubric = [
    { criterion: "A", levels: { meets: "m", does_not_meet: "d" } },
    { criterion: "B", levels: { meets: "m", does_not_meet: "d" } },
  ];

  it("allows sign-off only when every criterion is met", () => {
    expect(evaluateRubric(rubric, { A: "meets", B: "meets" }, "SIGNED_OFF").errors).toEqual([]);
    expect(evaluateRubric(rubric, { A: "meets", B: "does_not_meet" }, "SIGNED_OFF").errors).toEqual([
      "cannot sign off while a criterion is does_not_meet",
    ]);
  });

  it("requires a result for every criterion and rejects unknown ones", () => {
    expect(evaluateRubric(rubric, { A: "meets" }, "SIGNED_OFF").errors).toEqual(['no result for criterion "B"']);
    expect(evaluateRubric(rubric, { A: "meets", B: "meets", C: "meets" }, "SIGNED_OFF").errors).toEqual(['"C" is not a criterion in the rubric']);
  });

  it("requires a does_not_meet result before changes can be requested", () => {
    expect(evaluateRubric(rubric, { A: "meets", B: "meets" }, "CHANGES_REQUESTED").errors).toEqual([
      "changes requested needs at least one does_not_meet criterion",
    ]);
    expect(evaluateRubric(rubric, { A: "meets", B: "does_not_meet" }, "CHANGES_REQUESTED").errors).toEqual([]);
  });
});
