// Verifies the licence notice display and the template form helpers (PASS42).
// Components are transpiled with the workspace TypeScript and rendered to static HTML with react-dom/server.
// The frontend has no DOM test runner, so this covers rendered markup and pure helpers, not browser interaction.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const srcRoot = resolve(new URL("../src/", import.meta.url).pathname);
const cache = new Map();

function loadResolved(base) {
  for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")]) {
    if (existsSync(candidate)) return loadFile(candidate);
  }
  throw new Error(`cannot resolve ${base}`);
}

function loadFile(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const module = { exports: {} };
  cache.set(file, module);
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) return loadResolved(join(srcRoot, specifier.slice(2)));
    if (specifier.startsWith(".")) return loadResolved(resolve(dirname(file), specifier));
    return require(specifier);
  };
  new Function("exports", "require", "module", outputText)(module.exports, localRequire, module);
  return module.exports;
}

const checks = [];
const check = (name, fn) => checks.push([name, fn]);
const src = (relative) => readFileSync(join(srcRoot, relative), "utf8");

const notice = loadFile(join(srcRoot, "lib/licence-notice.ts"));
const form = loadFile(join(srcRoot, "lib/template-form.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { CurriculumLessonBody } = loadFile(join(srcRoot, "components/CurriculumLessonBody.tsx"));

check("licence points: only licenceNotice === true, trimmed, in order", () => {
  const body = { safetyAndRegulatory: [
    { point: "  Licence covers X.  ", licenceNotice: true },
    { point: "Ordinary safety point.", licenceNotice: false },
    { point: "", licenceNotice: true },
    { point: "Licence covers Y.", licenceNotice: true },
    null,
  ] };
  assert.deepEqual(notice.licenceNoticePoints(body), ["Licence covers X.", "Licence covers Y."]);
  assert.deepEqual(notice.licenceNoticePoints({}), []);
  assert.deepEqual(notice.licenceNoticePoints(null), []);
  assert.deepEqual(notice.licenceNoticePoints({ safetyAndRegulatory: "text" }), []);
});

check("licence notice title says the lesson does not grant a licence", () => {
  assert.match(notice.LICENCE_NOTICE_TITLE, /does not grant a licence/);
  assert.match(notice.LICENCE_NOTICE_BODY, /does not give you a licence/);
});

check("rendered notice sits above lesson content", () => {
  const html = renderToStaticMarkup(createElement(CurriculumLessonBody, { body: {
    introduction: "Intro text for the learner.",
    safetyAndRegulatory: [{ point: "Covers the licensed task only.", licenceNotice: true }],
  } }));
  const titleAt = html.indexOf(notice.LICENCE_NOTICE_TITLE);
  const pointAt = html.indexOf("Covers the licensed task only.");
  const introAt = html.indexOf("Intro text for the learner.");
  assert.ok(titleAt >= 0, "notice title rendered");
  assert.ok(pointAt > titleAt, "licence point rendered inside the notice");
  assert.ok(titleAt < introAt, "notice appears before the lesson content");
  assert.match(html, /<aside[^>]*aria-labelledby="licence-notice-title"/);
});

check("no notice when the lesson has no licence points", () => {
  const html = renderToStaticMarkup(createElement(CurriculumLessonBody, { body: {
    introduction: "Plain lesson.",
    safetyAndRegulatory: [{ point: "Ordinary point.", licenceNotice: false }],
  } }));
  assert.ok(!html.includes(notice.LICENCE_NOTICE_TITLE));
  assert.ok(!html.includes("<aside"));
});

check("template lessons keep the notice and hide raw template structure", () => {
  const html = renderToStaticMarkup(createElement(CurriculumLessonBody, { body: {
    lessonKind: "template",
    introduction: "Template intro.",
    safetyAndRegulatory: [{ point: "Licence point T.", licenceNotice: true }],
    editableTemplates: [{ templateId: "T-1", fields: [] }],
    outputDocument: { title: "x", sections: [] },
    assessmentRubric: [{ criterion: "c", levels: {} }],
  } }));
  assert.ok(html.includes(notice.LICENCE_NOTICE_TITLE));
  assert.ok(!html.includes("Editable templates"));
  assert.ok(!html.includes("Output document"));
  assert.ok(!html.includes("Assessment rubric"));
  assert.ok(html.includes("Template intro."));
});

const fields = [
  { fieldId: "f1", label: "Name", type: "text", prompt: "p", guidance: "g", required: true },
  { fieldId: "f2", label: "Days", type: "number", prompt: "p", guidance: "g", required: true },
  { fieldId: "f3", label: "Amount", type: "currency", prompt: "p", guidance: "g", required: false },
  { fieldId: "f4", label: "Checks", type: "checklist", prompt: "p", guidance: "g", required: true },
  { fieldId: "f5", label: "Rows", type: "table", prompt: "p", guidance: "g", required: false },
  { fieldId: "f6", label: "Start", type: "date", prompt: "p", guidance: "g", required: false },
];

check("payload conversion matches each field type", () => {
  const payload = form.toPayload(fields, {
    f1: "  Acme  ", f2: "14", f3: "12.50", f4: "Insurance\n\n Licence noted ", f5: "Card | none\n\n", f6: "2026-11-02",
  });
  assert.deepEqual(payload, {
    f1: "Acme", f2: 14, f3: 12.5, f4: ["Insurance", "Licence noted"], f5: [["Card", "none"]], f6: "2026-11-02",
  });
});

check("empty inputs become null and non-numeric numbers are sent as typed for the server to reject", () => {
  const payload = form.toPayload(fields, { f1: "   ", f2: "", f3: "abc", f4: " \n ", f5: "", f6: "" });
  assert.equal(payload.f1, null);
  assert.equal(payload.f2, null);
  assert.equal(payload.f3, "abc");
  assert.equal(payload.f4, null);
  assert.equal(payload.f5, null);
  assert.equal(payload.f6, null);
});

check("missing required labels reflect the required flag", () => {
  assert.deepEqual(form.missingRequiredLabels(fields, { f1: "x", f2: "3", f4: "one" }), []);
  assert.deepEqual(form.missingRequiredLabels(fields, { f1: " ", f2: "" , f4: ""}), ["Name", "Days", "Checks"]);
});

check("saved values round-trip into input text", () => {
  const text = form.initialFormValues(fields, { f1: "Acme", f2: 14, f3: 12.5, f4: ["a", "b"], f5: [["x", "y"], ["z"]], f6: "2026-11-02" });
  assert.deepEqual(text, { f1: "Acme", f2: "14", f3: "12.5", f4: "a\nb", f5: "x | y\nz", f6: "2026-11-02" });
  assert.deepEqual(form.toPayload(fields, text), { f1: "Acme", f2: 14, f3: 12.5, f4: ["a", "b"], f5: [["x", "y"], ["z"]], f6: "2026-11-02" });
});

check("player renders the template form for template lessons and keeps knowledge checks", () => {
  const player = src("components/SharedCurriculumPlayer.tsx");
  assert.match(player, /import \{ TemplateLessonForm \} from "@\/components\/TemplateLessonForm"/);
  assert.match(player, /body\?\.lessonKind === "template" && <TemplateLessonForm/);
  assert.match(player, /<CurriculumKnowledgeCheck/);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log("PASS", name);
  } catch (error) {
    failed += 1;
    console.log("FAIL", name, "\n   ", error.message.split("\n").slice(0, 6).join("\n    "));
  }
}
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
