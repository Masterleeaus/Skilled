/**
 * Which lesson revisions a learner may use for a tutor answer.
 *
 * The rules mirror GET /api/academy/curriculum/courses/:courseId/lessons/:lessonId/body (curriculum.routes.ts). A
 * lesson is usable only when, for at least one enrolment:
 *   - the enrolment is ACTIVE or COMPLETED and the course is published;
 *   - the course places the lesson in a published track, and the placement's revision is PUBLISHED;
 *   - the course's saved selection (if any) includes the lesson;
 *   - the learner's saved licence track does not exclude the lesson;
 *   - the level gate does not lock the lesson (staff are exempt there, as in the body route);
 *   - the revision body still hashes to the stored contentHash.
 *
 * The body is the revision body. The raw curriculum file is never read here.
 *
 * Dependencies are injected. The production set (tutor/route/tutor-wiring.ts) calls the same services the body route
 * calls. Any thrown error propagates, so the route fails closed (503) and answers nothing.
 */
import { contentHash } from '../../utils/content-hash.js';
import { licenceStatusOf, licenceTrackExcludes, savedLicenceTrack, type LicenceIndex, type LicenceTrack } from '../../modules/curriculum/licence-track.js';
import type { PublishedLessonInput } from '../rag/published-index.js';

export interface TutorLearner {
  userId: string;
  role: string;
}

export interface AccessEnrolment {
  courseId: string;
  licenceTrack: unknown;
}

export interface AccessPlacement {
  lesson: { id: string; sourceId: string };
  revision: { id: string; status: string; body: unknown; contentHash: string } | null;
}

export interface TutorAccessDeps {
  /** ACTIVE or COMPLETED enrolments on published courses. */
  activeEnrolments(learnerId: string): Promise<AccessEnrolment[]>;
  /** Placements of the course's published tracks, each with its lesson and pinned revision. */
  coursePlacements(courseId: string): Promise<AccessPlacement[]>;
  /** Saved course selection for the learner, or undefined when there is none. */
  savedSelection(courseId: string, learnerId: string): Promise<Set<string> | undefined>;
  /** Licence index for a track. Throws when the licence file is unavailable for that track. */
  licenceIndex(track: LicenceTrack): Promise<LicenceIndex>;
  /** Returns a check for database lesson ids that the level gate locks for this learner. */
  levelLockChecker(learner: TutorLearner): Promise<(lessonId: string) => boolean>;
}

export interface AccessReport {
  enrolments: number;
  placements_seen: number;
  excluded_no_revision: number;
  excluded_not_published: number;
  excluded_not_selected: number;
  excluded_licence: number;
  excluded_level_lock: number;
  excluded_integrity: number;
  accessible: number;
}

export interface AccessibleLessons {
  lessons: PublishedLessonInput[];
  report: AccessReport;
}

export async function loadAccessibleLessons(learner: TutorLearner, deps: TutorAccessDeps): Promise<AccessibleLessons> {
  const report: AccessReport = {
    enrolments: 0,
    placements_seen: 0,
    excluded_no_revision: 0,
    excluded_not_published: 0,
    excluded_not_selected: 0,
    excluded_licence: 0,
    excluded_level_lock: 0,
    excluded_integrity: 0,
    accessible: 0,
  };
  const lessons: PublishedLessonInput[] = [];
  if (!learner.userId) return { lessons, report };

  const enrolments = await deps.activeEnrolments(learner.userId);
  report.enrolments = enrolments.length;
  if (enrolments.length === 0) return { lessons, report };

  const isLocked = await deps.levelLockChecker(learner);

  for (const enrolment of enrolments) {
    const track = savedLicenceTrack(enrolment.licenceTrack);
    const selected = await deps.savedSelection(enrolment.courseId, learner.userId);
    // Throws when the licence file is unavailable for this track. The whole request then fails closed.
    const index = await deps.licenceIndex(track);
    const placements = await deps.coursePlacements(enrolment.courseId);

    for (const placement of placements) {
      report.placements_seen++;
      const sourceId = placement.lesson.sourceId;
      const lessonDbId = placement.lesson.id;
      const revision = placement.revision;
      if (!revision) {
        report.excluded_no_revision++;
        continue;
      }
      if (revision.status !== 'PUBLISHED') {
        report.excluded_not_published++;
        continue;
      }
      if (selected && !selected.has(sourceId)) {
        report.excluded_not_selected++;
        continue;
      }
      if (licenceTrackExcludes(track, licenceStatusOf(index, sourceId))) {
        report.excluded_licence++;
        continue;
      }
      if (isLocked(lessonDbId)) {
        report.excluded_level_lock++;
        continue;
      }
      if (contentHash(revision.body) !== revision.contentHash) {
        report.excluded_integrity++;
        continue;
      }
      lessons.push({ sourceId, revisionId: revision.id, body: revision.body });
      report.accessible++;
    }
  }

  return { lessons, report };
}
