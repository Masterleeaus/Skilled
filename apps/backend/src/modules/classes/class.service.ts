import { Role, LiveClassStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "../courses/course.service";
import { isEnrolled } from "../enrollment/enrollment.service";
import type { CreateLiveClassInput, MarkAttendanceInput } from "./class.validators";

export async function createLiveClass(input: CreateLiveClassInput, userId: string, role: Role) {
  await assertCourseOwnership(input.courseId, userId, role);
  return prisma.liveClass.create({ data: { ...input, createdById: userId } });
}

export async function listLiveClassesForCourse(courseId: string) {
  return prisma.liveClass.findMany({ where: { courseId }, orderBy: { scheduledAt: "asc" } });
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
