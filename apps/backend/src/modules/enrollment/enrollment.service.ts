import { prisma } from "../../config/prisma";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { evaluateCertificateEligibility } from "../certificates/certificate-eligibility.service";
import { DEFAULT_LICENCE_TRACK, type LicenceTrack } from "../curriculum/licence-track";

export async function enrollInCourse(studentId: string, courseId: string, licenceTrack: LicenceTrack = DEFAULT_LICENCE_TRACK) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError("Course");
  if (!course.isPublished) throw new AppError("Course is not published yet", 400);

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) throw new AppError("Already enrolled in this course", 409);

  // NOTE: paid courses will route through the Payment module once built;
  // for now, free courses (price 0) enroll directly.
  if (Number(course.price) > 0) {
    throw new AppError("This course requires payment — use the checkout flow", 402);
  }

  return prisma.enrollment.create({
    data: { studentId, courseId, licenceTrack },
  });
}

/**
 * Changes the licence track saved on the learner's own enrolment. Only the track field is written: progress, lesson
 * progress, completions and certificates are left as they are. Refused unless the enrolment is ACTIVE or COMPLETED.
 */
export async function setEnrolmentLicenceTrack(studentId: string, courseId: string, licenceTrack: LicenceTrack) {
  const enrolment = await prisma.enrollment.findFirst({
    where: { studentId, courseId, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { id: true },
  });
  if (!enrolment) throw new ForbiddenError("Active course enrolment required");
  return prisma.enrollment.update({
    where: { id: enrolment.id },
    data: { licenceTrack },
    select: { id: true, courseId: true, status: true, licenceTrack: true, progressPercentage: true },
  });
}

export async function listMyEnrollments(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          teacher: { select: { fullName: true } },
        },
      },
    },
  });
}

export async function isEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  return Boolean(enrollment && enrollment.status !== "CANCELLED");
}

export async function assertEnrolled(studentId: string, courseId: string) {
  const enrolled = await isEnrolled(studentId, courseId);
  if (!enrolled) throw new ForbiddenError("You are not enrolled in this course");
}

export async function listEnrolledStudents(courseId: string) {
  return prisma.enrollment.findMany({
    where: { courseId, status: { not: "CANCELLED" } },
    select: { student: { select: { id: true, fullName: true, email: true } } },
    orderBy: { enrolledAt: "asc" },
  });
}

// Full roster view for teacher/admin: progress, quiz attempts, assignment submissions per student
export async function getCourseRoster(courseId: string) {
  const [enrollments, totalQuizzes, totalAssignments] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId, status: { not: "CANCELLED" } },
      include: { student: { select: { id: true, fullName: true, email: true } } },
      orderBy: { enrolledAt: "asc" },
    }),
    prisma.quiz.count({ where: { courseId, isPublished: true } }),
    prisma.assignment.count({ where: { courseId } }),
  ]);

  const roster = await Promise.all(
    enrollments.map(async (e) => {
      const [quizzesAttempted, assignmentsSubmitted, avgQuizScore] = await Promise.all([
        prisma.quizAttempt.count({
          where: { studentId: e.studentId, quiz: { courseId }, status: { in: ["SUBMITTED", "GRADED"] } },
        }),
        prisma.assignmentSubmission.count({
          where: { studentId: e.studentId, assignment: { courseId } },
        }),
        prisma.quizAttempt.aggregate({
          where: { studentId: e.studentId, quiz: { courseId }, status: "GRADED" },
          _avg: { marksObtained: true },
        }),
      ]);

      return {
        student: e.student,
        progressPercentage: e.progressPercentage,
        status: e.status,
        enrolledAt: e.enrolledAt,
        quizzesAttempted,
        totalQuizzes,
        assignmentsSubmitted,
        totalAssignments,
        avgQuizScore: avgQuizScore._avg.marksObtained,
      };
    }),
  );

  return roster;
}

export async function getStudentDetailForCourse(courseId: string, studentId: string) {
  const [student, enrollment, quizAttempts, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true, email: true, avatarUrl: true },
    }),
    prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId, quiz: { courseId } },
      include: { quiz: { select: { title: true, totalMarks: true } } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId, assignment: { courseId } },
      include: { assignment: { select: { title: true, totalMarks: true } } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  if (!student || !enrollment) throw new NotFoundError("Learner enrollment");

  return { student, enrollment, quizAttempts, submissions };
}

export async function updateLessonProgress(
  studentId: string,
  lessonId: string,
  watchedSeconds: number,
  completed?: boolean,
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson");

  await assertEnrolled(studentId, lesson.module.courseId);

  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: {
      studentId,
      lessonId,
      watchedSeconds,
      completed: completed ?? false,
    },
    update: {
      watchedSeconds,
      ...(completed !== undefined && { completed }),
      lastAccessedAt: new Date(),
    },
  });

  await recalculateCourseProgress(studentId, lesson.module.courseId);
  return progress;
}

/** Refresh after a lesson update, quiz grading or assignment grading.
 * Never mark a cancelled enrollment complete or issue a certificate solely
 * because a client sent completed=true for the lessons.
 */
export async function recalculateCourseProgress(studentId: string, courseId: string) {
  const eligibility = await evaluateCertificateEligibility(studentId, courseId);
  const percentage = eligibility.lessonsTotal > 0
    ? Math.round((eligibility.lessonsCompleted / eligibility.lessonsTotal) * 100)
    : 0;
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment || enrollment.status === "CANCELLED") return eligibility;

  const completedAt = eligibility.eligible ? (enrollment.completedAt ?? new Date()) : null;
  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId, courseId } },
    data: {
      progressPercentage: percentage,
      status: eligibility.eligible ? "COMPLETED" : "ACTIVE",
      completedAt,
    },
  });

  if (eligibility.eligible && enrollment.status !== "COMPLETED") {
    const { queueCertificateIssuance } = await import("../../jobs/certificate.queue");
    await queueCertificateIssuance(studentId, courseId);
  }
  return eligibility;
}

export async function getCourseProgress(studentId: string, courseId: string) {
  await assertEnrolled(studentId, courseId);

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { studentId, lesson: { module: { courseId } } },
  });

  return { enrollment, lessonProgress };
}
