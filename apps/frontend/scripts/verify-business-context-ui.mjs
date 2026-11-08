import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const base = new URL("../src/", import.meta.url);
const api = readFileSync(new URL("lib/curriculum.api.ts", base), "utf8");
const ui = readFileSync(new URL("components/BusinessContextLesson.tsx", base), "utf8");
const player = readFileSync(new URL("components/SharedCurriculumPlayer.tsx", base), "utf8");
const checks = [
  ["memberships fetched from authenticated API", api.includes("/companies/me")],
  ["context presentation uses POST", api.includes("api.post(`/academy/curriculum/companies/")],
  ["snapshot list uses revision filter", api.includes("revisionId, limit: 20")],
  ["snapshot detail endpoint", api.includes("lesson-context-snapshots/${encodeURIComponent(snapshotId)}")],
  ["organisation selector", ui.includes("Select an organisation")],
  ["organisation changes reset historical state", ui.includes("setHistory([]); setCursor(undefined)")],
  ["history pagination", ui.includes("Load earlier presentations")],
  ["historical integrity failure shown", ui.includes("integrity verification failed")],
  ["structured safe lesson renderer reused", ui.includes("<CurriculumLessonBody body={view.body} />")],
  ["player integrates context UI", player.includes("<BusinessContextLesson key={active.revision.id}")],
];
for (const [name, ok] of checks) { assert.ok(ok, name); console.log(`PASS ${name}`); }
console.log(`${checks.length} source-contract checks passed`);
