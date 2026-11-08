"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { createAssignment } from "@/lib/course-mutations.api";
import { Topbar } from "@/components/Topbar";

export default function NewAssignmentPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState(20);
  const [passingMarks, setPassingMarks] = useState(10);

  const mutation = useMutation({
    mutationFn: () =>
      createAssignment({ courseId: course!.id, title, instructions, dueDate, totalMarks, passingMarks }),
    onSuccess: () => router.push(`/teacher/courses/${slug}`),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to create assignment"),
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="New Assignment" backHref="back" backLabel="Back to course" />
      <main className="mx-auto max-w-xl space-y-4 px-6 py-8">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assignment title"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="Instructions"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="assignment-due-date" className="mb-1 block text-xs text-neutral-400">Due date</label>
            <input
              id="assignment-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="assignment-total-marks" className="mb-1 block text-xs text-neutral-400">Total marks</label>
            <input
              id="assignment-total-marks"
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="assignment-passing-marks" className="mb-1 block text-xs text-neutral-400">Minimum passing marks</label>
          <input id="assignment-passing-marks" type="number" min={1} max={totalMarks} value={passingMarks}
            onChange={(e) => setPassingMarks(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500" />
          <p className="mt-1 text-xs text-neutral-500">Required for certificate eligibility.</p>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!title || !instructions || !dueDate || !course || totalMarks < 1 || passingMarks < 1 || passingMarks > totalMarks || mutation.isPending}
          className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create assignment"}
        </button>
      </main>
    </div>
  );
}
