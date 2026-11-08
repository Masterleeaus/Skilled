"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchSubmissions, gradeSubmission, type Submission } from "@/lib/assignment.api";
import { Topbar } from "@/components/Topbar";

function GradeRow({ submission, assignmentId }: { submission: Submission; assignmentId: string }) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState(submission.marksObtained?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");

  const mutation = useMutation({
    mutationFn: () => gradeSubmission(submission.id, Number(marks), feedback),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["submissions", assignmentId] }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Grading failed"),
  });

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{submission.student?.fullName}</p>
        <span className="text-xs text-neutral-500">{submission.status}</span>
      </div>

      {submission.text && <p className="mt-2 text-sm text-neutral-300">{submission.text}</p>}

      {submission.attachments.length > 0 && (
        <ul className="mt-2 text-xs text-neutral-500">
          {submission.attachments.map((a) => (
            <li key={a.key}>📎 {a.name}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="number"
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          placeholder="Marks"
          className="w-24 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback"
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!marks || mutation.isPending}
          className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function AssignmentSubmissionsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: () => fetchSubmissions(assignmentId),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="Submissions" backHref="back" backLabel="Back" />
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading...</p>}
        {submissions?.length === 0 && <p className="text-neutral-400">No submissions yet.</p>}
        {submissions?.map((s) => (
          <GradeRow key={s.id} submission={s} assignmentId={assignmentId} />
        ))}
      </main>
    </div>
  );
}
