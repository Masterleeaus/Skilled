import { api } from "@/lib/api-client";

export interface QuizSummary {
  id: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  timeLimitMinutes: number;
  isPublished: boolean;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";
  marks: number;
  options: QuizOption[];
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  marksObtained: number | null;
  startedAt: string;
  submittedAt: string | null;
}

export async function fetchQuizzesForCourse(courseId: string) {
  const { data } = await api.get(`/quizzes/course/${courseId}`);
  return data.data as QuizSummary[];
}

export async function fetchQuizToTake(quizId: string) {
  const { data } = await api.get(`/quizzes/${quizId}/take`);
  return data.data as QuizDetail;
}

export async function startQuizAttempt(quizId: string) {
  const { data } = await api.post(`/quizzes/${quizId}/attempts`);
  return data.data as QuizAttempt;
}

export async function submitQuizAttempt(
  attemptId: string,
  answers: { questionId: string; selectedOptionId?: string; selectedOptionIds?: string[]; textAnswer?: string }[],
) {
  const { data } = await api.post(`/quizzes/attempts/${attemptId}/submit`, { answers });
  return data.data;
}

export async function fetchMyAttempts(quizId: string) {
  const { data } = await api.get(`/quizzes/${quizId}/attempts`);
  return data.data as QuizAttempt[];
}

// Teacher/admin endpoints are ownership-scoped on the backend.
export interface QuizGradingAnswer {
  id: string;
  textAnswer: string | null;
  selectedOptionId: string | null;
  selectedOptionIds: string[] | null;
  marksObtained: number | null;
  question: {
    id: string;
    text: string;
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";
    marks: number;
    options: { id: string; text: string; isCorrect: boolean }[];
  };
}
export interface QuizGradingSubmission {
  id: string;
  status: "SUBMITTED" | "GRADED";
  marksObtained: number | null;
  submittedAt: string | null;
  student: { id: string; fullName: string };
  answers: QuizGradingAnswer[];
}
export async function fetchQuizSubmissions(quizId: string): Promise<QuizGradingSubmission[]> {
  const { data } = await api.get(`/quizzes/${quizId}/submissions`);
  return data.data;
}
export async function gradeQuizAnswer(answerId: string, marksObtained: number) {
  const { data } = await api.patch(`/quizzes/answers/${answerId}/grade`, { marksObtained });
  return data.data;
}
