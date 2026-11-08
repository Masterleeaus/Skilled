/**
 * PASS42 pathway seed: loads PATHWAYS.json as base-module items and one service slot per pathway.
 * Writes no course rows. Idempotent. Runs against the in-memory Prisma double.
 */
import path from "node:path";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";

import { fakePrisma, resetFakeDb, rows } from "./support/fake-prisma";
import { BASE_MODULE_UNITS, PathwaysFile, seedPathways, SERVICE_ITEM_KEY } from "../modules/pathways/pathway.seed";

const ROOT = path.resolve(__dirname, "../../../..");
const pathwaysFile = JSON.parse(readFileSync(path.join(ROOT, "curriculum/structure/PATHWAYS.json"), "utf8")) as PathwaysFile;
const lessonFile = JSON.parse(readFileSync(path.join(__dirname, "../../prisma/curriculum/titan-three-layer-lessons.json"), "utf8")) as {
  lessons: Array<{ layer: string; unit: string }>;
};

function pathwayItems(code: string) {
  const pathwayId = rows("academyCurriculumPathway").find((row) => row.code === code)!.id;
  return rows("academyPathwayCourse")
    .filter((row) => row.pathwayId === pathwayId)
    .sort((a, b) => a.position - b.position)
    .map((row) => ({ key: row.courseSlug, required: row.required, position: row.position }));
}

beforeEach(() => {
  resetFakeDb();
});

describe("PASS42 pathway seed", () => {
  it("loads the three pathways with base-module items and one optional service slot each", async () => {
    const report = await seedPathways(fakePrisma as never, pathwaysFile);

    expect(rows("academyCurriculumPathway").map((row) => row.code).sort()).toEqual(["PATH-SOLO", "PATH-TEAM-MEMBER", "PATH-TEAM-OWNER"]);
    expect(report.pathways.map((item) => item.action)).toEqual(["created", "created", "created"]);

    const solo = pathwayItems("PATH-SOLO");
    expect(solo).toHaveLength(12);
    expect(solo[0]).toEqual({ key: "module:Professional induction and standards", required: true, position: 1 });
    expect(solo[solo.length - 1]).toEqual({ key: SERVICE_ITEM_KEY, required: false, position: 12 });
    expect(pathwayItems("PATH-TEAM-MEMBER")).toHaveLength(8);
    expect(pathwayItems("PATH-TEAM-OWNER")).toHaveLength(13);

    // No course rows: every stored key is a module item or the service slot.
    expect(rows("academyPathwayCourse").every((row) => row.courseSlug.startsWith("module:") || row.courseSlug === SERVICE_ITEM_KEY)).toBe(true);
    expect(report.unmappedModules).toEqual([]);
  });

  it("maps every base module title to a Universal unit that exists in the curriculum lesson file", () => {
    const universalUnits = new Set(lessonFile.lessons.filter((lesson) => lesson.layer === "Universal").map((lesson) => lesson.unit));
    const baseTitles = new Set(pathwaysFile.pathways.flatMap((pathway) => pathway.sharedModules));
    for (const title of baseTitles) {
      expect(BASE_MODULE_UNITS[title], title).toBeDefined();
      expect(universalUnits.has(BASE_MODULE_UNITS[title]), title).toBe(true);
    }
  });

  it("is idempotent: a second run leaves every row, including ids and timestamps, unchanged", async () => {
    await seedPathways(fakePrisma as never, pathwaysFile);
    const first = structuredClone({ pathways: rows("academyCurriculumPathway"), items: rows("academyPathwayCourse") });

    const second = await seedPathways(fakePrisma as never, pathwaysFile);

    expect(structuredClone({ pathways: rows("academyCurriculumPathway"), items: rows("academyPathwayCourse") })).toEqual(first);
    expect(second.pathways.every((item) => item.action === "unchanged")).toBe(true);
    expect(second.items).toEqual({ created: 0, updated: 0, unchanged: 33, removed: 0 });
  });

  it("re-runs after a JSON change: removes the dropped module and keeps positions contiguous", async () => {
    await seedPathways(fakePrisma as never, pathwaysFile);
    const changed = structuredClone(pathwaysFile);
    changed.pathways[1].sharedModules = changed.pathways[1].sharedModules.filter((title) => title !== "Chemicals and materials");

    const report = await seedPathways(fakePrisma as never, changed);

    const member = pathwayItems("PATH-TEAM-MEMBER");
    expect(member.map((item) => item.key)).not.toContain("module:Chemicals and materials");
    expect(member.map((item) => item.position)).toEqual(member.map((_, index) => index + 1));
    expect(report.items.removed).toBe(1);
  });

  it("rejects a pathway that lists the same base module twice", async () => {
    const duplicated = structuredClone(pathwaysFile);
    duplicated.pathways[0].sharedModules.push("Workplace safety and risk");
    await expect(seedPathways(fakePrisma as never, duplicated)).rejects.toThrow(/Duplicate item key/);
  });
});
