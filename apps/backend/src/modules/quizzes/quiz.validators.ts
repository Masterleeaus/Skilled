import { z } from "zod";

export const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT"]),
  marks: z.coerce.number().int().min(1),
  orderIndex: z.coerce.number().int().min(0).optional(),
  options: z.array(optionSchema).max(40).optional(),
}).superRefine((value, ctx) => {
  const options = value.options ?? [];
  if (value.type === "TEXT") {
    if (options.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Text questions cannot include choice options" });
    return;
  }
  if (options.length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "Choice questions require at least two options" });
  const count = options.filter((o) => o.isCorrect).length;
  if (value.type === "SINGLE_CHOICE" && count !== 1) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Single-choice questions require exactly one correct option" });
  }
  if (value.type === "MULTIPLE_CHOICE" && count < 2) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Multiple-choice questions require at least two correct options" });
  }
  const labels = options.map((o) => o.text.trim().toLocaleLowerCase());
  if (new Set(labels).size !== labels.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Choice labels must be distinct" });
});

export const createQuizSchema = z.object({
  courseId: z.string().cuid(),
  moduleId: z.string().cuid().optional(),
  title: z.string().min(3).max(150),
  totalMarks: z.coerce.number().int().min(1),
  passingMarks: z.coerce.number().int().min(0),
  timeLimitMinutes: z.coerce.number().int().min(1),
});

export const updateQuizSchema = createQuizSchema.partial().omit({ courseId: true });

export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  selectedOptionId: z.string().cuid().optional(),
  selectedOptionIds: z.array(z.string().cuid()).min(1).max(40).optional(),
  textAnswer: z.string().max(20000).optional(),
}).superRefine((answer, ctx) => {
  if (answer.selectedOptionId && answer.selectedOptionIds) {
    ctx.addIssue({ code: "custom", message: "Use either selectedOptionId or selectedOptionIds, not both" });
  }
  if ((answer.selectedOptionId || answer.selectedOptionIds) && answer.textAnswer !== undefined) {
    ctx.addIssue({ code: "custom", message: "Choice and text answers cannot be combined" });
  }
  if (answer.selectedOptionIds && new Set(answer.selectedOptionIds).size !== answer.selectedOptionIds.length) {
    ctx.addIssue({ code: "custom", path: ["selectedOptionIds"], message: "Duplicate selected options" });
  }
});

export const submitAttemptSchema = z.object({
  answers: z.array(submitAnswerSchema).min(1),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
