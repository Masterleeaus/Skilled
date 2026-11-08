"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourses } from "@/lib/course.api";
import { Topbar } from "@/components/Topbar";

export default function TeacherDashboard() {
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-courses", user?.id],
    queryFn: () => fetchCourses({ teacherId: user!.id, limit: "50" }),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="My Courses" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-neutral-400">{data?.pagination.total ?? 0} course(s)</p>
          <Link
            href="/teacher/courses/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            + New course
          </Link>
        </div>

        {isLoading && <p className="text-neutral-400">Loading...</p>}

        <div className="space-y-3">
          {data?.data.map((course) => (
            <Link
              key={course.id}
              href={`/teacher/courses/${course.slug}`}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
            >
              <div>
                <h3 className="font-medium">{course.title}</h3>
                <p className="mt-1 text-sm text-neutral-400">{course.category.name}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                <span>{course._count.enrollments} students</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    course.isPublished
                      ? "bg-green-500/10 text-green-400"
                      : "bg-neutral-700/50 text-neutral-400"
                  }`}
                >
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
