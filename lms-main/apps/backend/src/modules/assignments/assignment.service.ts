import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "../courses/course.service";
import { assertEnrolled, recalculateCourseProgress } from "../enrollment/enrollment.service";
import type { CreateAssignmentInput } from "./assignment.validators";

export async function createAssignment(
  input: CreateAssignmentInput,
  userId: string,
  role: Role,
) {
  await assertCourseOwnership(input.courseId, userId, role);

  return prisma.assignment.create({
    data: { ...input, createdById: userId },
  });
}

export async function configureAssignmentPassingMarks(
  assignmentId: string, passingMarks: number, userId: string, role: Role,
) {
  const assignment = await getAssignmentOrThrow(assignmentId);
  await assertCourseOwnership(assignment.courseId, userId, role);
  if (!Number.isInteger(passingMarks) || passingMarks < 1 || passingMarks > assignment.totalMarks) {
    throw new AppError("Passing marks must be between 1 and total marks", 400);
  }
  const updated = await prisma.assignment.update({
    where: { id: assignmentId }, data: { passingMarks },
  });
  // Re-evaluate existing graded learners; editing an assignment threshold
  // must not silently leave old completion records in an inconsistent state.
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: assignment.courseId, status: { not: "CANCELLED" } },
    select: { studentId: true },
  });
  for (const enrollment of enrollments) {
    await recalculateCourseProgress(enrollment.studentId, assignment.courseId);
  }
  return updated;
}

export async function listAssignmentsForCourse(courseId: string, userId: string, role: Role) {
  if (role === "STUDENT") {
    await assertEnrolled(userId, courseId);
  } else {
    await assertCourseOwnership(courseId, userId, role);
  }
  return prisma.assignment.findMany({
    where: { courseId },
    orderBy: { dueDate: "asc" },
  });
}

async function getAssignmentOrThrow(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new NotFoundError("Assignment");
  return assignment;
}

export async function assertCanSubmitAssignment(assignmentId: string, studentId: string) {
  const assignment = await getAssignmentOrThrow(assignmentId);
  await assertEnrolled(studentId, assignment.courseId);
  const course = await prisma.course.findUnique({
    where: { id: assignment.courseId },
    select: { isPublished: true, deletedAt: true },
  });
  if (!course || !course.isPublished || course.deletedAt) {
    throw new AppError("Course is not available for submission", 403);
  }
  return assignment;
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  text: string | undefined,
  attachments: { key: string; name: string }[],
) {
  const assignment = await assertCanSubmitAssignment(assignmentId, studentId);

  if (!text && attachments.length === 0) {
    throw new AppError("Submission must include text or at least one attachment", 400);
  }

  const isLate = new Date() > assignment.dueDate;

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: {
      assignmentId,
      studentId,
      text,
      attachments,
      status: isLate ? "LATE" : "SUBMITTED",
    },
    update: {
      text,
      attachments,
      status: isLate ? "LATE" : "SUBMITTED",
      submittedAt: new Date(),
      marksObtained: null,
      feedback: null,
    },
  });
  // Resubmission invalidates any prior grade; immediately recheck the
  // learner's completion status instead of retaining a stale completion.
  await recalculateCourseProgress(studentId, assignment.courseId);
  return submission;
}

export async function listSubmissions(assignmentId: string, userId: string, role: Role) {
  const assignment = await getAssignmentOrThrow(assignmentId);
  await assertCourseOwnership(assignment.courseId, userId, role);

  return prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    orderBy: { submittedAt: "desc" },
    include: { student: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function getMySubmission(assignmentId: string, studentId: string) {
  const assignment = await getAssignmentOrThrow(assignmentId);
  await assertEnrolled(studentId, assignment.courseId);
  return prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
}

export async function gradeSubmission(
  submissionId: string,
  marksObtained: number,
  feedback: string | undefined,
  userId: string,
  role: Role,
) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
  });
  if (!submission) throw new NotFoundError("Submission");

  await assertCourseOwnership(submission.assignment.courseId, userId, role);

  if (marksObtained > submission.assignment.totalMarks) {
    throw new AppError("Marks cannot exceed the assignment's total marks", 400);
  }

  const result = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { marksObtained, feedback, status: "GRADED" },
  });
  await recalculateCourseProgress(submission.studentId, submission.assignment.courseId);
  return result;
}
