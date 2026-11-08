"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchUserDetail } from "@/lib/admin.api";
import { Topbar } from "@/components/Topbar";

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useRequireAuth(["ADMIN"]);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="User Profile" backHref="/admin/users" backLabel="All Users" />
      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading...</p>}

        {detail && (
          <>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-lg font-medium">{detail.fullName}</p>
              <p className="text-sm text-neutral-400">{detail.email}</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="rounded-full bg-neutral-800 px-2 py-0.5">{detail.role}</span>
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    detail.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {detail.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Joined {new Date(detail.createdAt).toLocaleDateString()}
              </p>
            </div>

            {detail.role === "TEACHER" && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-neutral-300">
                  Courses ({detail.courses?.length ?? 0})
                </h3>
                <div className="space-y-2">
                  {detail.courses?.map((c) => (
                    <Link
                      key={c.id}
                      href={`/teacher/courses/${c.slug}/students`}
                      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-600"
                    >
                      <span>{c.title}</span>
                      <span className="text-xs text-neutral-500">
                        {c._count.enrollments} students · {c.isPublished ? "Published" : "Draft"}
                      </span>
                    </Link>
                  ))}
                  {detail.courses?.length === 0 && (
                    <p className="text-sm text-neutral-500">No courses created yet.</p>
                  )}
                </div>
              </div>
            )}

            {detail.role === "STUDENT" && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-neutral-300">
                  Enrollments ({detail.enrollments?.length ?? 0})
                </h3>
                <div className="space-y-2">
                  {detail.enrollments?.map((e) => (
                    <div key={e.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                      <div className="flex items-center justify-between">
                        <span>{e.course.title}</span>
                        <span className="text-xs text-neutral-500">{e.status}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${e.progressPercentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{e.progressPercentage}% complete</p>
                    </div>
                  ))}
                  {detail.enrollments?.length === 0 && (
                    <p className="text-sm text-neutral-500">Not enrolled in any courses yet.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
