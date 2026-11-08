"use client";

import { apiErrorMessage, apiErrorStatus } from "@/lib/api-error";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import {
  fetchLessonPool,
  fetchLessonSelection,
  saveLessonSelection,
  LESSON_LEVELS,
  LESSON_LEVEL_LABEL,
  type CourseSelection,
} from "@/lib/course-selection.api";
import { Topbar } from "@/components/Topbar";

const sameIds = (a: Set<string>, b: string[]) => a.size === b.length && b.every((id) => a.has(id));

export default function CourseLessonsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });
  const courseId = course?.id;

  const pool = useQuery({
    queryKey: ["lesson-pool", courseId],
    queryFn: () => fetchLessonPool(courseId!),
    enabled: !!courseId,
    retry: false,
  });
  const saved = useQuery({
    queryKey: ["lesson-selection", courseId],
    queryFn: () => fetchLessonSelection(courseId!),
    enabled: !!courseId,
    retry: false,
  });

  // The unsaved picks. Null means the page shows the saved state.
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const lessons = useMemo(() => pool.data?.lessons ?? [], [pool.data]);
  const allIds = useMemo(() => lessons.map((lesson) => lesson.sourceId), [lessons]);
  // With no saved selection, the saved state is the full level list.
  const savedIds = useMemo(() => {
    if (!saved.data) return [];
    return saved.data.usesFullLevel ? allIds : saved.data.sourceIds;
  }, [saved.data, allIds]);

  const selected = draft ?? new Set(savedIds);
  const selectedInPool = lessons.filter((lesson) => selected.has(lesson.sourceId)).length;
  const isDirty = draft !== null && !sameIds(draft, savedIds);

  const save = useMutation({
    mutationFn: (ids: string[]) => saveLessonSelection(courseId!, ids),
    onSuccess: (result: CourseSelection) => {
      queryClient.setQueryData(["lesson-selection", courseId], result);
      setDraft(null);
      setMessage({ kind: "ok", text: `Saved. ${result.sourceIds.length} lessons now count toward the level gates.` });
    },
    onError: (err: unknown) => {
      setMessage({ kind: "error", text: apiErrorMessage(err) ?? "The selection could not be saved. Your picks are still here." });
    },
  });

  if (!user) return null;

  const loadError = pool.isError || saved.isError;
  const forbidden = apiErrorStatus(pool.error) === 403 || apiErrorStatus(saved.error) === 403;

  const toggle = (sourceId: string) => {
    const next = new Set(selected);
    if (next.has(sourceId)) next.delete(sourceId);
    else next.add(sourceId);
    setDraft(next);
    setMessage(null);
  };

  const statusText = (() => {
    if (!saved.data) return "Loading the saved selection.";
    if (isDirty) return `You have unsaved changes. ${selectedInPool} of ${lessons.length} lessons are selected.`;
    if (saved.data.usesFullLevel) return `No selection is saved. The course uses all ${lessons.length} lessons in its level list.`;
    const when = saved.data.savedAt ? ` Last saved ${new Date(saved.data.savedAt).toLocaleString()}.` : "";
    return `Saved selection: ${savedIds.length} lessons.${when}`;
  })();

  const counts = (level: (typeof LESSON_LEVELS)[number]) => {
    const inLevel = lessons.filter((lesson) => lesson.level === level);
    return { chosen: inLevel.filter((lesson) => selected.has(lesson.sourceId)).length, total: inLevel.length };
  };

  return (
    <div>
      <Topbar title={course ? `Lessons — ${course.title}` : "Lessons"} backHref={`/teacher/courses/${slug}`} backLabel="Back to course" />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {forbidden && (
          <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            You do not have permission to change this course&apos;s lessons. Ask the course owner or an administrator.
          </p>
        )}
        {!forbidden && loadError && (
          <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            The lesson list could not be loaded. Refresh the page to try again.
          </p>
        )}

        {!forbidden && !loadError && (
          <>
            <section aria-labelledby="selection-status" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <h2 id="selection-status" className="text-sm font-medium">Lesson selection</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Choose which lessons this course includes. Only the lessons you choose count toward the base, group and
                specialised level gates. Selecting every lesson gives the same result as having no selection.
              </p>
              <p role="status" aria-live="polite" className="mt-3 text-sm text-neutral-200">{statusText}</p>
              {message && (
                <p role={message.kind === "error" ? "alert" : "status"} className={`mt-2 text-sm ${message.kind === "error" ? "text-red-300" : "text-green-400"}`}>
                  {message.text}
                </p>
              )}
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => { setDraft(new Set(allIds)); setMessage(null); }}
                disabled={!lessons.length}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => { setDraft(new Set()); setMessage(null); }}
                disabled={!selected.size}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => save.mutate([...selected])}
                disabled={!isDirty || selectedInPool === 0 || save.isPending}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                {save.isPending ? "Saving..." : "Save selection"}
              </button>
              {selectedInPool === 0 && (
                <p className="text-sm text-neutral-400">Select at least one lesson. A saved selection cannot be empty.</p>
              )}
            </div>

            {LESSON_LEVELS.map((level) => {
              const { chosen, total } = counts(level);
              const inLevel = lessons.filter((lesson) => lesson.level === level);
              return (
                <fieldset key={level} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <legend className="px-1 text-sm font-medium">
                    {LESSON_LEVEL_LABEL[level]} level: {chosen} of {total} selected
                  </legend>
                  {inLevel.length === 0 && <p className="text-sm text-neutral-500">No lessons in this level for this course.</p>}
                  <ul className="mt-2 space-y-1">
                    {inLevel.map((lesson) => {
                      const id = `lesson-${lesson.sourceId}`;
                      return (
                        <li key={lesson.sourceId}>
                          <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded px-2 py-1.5 text-sm hover:bg-neutral-800">
                            <input
                              id={id}
                              type="checkbox"
                              checked={selected.has(lesson.sourceId)}
                              onChange={() => toggle(lesson.sourceId)}
                              className="mt-0.5 h-4 w-4 accent-white"
                            />
                            <span>
                              <span className="font-mono text-xs text-neutral-400">{lesson.sourceId}</span>
                              {lesson.title && <span className="ml-2">{lesson.title}</span>}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
