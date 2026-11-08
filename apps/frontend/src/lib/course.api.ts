import { api } from "@/lib/api-client";

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: string;
  isPublished: boolean;
  category: { name: string };
  teacher: { fullName: string };
  _count: { enrollments: number; reviews: number };
}

export async function fetchCourses(params: Record<string, string | undefined> = {}) {
  const { data } = await api.get("/courses", { params });
  return data as { data: CourseListItem[]; pagination: { total: number } };
}
