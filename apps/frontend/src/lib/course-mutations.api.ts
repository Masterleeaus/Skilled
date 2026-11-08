import { api } from "@/lib/api-client";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export async function fetchCategories() {
  const { data } = await api.get("/categories");
  return data.data as Category[];
}

export async function createCourse(input: {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}) {
  const { data } = await api.post("/courses", input);
  return data.data as { id: string; slug: string };
}

export async function createModule(courseId: string, title: string) {
  const { data } = await api.post(`/courses/${courseId}/modules`, { title });
  return data.data;
}

export async function createLesson(moduleId: string, title: string) {
  const { data } = await api.post(`/courses/modules/${moduleId}/lessons`, { title });
  return data.data;
}

export async function setPublishStatus(courseId: string, isPublished: boolean) {
  const { data } = await api.patch(`/courses/${courseId}/publish`, { isPublished });
  return data.data;
}

export async function uploadLessonVideo(lessonId: string, file: File) {
  const formData = new FormData();
  formData.append("video", file);
  const { data } = await api.post(`/courses/lessons/${lessonId}/video`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function createQuiz(input: {
  courseId: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  timeLimitMinutes: number;
}) {
  const { data } = await api.post("/quizzes", input);
  return data.data as { id: string };
}

export async function addQuestion(
  quizId: string,
  input: {
    text: string;
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";
    marks: number;
    options?: { text: string; isCorrect: boolean }[];
  },
) {
  const { data } = await api.post(`/quizzes/${quizId}/questions`, input);
  return data.data;
}

export async function publishQuiz(quizId: string) {
  const { data } = await api.patch(`/quizzes/${quizId}/publish`);
  return data.data;
}

export async function createAssignment(input: {
  courseId: string;
  title: string;
  instructions: string;
  dueDate: string;
  totalMarks: number;
  passingMarks: number;
}) {
  const { data } = await api.post("/assignments", input);
  return data.data as { id: string };
}
