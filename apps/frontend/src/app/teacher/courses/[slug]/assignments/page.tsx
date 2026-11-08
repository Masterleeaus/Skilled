"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { fetchAssignmentsForCourse, updateAssignmentPassingMarks } from "@/lib/assignment.api";
import { Topbar } from "@/components/Topbar";

export default function AssignmentThresholdsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const { data: course } = useQuery({
    queryKey: ["course", slug], queryFn: () => fetchCourseForManagement(slug), enabled: !!user,
  });
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["course-assignments", course?.id],
    queryFn: () => fetchAssignmentsForCourse(course!.id), enabled: !!user && !!course,
  });
  const update = useMutation({
    mutationFn: ({ id, passingMarks }: { id: string; passingMarks: number }) =>
      updateAssignmentPassingMarks(id, passingMarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-assignments", course?.id] }),
    onError: (error: unknown) => alert(apiErrorMessage(error) ?? "Threshold update failed"),
  });
  if (!user) return null;
  return <div>
    <Topbar title="Assignment pass requirements" backHref={`/teacher/courses/${slug}`} backLabel="Back to course" />
    <main className="mx-auto max-w-2xl space-y-4 px-6 py-8">
      <p className="text-sm text-neutral-400">A passing threshold is required for certificates. Existing assignments are not automatically approved.</p>
      {isLoading && <p>Loading assignments…</p>}
      {assignments?.map((assignment) => {
        const raw = values[assignment.id] ?? String(assignment.passingMarks ?? "");
        const number = Number(raw);
        const valid = raw.trim() !== "" && Number.isInteger(number) && number >= 1 && number <= assignment.totalMarks;
        return <div key={assignment.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="font-medium">{assignment.title}</p>
          <p className="text-xs text-neutral-400">Maximum: {assignment.totalMarks} marks · {assignment.passingMarks === null ? "Unconfigured — certification blocked" : `Current pass: ${assignment.passingMarks}`}</p>
          <div className="mt-3 flex items-center gap-2">
            <input aria-label={`Passing marks for ${assignment.title}`} type="number" min={1} max={assignment.totalMarks}
              value={raw} onChange={(e) => setValues((previous) => ({ ...previous, [assignment.id]: e.target.value }))}
              className="w-24 rounded-md border border-neutral-700 bg-neutral-950 p-2" />
            <button className="rounded-md bg-blue-700 px-3 py-2 disabled:opacity-50" disabled={!valid || update.isPending}
              onClick={() => update.mutate({ id: assignment.id, passingMarks: number })}>Save threshold</button>
          </div>
        </div>;
      })}
    </main>
  </div>;
}
