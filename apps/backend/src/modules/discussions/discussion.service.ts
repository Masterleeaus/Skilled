import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ForbiddenError, NotFoundError } from "../../utils/AppError";
import { isEnrolled } from "../enrollment/enrollment.service";
import type { CreateThreadInput } from "./discussion.validators";

async function assertCanParticipate(courseId: string, userId: string, role: Role) {
  // A signed-in user or an old enrolment must never author content in a
  // deleted course. Students may write only to a published course they are
  // still enrolled in; the owning teacher and admins may prepare draft forums.
  const course = await prisma.course.findUnique({
    where: { id: courseId, deletedAt: null },
    select: { teacherId: true, isPublished: true },
  });
  if (!course) throw new NotFoundError("Course");
  if (role === "ADMIN") return;
  if (role === "TEACHER") {
    if (course.teacherId === userId) return;
    throw new ForbiddenError("You do not teach this course");
  }
  if (!course.isPublished) throw new NotFoundError("Course");
  if (role === "STUDENT" && (await isEnrolled(userId, courseId))) return;
  throw new ForbiddenError("You must be enrolled to participate in discussions");
}

export async function createThread(input: CreateThreadInput, userId: string, role: Role) {
  await assertCanParticipate(input.courseId, userId, role);

  return prisma.discussionThread.create({
    data: {
      courseId: input.courseId,
      lessonId: input.lessonId,
      studentId: userId, // field name is legacy — represents the thread's author, any role
      title: input.title,
      body: input.body,
    },
  });
}

/**
 * Reading threads and replies needs the same course access as taking part, plus a published course. Admins and the
 * course's teacher can read it, and enrolled students can read it on a published course. An unpublished course returns
 * 404 to everyone else, matching listModules.
 */
async function assertCanReadCourseDiscussions(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({
    where: { id: courseId, deletedAt: null },
    select: { teacherId: true, isPublished: true },
  });
  if (!course) throw new NotFoundError("Course");

  if (role === "ADMIN") return;
  if (role === "TEACHER" && course.teacherId === userId) return;
  if (!course.isPublished) throw new NotFoundError("Course");
  if (role === "STUDENT" && (await isEnrolled(userId, courseId))) return;

  throw new ForbiddenError("You must be enrolled to view discussions");
}

export async function listThreadsForCourse(
  courseId: string,
  userId: string,
  role: Role,
  lessonId?: string,
) {
  await assertCanReadCourseDiscussions(courseId, userId, role);
  return prisma.discussionThread.findMany({
    where: { courseId, ...(lessonId && { lessonId }) },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
      _count: { select: { replies: true } },
    },
  });
}

export async function getThread(threadId: string, userId: string, role: Role) {
  // Read only the owning course first. Unauthorised callers must never load
  // thread bodies, reply text, or author profiles into the application.
  const reference = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    select: { courseId: true },
  });
  if (!reference) throw new NotFoundError("Thread");
  await assertCanReadCourseDiscussions(reference.courseId, userId, role);

  const thread = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
      replies: {
        orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
        include: { user: { select: { fullName: true, avatarUrl: true, role: true } } },
      },
    },
  });
  // A thread moved or removed during an access check must fail closed.
  if (!thread || thread.courseId !== reference.courseId) throw new NotFoundError("Thread");
  return thread;
}

export async function addReply(threadId: string, body: string, userId: string, role: Role) {
  const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new NotFoundError("Thread");

  await assertCanParticipate(thread.courseId, userId, role);

  return prisma.discussionReply.create({
    data: { threadId, userId, body },
  });
}

export async function pinReply(replyId: string, userId: string, role: Role) {
  const reply = await prisma.discussionReply.findUnique({
    where: { id: replyId },
    include: { thread: true },
  });
  if (!reply) throw new NotFoundError("Reply");

  // Only the course teacher or admin can pin a "best answer"
  await assertCanParticipate(reply.thread.courseId, userId, role);
  if (role === "STUDENT") throw new ForbiddenError("Only teachers/admins can pin replies");

  return prisma.discussionReply.update({ where: { id: replyId }, data: { isPinned: true } });
}

export async function resolveThread(threadId: string, userId: string, role: Role) {
  const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new NotFoundError("Thread");

  // Even a TEACHER must teach the thread's course; ownership of an arbitrary
  // thread ID or a generic staff role is never sufficient to resolve it.
  await assertCanParticipate(thread.courseId, userId, role);

  const isOwner = thread.studentId === userId;
  const isStaff = role === "ADMIN" || role === "TEACHER";
  if (!isOwner && !isStaff) throw new ForbiddenError();

  return prisma.discussionThread.update({ where: { id: threadId }, data: { isResolved: true } });
}

// Admin moderation — remove inappropriate content
export async function moderateDeleteThread(threadId: string) {
  const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new NotFoundError("Thread");
  await prisma.discussionThread.delete({ where: { id: threadId } });
}

export async function moderateDeleteReply(replyId: string) {
  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
  if (!reply) throw new NotFoundError("Reply");
  await prisma.discussionReply.delete({ where: { id: replyId } });
}
