/**
 * Creates the Course rows that COURSES-MODULES.json names but the database does not have yet. The curriculum
 * publisher never creates courses. It skips a slug with no row, so a fresh database would publish nothing.
 * Run from apps/backend.
 *
 *   npm run courses:sync                 create missing courses and fix changed titles
 *   npm run courses:sync -- --dry-run    print what would change, write nothing
 *
 * A course is matched by slug. A missing slug gets a row with its title, an empty description, and the category and
 * teacher from the environment. An existing row only gets its title changed, and only when the title differs.
 * Rows are never deleted, and the description, teacher and category of existing rows are never touched.
 *
 * Needs CURRICULUM_SYNC_CATEGORY_ID (an existing category) and CURRICULUM_SYNC_TEACHER_ID (an existing active user).
 * Nothing is invented: a missing value stops the run before any read of the courses or any write. Set CURRICULUM_DIR
 * to sync from another curriculum folder.
 *
 * Prints a JSON summary of counts and slugs. It never prints a key, a connection string or a credential.
 * Exit code is 1 when the run fails.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/config/prisma";
import { readStructure, type StructureCourse } from "../src/modules/curriculum/curriculum-publisher";
import { curriculumRoot } from "../src/modules/curriculum/file-lesson-loader";

export const CATEGORY_ENV = "CURRICULUM_SYNC_CATEGORY_ID";
export const TEACHER_ENV = "CURRICULUM_SYNC_TEACHER_ID";

export interface SyncSettings {
  categoryId: string;
  teacherId: string;
}

export interface SyncSummary {
  dryRun: boolean;
  courses: number;
  created: number;
  updated: number;
  unchanged: number;
  createdSlugs: string[];
  updatedSlugs: string[];
  warnings: string[];
}

export interface SyncOptions {
  db: typeof prisma;
  structure: StructureCourse[];
  settings: SyncSettings;
  dryRun: boolean;
}

/** Reads the category and teacher IDs. Throws, naming each missing setting, before anything touches the database. */
export function readSyncSettings(env: NodeJS.ProcessEnv): SyncSettings {
  const categoryId = env[CATEGORY_ENV]?.trim() ?? "";
  const teacherId = env[TEACHER_ENV]?.trim() ?? "";
  const missing: string[] = [];
  if (!categoryId) missing.push(`${CATEGORY_ENV} (the ID of an existing category)`);
  if (!teacherId) missing.push(`${TEACHER_ENV} (the ID of an existing user who teaches the course)`);
  if (missing.length > 0) {
    throw new Error(`Not set: ${missing.join("; ")}. The sync does not create or guess these.`);
  }
  return { categoryId, teacherId };
}

/** Accepts only --dry-run. Anything else is refused so a typo cannot start a write run by accident. */
export function parseSyncArgs(argv: string[]): { dryRun: boolean } {
  for (const arg of argv) {
    if (arg !== "--dry-run") throw new Error(`Unknown argument: ${arg}. The only option is --dry-run.`);
  }
  return { dryRun: argv.includes("--dry-run") };
}

/** Keeps the first entry for each slug, as the publisher does, and reports the rest. */
function uniqueCourses(courses: StructureCourse[], warnings: string[]): StructureCourse[] {
  const seen = new Set<string>();
  const kept: StructureCourse[] = [];
  for (const course of courses) {
    if (seen.has(course.slug)) {
      warnings.push(`Course ${course.slug} is listed twice in COURSES-MODULES.json; the second entry is ignored`);
      continue;
    }
    seen.add(course.slug);
    kept.push(course);
  }
  return kept;
}

/**
 * Creates missing course rows and fixes changed titles. All checks run before the first write, so a bad setting or a
 * soft-deleted slug leaves the database as it was. Re-running after a successful run changes nothing.
 */
export async function syncCoursesFromStructure(options: SyncOptions): Promise<SyncSummary> {
  const { db, settings, dryRun } = options;
  const warnings: string[] = [];
  const courses = uniqueCourses(options.structure, warnings);
  const slugs = courses.map((course) => course.slug);

  const category = await db.category.findUnique({ where: { id: settings.categoryId }, select: { id: true } });
  if (!category) throw new Error(`${CATEGORY_ENV} does not match an active category. Create the category first, then set its ID.`);

  const teacher = await db.user.findFirst({ where: { id: settings.teacherId, isActive: true }, select: { id: true } });
  if (!teacher) throw new Error(`${TEACHER_ENV} does not match an active user.`);

  // Soft-deleted rows are hidden from normal queries, so a slug held by one would fail the create on the unique slug.
  // The sync does not restore or rename them. It stops and names them.
  const deleted = await db.course.findMany({ where: { slug: { in: slugs }, deletedAt: { not: null } }, select: { slug: true } });
  if (deleted.length > 0) {
    throw new Error(
      `Soft-deleted course rows already use these slugs: ${deleted.map((row) => row.slug).join(", ")}. ` +
        "Restore or rename them by hand; the sync does not touch deleted rows.",
    );
  }

  const existing = await db.course.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, title: true } });
  const bySlug = new Map(existing.map((row) => [row.slug, row]));

  const createdSlugs: string[] = [];
  const updatedSlugs: string[] = [];
  let unchanged = 0;
  for (const course of courses) {
    const row = bySlug.get(course.slug);
    if (!row) createdSlugs.push(course.slug);
    else if (row.title !== course.title) updatedSlugs.push(course.slug);
    else unchanged += 1;
  }

  if (!dryRun) {
    for (const course of courses) {
      const row = bySlug.get(course.slug);
      if (!row) {
        // price, level and isPublished take their schema defaults, so a new course is unpublished at price 0.
        await db.course.create({
          data: {
            slug: course.slug,
            title: course.title,
            description: "",
            categoryId: settings.categoryId,
            teacherId: settings.teacherId,
          },
        });
      } else if (row.title !== course.title) {
        await db.course.update({ where: { id: row.id }, data: { title: course.title } });
      }
    }
  }

  return {
    dryRun,
    courses: courses.length,
    created: createdSlugs.length,
    updated: updatedSlugs.length,
    unchanged,
    createdSlugs,
    updatedSlugs,
    warnings,
  };
}

async function main(): Promise<void> {
  try {
    const { dryRun } = parseSyncArgs(process.argv.slice(2));
    const settings = readSyncSettings(process.env);
    const root = curriculumRoot();
    const structure = readStructure(
      JSON.parse(await readFile(path.join(root, "structure", "COURSES-MODULES.json"), "utf8")) as unknown,
    ).courses;
    const summary = await syncCoursesFromStructure({ db: prisma, structure, settings, dryRun });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

const isEntryPoint = typeof require !== "undefined" && typeof module !== "undefined" && require.main === module;
if (isEntryPoint) {
  main().catch((error) => {
    console.error(`Course sync failed: ${(error as Error).message}`);
    process.exitCode = 1;
  });
}
