import { api } from "@/lib/api-client";
import { DEFAULT_LICENCE_TRACK, type LicenceNotice, type LicenceTrack } from "@/lib/curriculum.api";

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  duration: number | null;
  isFreePreview: boolean;
  orderIndex: number;
  /** Set by the server for the chosen licence track. Null when the lesson has no licence position. */
  licence?: LicenceNotice | null;
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  isPublished: boolean;
  teacher: { id: string; fullName: string };
  modules: ModuleWithLessons[];
  _count: { enrollments: number; reviews: number };
}

/** The course with its legacy modules, filtered to the licence track. Non-licensed when no track is given. */
export async function fetchCourseBySlug(slug: string, track: LicenceTrack = DEFAULT_LICENCE_TRACK) {
  const { data } = await api.get(`/courses/${slug}`, { params: { track } });
  return data.data as CourseDetail;
}

// Draft previews are restricted to the owning instructor or Academy administrator.
export async function fetchCourseForManagement(slug: string) {
  const { data } = await api.get(`/courses/${slug}/manage`);
  return data.data as CourseDetail;
}

export interface LessonProgressRow {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
}

export async function fetchCourseProgress(courseId: string) {
  const { data } = await api.get(`/enrollments/${courseId}/progress`);
  return data.data as { enrollment: { progressPercentage: number }; lessonProgress: LessonProgressRow[] };
}

export async function markLessonProgress(lessonId: string, watchedSeconds: number, completed: boolean) {
  const { data } = await api.patch(`/enrollments/lessons/${lessonId}/progress`, {
    watchedSeconds,
    completed,
  });
  return data.data;
}

/** Resolves a private, same-origin API path. When the frontend runs on a separate development port, resolve against its configured API. */
function resolveApiPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "/api";
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return new URL(path, base).toString();
  }
  return path;
}

/** The lesson video stream and, when the lesson has one, its WebVTT caption track. Both use the same grant cookie. */
export async function fetchLessonMedia(lessonId: string) {
  const { data } = await api.get(`/courses/lessons/${lessonId}/video-url`);
  const captionsPath = data.data.captionsUrl as string | null;
  return {
    url: resolveApiPath(data.data.url as string),
    captionsUrl: captionsPath ? resolveApiPath(captionsPath) : null,
  };
}

export async function fetchLessonVideoUrl(lessonId: string) {
  return (await fetchLessonMedia(lessonId)).url;
}
