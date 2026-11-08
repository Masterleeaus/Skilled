/**
 * PASS42 level gate IDs: the level CSVs, the committed course map and the lesson sourceIds the trial database loads.
 * A lesson is matched by its sourceId, which is the CSV lesson_id string. No translation is applied.
 */
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import courseLevelMapFile from "../modules/levels/course-level-map.json";
import { courseLevelFor, CourseLevelMap, LEVEL_ORDER } from "../modules/levels/level-rules";

const ROOT = path.resolve(__dirname, "../../../..");
const LEVELS_DIR = path.join(ROOT, "curriculum/levels");

// Minimal RFC 4180 reader. The level files contain no quoted newlines.
function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

type LevelRow = Record<string, string>;

// ALL-LESSON-LEVELS.csv is an aggregate with a different schema (no override or reason column). The per-course
// files are the source of the map, so only they are read here.
const AGGREGATE_LEVEL_FILE = "ALL-LESSON-LEVELS.csv";

function readLevelRows(): LevelRow[] {
  return readdirSync(LEVELS_DIR)
    .filter((name) => name.endsWith(".csv") && name !== AGGREGATE_LEVEL_FILE)
    .sort()
    .flatMap((name) => {
      const [header, ...lines] = readFileSync(path.join(LEVELS_DIR, name), "utf8").split(/\r?\n/).filter((line) => line.length > 0);
      const keys = splitRow(header);
      return lines.map((line) => Object.fromEntries(keys.map((key, i) => [key, splitRow(line)[i] ?? ""])));
    });
}

// Same rule as apps/backend/scripts/build-course-level-map.py: a row whose reason mentions the course map is excluded.
const isMapOnly = (row: LevelRow) => row.reason.toLowerCase().includes("map");

const committedMap = (courseLevelMapFile as { courses: CourseLevelMap }).courses;

// Lesson sourceIds the trial database loads: the 216 canonical import lessons (manifest), and the 20 editable template
// lessons, which the manifest does not list. The template list matches the trial run (PASS42/TRIAL-smoke.md).
const TRIAL_TEMPLATE_IDS = [
  ...Array.from({ length: 17 }, (_, i) => `TPL-${String(i + 1).padStart(2, "0")}`),
  "PBP-TPL-01",
  "RAS-17",
  "WAH-TPL-01",
];

const manifest = JSON.parse(readFileSync(path.join(ROOT, "curriculum/import/canonical-import-manifest.json"), "utf8")) as {
  entries: Array<{ sourceId: string; courseSlugs: string[] }>;
};

describe("level map is generated from the level CSVs", () => {
  it("the committed course map holds exactly the non-map-only rows of the level CSVs", () => {
    const expected: CourseLevelMap = {};
    for (const row of readLevelRows()) {
      if (isMapOnly(row)) continue;
      const lessons = (expected[row.course_slug] ??= {});
      expect(lessons[row.lesson_id] === undefined || lessons[row.lesson_id] === row.level, `conflicting level for ${row.course_slug} ${row.lesson_id}`).toBe(true);
      lessons[row.lesson_id] = row.level as (typeof LEVEL_ORDER)[number];
    }
    expect(committedMap).toEqual(expected);
  });
});

describe("trial lesson sourceIds match the level files", () => {
  it("every canonical import lesson is placed in a level by each course its manifest lists", () => {
    const missing = manifest.entries.flatMap((entry) =>
      entry.courseSlugs.filter((slug) => !(LEVEL_ORDER as readonly string[]).includes(courseLevelFor(slug, entry.sourceId) ?? "")).map((slug) => `${entry.sourceId}@${slug}`),
    );
    expect(missing).toEqual([]);
    expect(manifest.entries.length).toBe(216);
  });

  it("each trial template lesson is placed in a level by at least one course", () => {
    const unplaced = TRIAL_TEMPLATE_IDS.filter((id) => !Object.values(committedMap).some((lessons) => id in lessons));
    expect(unplaced).toEqual([]);
  });

  it("a sourceId that no level file lists is not placed in any course, so it is not gated", () => {
    // Pattern of the scratch seed database's BRIEF IDs. None of them appear in the level files.
    for (const id of ["G0101-01", "U01-01"]) {
      expect(Object.keys(committedMap).map((slug) => courseLevelFor(slug, id)).every((level) => level === null)).toBe(true);
    }
  });
});
