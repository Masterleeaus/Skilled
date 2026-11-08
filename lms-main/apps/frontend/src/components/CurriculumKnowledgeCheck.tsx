"use client";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitKnowledgeCheck } from "@/lib/curriculum.api";
type Question = { question: string; options: string[] };
export function CurriculumKnowledgeCheck({ body, lessonId, revisionId }: { body: Record<string, unknown>; lessonId: string; revisionId: string }) {
  const raw = Array.isArray(body.knowledgeChecks) ? body.knowledgeChecks : body.knowledgeCheck;
  const questions: Question[] = Array.isArray(raw) ? raw.filter((q): q is Question => !!q && typeof q === "object" && typeof q.question === "string" && Array.isArray(q.options) && q.options.every((v: unknown) => typeof v === "string")) : [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const attempt = useMutation({ mutationFn: () => submitKnowledgeCheck(lessonId, revisionId, questions.map((_, i) => answers[i])) });
  // reset is bound once per mutation observer, so listing it in deps does not re-run the effect.
  const resetAttempt = attempt.reset;
  useEffect(() => { setAnswers({}); resetAttempt(); }, [revisionId, lessonId, resetAttempt]);
  if (!questions.length) return null;
  // ACA-023 item 8: Submit explains why it is unavailable. The helper text is linked with aria-describedby.
  const unanswered = questions.some((_, i) => answers[i] === undefined);
  const submitBlocked = attempt.isPending || unanswered;
  const helpId = `knowledge-help-${revisionId}`;
  return <section aria-label="Knowledge check" className="mt-6 space-y-4 border-t border-slate-600 pt-4"><h4 className="font-semibold">Knowledge check</h4><p className="text-sm text-slate-300">Answer every question. A score of 80% is required to pass this knowledge check; practical competency is assessed separately.</p>
    {questions.map((q, i) => <fieldset key={i} className="rounded bg-slate-900 p-3"><legend className="font-medium">{i + 1}. {q.question}</legend>{q.options.map((option, j) => <label key={j} className="mt-2 flex items-start gap-2 text-sm"><input type="radio" name={`knowledge-${revisionId}-${i}`} checked={answers[i] === j} onChange={() => { setAnswers(a => ({ ...a, [i]: j })); attempt.reset(); }} /><span>{option}</span></label>)}</fieldset>)}
    {/* ACA-023 item 1: aria-disabled instead of disabled, so focus stays on the button while grading. */}
    <button type="button" className="rounded bg-blue-700 px-4 py-2 aria-disabled:opacity-50" aria-disabled={submitBlocked} aria-describedby={unanswered ? helpId : undefined} onClick={() => { if (!submitBlocked) attempt.mutate(); }}> {attempt.isPending ? "Grading…" : "Submit answers"}</button>
    {unanswered && <p id={helpId} className="text-sm text-slate-300">Answer every question to enable Submit answers.</p>}
    {attempt.data && <p role="status">Score: {attempt.data.score}/{attempt.data.total}. {attempt.data.passed ? "Passed" : "Not yet passed — review the lesson and retry."}</p>}
    {attempt.isError && <p role="alert" className="text-red-300">Submission failed. Please try again.</p>}
  </section>;
}
