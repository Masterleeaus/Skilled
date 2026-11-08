import { prisma } from "../../config/prisma";
import { Role } from "@prisma/client";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "../courses/course.service";
import { assertEnrolled } from "../enrollment/enrollment.service";
import type { CreateQuizInput, QuestionInput, SubmitAttemptInput } from "./quiz.validators";

export async function listQuizzesForCourse(courseId: string, userId: string, role: Role) {
  // Course membership is not implied by an authenticated role. Never disclose
  // teacher drafts across organisations or course lists to unenrolled students.
  if (role === "STUDENT") {
    await assertEnrolled(userId, courseId);
  } else {
    await assertCourseOwnership(courseId, userId, role);
  }
  return prisma.quiz.findMany({
    where: { courseId, ...(role === "STUDENT" && { isPublished: true }) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      totalMarks: true,
      passingMarks: true,
      timeLimitMinutes: true,
      isPublished: true,
    },
  });
}

// ---------------- Builder (Teacher/Admin) ----------------

export async function createQuiz(input: CreateQuizInput, userId: string, role: Role) {
  await assertCourseOwnership(input.courseId, userId, role);

  if (input.passingMarks > input.totalMarks) {
    throw new AppError("Passing marks cannot exceed total marks", 400);
  }

  return prisma.quiz.create({ data: input });
}

async function assertQuizOwnership(quizId: string, userId: string, role: Role) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new NotFoundError("Quiz");
  await assertCourseOwnership(quiz.courseId, userId, role);
  return quiz;
}

export async function addQuestion(quizId: string, input: QuestionInput, userId: string, role: Role) {
  const quiz = await assertQuizOwnership(quizId, userId, role);
  if (quiz.isPublished) throw new AppError("Unpublish the quiz before changing its questions", 409);

  if (input.type !== "TEXT" && (!input.options || input.options.length < 2)) {
    throw new AppError("Choice questions need at least 2 options", 400);
  }
  if (input.type === "TEXT" && input.options?.length) {
    throw new AppError("Text questions cannot contain choice options", 400);
  }
  const correctCount = input.options?.filter((o) => o.isCorrect).length ?? 0;
  if (input.type === "SINGLE_CHOICE" && correctCount !== 1) {
    throw new AppError("Single-choice questions need exactly 1 correct option", 400);
  }
  if (input.type === "MULTIPLE_CHOICE" && correctCount < 2) {
    throw new AppError("Multiple-choice questions need at least 2 correct options", 400);
  }

  const orderIndex = input.orderIndex ?? (await prisma.question.count({ where: { quizId } }));

  return prisma.question.create({
    data: {
      quizId,
      text: input.text,
      type: input.type,
      marks: input.marks,
      orderIndex,
      options: input.options
        ? { create: input.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) }
        : undefined,
    },
    include: { options: true },
  });
}

export async function publishQuiz(quizId: string, userId: string, role: Role) {
  await assertQuizOwnership(quizId, userId, role);

  const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: quizId } });
  const questions = await prisma.question.findMany({
    where: { quizId },
    select: { marks: true, type: true, options: { select: { isCorrect: true } } },
  });
  if (questions.length === 0) throw new AppError("Cannot publish a quiz with no questions", 400);
  const maxMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  if (maxMarks !== quiz.totalMarks) {
    throw new AppError("Question marks must equal the quiz total before publication", 400);
  }
  for (const question of questions) {
    if (question.type === "TEXT" && question.options.length !== 0) {
      throw new AppError("Text questions cannot have choice options", 400);
    }
    if (question.type !== "TEXT" && question.options.length < 2) {
      throw new AppError("Every choice question requires at least two options", 400);
    }
    if (question.type === "SINGLE_CHOICE" && question.options.filter((o) => o.isCorrect).length !== 1) {
      throw new AppError("Every single-choice question needs exactly one correct answer", 400);
    }
    if (question.type === "MULTIPLE_CHOICE" && question.options.filter((o) => o.isCorrect).length < 2) {
      throw new AppError("Multiple-choice questions need at least two correct answers", 400);
    }
  }

  return prisma.quiz.update({ where: { id: quizId }, data: { isPublished: true } });
}

// Full view with correct answers — for the owning teacher/admin only
export async function getQuizForTeacher(quizId: string, userId: string, role: Role) {
  await assertQuizOwnership(quizId, userId, role);
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { orderIndex: "asc" }, include: { options: true } } },
  });
}

// ---------------- Student attempt flow ----------------

// Never exposes isCorrect — sent to students taking the quiz
export async function getQuizForStudent(quizId: string, studentId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.isPublished) throw new NotFoundError("Quiz");

  await assertEnrolled(studentId, quiz.courseId);

  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      text: true,
      type: true,
      marks: true,
      orderIndex: true,
      options: { select: { id: true, text: true } }, // isCorrect withheld
    },
  });

  return { ...quiz, questions };
}

export async function startAttempt(quizId: string, studentId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.isPublished) throw new NotFoundError("Quiz");

  await assertEnrolled(studentId, quiz.courseId);

  const inProgress = await prisma.quizAttempt.findFirst({
    where: { studentId, quizId, status: "IN_PROGRESS" },
  });
  if (inProgress) {
    if (Date.now() - inProgress.startedAt.getTime() < quiz.timeLimitMinutes * 60_000) {
      return inProgress;
    }
    // Expired attempts must not trap learners in an unrecoverable IN_PROGRESS state.
    await prisma.quizAttempt.updateMany({
      where: { id: inProgress.id, status: "IN_PROGRESS" },
      data: { status: "GRADED", marksObtained: 0, submittedAt: new Date() },
    });
  }

  try {
    return await prisma.quizAttempt.create({
      data: { studentId, quizId, status: "IN_PROGRESS" },
    });
  } catch (error) {
    // A concurrent request may have claimed the sole active attempt.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const active = await prisma.quizAttempt.findFirst({
        where: { studentId, quizId, status: "IN_PROGRESS" },
      });
      if (active) return active;
    }
    throw error;
  }
}

export async function submitAttempt(
  attemptId: string,
  studentId: string,
  input: SubmitAttemptInput,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: true },
  });
  if (!attempt) throw new NotFoundError("Attempt");
  if (attempt.studentId !== studentId) throw new ForbiddenError();
  if (attempt.status !== "IN_PROGRESS") throw new AppError("Attempt already submitted", 400);

  const questions = await prisma.question.findMany({
    where: { quizId: attempt.quizId },
    include: { options: true },
  });
  if (Date.now() - attempt.startedAt.getTime() > attempt.quiz.timeLimitMinutes * 60_000) {
    throw new AppError("Quiz attempt time limit exceeded", 400);
  }
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  if (input.answers.length !== questions.length) {
    throw new AppError("Submit exactly one answer for every quiz question", 400);
  }
  const answeredIds = new Set<string>();
  let autoGradedMarks = 0;
  let allAutoGradable = true;

  const answerRows = input.answers.map((answer) => {
    if (answeredIds.has(answer.questionId)) {
      throw new AppError("Duplicate quiz question answer", 400);
    }
    answeredIds.add(answer.questionId);
    const question = questionMap.get(answer.questionId);
    if (!question) throw new AppError("Answer references a question outside this quiz", 400);
    if (answer.selectedOptionId && !question.options.some((o) => o.id === answer.selectedOptionId)) {
      throw new AppError("Selected answer option does not belong to this question", 400);
    }
    if (answer.selectedOptionIds?.some((id) => !question.options.some((o) => o.id === id))) {
      throw new AppError("Selected answer option does not belong to this question", 400);
    }
    if (answer.selectedOptionIds && new Set(answer.selectedOptionIds).size !== answer.selectedOptionIds.length) {
      throw new AppError("Duplicate selected options", 400);
    }
    if ((answer.selectedOptionId && answer.selectedOptionIds) ||
        ((answer.selectedOptionId || answer.selectedOptionIds) && answer.textAnswer !== undefined)) {
      throw new AppError("Answer contains conflicting response fields", 400);
    }
    if (question.type === "TEXT") {
      if (answer.selectedOptionId || answer.selectedOptionIds || !answer.textAnswer?.trim()) {
        throw new AppError("Text questions require a text response", 400);
      }
    } else if (question.type === "SINGLE_CHOICE") {
      if (!answer.selectedOptionId || answer.selectedOptionIds) {
        throw new AppError("A single choice must be selected", 400);
      }
    } else if (question.type === "MULTIPLE_CHOICE") {
      if (answer.selectedOptionId || !answer.selectedOptionIds?.length) {
        throw new AppError("Multiple-choice questions require selectedOptionIds", 400);
      }
    }
    let marksObtained: number | null = null;
    if (question.type === "SINGLE_CHOICE") {
      const correct = question.options.find((o) => o.isCorrect);
      marksObtained = answer.selectedOptionId === correct?.id ? question.marks : 0;
      autoGradedMarks += marksObtained;
    } else if (question.type === "MULTIPLE_CHOICE") {
      // All-or-nothing exact-set scoring: no marks if any required choice is
      // omitted or any incorrect choice is selected. Order is irrelevant.
      const expected = question.options.filter((o) => o.isCorrect).map((o) => o.id);
      const selected = new Set(answer.selectedOptionIds);
      marksObtained = selected.size === expected.length && expected.every((id) => selected.has(id))
        ? question.marks : 0;
      autoGradedMarks += marksObtained;
    } else {
      allAutoGradable = false;
    }
    return {
      attemptId,
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      selectedOptionIds: answer.selectedOptionIds,
      textAnswer: answer.textAnswer,
      marksObtained,
    };
  });

  // Claim the attempt first, then persist the answers in the same transaction.
  // Conditional UPDATE serializes competing submissions on PostgreSQL: only
  // one transaction can move IN_PROGRESS to SUBMITTED/GRADED.
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.quizAttempt.updateMany({
      where: { id: attemptId, studentId, status: "IN_PROGRESS" },
      data: {
        submittedAt: new Date(),
        status: allAutoGradable ? "GRADED" : "SUBMITTED",
        marksObtained: allAutoGradable ? autoGradedMarks : null,
      },
    });
    if (claimed.count !== 1) throw new AppError("Quiz attempt already submitted", 409);
    await tx.answer.createMany({ data: answerRows });
  });

  if (allAutoGradable) {
    const { recalculateCourseProgress } = await import("../enrollment/enrollment.service");
    await recalculateCourseProgress(studentId, attempt.quiz.courseId);
  }
  return prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true },
  });
}

export async function listMyAttempts(quizId: string, studentId: string) {
  return prisma.quizAttempt.findMany({
    where: { quizId, studentId },
    orderBy: { startedAt: "desc" },
  });
}

// Only the course owner (or authorised administrator) can inspect learner
// submissions. Restrict output to assessment data and minimal learner identity.
export async function listQuizSubmissionsForTeacher(
  quizId: string,
  userId: string,
  role: Role,
) {
  await assertQuizOwnership(quizId, userId, role);
  return prisma.quizAttempt.findMany({
    where: { quizId, status: { in: ["SUBMITTED", "GRADED"] } },
    take: 100,
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      status: true,
      marksObtained: true,
      submittedAt: true,
      student: { select: { id: true, fullName: true } },
      answers: {
        select: {
          id: true,
          selectedOptionId: true,
          selectedOptionIds: true,
          textAnswer: true,
          marksObtained: true,
          question: {
            select: {
              id: true,
              text: true,
              type: true,
              marks: true,
              options: { select: { id: true, text: true, isCorrect: true } },
            },
          },
        },
      },
    },
  });
}

// Teacher/Admin manually grades TEXT answers (or reviews auto-graded choice answers)
export async function gradeAnswer(
  answerId: string,
  marksObtained: number,
  userId: string,
  role: Role,
) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { attempt: { include: { quiz: true } } },
  });
  if (!answer) throw new NotFoundError("Answer");

  await assertCourseOwnership(answer.attempt.quiz.courseId, userId, role);

  if (answer.attempt.status !== "SUBMITTED" && answer.attempt.status !== "GRADED") {
    throw new AppError("Only submitted attempts may be graded", 400);
  }
  const question = await prisma.question.findUnique({
    where: { id: answer.questionId }, select: { marks: true },
  });
  if (!question) throw new NotFoundError("Question");
  if (!Number.isInteger(marksObtained) || marksObtained < 0 || marksObtained > question.marks) {
    throw new AppError("Grade must be an integer between zero and the question maximum", 400);
  }
  await prisma.$transaction(async (tx) => {
    // Serialize graders for the same attempt. Without a row lock, two teachers
    // can both aggregate stale answer scores and overwrite the final total.
    // Parameterised Prisma SQL template: no user input is interpolated as SQL.
    const locked = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM quiz_attempts WHERE id = ${answer.attemptId} FOR UPDATE
    `;
    if (locked.length !== 1 || !["SUBMITTED", "GRADED"].includes(locked[0].status)) {
      throw new AppError("Only submitted attempts may be graded", 409);
    }
    const currentAnswer = await tx.answer.findUnique({ where: { id: answerId } });
    if (!currentAnswer || currentAnswer.attemptId !== answer.attemptId) {
      throw new NotFoundError("Answer");
    }
    await tx.answer.update({ where: { id: answerId }, data: { marksObtained } });
    const allAnswers = await tx.answer.findMany({ where: { attemptId: answer.attemptId } });
    if (allAnswers.length > 0 && allAnswers.every((a) => a.marksObtained !== null)) {
      const total = allAnswers.reduce((sum, a) => sum + (a.marksObtained ?? 0), 0);
      await tx.quizAttempt.update({
        where: { id: answer.attemptId },
        data: { status: "GRADED", marksObtained: total },
      });
    } else {
      // A regrade that becomes incomplete must not leave a stale final score.
      await tx.quizAttempt.update({
        where: { id: answer.attemptId },
        data: { status: "SUBMITTED", marksObtained: null },
      });
    }
  });
  const { recalculateCourseProgress } = await import("../enrollment/enrollment.service");
  await recalculateCourseProgress(answer.attempt.studentId, answer.attempt.quiz.courseId);
}
