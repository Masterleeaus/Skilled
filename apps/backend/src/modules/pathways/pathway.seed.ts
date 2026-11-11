/**
 * Idempotent seed for the three role pathways (PASS42).
 *
 * Source: curriculum/structure/PATHWAYS.json.
 * - Pathway rows come from the file.
 * - Each base module title is stored as a required item, courseSlug "module:<title>", with no course rows.
 *   Its lessons reach the learner through the courses they enrol in (see pathway.service.ts).
 * - The learner-chosen service courses are stored as one optional item, courseSlug "service:learner-chosen".
 *
 * The courseSlug column holds these item keys because the schema has no item-kind column.
 * A plain value (no prefix) is a course slug and is only used for course items.
 */

export interface PathwayJsonEntry {
  id: string;
  title: string;
  summary: string;
  sharedModules: string[];
  serviceCourses: string;
  excludesModules: string[];
  status: string;
}

export interface PathwaysFile {
  schema: string;
  status: string;
  pathways: PathwayJsonEntry[];
}

/**
 * Base module title (PATHWAYS.json) to the Universal-layer unit in the curriculum lesson file
 * (prisma/curriculum/titan-three-layer-lessons.json). Each title maps to exactly one unit.
 */
export const BASE_MODULE_UNITS: Record<string, string> = {
  "Professional induction and standards": "Professional Induction & Standards",
  "Workplace safety and risk": "Workplace Safety & Risk",
  "Tools, equipment and maintenance": "Tools & Equipment Management",
  "Chemicals and materials": "Materials, Chemicals & Consumables",
  "Quality and job documentation": "Quality Assurance & Evidence",
  "Job management and service delivery": "Job Management & Delivery",
  "Customer communication and privacy": "Customer Service & Communication",
  "Starting a business": "Starting a Home Services Business",
  "Quoting and pricing": "Quoting, Pricing & Profitability",
  "Business operations and finance": "Business Finance & Administration",
  "Marketing and sales": "Marketing & Sales",
  "Growing and managing a team": "Teams & Business Growth",
};

export const MODULE_KEY_PREFIX = "module:";
export const SERVICE_ITEM_KEY = "service:learner-chosen";

interface PathwayRecord {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface PathwayCourseRecord {
  id: string;
  courseSlug: string;
  required: boolean;
  position: number;
}

/** The Prisma delegates this seed uses. Structural, so tests can pass a fake client. */
export interface PathwaySeedClient {
  academyCurriculumPathway: {
    findUnique(args: { where: { code: string } }): Promise<PathwayRecord | null>;
    create(args: { data: Record<string, unknown> }): Promise<PathwayRecord>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<PathwayRecord>;
  };
  academyPathwayCourse: {
    findMany(args: { where: { pathwayId: string }; orderBy: { position: "asc" } }): Promise<PathwayCourseRecord[]>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
    delete(args: { where: { id: string } }): Promise<unknown>;
  };
}

export interface PathwaySeedReport {
  pathways: Array<{ code: string; action: "created" | "updated" | "unchanged" }>;
  items: { created: number; updated: number; unchanged: number; removed: number };
  unmappedModules: string[];
}

interface DesiredItem {
  courseSlug: string;
  required: boolean;
}

/** The items a pathway holds, in order: base modules (required), then the service slot (optional). */
export function desiredItems(entry: PathwayJsonEntry): DesiredItem[] {
  return [
    ...entry.sharedModules.map((title) => ({ courseSlug: `${MODULE_KEY_PREFIX}${title}`, required: true })),
    { courseSlug: SERVICE_ITEM_KEY, required: false },
  ];
}

/** Seed the pathways and their items. Safe to run repeatedly. */
export async function seedPathways(client: PathwaySeedClient, file: PathwaysFile): Promise<PathwaySeedReport> {
  const report: PathwaySeedReport = {
    pathways: [],
    items: { created: 0, updated: 0, unchanged: 0, removed: 0 },
    unmappedModules: [],
  };

  for (const entry of file.pathways) {
    report.unmappedModules.push(...entry.sharedModules.filter((title) => !BASE_MODULE_UNITS[title]));
    const pathway = await upsertPathway(client, entry, report);
    await syncItems(client, pathway.id, desiredItems(entry), report);
  }

  return report;
}

async function upsertPathway(client: PathwaySeedClient, entry: PathwayJsonEntry, report: PathwaySeedReport) {
  const desired = { title: entry.title, description: entry.summary, status: entry.status };
  const existing = await client.academyCurriculumPathway.findUnique({ where: { code: entry.id } });

  if (!existing) {
    const created = await client.academyCurriculumPathway.create({ data: { code: entry.id, ...desired } });
    report.pathways.push({ code: entry.id, action: "created" });
    return created;
  }

  const changed = (Object.keys(desired) as Array<keyof typeof desired>).some((key) => existing[key] !== desired[key]);
  if (!changed) {
    report.pathways.push({ code: entry.id, action: "unchanged" });
    return existing;
  }

  const updated = await client.academyCurriculumPathway.update({ where: { id: existing.id }, data: desired });
  report.pathways.push({ code: entry.id, action: "updated" });
  return updated;
}

async function syncItems(client: PathwaySeedClient, pathwayId: string, wanted: DesiredItem[], report: PathwaySeedReport) {
  if (new Set(wanted.map((item) => item.courseSlug)).size !== wanted.length) {
    throw new Error(`Duplicate item key in pathway ${pathwayId}`);
  }

  const keep = new Set(wanted.map((item) => item.courseSlug));
  const existingRows: PathwayCourseRecord[] =
    await client.academyPathwayCourse.findMany({ where: { pathwayId }, orderBy: { position: "asc" } });

  for (const row of existingRows) {
    if (keep.has(row.courseSlug)) continue;
    await client.academyPathwayCourse.delete({ where: { id: row.id } });
    report.items.removed += 1;
  }

  // Positions are unique per pathway. Move rows that will change to temporary negative positions first.
  const surviving = existingRows.filter((row) => keep.has(row.courseSlug));
  const plan = wanted.map((item, index) => ({ item, position: index + 1 }));
  const changing = plan.filter(({ item, position }) => {
    const row = surviving.find((candidate) => candidate.courseSlug === item.courseSlug);
    return row && (row.position !== position || row.required !== item.required);
  });
  for (const [offset, { item }] of changing.entries()) {
    const row = surviving.find((candidate) => candidate.courseSlug === item.courseSlug)!;
    await client.academyPathwayCourse.update({ where: { id: row.id }, data: { position: -1 - offset } });
  }

  for (const { item, position } of plan) {
    const row = surviving.find((candidate) => candidate.courseSlug === item.courseSlug);
    if (!row) {
      await client.academyPathwayCourse.create({
        data: { pathwayId, courseSlug: item.courseSlug, required: item.required, position, createdAt: new Date() },
      });
      report.items.created += 1;
    } else if (row.position !== position || row.required !== item.required) {
      await client.academyPathwayCourse.update({ where: { id: row.id }, data: { position, required: item.required } });
      report.items.updated += 1;
    } else {
      report.items.unchanged += 1;
    }
  }
}
