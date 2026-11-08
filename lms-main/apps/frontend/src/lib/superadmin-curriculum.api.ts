import { api } from "@/lib/api-client";

// Superadmin (ADMIN role) lesson source editing. These calls read and write the lesson files on the server.
export type SuperadminLessonStatus = "DRAFT" | "READY";

export interface SuperadminLessonRow {
  id: string;
  title: string;
  status: string;
  moduleTitle: string | null;
  lessonType: string | null;
  file: string;
}

export interface SuperadminLesson {
  id: string;
  file: string;
  /** SHA-256 of the file as loaded. Save sends it back so a changed file is refused, not overwritten. */
  sourceHash: string;
  status: string;
  record: Record<string, unknown>;
}

export interface SaveSuperadminLessonInput {
  expectedHash: string;
  changes?: Record<string, unknown>;
  status?: SuperadminLessonStatus;
}

export interface SaveSuperadminLessonResult {
  sourceHash: string;
  status: string;
  changedKeys: string[];
}

export async function fetchSuperadminCourseLessons(courseSlug: string): Promise<SuperadminLessonRow[]> {
  const { data } = await api.get(`/academy/curriculum/superadmin/courses/${encodeURIComponent(courseSlug)}/lessons`);
  return data.data;
}

export async function fetchSuperadminLesson(lessonId: string): Promise<SuperadminLesson> {
  const { data } = await api.get(`/academy/curriculum/superadmin/lessons/${encodeURIComponent(lessonId)}`);
  return data.data;
}

export async function saveSuperadminLesson(lessonId: string, input: SaveSuperadminLessonInput): Promise<SaveSuperadminLessonResult> {
  const { data } = await api.patch(`/academy/curriculum/superadmin/lessons/${encodeURIComponent(lessonId)}`, input);
  return data.data;
}
