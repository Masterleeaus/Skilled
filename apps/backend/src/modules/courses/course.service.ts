import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { slugify, slugWithSuffix } from "../../utils/slugify";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { logger } from "../../config/logger";
import type { CreateCourseInput, UpdateCourseInput, ListCourseQuery } from "./course.validators";

/**
 * Course deletion policy: SOFT DELETE ONLY.
 *
 * deleteCourse() sets deletedAt and unpublishes the course in one write. It never removes the course row, and never
 * removes its modules, lessons, enrolments, payments, assignments, tracks or certificates, because those are historical
 * records. Lesson video objects in MinIO are kept too, since the course is retained for history; removing them is a
 * separate follow-up job. Any future hard purge must be its own operation with its own guards (super-admin only, a
 * retention check and an audit record), and it must never be reached from deleteCourse.
 */

/**
 * Soft-deleted courses are treated as not found by every ordinary read, write, publish, enrolment and payment path.
 * The explicit deletedAt filter here does not depend on the Prisma soft-delete extension in config/prisma.ts.
 */
export async function assertCourseOwnership(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");

  if (role !== "ADMIN" && course.teacherId !== userId) {
    throw new ForbiddenError("You do not own this course");
  }

  return course;
}

export async function createCourse(input: CreateCourseInput, teacherId: string) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new AppError("Category not found", 404);

  const baseSlug = slugify(input.title);
  const existing = await prisma.course.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? slugWithSuffix(baseSlug) : baseSlug;

  return prisma.course.create({
    data: { ...input, slug, teacherId },
  });
}

export async function listCourses(query: ListCourseQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.CourseWhereInput = {
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...(query.level && { level: query.level }),
    ...(query.teacherId && { teacherId: query.teacherId }),
    // Public catalogue must never disclose draft courses, even when a caller requests published=false.
    isPublished: true,
    deletedAt: null,
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        teacher: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, pagination: buildPaginationMeta(total, page, limit) };
}

async function loadCourseBySlug(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      teacher: { select: { id: true, fullName: true, avatarUrl: true } },
      modules: {
        orderBy: { orderIndex: "asc" },
        include: { lessons: { orderBy: { orderIndex: "asc" } } },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });
  if (!course || course.deletedAt) throw new NotFoundError("Course");
  return course;
}

// Public course details must never expose unpublished teacher drafts.
export async function getCourseBySlug(slug: string) {
  const course = await loadCourseBySlug(slug);
  if (!course.isPublished) throw new NotFoundError("Course");
  return course;
}

// Teacher and administrator preview is authenticated and ownership checked.
export async function getCourseBySlugForManager(slug: string, userId: string, role: Role) {
  const course = await loadCourseBySlug(slug);
  await assertCourseOwnership(course.id, userId, role);
  return course;
}

export async function updateCourse(
  courseId: string,
  input: UpdateCourseInput,
  userId: string,
  role: Role,
) {
  await assertCourseOwnership(courseId, userId, role);

  const data: Prisma.CourseUpdateInput = { ...input };

  if (input.title) {
    const baseSlug = slugify(input.title);
    const existing = await prisma.course.findFirst({
      where: { slug: baseSlug, NOT: { id: courseId } },
    });
    data.slug = existing ? slugWithSuffix(baseSlug) : baseSlug;
  }

  return prisma.course.update({ where: { id: courseId }, data });
}

export async function setPublishStatus(
  courseId: string,
  isPublished: boolean,
  userId: string,
  role: Role,
) {
  const course = await assertCourseOwnership(courseId, userId, role);

  if (isPublished) {
    const moduleCount = await prisma.module.count({ where: { courseId: course.id } });
    // Academy content reaches learners through attached tracks, not modules. A course with
    // neither modules nor a published track that has lesson placements has no content.
    const publishedTrackCount = await prisma.academyCourseTrack.count({
      where: { courseId: course.id, track: { status: "PUBLISHED", placements: { some: {} } } },
    });
    if (moduleCount === 0 && publishedTrackCount === 0) {
      throw new AppError("Cannot publish a course with no modules or published tracks", 400);
    }
  }

  const updated = await prisma.course.update({ where: { id: courseId }, data: { isPublished } });

  const { recordAuditLog } = await import("../audit/audit.service");
  await recordAuditLog({
    userId,
    action: isPublished ? "COURSE_PUBLISHED" : "COURSE_UNPUBLISHED",
    entity: "Course",
    entityId: courseId,
    oldValue: { isPublished: course.isPublished },
    newValue: { isPublished },
  });

  return updated;
}

/** MinIO object keys of every lesson video and caption track under the course. Read-only: nothing is deleted or stored. */
export async function listCourseVideoObjectKeys(courseId: string): Promise<string[]> {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId } },
    select: { videoUrl: true, captionTrackKey: true },
  });
  return lessons.flatMap((lesson) => [lesson.videoUrl, lesson.captionTrackKey].filter((key): key is string => !!key));
}

export async function deleteCourse(courseId: string, userId: string, role: Role) {
  const course = await assertCourseOwnership(courseId, userId, role);
  const videoObjectKeys = await listCourseVideoObjectKeys(courseId);

  // One conditional write sets deletedAt and unpublishes together. The deletedAt guard means a second concurrent
  // delete matches nothing and fails as not found, rather than writing twice.
  const result = await prisma.course.updateMany({
    where: { id: courseId, deletedAt: null },
    data: { deletedAt: new Date(), isPublished: false },
  });
  if (result.count !== 1) throw new NotFoundError("Course");

  logger.info(
    `Soft-deleted course ${courseId}: ${videoObjectKeys.length} lesson video object(s) retained in storage pending the separate cleanup job`,
  );

  const { recordAuditLog } = await import("../audit/audit.service");
  await recordAuditLog({
    userId,
    action: "COURSE_DELETED",
    entity: "Course",
    entityId: courseId,
    oldValue: { title: course.title, isPublished: course.isPublished },
  });
}
