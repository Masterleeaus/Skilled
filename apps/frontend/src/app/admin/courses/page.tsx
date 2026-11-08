"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourses } from "@/lib/course.api";
import { Topbar } from "@/components/Topbar";
import { AdminNav } from "@/components/AdminNav";

export default function AdminCoursesPage() {
  const { user } = useRequireAuth(["ADMIN"]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => fetchCourses({ limit: "100" }),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="All Courses" />
      <AdminNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading...</p>}
        {isError && <p role="alert" className="text-amber-300">The course list could not be loaded.</p>}

        <div className="space-y-3">
          {data?.data.map((course) => (
            <div key={course.id} className="flex items-stretch gap-3">
            <Link
              href={`/teacher/courses/${course.slug}`}
              className="flex flex-1 items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600"
            >
              <div>
                <h3 className="font-medium">{course.title}</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  by {course.teacher.fullName} · {course.category.name}
                </p>
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
            <Link
              href={`/admin/curriculum/${course.slug}`}
              aria-label={`Edit lessons for ${course.title}`}
              className="flex items-center rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 text-sm text-amber-200 hover:border-amber-600"
            >
              Edit lessons
            </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
