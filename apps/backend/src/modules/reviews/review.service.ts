import { prisma } from "../../config/prisma";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { assertEnrolled } from "../enrollment/enrollment.service";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import type { CreateReviewInput } from "./review.validators";

export async function createReview(input: CreateReviewInput, studentId: string) {
  await assertEnrolled(studentId, input.courseId);

  const existing = await prisma.review.findUnique({
    where: { courseId_studentId: { courseId: input.courseId, studentId } },
  });
  if (existing) throw new AppError("You already reviewed this course", 409);

  return prisma.review.create({
    data: { courseId: input.courseId, studentId, rating: input.rating, comment: input.comment },
  });
}

export async function listReviewsForCourse(courseId: string, page = 1, limit = 10) {
  const { skip, limit: take } = getPaginationParams({ page, limit });

  const [reviews, total, aggregate] = await prisma.$transaction([
    prisma.review.findMany({
      where: { courseId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { fullName: true, avatarUrl: true } } },
    }),
    prisma.review.count({ where: { courseId } }),
    prisma.review.aggregate({ where: { courseId }, _avg: { rating: true } }),
  ]);

  return {
    reviews,
    pagination: buildPaginationMeta(total, page, take),
    averageRating: aggregate._avg.rating ?? 0,
  };
}

export async function updateReview(
  reviewId: string,
  studentId: string,
  data: { rating?: number; comment?: string },
) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Review");
  if (review.studentId !== studentId) throw new ForbiddenError("Not your review");

  return prisma.review.update({ where: { id: reviewId }, data });
}

export async function deleteReview(reviewId: string, studentId: string, isAdmin: boolean) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Review");
  if (review.studentId !== studentId && !isAdmin) throw new ForbiddenError("Not your review");

  await prisma.review.delete({ where: { id: reviewId } });
}
