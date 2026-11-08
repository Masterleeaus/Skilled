import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const s = readFileSync(new URL("../src/modules/curriculum/curriculum.routes.ts", import.meta.url), "utf8");
const segment = s.split('router.get("/courses/:courseId/progress/me"')[1]?.split('router.get("/completions/me"')[0];
assert.ok(segment, "progress endpoint registered");
for (const [name, pattern] of Object.entries({
  auth: /authenticate, run/, enrollment: /studentId: learnerId, courseId, status: "ACTIVE"/,
  publishedCourse: /course: \{ isPublished: true \}/, publishedTrack: /track: \{ status: "PUBLISHED" \}/,
  publishedRevision: /revision: \{ status: "PUBLISHED" \}/, scopedCompletions: /where: \{ learnerId, OR:/,
  requiredDeduplication: /required\.set\(key, target\)/, optionalDeduplication: /optional\.set\(key, target\)/,
  zeroRequired: /required\.size \? Math\.round/, acknowledgement: /acknowledgedOnly: true/,
})) { assert.match(segment, pattern, name); console.log(`PASS ${name}`); }
