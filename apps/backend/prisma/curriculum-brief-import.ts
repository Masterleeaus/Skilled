/**
 * Revision-safe import of the Titan curriculum brief inventory (ACA-009).
 *
 * This module reads no files and creates no client. The CLI (import-titan-curriculum.ts) supplies both, and tests
 * supply an in-memory client and an inline inventory. See docs/CURRICULUM-IMPORT-IDENTITY-AND-CONFLICT-POLICY.md.
 *
 * Identity: a brief's `id` (for example "U01-01") is the source identity. It is stored as
 * AcademyContentLesson.sourceId, which is unique. Renaming an ID creates a new lesson. It is never inferred.
 *
 * Each distinct source content for a lesson is one AcademyLessonRevision row. Its body carries sourceId,
 * sourceVersion and the content fields, and its contentHash is contentHash(body). That is the same hash the review
 * gate recomputes, so import revisions can be reviewed like any other draft. The lesson row is the working copy.
 *
 * Every write runs in one transaction, and every decision is made from the state read inside it. A failure rolls
 * everything back, and a retry makes the same decisions again.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { contentHash } from '../src/utils/content-hash';

/** Marks revision bodies that this inventory wrote. Only lessons carrying this marker can be retired by an import. */
export const BRIEF_INVENTORY_ID = 'titan-three-layer-lessons';

const SOURCE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export interface BriefRow {
  id: string;
  layer: string;
  service_group: string;
  unit: string;
  title: string;
  objective: string;
  assessment: string;
  status?: string;
}

export interface BriefInventory {
  version: string;
  lessons: BriefRow[];
}

export interface BriefContent {
  layer: string;
  serviceGroup: string;
  unit: string;
  title: string;
  objective: string;
  assessment: string;
}

export interface BriefImportStats {
  total: number;
  lessonsCreated: number;
  /** Unreviewed lessons whose working row was changed to match the source. */
  lessonsUpdated: number;
  lessonsUnchanged: number;
  /** Explicit DRAFT revisions written. Every new source content gets exactly one. */
  revisionsCreated: number;
  /** Revisions written for lessons that already carry reviewed or published content. Their rows were not changed. */
  reviewedRevisionsDrafted: number;
  /** Unreviewed lessons that left the source and were marked RETIRED. */
  retired: number;
  /** Retired lessons that came back to the source and were returned to BRIEF. */
  restored: number;
  /** Lessons that left the source but have reviewed or published content. Their status is unchanged. */
  retiredNeedsReview: string[];
}

/** Lesson-row fields for one brief. The hash of these fields is the lesson's sourceHash. */
export function briefContent(row: BriefRow): BriefContent {
  return {
    layer: row.layer,
    serviceGroup: row.service_group ?? '',
    unit: row.unit,
    title: row.title,
    objective: row.objective,
    assessment: row.assessment ?? '',
  };
}

/** Revision body for one brief at one source version. Its contentHash is what the review gate checks. */
export function briefRevisionBody(row: BriefRow, version: string) {
  return { ...briefContent(row), sourceId: row.id, sourceVersion: version, sourceInventory: BRIEF_INVENTORY_ID };
}

/**
 * Content fields of a stored revision body, or null when the body is not an import body. Compared with
 * sourceHash, so a version bump with identical content does not create a revision.
 */
function contentOfBody(body: unknown): BriefContent | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (b.sourceInventory !== BRIEF_INVENTORY_ID) return null;
  return {
    layer: String(b.layer),
    serviceGroup: String(b.serviceGroup),
    unit: String(b.unit),
    title: String(b.title),
    objective: String(b.objective),
    assessment: String(b.assessment),
  };
}

/** Throws before any write when the inventory is not safe to import. Returns the inventory unchanged. */
export function validateBriefInventory(payload: unknown): BriefInventory {
  if (!payload || typeof payload !== 'object') throw new Error('Inventory must be a JSON object');
  const inventory = payload as Partial<BriefInventory>;
  if (typeof inventory.version !== 'string' || !inventory.version.trim()) throw new Error('Inventory has no version');
  if (!Array.isArray(inventory.lessons) || inventory.lessons.length === 0) throw new Error('No lessons in inventory');
  const seen = new Set<string>();
  for (const row of inventory.lessons) {
    const id = row?.id;
    if (typeof id !== 'string' || !SOURCE_ID_PATTERN.test(id)) throw new Error(`Invalid source ID ${String(id)}`);
    for (const field of ['layer', 'unit', 'title', 'objective'] as const) {
      if (typeof row[field] !== 'string' || !row[field].trim()) throw new Error(`Invalid brief ${id}: missing ${field}`);
    }
    if (seen.has(id)) throw new Error(`Duplicate source ID ${id}`);
    seen.add(id);
  }
  return inventory as BriefInventory;
}

type Client = PrismaClient;
type Tx = Prisma.TransactionClient;

/** Writes DRAFT revision n+1 for a lesson. The caller has already decided one is needed. */
async function insertRevision(tx: Tx, lessonId: string, body: ReturnType<typeof briefRevisionBody>, latestVersion: number) {
  await tx.academyLessonRevision.create({
    data: { lessonId, version: latestVersion + 1, body, contentHash: contentHash(body), status: 'DRAFT', publishedAt: null },
  });
}

/**
 * Applies the inventory in one transaction. The result describes what happened. Repeating the same inventory
 * produces zero writes.
 */
export async function applyBriefImport(prisma: Client, inventory: BriefInventory): Promise<BriefImportStats> {
  const checked = validateBriefInventory(inventory);
  const stats: BriefImportStats = {
    total: checked.lessons.length,
    lessonsCreated: 0,
    lessonsUpdated: 0,
    lessonsUnchanged: 0,
    revisionsCreated: 0,
    reviewedRevisionsDrafted: 0,
    retired: 0,
    restored: 0,
    retiredNeedsReview: [],
  };

  await prisma.$transaction(async (tx: Tx) => {
    for (const row of checked.lessons) {
      const content = briefContent(row);
      const body = briefRevisionBody(row, checked.version);
      const sourceHash = contentHash(content);
      const lesson = await tx.academyContentLesson.findUnique({ where: { sourceId: row.id } });

      if (!lesson) {
        const created = await tx.academyContentLesson.create({
          data: { sourceId: row.id, ...content, sourceVersion: checked.version, sourceHash, contentStatus: 'BRIEF' },
        });
        await insertRevision(tx, created.id, body, 0);
        stats.lessonsCreated++;
        stats.revisionsCreated++;
        continue;
      }

      // A revision is written when the content differs from the newest revision's content. A version bump with the
      // same content, and an exact repeat, write no revision. The version is kept on the lesson row (unreviewed rows only).
      const latest = await tx.academyLessonRevision.findFirst({ where: { lessonId: lesson.id }, orderBy: { version: 'desc' } });
      const contentChanged = !latest || contentHash(contentOfBody(latest.body)) !== sourceHash;
      if (contentChanged) {
        await insertRevision(tx, lesson.id, body, latest?.version ?? 0);
        stats.revisionsCreated++;
      }

      const unreviewed = lesson.contentStatus === 'BRIEF' || lesson.contentStatus === 'RETIRED';
      if (!unreviewed) {
        // Reviewed or published content keeps its row. A changed source is only a draft revision for review.
        if (contentChanged) stats.reviewedRevisionsDrafted++;
        stats.lessonsUnchanged++;
        continue;
      }

      const differs =
        lesson.layer !== content.layer ||
        lesson.serviceGroup !== content.serviceGroup ||
        lesson.unit !== content.unit ||
        lesson.title !== content.title ||
        lesson.objective !== content.objective ||
        lesson.assessment !== content.assessment ||
        lesson.sourceVersion !== checked.version ||
        lesson.sourceHash !== sourceHash ||
        lesson.contentStatus !== 'BRIEF';
      if (lesson.contentStatus === 'RETIRED') stats.restored++;
      if (differs) {
        await tx.academyContentLesson.update({
          where: { sourceId: row.id },
          data: { ...content, sourceVersion: checked.version, sourceHash, contentStatus: 'BRIEF' },
        });
        stats.lessonsUpdated++;
      } else {
        stats.lessonsUnchanged++;
      }
    }

    // Retirement: only lessons this inventory wrote (marker in their newest revision) and that left the source.
    const present = checked.lessons.map((row) => row.id);
    const absent = await tx.academyContentLesson.findMany({ where: { sourceId: { notIn: present } } });
    for (const lesson of absent) {
      const latest = await tx.academyLessonRevision.findFirst({ where: { lessonId: lesson.id }, orderBy: { version: 'desc' } });
      const marker = latest?.body && typeof latest.body === 'object' ? (latest.body as Record<string, unknown>).sourceInventory : undefined;
      if (marker !== BRIEF_INVENTORY_ID) continue;
      if (lesson.contentStatus === 'RETIRED') continue;
      if (lesson.contentStatus === 'BRIEF') {
        await tx.academyContentLesson.update({ where: { sourceId: lesson.sourceId }, data: { contentStatus: 'RETIRED' } });
        stats.retired++;
      } else {
        stats.retiredNeedsReview.push(lesson.sourceId);
      }
    }
    stats.retiredNeedsReview.sort();
  }, { isolationLevel: 'Serializable', timeout: 120_000 });

  return stats;
}
