"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchMySubmission, submitAssignment } from "@/lib/assignment.api";
import { Topbar } from "@/components/Topbar";

export default function SubmitAssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useRequireAuth(["STUDENT"]);
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const { data: submission, isLoading } = useQuery({
    queryKey: ["my-submission", assignmentId],
    queryFn: () => fetchMySubmission(assignmentId),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: () => submitAssignment(assignmentId, text, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-submission", assignmentId] }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Submission failed"),
  });

  if (!user) return null;
  if (isLoading) return <p className="p-8 text-neutral-400">Loading...</p>;

  return (
    <div>
      <Topbar title="Assignment" backHref="back" backLabel="Back to course" />
      <main className="mx-auto max-w-xl px-6 py-8">
        {submission && (
          <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">
              Last submitted {new Date(submission.submittedAt).toLocaleString()} — status:{" "}
              <span className="text-neutral-200">{submission.status}</span>
            </p>
            {submission.status === "GRADED" && (
              <p className="mt-2 text-sm">
                Marks: <span className="font-medium">{submission.marksObtained}</span>
                {submission.feedback && <span className="block text-neutral-400">{submission.feedback}</span>}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Write your submission..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />

          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm text-neutral-400"
          />

          <button
            onClick={() => mutation.mutate()}
            disabled={(!text && files.length === 0) || mutation.isPending}
            className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            {mutation.isPending ? "Submitting..." : submission ? "Resubmit" : "Submit assignment"}
          </button>
        </div>
      </main>
    </div>
  );
}
