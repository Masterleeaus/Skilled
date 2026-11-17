import { Role, LiveClassStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "../courses/course.service";
import { isEnrolled } from "../enrollment/enrollment.service";
import type { CreateLiveClassInput, MarkAttendanceInput } from "./class.validators";

export async function createLiveClass(input: CreateLiveClassInput, userId: string, role: Role) {
  await assertCourseOwnership(input.courseId, userId, role);
  return prisma.liveClass.create({ data: { ...input, createdById: userId } });
}

/**
 * Meeting links and recording URLs are for course staff and enrolled learners only. Admins, and the teacher who owns
 * the course, can read them. A student can read them only on a published course in which they are enrolled. Everyone
 * else is refused, so the join data is never returned to them.
 */
export async function assertCanViewCourseLiveClasses(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({
    where: { id: courseId, deletedAt: null },
    select: { teacherId: true, isPublished: true },
  });
  if (!course) throw new NotFoundError("Course");

  if (role === "ADMIN") return;
  if (role === "TEACHER" && course.teacherId === userId) return;
  if (role === "STUDENT" && course.isPublished && (await isEnrolled(userId, courseId))) return;

  throw new ForbiddenError("You must be enrolled in this course to view its live classes");
}

export async function listLiveClassesForCourse(courseId: string, userId: string, role: Role) {
  await assertCanViewCourseLiveClasses(courseId, userId, role);
  const classes = await prisma.liveClass.findMany({ where: { courseId }, orderBy: { scheduledAt: "asc" } });

  // Keep the session's scheduling metadata visible to authorised learners, but never
  // return a usable join URL after it has ended or been cancelled. A cancelled
  // recording must not be disclosed as an accidental attachment.
  return classes.map((liveClass) => {
    if (liveClass.status === "CANCELLED") {
      return { ...liveClass, meetingLink: null, recordingUrl: null };
    }
    if (liveClass.status === "ENDED") {
      return { ...liveClass, meetingLink: null };
    }
    return liveClass;
  });
}

async function getLiveClassOrThrow(id: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id } });
  if (!liveClass) throw new NotFoundError("Live class");
  return liveClass;
}

export async function updateLiveClassStatus(
  id: string,
  status: LiveClassStatus,
  userId: string,
  role: Role,
) {
  const liveClass = await getLiveClassOrThrow(id);
  await assertCourseOwnership(liveClass.courseId, userId, role);
  return prisma.liveClass.update({ where: { id }, data: { status } });
}

export async function setRecordingUrl(id: string, recordingUrl: string, userId: string, role: Role) {
  const liveClass = await getLiveClassOrThrow(id);
  await assertCourseOwnership(liveClass.courseId, userId, role);
  return prisma.liveClass.update({ where: { id }, data: { recordingUrl } });
}

export async function markAttendance(
  liveClassId: string,
  input: MarkAttendanceInput,
  userId: string,
  role: Role,
) {
  const liveClass = await getLiveClassOrThrow(liveClassId);
  await assertCourseOwnership(liveClass.courseId, userId, role);

  // Only mark attendance for students actually enrolled in the course
  for (const record of input.records) {
    const enrolled = await isEnrolled(record.studentId, liveClass.courseId);
    if (!enrolled) {
      throw new AppError(`Student ${record.studentId} is not enrolled in this course`, 400);
    }
  }

  await prisma.$transaction(
    input.records.map((r) =>
      prisma.attendance.upsert({
        where: { liveClassId_studentId: { liveClassId, studentId: r.studentId } },
        create: { liveClassId, studentId: r.studentId, status: r.status, markedById: userId },
        update: { status: r.status, markedById: userId },
      }),
    ),
  );

  return prisma.attendance.findMany({ where: { liveClassId } });
}

export async function getMyAttendance(courseId: string, studentId: string) {
  return prisma.attendance.findMany({
    where: { studentId, liveClass: { courseId } },
    include: { liveClass: { select: { title: true, scheduledAt: true } } },
    orderBy: { liveClass: { scheduledAt: "desc" } },
  });
}

export async function getAttendanceForClass(liveClassId: string, userId: string, role: Role) {
  const liveClass = await getLiveClassOrThrow(liveClassId);
  await assertCourseOwnership(liveClass.courseId, userId, role);

  return prisma.attendance.findMany({
    where: { liveClassId },
    include: { student: { select: { id: true, fullName: true, email: true } } },
  });
}
