import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const api = readFileSync(new URL("../src/lib/curriculum.api.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/SharedCurriculumPlayer.tsx", import.meta.url), "utf8");
const backend = readFileSync(new URL("../../backend/src/modules/curriculum/curriculum.routes.ts", import.meta.url), "utf8");
const checks = [
  ["backend protected progress endpoint", /router\.get\("\/courses\/:courseId\/progress\/me", authenticate/.test(backend)],
  ["frontend uses backend route", api.includes("/academy/curriculum/courses/${encodeURIComponent(courseId)}/progress/me")],
  ["typed required and optional counts", api.includes("export interface AcademyCourseProgress") && api.includes("completionPercent: number")],
  ["progress query scoped to course", ui.includes('queryKey: ["academy-course-progress", courseId]')],
  ["progress refreshed on acknowledgement", ui.includes('client.invalidateQueries({ queryKey: ["academy-course-progress", courseId] })')],
  ["deduplicated shared lessons", ui.includes("const unique = new Map(")],
  ["required progress from server", ui.includes("courseProgress.data.required.completed")],
  ["optional progress from server", ui.includes("courseProgress.data.optional.completed")],
  ["progress failure fallback", ui.includes("courseProgress.isError")],
  ["competency distinction", ui.includes("do not certify practical competency")],
];
for (const [name, ok] of checks) { assert.ok(ok, name); console.log(`PASS ${name}`); }
console.log(`${checks.length} source-contract assertions passed`);
