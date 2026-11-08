"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Topbar } from "@/components/Topbar";
import { fetchQuizSubmissions, gradeQuizAnswer } from "@/lib/quiz.api";

export default function GradeQuizPage() {
  const { slug, quizId } = useParams<{slug:string; quizId:string}>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const client = useQueryClient();
  const [scores, setScores] = useState<Record<string,string>>({});
  const [error, setError] = useState<string | null>(null);
  const submissions = useQuery({
    queryKey:["quiz-submissions",quizId],
    queryFn:()=>fetchQuizSubmissions(quizId),
    enabled:!!user,
  });
  const grade = useMutation({
    mutationFn:({answerId, marks}:{answerId:string; marks:number})=>gradeQuizAnswer(answerId,marks),
    onSuccess:()=>{setError(null);void client.invalidateQueries({queryKey:["quiz-submissions",quizId]});},
    onError:()=>setError("The grade could not be saved. Please retry."),
  });
  if (!user) return null;
  return <div>
    <Topbar title="Grade quiz" backHref={`/teacher/courses/${slug}/quizzes`} backLabel="Assessments" />
    <main className="mx-auto max-w-3xl space-y-5 px-6 py-8">
      <p className="text-sm text-neutral-400">The newest 100 submitted attempts are shown. Only course owners and authorised admins may access this page.</p>
      {submissions.isLoading && <p>Loading submissions…</p>}
      {submissions.isError && <p role="alert" className="text-red-400">Failed to retrieve submissions.</p>}
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {submissions.data?.length === 0 && <p className="text-neutral-400">No submitted attempts yet.</p>}
      {submissions.data?.map(attempt=><section key={attempt.id} className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <div><h2 className="font-semibold">{attempt.student.fullName}</h2><p className="text-xs text-neutral-400">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Submitted"}</p></div>
          <span className="text-sm text-neutral-300">{attempt.status === "GRADED" ? `${attempt.marksObtained} marks` : "Awaiting manual grading"}</span>
        </div>
        {attempt.answers.map(answer=><div key={answer.id} className="rounded-lg border border-neutral-800 p-3">
          <p className="font-medium">{answer.question.text} <span className="text-xs text-neutral-400">({answer.question.marks} marks)</span></p>
          {answer.question.type === "TEXT" ? <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{answer.textAnswer || "No text supplied"}</p> : <p className="mt-2 text-sm text-neutral-300">Selected: {answer.question.options.filter(o=> answer.selectedOptionId === o.id || (Array.isArray(answer.selectedOptionIds) && answer.selectedOptionIds.includes(o.id))).map(o=>o.text).join(", ") || "None"}</p>}
          <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={e=>{e.preventDefault();const raw=scores[answer.id];const marks=raw === undefined || raw.trim()==="" ? answer.marksObtained : Number(raw);if(marks===null||!Number.isInteger(marks)||marks<0||marks>answer.question.marks){setError("Enter a whole-number grade within the question maximum.");return;}grade.mutate({answerId:answer.id,marks});}}>
            <label htmlFor={`score-${answer.id}`} className="text-xs text-neutral-400">Award marks</label>
            <input id={`score-${answer.id}`} type="number" min={0} max={answer.question.marks} step={1} value={scores[answer.id] ?? String(answer.marksObtained ?? "")} onChange={e=>setScores(prev=>({...prev,[answer.id]:e.target.value}))} className="w-20 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm" />
            <button type="submit" disabled={grade.isPending} className="rounded border border-neutral-600 px-3 py-1 text-sm disabled:opacity-50">Save grade</button>
          </form>
        </div>)}
      </section>)}
    </main>
  </div>;
}
