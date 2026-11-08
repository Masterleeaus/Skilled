"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchQuizToTake, startQuizAttempt, submitQuizAttempt } from "@/lib/quiz.api";
import { Topbar } from "@/components/Topbar";

export default function TakeQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const { user } = useRequireAuth(["STUDENT"]);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({}); // questionId -> text, optionId or option IDs
  const [result, setResult] = useState<{ marksObtained: number | null; status: string } | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz-take", quizId],
    queryFn: () => fetchQuizToTake(quizId),
    enabled: !!user,
  });

  const startMutation = useMutation({
    mutationFn: () => startQuizAttempt(quizId),
    onSuccess: (attempt) => setAttemptId(attempt.id),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitQuizAttempt(
        attemptId!,
        quiz!.questions.map((q) => ({
          questionId: q.id,
          ...(q.type === "TEXT"
            ? { textAnswer: typeof answers[q.id] === "string" ? answers[q.id] as string : "" }
            : q.type === "MULTIPLE_CHOICE"
              ? { selectedOptionIds: Array.isArray(answers[q.id]) ? answers[q.id] as string[] : [] }
              : { selectedOptionId: typeof answers[q.id] === "string" ? answers[q.id] as string : "" }),
        })),
      ),
    onSuccess: (data) => setResult({ marksObtained: data.marksObtained, status: data.status }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Submission failed"),
  });

  if (!user) return null;
  if (isLoading) return <p className="p-8 text-neutral-400">Loading quiz...</p>;
  if (!quiz) return <p className="p-8 text-neutral-400">Quiz not found.</p>;

  if (result) {
    return (
      <div>
        <Topbar title={quiz.title} backHref="back" backLabel="Back to course" />
        <main className="mx-auto max-w-xl px-6 py-12 text-center">
          <h2 className="text-xl font-semibold">Quiz submitted</h2>
          {result.status === "GRADED" ? (
            <p className="mt-2 text-neutral-300">
              Score: {result.marksObtained} / {quiz.totalMarks}{" "}
              {result.marksObtained! >= quiz.passingMarks ? "— Passed ✓" : "— Not passed"}
            </p>
          ) : (
            <p className="mt-2 text-neutral-400">
              Some answers need manual grading. Your teacher will review them soon.
            </p>
          )}
          <button
            onClick={() => router.back()}
            className="mt-6 rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
          >
            Back to course
          </button>
        </main>
      </div>
    );
  }

  if (!attemptId) {
    return (
      <div>
        <Topbar title={quiz.title} backHref="back" backLabel="Back to course" />
        <main className="mx-auto max-w-xl px-6 py-12 text-center">
          <p className="text-neutral-300">
            {quiz.questions.length} questions · {quiz.totalMarks} marks · {quiz.timeLimitMinutes} min
          </p>
          <button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="mt-6 rounded-lg bg-white px-6 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            {startMutation.isPending ? "Starting..." : "Start quiz"}
          </button>
        </main>
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => {
    const value = answers[q.id];
    return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim().length > 0;
  });

  return (
    <div>
      <Topbar title={quiz.title} backHref="back" backLabel="Back to course" />
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="font-medium">
              {i + 1}. {q.text} <span className="text-xs text-neutral-500">({q.marks} marks)</span>
            </p>

            {q.type === "TEXT" ? (
              <textarea
                rows={3}
                value={typeof answers[q.id] === "string" ? answers[q.id] as string : ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            ) : (
              <div className="mt-3 space-y-2">
                {q.type === "MULTIPLE_CHOICE" && (
                  <p className="text-xs text-neutral-400">Select all correct answers</p>
                )}
                {q.options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                      name={q.id}
                      checked={q.type === "MULTIPLE_CHOICE"
                        ? Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt.id)
                        : answers[q.id] === opt.id}
                      onChange={() => setAnswers((prev) => {
                        if (q.type !== "MULTIPLE_CHOICE") return { ...prev, [q.id]: opt.id };
                        const selected = Array.isArray(prev[q.id]) ? prev[q.id] as string[] : [];
                        return { ...prev, [q.id]: selected.includes(opt.id)
                          ? selected.filter((id) => id !== opt.id) : [...selected, opt.id] };
                      })}
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={() => submitMutation.mutate()}
          disabled={!allAnswered || submitMutation.isPending}
          className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit quiz"}
        </button>
      </main>
    </div>
  );
}
