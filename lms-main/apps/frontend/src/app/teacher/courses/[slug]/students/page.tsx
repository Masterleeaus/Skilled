"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { fetchCourseRoster } from "@/lib/class.api";
import { Topbar } from "@/components/Topbar";

export default function RosterPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const { data: roster, isLoading } = useQuery({
    queryKey: ["roster", course?.id],
    queryFn: () => fetchCourseRoster(course!.id),
    enabled: !!course,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title={course ? `Students — ${course.title}` : "Students"} backHref={`/teacher/courses/${slug}`} backLabel="Back to course" />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading...</p>}
        {roster?.length === 0 && <p className="text-neutral-400">No students enrolled yet.</p>}

        <div className="space-y-3">
          {roster?.map((r) => (
            <Link
              key={r.student.id}
              href={`/teacher/courses/${slug}/students/${r.student.id}`}
              className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.student.fullName}</p>
                  <p className="text-xs text-neutral-500">{r.student.email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "COMPLETED"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-neutral-700/50 text-neutral-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full rounded-full bg-white" style={{ width: `${r.progressPercentage}%` }} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-neutral-400">
                <span>Progress: {r.progressPercentage}%</span>
                <span>
                  Quizzes: {r.quizzesAttempted}/{r.totalQuizzes}
                  {r.avgQuizScore !== null && ` (avg ${Math.round(r.avgQuizScore)})`}
                </span>
                <span>
                  Assignments: {r.assignmentsSubmitted}/{r.totalAssignments}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
