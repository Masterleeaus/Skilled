"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { createQuiz, addQuestion, publishQuiz } from "@/lib/course-mutations.api";
import { Topbar } from "@/components/Topbar";

interface OptionDraft {
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";
  marks: number;
  options: OptionDraft[];
}

export default function NewQuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const [quizId, setQuizId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState(10);
  const [passingMarks, setPassingMarks] = useState(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const createQuizMutation = useMutation({
    mutationFn: () =>
      createQuiz({ courseId: course!.id, title, totalMarks, passingMarks, timeLimitMinutes }),
    onSuccess: (quiz) => setQuizId(quiz.id),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to create quiz"),
  });

  const addQuestionMutation = useMutation({
    mutationFn: (q: QuestionDraft) =>
      addQuestion(quizId!, {
        text: q.text,
        type: q.type,
        marks: q.marks,
        options: q.type !== "TEXT" ? q.options : undefined,
      }),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to add question"),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishQuiz(quizId!),
    onSuccess: () => router.push(`/teacher/courses`),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to publish"),
  });

  function addBlankQuestion() {
    setQuestions((prev) => [
      ...prev,
      { text: "", type: "SINGLE_CHOICE", marks: 1, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] },
    ]);
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, patch: Partial<OptionDraft>) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex
          ? q
          : {
              ...q,
              options: q.options.map((o, j) => (j === oIndex ? { ...o, ...patch } : o)),
            },
      ),
    );
  }

  async function saveAllQuestions() {
    for (const q of questions) {
      await addQuestionMutation.mutateAsync(q);
    }
    alert("Questions saved. You can now publish the quiz.");
  }

  if (!user) return null;

  return (
    <div>
      <Topbar title="New Quiz" backHref="back" backLabel="Back to course" />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {!quizId ? (
          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz title"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="quiz-total-marks" className="mb-1 block text-xs text-neutral-400">Total marks</label>
                <input
                  id="quiz-total-marks"
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label htmlFor="quiz-passing-marks" className="mb-1 block text-xs text-neutral-400">Passing marks</label>
                <input
                  id="quiz-passing-marks"
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label htmlFor="quiz-time-limit" className="mb-1 block text-xs text-neutral-400">Time limit (min)</label>
                <input
                  id="quiz-time-limit"
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>
            </div>
            <button
              onClick={() => createQuizMutation.mutate()}
              disabled={!title || !course || createQuizMutation.isPending}
              className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              {createQuizMutation.isPending ? "Creating..." : "Create quiz & add questions"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <input
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                  placeholder="Question text"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />

                <div className="mt-2 flex gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as QuestionDraft["type"];
                      updateQuestion(qi, {
                        type,
                        options: type === "MULTIPLE_CHOICE"
                          ? q.options.length >= 3
                            ? q.options.map((opt, i) => ({ ...opt, isCorrect: i < 2 }))
                            : [{ text: "", isCorrect: true }, { text: "", isCorrect: true }, { text: "", isCorrect: false }]
                          : type === "SINGLE_CHOICE"
                            ? q.options.length >= 2
                              ? q.options.map((opt, i) => ({ ...opt, isCorrect: i === 0 }))
                              : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]
                            : [],
                      });
                    }}
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm"
                  >
                    <option value="SINGLE_CHOICE">Single choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple choice (select all)</option>
                    <option value="TEXT">Text (manual grading)</option>
                  </select>
                  <input
                    type="number"
                    value={q.marks}
                    onChange={(e) => updateQuestion(qi, { marks: Number(e.target.value) })}
                    placeholder="Marks"
                    className="w-20 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm"
                  />
                </div>

                {q.type !== "TEXT" && (
                  <div className="mt-2 space-y-2">
                    {q.type === "MULTIPLE_CHOICE" && (
                      <p className="text-xs text-neutral-400">Mark at least two correct options.</p>
                    )}
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                          name={`correct-${qi}`}
                          aria-label={`Option ${oi + 1} is correct`}
                          checked={o.isCorrect}
                          onChange={() =>
                            updateQuestion(qi, {
                              options: q.type === "MULTIPLE_CHOICE"
                                ? q.options.map((opt, j) => j === oi ? { ...opt, isCorrect: !opt.isCorrect } : opt)
                                : q.options.map((opt, j) => ({ ...opt, isCorrect: j === oi })),
                            })
                          }
                        />
                        <input
                          value={o.text}
                          onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        updateQuestion(qi, { options: [...q.options, { text: "", isCorrect: false }] })
                      }
                      className="text-xs text-neutral-400 underline"
                    >
                      + Add option
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addBlankQuestion}
              className="w-full rounded-lg border border-neutral-700 py-2 text-sm hover:bg-neutral-800"
            >
              + Add question
            </button>

            <div className="flex gap-2">
              <button
                onClick={saveAllQuestions}
                disabled={questions.length === 0}
                className="flex-1 rounded-lg border border-neutral-700 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
              >
                Save questions
              </button>
              <button
                onClick={() => publishMutation.mutate()}
                className="flex-1 rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
              >
                Publish quiz
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
