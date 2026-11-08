import { z } from "zod";

// zod 4 cannot call .partial() on a refined schema, so the object shape is shared
// and each schema applies the passing-marks rule itself.
const assignmentFields = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(3).max(150),
  instructions: z.string().min(10),
  dueDate: z.coerce.date(),
  totalMarks: z.coerce.number().int().min(1),
  passingMarks: z.coerce.number().int().min(1),
});

export const createAssignmentSchema = assignmentFields.refine((value) => value.passingMarks <= value.totalMarks, {
  message: "Passing marks cannot exceed total marks",
  path: ["passingMarks"],
});

export const updateAssignmentSchema = assignmentFields
  .partial()
  .omit({ courseId: true })
  .refine((value) => value.passingMarks === undefined || value.totalMarks === undefined || value.passingMarks <= value.totalMarks, {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"],
  });

export const gradePassingMarksSchema = z.object({ passingMarks: z.coerce.number().int().min(1) });

export const submitAssignmentSchema = z.object({
  text: z.string().optional(),
});

export const gradeSubmissionSchema = z.object({
  marksObtained: z.coerce.number().int().min(0),
  feedback: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
