"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseBySlug } from "@/lib/course-detail.api";
import { fetchLiveClassesForCourse, fetchMyAttendance } from "@/lib/class.api";
import { Topbar } from "@/components/Topbar";

export default function StudentLiveClassesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["STUDENT"]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseBySlug(slug),
    enabled: !!user,
  });

  const { data: classes } = useQuery({
    queryKey: ["live-classes", course?.id],
    queryFn: () => fetchLiveClassesForCourse(course!.id),
    enabled: !!course,
  });

  const { data: attendance } = useQuery({
    queryKey: ["my-attendance", course?.id],
    queryFn: () => fetchMyAttendance(course!.id),
    enabled: !!course,
  });

  const attendanceByTitle = new Map(attendance?.map((a) => [a.liveClass.title, a.status]));

  if (!user) return null;

  return (
    <div>
      <Topbar title={course ? `Live Classes — ${course.title}` : "Live Classes"} backHref={`/student/courses/${slug}`} backLabel="Back to course" />
      <main className="mx-auto max-w-2xl space-y-3 px-6 py-8">
        {classes?.length === 0 && <p className="text-neutral-400">No live classes scheduled yet.</p>}

        {classes?.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(c.scheduledAt).toLocaleString()} · {c.durationMinutes} min
                </p>
              </div>
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs">{c.status}</span>
            </div>

            {c.meetingLink && c.status === "LIVE" && (
              <a
                href={c.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-white underline underline-offset-2"
              >
                Join now
              </a>
            )}

            {attendanceByTitle.has(c.title) && (
              <p className="mt-2 text-xs text-neutral-400">
                Your attendance: {attendanceByTitle.get(c.title)}
              </p>
            )}

            {c.recordingUrl && (
              <a
                href={c.recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-xs text-neutral-400 underline"
              >
                Watch recording
              </a>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
