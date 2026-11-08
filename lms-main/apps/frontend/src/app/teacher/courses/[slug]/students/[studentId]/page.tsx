"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { fetchStudentDetailForCourse } from "@/lib/class.api";
import { Topbar } from "@/components/Topbar";

export default function StudentDetailPage() {
  const { slug, studentId } = useParams<{ slug: string; studentId: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const { data: detail, isLoading } = useQuery({
    queryKey: ["student-detail", course?.id, studentId],
    queryFn: () => fetchStudentDetailForCourse(course!.id, studentId),
    enabled: !!course,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar
        title={detail ? detail.student.fullName : "Student"}
        backHref={`/teacher/courses/${slug}/students`}
        backLabel="All students"
      />
      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading...</p>}

        {detail && (
          <>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="font-medium">{detail.student.fullName}</p>
              <p className="text-sm text-neutral-400">{detail.student.email}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${detail.enrollment.progressPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {detail.enrollment.progressPercentage}% complete · {detail.enrollment.status}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-neutral-300">Quiz Attempts</h3>
              <div className="space-y-2">
                {detail.quizAttempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm"
                  >
                    <span>{a.quiz.title}</span>
                    <span className="text-neutral-400">
                      {a.marksObtained !== null ? `${a.marksObtained}/${a.quiz.totalMarks}` : a.status}
                    </span>
                  </div>
                ))}
                {detail.quizAttempts.length === 0 && (
                  <p className="text-sm text-neutral-500">No quiz attempts yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-neutral-300">Assignment Submissions</h3>
              <div className="space-y-2">
                {detail.submissions.map((s) => (
                  <div key={s.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{s.assignment.title}</span>
                      <span className="text-neutral-400">
                        {s.marksObtained !== null ? `${s.marksObtained}/${s.assignment.totalMarks}` : s.status}
                      </span>
                    </div>
                    {s.feedback && <p className="mt-1 text-xs text-neutral-500">{s.feedback}</p>}
                  </div>
                ))}
                {detail.submissions.length === 0 && (
                  <p className="text-sm text-neutral-500">No submissions yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
