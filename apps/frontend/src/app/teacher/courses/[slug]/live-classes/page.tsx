"use client";

import { apiErrorMessage } from "@/lib/api-error";
import type { AttendanceRecord } from "@/lib/class.api";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import {
  fetchLiveClassesForCourse,
  createLiveClass,
  updateLiveClassStatus,
  markAttendance,
  fetchEnrolledStudents,
  type LiveClass,
} from "@/lib/class.api";
import { Topbar } from "@/components/Topbar";

function AttendancePanel({ liveClass, courseId }: { liveClass: LiveClass; courseId: string }) {
  const { data: students } = useQuery({
    queryKey: ["enrolled-students", courseId],
    queryFn: () => fetchEnrolledStudents(courseId),
  });
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      markAttendance(
        liveClass.id,
        Object.entries(statuses).map(([studentId, status]) => ({
          studentId,
          status: status as AttendanceRecord["status"],
        })),
      ),
    onSuccess: () => alert("Attendance saved"),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to save attendance"),
  });

  return (
    <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
      {students?.map((s) => (
        <div key={s.id} className="flex items-center justify-between text-sm">
          <span>{s.fullName}</span>
          <select
            value={statuses[s.id] ?? "PRESENT"}
            onChange={(e) => setStatuses((prev) => ({ ...prev, [s.id]: e.target.value }))}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </div>
      ))}
      <button
        onClick={() => mutation.mutate()}
        disabled={!students?.length || mutation.isPending}
        className="mt-2 w-full rounded-lg bg-white py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
      >
        Save attendance
      </button>
    </div>
  );
}

export default function TeacherLiveClassesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const { data: classes } = useQuery({
    queryKey: ["live-classes", course?.id],
    queryFn: () => fetchLiveClassesForCourse(course!.id),
    enabled: !!course,
  });

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [meetingLink, setMeetingLink] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["live-classes", course?.id] });

  const createMutation = useMutation({
    mutationFn: () =>
      createLiveClass({
        courseId: course!.id,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: duration,
        meetingLink: meetingLink || undefined,
      }),
    onSuccess: () => {
      setTitle("");
      setScheduledAt("");
      setMeetingLink("");
      invalidate();
    },
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to schedule class"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LiveClass["status"] }) =>
      updateLiveClassStatus(id, status),
    onSuccess: invalidate,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title={course ? `Live Classes — ${course.title}` : "Live Classes"} backHref={`/teacher/courses/${slug}`} backLabel="Back to course" />
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-medium">Schedule a new class</h2>
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                aria-label="Start date and time"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="Minutes"
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="Meeting link (optional)"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!title || !scheduledAt || !course || createMutation.isPending}
              className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              Schedule
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {classes?.map((c) => (
            <div key={c.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(c.scheduledAt).toLocaleString()} · {c.durationMinutes} min
                  </p>
                </div>
                <select
                  value={c.status}
                  onChange={(e) =>
                    statusMutation.mutate({ id: c.id, status: e.target.value as LiveClass["status"] })
                  }
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="ENDED">Ended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="mt-2 text-xs text-neutral-400 underline"
              >
                {expandedId === c.id ? "Hide attendance" : "Mark attendance"}
              </button>

              {expandedId === c.id && course && (
                <AttendancePanel liveClass={c} courseId={course.id} />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
