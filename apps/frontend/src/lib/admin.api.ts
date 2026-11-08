import { api } from "@/lib/api-client";

export interface DashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeStudents: number;
  activeTeachers: number;
  publishedCourses: number;
  courseCompletionRate: number;
  averageQuizScore: number;
}

export async function fetchDashboardMetrics() {
  const { data } = await api.get("/admin/dashboard");
  return data.data as DashboardMetrics;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export async function fetchUsers(params: Record<string, string | undefined> = {}) {
  const { data } = await api.get("/admin/users", { params });
  return data as { data: AdminUser[]; pagination: { total: number } };
}

export interface UserDetail extends AdminUser {
  courses?: {
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    _count: { enrollments: number };
  }[];
  enrollments?: {
    id: string;
    progressPercentage: number;
    status: string;
    enrolledAt: string;
    course: { id: string; title: string; slug: string };
  }[];
}

export async function fetchUserDetail(userId: string) {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data.data as UserDetail;
}

export async function updateUserRole(userId: string, role: "ADMIN" | "TEACHER" | "STUDENT") {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
  return data.data as AdminUser;
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const { data } = await api.patch(`/admin/users/${userId}/active`, { isActive });
  return data.data as AdminUser;
}

export async function deleteUser(userId: string) {
  await api.delete(`/admin/users/${userId}`);
}
