"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { CurriculumKnowledgeCheck } from "@/components/CurriculumKnowledgeCheck";
import { BusinessContextLesson } from "@/components/BusinessContextLesson";
import { CurriculumLessonBody } from "@/components/CurriculumLessonBody";
import { TemplateLessonForm } from "@/components/TemplateLessonForm";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LevelStatus } from "@/components/LevelStatus";
import { outlineHasLessons } from "@/components/TrackOutline";
import { useLicenceTrack } from "@/hooks/useLicenceTrack";
import { acknowledgeCurriculumLesson, fetchAcademyCourseProgress, fetchCurriculumLessonBody, fetchCurriculumOutline, fetchMyCurriculumCompletions, fetchMyLevels, type CurriculumPlacement, type LicenceNotice, type LicenceTrack } from "@/lib/curriculum.api";

/** The licence position of the open lesson. Limits show on both tracks; the licence requirement shows on the licensed track. */
function LicenceNote({ notice, track }: { notice: LicenceNotice; track: LicenceTrack }) {
  if (notice.status === "threshold") {
    return <div className="mb-3 space-y-1 rounded bg-slate-900 p-3 text-sm text-slate-200">
      {notice.limit && <p>Work limit: {notice.limit}. Work over this limit needs a licence.</p>}
      {track === "licensed" && <p className="text-amber-200">Licence requirement: {notice.reason ?? "A licence is needed for work over this limit."}</p>}
    </div>;
  }
  // A required lesson is only listed on the licensed track. The non-licensed track never shows it.
  if (track !== "licensed") return null;
  return <div className="mb-3 space-y-1 rounded bg-slate-900 p-3 text-sm text-amber-200">
    <p>This lesson covers work that needs a licence: {notice.reason ?? "A licence is required for this work."}</p>
    <p className="text-slate-300">The Licensed track does not grant a licence.</p>
  </div>;
}

/** The server's refusal message when the lesson body is forbidden (not enrolled, or locked). Null for any other failure. */
function lessonDenialMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) return null;
  const message = (error.response.data as { message?: unknown } | undefined)?.message;
  return typeof message === "string" && message.trim() !== "" ? message : "Your enrolment does not include this lesson.";
}

/** The nearest placement from `from` in direction `step` that has a published revision. Placements without one are skipped. */
function nearestOpenable(list: CurriculumPlacement[], from: number, step: 1 | -1): CurriculumPlacement | null {
  for (let i = from + step; i >= 0 && i < list.length; i += step) {
    if (list[i].revision) return list[i];
  }
  return null;
}

/** Acknowledgement is not a verified practical competency or a certificate. */
export function SharedCurriculumPlayer({ courseId, courseSlug }: { courseId: string; courseSlug?: string }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<CurriculumPlacement | null>(null);
  // The track requested by the URL (?track=). Used only until the outline loads, and for visitors and staff previews.
  const [requestedTrack] = useLicenceTrack();
  // Keeps the previous list while a new track loads, so the open lesson is only cleared once the new list is known.
  const outline = useQuery({ queryKey: ["academy-outline", courseId, requestedTrack], queryFn: () => fetchCurriculumOutline(courseId, requestedTrack), retry: false, placeholderData: keepPreviousData });
  // The track the server applied. An enrolled learner gets their saved track whatever ?track= says, so this is what the page shows.
  const track: LicenceTrack = outline.data?.licenceTrack ?? requestedTrack;
  // Clear the open lesson when the loaded list no longer has it (for example, a required lesson after switching to Non-licensed).
  useEffect(() => {
    if (!selected || !outline.data) return;
    const listed = outline.data.tracks.some(t => t.track.placements.some(p => p.id === selected.id));
    if (!listed) setSelected(null);
  }, [outline.data, selected]);
  // ACA-023 item 2: after a lesson is chosen from the list or by Previous/Next, focus moves to its heading.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeadingOnSelect = useRef(false);
  useEffect(() => {
    if (!focusHeadingOnSelect.current) return;
    focusHeadingOnSelect.current = false;
    headingRef.current?.focus();
  }, [selected]);
  function chooseLesson(next: CurriculumPlacement) {
    if (next.id !== selected?.id) focusHeadingOnSelect.current = true;
    setSelected(next);
  }
  const completions = useQuery({ queryKey: ["academy-completions"], queryFn: fetchMyCurriculumCompletions, retry: false });
  // Non-blocking: the lesson list still renders if progress is unavailable, and counts fall back to the outline.
  const courseProgress = useQuery({ queryKey: ["academy-course-progress", courseId, track], queryFn: () => fetchAcademyCourseProgress(courseId, track), retry: false });
  // Level status (PASS42). Non-blocking; the server still enforces every lock if this query fails.
  const levels = useQuery({ queryKey: ["academy-levels"], queryFn: fetchMyLevels, retry: false });
  // Lesson text comes from the server for the selected lesson only. The server checks enrolment and the level lock.
  // Nothing about lesson text is bundled into the client.
  const lessonBody = useQuery({
    queryKey: ["academy-lesson-body", courseId, track, selected?.lesson.sourceId, selected?.revision?.id],
    queryFn: () => fetchCurriculumLessonBody(courseId, selected!.lesson.sourceId, track),
    enabled: Boolean(selected?.revision && !selected.levelLock),
    retry: false,
  });
  const acknowledge = useMutation({
    mutationFn: ({ lessonId, revisionId }: { lessonId: string; revisionId: string }) => acknowledgeCurriculumLesson(lessonId, revisionId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["academy-completions"] });
      void client.invalidateQueries({ queryKey: ["academy-course-progress", courseId] });
      void client.invalidateQueries({ queryKey: ["academy-levels"] });
    },
  });
  if (outline.isLoading || completions.isLoading) return <section aria-label="Shared curriculum" className="my-6 text-slate-400">Loading shared lessons…</section>;
  if (outline.isError) return <section role="alert" className="my-6 text-amber-600">Shared curriculum unavailable or enrolment required. Existing course lessons remain available.</section>;
  const tracks = outline.data?.tracks ?? [];
  // An outline with no placements is the empty case: the course page then lists the legacy lessons instead.
  if (!outlineHasLessons(outline.data)) return null;
  const completed = new Set((completions.data ?? []).map(c => `${c.lessonId}:${c.revisionId}`));
  const placements = tracks.flatMap(t => t.track.placements);
  // A lesson can sit in more than one track; count each lesson revision once in the fallback totals.
  const unique = new Map(placements.filter(p => p.revision).map(p => [`${p.lesson.id}:${p.revision!.id}`, p] as const));
  const localCount = [...unique.keys()].filter(key => completed.has(key)).length;
  const shownCount = courseProgress.data ? courseProgress.data.completedCount : localCount;
  const shownTotal = courseProgress.data ? courseProgress.data.lessonCount : unique.size;
  // The active placement comes from the loaded list, so its licence and revision fields are current.
  const active = placements.find(p => p.id === selected?.id) ?? null;
  // Previous and next follow the flat list the outline shows, in order, skipping placements with no published revision.
  const activeIndex = active ? placements.indexOf(active) : -1;
  const previousLesson = nearestOpenable(placements, activeIndex, -1);
  const nextLesson = nearestOpenable(placements, activeIndex, 1);
  // The body is the server's lesson text for the selected lesson. It is undefined until the request succeeds.
  const body = active?.revision && !active.levelLock ? lessonBody.data : undefined;
  const denial = lessonDenialMessage(lessonBody.error);
  // ACA-023 item 3: the only live region in the lesson panel. It announces load state, not the whole lesson.
  const lessonStatus = !active || !active.revision || active.levelLock ? "" : lessonBody.isPending ? "Loading lesson…" : body ? "Lesson loaded." : "";
  return <section className="my-6 rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100" aria-label="Shared curriculum">
    <header className="mb-4"><h2 className="text-xl font-semibold">Shared learning pathway</h2><p className="text-sm text-slate-300">Track: {track === "licensed" ? "Licensed" : "Non-licensed"}{courseSlug && <> · <Link href={`/courses/${courseSlug}?track=${track}`} className="underline">Change track</Link></>}</p><p className="text-sm text-slate-400">{shownCount} of {shownTotal} lesson placements acknowledged. Acknowledgements are learning records and do not certify practical competency; practical skills require separate assessment.</p>{courseProgress.data && <p className="text-sm text-slate-300">Required: {courseProgress.data.required.completed} of {courseProgress.data.required.total}. Optional: {courseProgress.data.optional.completed} of {courseProgress.data.optional.total}.</p>}{courseProgress.isError && <p role="status" className="text-sm text-amber-300">Server progress totals are unavailable, so counts show the lessons listed below.</p>}<progress className="mt-2 w-full" value={shownCount} max={Math.max(1, shownTotal)} aria-label="Shared lesson acknowledgement progress" /></header>
    {levels.data && <LevelStatus levels={levels.data} />}
    {levels.isError && <p role="status" className="mb-4 text-sm text-amber-300">Level status is unavailable. Locked lessons still show their reason when opened.</p>}
    <div className="grid gap-4 md:grid-cols-2">
      <nav aria-label="Shared lesson list" className="space-y-4">
        {tracks.map(({ id, track }) => <div key={id}><h3 className="mb-2 text-sm font-semibold">{track.title} <span className="text-slate-400">({track.scope.toLowerCase()})</span></h3><ol className="space-y-1">{track.placements.map(p => <li key={p.id}><button type="button" onClick={() => chooseLesson(p)} className={`w-full rounded p-2 text-left text-sm hover:bg-slate-700 ${active?.id === p.id ? "bg-slate-700" : "bg-slate-800"}`} aria-current={active?.id === p.id ? "step" : undefined}><span aria-hidden="true">{p.revision && completed.has(`${p.lesson.id}:${p.revision.id}`) ? "✓ " : "○ "}</span>{p.lesson.title}{p.revision && completed.has(`${p.lesson.id}:${p.revision.id}`) && <span className="sr-only"> (completed)</span>}{!p.revision && <span className="ml-2 text-amber-300">Awaiting published lesson</span>}{p.licence?.status === "threshold" && <span className="ml-2 text-slate-400">Work limit</span>}{p.licence?.status === "required" && <span className="ml-2 text-amber-300">Needs a licence</span>}{p.levelLock && <span className="ml-2 text-amber-300">Locked</span>}</button></li>)}</ol></div>)}
      </nav>
      <article className="rounded-lg bg-slate-800 p-4">
        <p role="status" aria-live="polite" className="sr-only">{lessonStatus}</p>
        {!active ? <p className="text-slate-300">Select a lesson to read its published content.</p> : <><h3 ref={headingRef} tabIndex={-1} className="mb-3 text-lg font-semibold">{active.lesson.title}</h3>{active.licence && <LicenceNote notice={active.licence} track={track} />}{active.levelLock ?<p role="alert" className="text-amber-300">This lesson is locked. {active.levelLock.reason}</p> : !active.revision ? <p>Lesson content is not published yet.</p> : lessonBody.isPending ? <p className="text-slate-300">Loading lesson…</p> : denial ? <p role="alert" className="text-amber-300">This lesson is not available. {denial}</p> : !body ? <p role="alert" className="text-red-300">Lesson text could not be loaded. Please try again.</p> : <><CurriculumLessonBody body={body} />{body?.lessonKind === "template" && <TemplateLessonForm key={active.revision.id} lessonId={active.lesson.id} revisionId={active.revision.id} />}<BusinessContextLesson key={active.revision.id} revisionId={active.revision.id} /><CurriculumKnowledgeCheck key={active.revision.id} body={body ?? {}} lessonId={active.lesson.id} revisionId={active.revision.id} />{/* ACA-023 item 1: aria-disabled keeps focus on the button; the handler guards the disabled state. */}<button type="button" aria-disabled={acknowledge.isPending || completed.has(`${active.lesson.id}:${active.revision.id}`)} onClick={() => { if (acknowledge.isPending || completed.has(`${active.lesson.id}:${active.revision!.id}`)) return; acknowledge.mutate({ lessonId: active.lesson.id, revisionId: active.revision!.id }); }} className="mt-5 rounded bg-blue-700 px-4 py-2 text-sm font-medium aria-disabled:opacity-50">{completed.has(`${active.lesson.id}:${active.revision.id}`) ? "Acknowledged" : acknowledge.isPending ? "Saving…" : "Mark lesson read"}</button>{acknowledge.isError && <p role="alert" className="mt-2 text-red-300">Could not save acknowledgement. Please try again.</p>}</> }</>}
        <nav aria-label="Lesson navigation" className="mt-6 flex justify-between gap-3">
          <button type="button" aria-disabled={!previousLesson} onClick={() => { if (previousLesson) chooseLesson(previousLesson); }} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium aria-disabled:opacity-50">Previous lesson</button>
          <button type="button" aria-disabled={!nextLesson} onClick={() => { if (nextLesson) chooseLesson(nextLesson); }} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium aria-disabled:opacity-50">Next lesson</button>
        </nav>
      </article>
    </div>
  </section>;
}
