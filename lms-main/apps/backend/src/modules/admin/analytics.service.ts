import { prisma } from "../../config/prisma";

export async function getDashboardMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalRevenueAgg,
    monthlyRevenueAgg,
    activeStudents,
    activeTeachers,
    publishedCourses,
    completionAgg,
    quizAgg,
  ] = await prisma.$transaction([
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED", paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.lessonProgress.findMany({
      where: { lastAccessedAt: { gte: thirtyDaysAgo } },
      distinct: ["studentId"],
      select: { studentId: true },
    }),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.enrollment.aggregate({ _avg: { progressPercentage: true } }),
    prisma.quizAttempt.findMany({
      where: { status: "GRADED", marksObtained: { not: null } },
      include: { quiz: { select: { totalMarks: true } } },
    }),
  ]);

  const avgQuizScorePercent =
    quizAgg.length > 0
      ? quizAgg.reduce((sum, a) => sum + (a.marksObtained! / a.quiz.totalMarks) * 100, 0) /
        quizAgg.length
      : 0;

  return {
    totalRevenue: Number(totalRevenueAgg._sum.amount ?? 0),
    monthlyRevenue: Number(monthlyRevenueAgg._sum.amount ?? 0),
    activeStudents: activeStudents.length,
    activeTeachers,
    publishedCourses,
    courseCompletionRate: Math.round(completionAgg._avg.progressPercentage ?? 0),
    averageQuizScore: Math.round(avgQuizScorePercent),
  };
}
