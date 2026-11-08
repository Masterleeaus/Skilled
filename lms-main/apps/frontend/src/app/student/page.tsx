"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchMyEnrollments } from "@/lib/enrollment.api";
import { Topbar } from "@/components/Topbar";
import { BrandImage } from "@/components/BrandImage";
import { getBrand } from "@/lib/academy-brand";

export default function StudentDashboard() {
  const { user } = useRequireAuth(["STUDENT"]);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="My Courses" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex justify-end">
          <Link
            href="/courses"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            + Browse courses
          </Link>
        </div>

        {isLoading && <p className="text-neutral-400">Loading your courses...</p>}

        {enrollments && enrollments.length === 0 && (
          <div className="rounded-lg border border-neutral-800 p-8 text-center text-neutral-400">
            You haven&apos;t enrolled in any courses yet.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments?.map((e) => {
            const brand = getBrand(e.course.slug);
            return (
            <Link
              key={e.id}
              href={`/student/courses/${e.course.slug}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
            >
              {brand && (
                <BrandImage
                  sources={[brand.thumb, brand.icon]}
                  alt={e.course.title}
                  width={400}
                  height={225}
                  className="mb-3 h-36 w-full rounded-lg object-cover"
                />
              )}
              <h3 className="font-medium">{e.course.title}</h3>
              <p className="mt-1 text-sm text-neutral-400">by {e.course.teacher.fullName}</p>

              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${e.progressPercentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {e.progressPercentage}% complete
                  {e.status === "COMPLETED" && " — 🎉 Finished"}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
