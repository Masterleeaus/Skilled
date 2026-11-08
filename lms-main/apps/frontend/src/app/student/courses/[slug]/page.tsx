"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  fetchCourseBySlug,
  fetchCourseProgress,
  markLessonProgress,
  fetchLessonVideoUrl,
  type Lesson,
} from "@/lib/course-detail.api";
import { fetchQuizzesForCourse } from "@/lib/quiz.api";
import { fetchAssignmentsForCourse } from "@/lib/assignment.api";
import { Topbar } from "@/components/Topbar";
import { SharedCurriculumPlayer } from "@/components/SharedCurriculumPlayer";
import { BrandImage } from "@/components/BrandImage";
import { LicenceTrackChooser } from "@/components/LicenceTrackChooser";
import { outlineHasLessons } from "@/components/TrackOutline";
import { useLicenceTrack } from "@/hooks/useLicenceTrack";
import { fetchAcademyCourseProgress, fetchCurriculumOutline, fetchLicenceTrackSummary, type LicenceTrack } from "@/lib/curriculum.api";
import { fetchMyEnrollments, setEnrolmentLicenceTrack } from "@/lib/enrollment.api";
import { getBrand } from "@/lib/academy-brand";

export default function CoursePlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["STUDENT"]);
  const queryClient = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const latestLessonRequest = useRef(0);
  // The licence track requested by the URL (?track=). The server ignores it for an enrolled learner, so the saved track below governs.
  const [track, setTrack] = useLicenceTrack();
  const [switchNote, setSwitchNote] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug, track],
    queryFn: () => fetchCourseBySlug(slug, track),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });

  // The saved track of this learner's enrolment. Used when the URL names no track (for example from My Courses).
  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
    enabled: !!user,
  });
  const enrollment = myEnrollments?.find((e) => e.course.slug === slug);
  const savedTrack = enrollment?.licenceTrack;
  useEffect(() => {
    // This page is for enrolled learners only, and the server always applies their saved track (?track= is ignored).
    // The URL and the lesson list therefore follow the saved track, so a stale ?track= value cannot mislead the page.
    if (savedTrack) setTrack(savedTrack);
  }, [savedTrack, setTrack]);

  const switchTrackMutation = useMutation({
    mutationFn: (next: LicenceTrack) => setEnrolmentLicenceTrack(course!.id, next),
    onSuccess: (_result, next) => {
      setTrack(next);
      setSwitchNote(`Your track is now ${next === "licensed" ? "Licensed" : "Non-licensed"}. Your progress is kept.`);
      void queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: () => setSwitchNote("Your track could not be changed, so it is still the one you had. Please try again."),
  });

  // An enrolled learner's switch is saved on the enrolment, as on the course page. Otherwise only the URL changes.
  const chooseTrack = (next: LicenceTrack) => {
    if (!enrollment) {
      setTrack(next);
      return;
    }
    if (next === savedTrack || switchTrackMutation.isPending) return;
    setSwitchNote(null);
    switchTrackMutation.mutate(next);
  };

  const licenceSummary = useQuery({
    queryKey: ["licence-tracks", course?.id],
    queryFn: () => fetchLicenceTrackSummary(course!.id),
    enabled: !!course,
    retry: false,
  });

  const { data: progress } = useQuery({
    queryKey: ["course-progress", course?.id],
    queryFn: () => fetchCourseProgress(course!.id),
    enabled: !!course,
  });

  // Non-licensed: the bar counts only the track's lessons (the legacy progress counts lessons the track hides).
  const trackProgress = useQuery({
    queryKey: ["academy-course-progress", course?.id, track],
    queryFn: () => fetchAcademyCourseProgress(course!.id, track),
    enabled: !!course && track === "non-licensed",
    retry: false,
  });
  // The academy outline for the non-licensed track. Same key as SharedCurriculumPlayer, so it is one request.
  // When it lists no lessons, the legacy lesson list is shown in the sidebar, and the legacy progress is used.
  const academyOutline = useQuery({
    queryKey: ["academy-outline", course?.id, track],
    queryFn: () => fetchCurriculumOutline(course!.id, track),
    enabled: !!course && track === "non-licensed",
    retry: false,
  });
  const academyEmpty = track === "non-licensed" && academyOutline.isSuccess && !outlineHasLessons(academyOutline.data);
  const showLegacyLessons = track === "licensed" || academyEmpty;
  const legacyLessonTotal = course ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0) : undefined;

  const progressPercent =
    track === "non-licensed" && !academyEmpty
      ? trackProgress.data?.completionPercent ?? 0
      : progress?.enrollment.progressPercentage ?? 0;

  const { data: quizzes } = useQuery({
    queryKey: ["course-quizzes", course?.id],
    queryFn: () => fetchQuizzesForCourse(course!.id),
    enabled: !!course,
  });

  const { data: assignments } = useQuery({
    queryKey: ["course-assignments", course?.id],
    queryFn: () => fetchAssignmentsForCourse(course!.id),
    enabled: !!course,
  });

  const progressMutation = useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      markLessonProgress(lessonId, 0, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", course?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
  });

  async function openLesson(lesson: Lesson) {
    const requestId = ++latestLessonRequest.current;
    setActiveLesson(lesson);
    setVideoUrl(null);
    if (lesson.videoUrl) {
      try {
        const url = await fetchLessonVideoUrl(lesson.id);
        if (requestId === latestLessonRequest.current) setVideoUrl(url);
      } catch {
        if (requestId === latestLessonRequest.current) setVideoUrl(null);
      }
    }
  }

  const isLessonComplete = (lessonId: string) =>
    progress?.lessonProgress.some((p) => p.lessonId === lessonId && p.completed) ?? false;

  if (!user) return null;
  if (isLoading) return <p className="p-8 text-neutral-400">Loading course...</p>;
  if (!course) return <p className="p-8 text-neutral-400">Course not found.</p>;

  const brand = getBrand(course.slug);

  return (
    <div>
      <Topbar title={course.title} backHref="/student" backLabel="My Courses" />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <LicenceTrackChooser
          track={track}
          onChange={chooseTrack}
          summary={licenceSummary.data}
          isLoading={licenceSummary.isLoading}
          isError={licenceSummary.isError}
          countFallback={academyEmpty ? legacyLessonTotal : undefined}
        />
        {switchNote && <p role="status" className="mt-2 text-sm text-neutral-300">{switchNote}</p>}
      </div>
      {/* The track-aware outline (lessons the track leaves out are not in it) is the lesson list on this page. */}
      <SharedCurriculumPlayer courseId={course.id} courseSlug={slug} />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Sidebar: modules + lessons */}
        <aside className="border-r border-neutral-800 p-4">
          {brand && (
            <BrandImage
              sources={[brand.thumb, brand.icon]}
              alt={course.title}
              width={400}
              height={225}
              className="mb-4 h-24 w-full rounded-lg object-cover"
            />
          )}
          <div className="mb-4">
            <div
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800"
            >
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {progressPercent}% complete
            </p>
          </div>

          {/* The legacy module list is not shown on the non-licensed track while the academy lists lessons: it cannot be filtered by licence. */}
          {showLegacyLessons && course.modules.map((mod) => (
            <div key={mod.id} className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-300">{mod.title}</h3>
              <div className="space-y-1">
                {mod.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => openLesson(lesson)}
                    /* ACA-023 item 4: the active lesson is marked for assistive technology, not only by background colour. */
                    aria-current={activeLesson?.id === lesson.id ? "true" : undefined}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeLesson?.id === lesson.id
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-400 hover:bg-neutral-900"
                    }`}
                  >
                    <span>
                      {lesson.title}
                      {lesson.licence?.status === "required" && <span className="ml-2 text-xs text-amber-300">Needs a licence</span>}
                      {lesson.licence?.status === "threshold" && <span className="ml-2 text-xs text-neutral-300">Work limit</span>}
                    </span>
                    {isLessonComplete(lesson.id) && <span className="text-green-400"><span aria-hidden="true">✓</span><span className="sr-only"> (completed)</span></span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4">
            <Link
              href={`/student/courses/${slug}/live-classes`}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              <span aria-hidden="true">📅</span> Live Classes
            </Link>
            <Link
              href={`/student/courses/${slug}/discussions`}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              <span aria-hidden="true">💬</span> Discussions
            </Link>
          </div>

          {quizzes && quizzes.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-300">Quizzes</h3>
              <div className="space-y-1">
                {quizzes.map((q) => (
                  <Link
                    key={q.id}
                    href={`/student/quizzes/${q.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900"
                  >
                    {q.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {assignments && assignments.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-300">Assignments</h3>
              <div className="space-y-1">
                {assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/student/assignments/${a.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900"
                  >
                    {a.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main: active lesson */}
        <main className="p-6">
          {!activeLesson && (
            <p className="text-neutral-400">Select a lesson from the sidebar to begin.</p>
          )}

          {activeLesson && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-semibold">{activeLesson.title}</h2>

              {/* TODO(ACA-023 item 5): lesson videos have no caption track and the lesson schema has no track field.
                  Captions are not added here. Confirm captions exist for each published video, then add track support. See fix-accessibility.md. */}
              {videoUrl ? (
                <video controls className="mt-4 w-full rounded-lg" src={videoUrl} />
              ) : (
                <div className="mt-4 flex aspect-video items-center justify-center rounded-lg bg-neutral-900 text-neutral-500">
                  No video attached to this lesson
                </div>
              )}

              <button
                onClick={() =>
                  progressMutation.mutate({
                    lessonId: activeLesson.id,
                    completed: !isLessonComplete(activeLesson.id),
                  })
                }
                disabled={progressMutation.isPending}
                className={`mt-6 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                  isLessonComplete(activeLesson.id)
                    ? "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    : "bg-white text-neutral-900 hover:bg-neutral-200"
                }`}
              >
                {isLessonComplete(activeLesson.id) ? "Mark as incomplete" : "Mark as complete"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
