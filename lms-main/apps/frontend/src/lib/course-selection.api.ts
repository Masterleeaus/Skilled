import { api } from "@/lib/api-client";

// Course lesson selection (PASS42). The owner or teacher chooses which lessons from the level list count for the level gates.
export type LessonLevel = "base" | "group" | "specialised";
export const LESSON_LEVELS: LessonLevel[] = ["base", "group", "specialised"];
export const LESSON_LEVEL_LABEL: Record<LessonLevel, string> = { base: "Base", group: "Group", specialised: "Specialised" };

export interface PoolLesson { sourceId: string; level: LessonLevel; title: string | null }
export type LevelCounts = Record<LessonLevel, number>;
export interface CoursePool { courseId: string; lessons: PoolLesson[]; countsByLevel: LevelCounts }
export interface CourseSelection {
  courseId: string;
  usesFullLevel: boolean;
  sourceIds: string[];
  savedAt: string | null;
  countsByLevel: LevelCounts;
}

const base = (courseId: string) => `/academy/course-selection/courses/${encodeURIComponent(courseId)}`;

export async function fetchLessonPool(courseId: string): Promise<CoursePool> {
  const { data } = await api.get(`${base(courseId)}/lesson-pool`);
  return data.data as CoursePool;
}

export async function fetchLessonSelection(courseId: string): Promise<CourseSelection> {
  const { data } = await api.get(`${base(courseId)}/lesson-selection`);
  return data.data as CourseSelection;
}

export async function saveLessonSelection(courseId: string, sourceIds: string[]): Promise<CourseSelection> {
  const { data } = await api.put(`${base(courseId)}/lesson-selection`, { sourceIds });
  return data.data as CourseSelection;
}
