/** Server-authoritative certificate gate.
 * Lesson completion is learner-reported; assessments require stored, graded results.
 * This does NOT attest supervised practical competence or video watch authenticity.
 */
import { prisma } from "../../config/prisma";

export type CertificateEligibility = {
  eligible: boolean;
  lessonsCompleted: number;
  lessonsTotal: number;
  quizzesPassed: number;
  quizzesTotal: number;
  assignmentsGraded: number;
  assignmentsPassed: number;
  assignmentsTotal: number;
  blockers: string[];
};

export async function evaluateCertificateEligibility(studentId: string, courseId: string): Promise<CertificateEligibility> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  const course = await prisma.course.findUnique({
    where: { id: courseId }, select: { isPublished: true, deletedAt: true },
  });
  const blockers: string[] = [];
  if (!enrollment || enrollment.status === "CANCELLED") blockers.push("Active enrollment required");
  if (!course || !course.isPublished || course.deletedAt) blockers.push("Published course required");

  const [lessonsTotal, lessonsCompleted, quizzes, assignments] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({ where: { studentId, completed: true, lesson: { module: { courseId } } } }),
    prisma.quiz.findMany({ where: { courseId, isPublished: true }, select: { id: true, passingMarks: true, totalMarks: true } }),
    prisma.assignment.findMany({ where: { courseId }, select: { id: true, passingMarks: true, totalMarks: true } }),
  ]);
  if (lessonsTotal === 0 || lessonsCompleted < lessonsTotal) blockers.push("Incomplete lessons");
  let quizzesPassed = 0;
  for (const quiz of quizzes) {
    // A missing/zero pass threshold must never silently qualify a learner.
    if (quiz.passingMarks <= 0 || quiz.passingMarks > quiz.totalMarks) continue;
    const passed = await prisma.quizAttempt.findFirst({
      where: { studentId, quizId: quiz.id, status: "GRADED", marksObtained: { gte: quiz.passingMarks } },
      select: { id: true },
    });
    if (passed) quizzesPassed++;
  }
  if (quizzesPassed !== quizzes.length) blockers.push("Required quizzes not passed");
  let assignmentsGraded = 0;
  let assignmentsPassed = 0;
  for (const assignment of assignments) {
    // Legacy or invalid thresholds cannot award a certificate by default.
    const configured = assignment.passingMarks !== null && assignment.passingMarks >= 1
      && assignment.passingMarks <= assignment.totalMarks;
    const graded = await prisma.assignmentSubmission.findFirst({
      where: { studentId, assignmentId: assignment.id, status: "GRADED", marksObtained: { not: null } },
      select: { id: true, marksObtained: true },
    });
    if (graded) {
      assignmentsGraded++;
      if (configured && graded.marksObtained !== null && graded.marksObtained >= assignment.passingMarks!) {
        assignmentsPassed++;
      }
    }
  }
  if (assignments.some((a) => a.passingMarks === null || a.passingMarks < 1 || a.passingMarks > a.totalMarks)) {
    blockers.push("Assignment passing marks not configured");
  }
  if (assignmentsGraded !== assignments.length) blockers.push("Required assignments not graded");
  if (assignmentsPassed !== assignments.length) blockers.push("Required assignments not passed");

  return {
    eligible: blockers.length === 0,
    lessonsTotal, lessonsCompleted,
    quizzesTotal: quizzes.length, quizzesPassed,
    assignmentsTotal: assignments.length, assignmentsGraded, assignmentsPassed,
    blockers,
  };
}
