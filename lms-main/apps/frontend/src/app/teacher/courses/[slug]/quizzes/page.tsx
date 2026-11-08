"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { fetchQuizzesForCourse } from "@/lib/quiz.api";
import { Topbar } from "@/components/Topbar";

export default function TeacherQuizzesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const course = useQuery({queryKey:["course", slug], queryFn:()=>fetchCourseForManagement(slug), enabled:!!user});
  const quizzes = useQuery({
    queryKey:["teacher-quizzes", course.data?.id],
    queryFn:()=>fetchQuizzesForCourse(course.data!.id),
    enabled:!!user && !!course.data?.id,
  });
  if (!user) return null;
  return <div>
    <Topbar title="Assessments & grading" backHref={`/teacher/courses/${slug}`} backLabel="Back to course" />
    <main className="mx-auto max-w-3xl space-y-4 px-6 py-8">
      <Link href={`/teacher/courses/${slug}/quizzes/new`} className="inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm">+ Create quiz</Link>
      {(course.isLoading || quizzes.isLoading) && <p>Loading assessments…</p>}
      {(course.isError || quizzes.isError) && <p role="alert" className="text-red-400">Unable to load assessments.</p>}
      {quizzes.data?.length === 0 && <p className="text-neutral-400">No quizzes in this course yet.</p>}
      {quizzes.data?.map(q=><article key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <div><h2 className="font-medium">{q.title}</h2>
          <p className="text-sm text-neutral-400">{q.isPublished ? "Published" : "Draft"} · {q.totalMarks} marks</p></div>
        <Link href={`/teacher/courses/${slug}/quizzes/${q.id}/grading`} className="rounded-lg border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-800">Review submissions</Link>
      </article>)}
    </main>
  </div>;
}
