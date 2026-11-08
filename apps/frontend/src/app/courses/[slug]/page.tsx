"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { fetchCourseBySlug } from "@/lib/course-detail.api";
import { fetchMyEnrollments, setEnrolmentLicenceTrack } from "@/lib/enrollment.api";
import { fetchLicenceTrackSummary, type LicenceTrack } from "@/lib/curriculum.api";
import { api } from "@/lib/api-client";
import { Topbar } from "@/components/Topbar";
import { BrandImage } from "@/components/BrandImage";
import { LicenceTrackChooser } from "@/components/LicenceTrackChooser";
import { TrackOutline } from "@/components/TrackOutline";
import { useLicenceTrack } from "@/hooks/useLicenceTrack";
import { getBrand, topicLabel } from "@/lib/academy-brand";

export default function CoursePreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState("");
  const [switchNote, setSwitchNote] = useState<string | null>(null);
  // Non-licensed by default. The choice travels to the lessons in the ?track= query parameter.
  const [track, setTrack] = useLicenceTrack();

  // The curriculum list follows the chosen track. Keep the last list on screen while a new track loads.
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug, track],
    queryFn: () => fetchCourseBySlug(slug, track),
    placeholderData: keepPreviousData,
  });

  const licenceSummary = useQuery({
    queryKey: ["licence-tracks", course?.id],
    queryFn: () => fetchLicenceTrackSummary(course!.id),
    enabled: !!course,
    retry: false,
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
    enabled: !!user && user.role === "STUDENT",
  });

  const alreadyEnrolled = myEnrollments?.some((e) => e.course.slug === slug);
  // An enrolled learner's saved track is the one shown as selected. It replaces any ?track= value, which the server ignores for them.
  // Visitors and staff (no student enrolment list) keep the ?track= preview.
  const savedTrack = myEnrollments?.find((e) => e.course.slug === slug)?.licenceTrack;
  useEffect(() => {
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

  // Before enrolment the choice is only kept in the URL. After enrolment it is saved on the enrolment.
  const chooseTrack = (next: LicenceTrack) => {
    if (!alreadyEnrolled) {
      setTrack(next);
      return;
    }
    if (next === savedTrack || switchTrackMutation.isPending) return;
    setSwitchNote(null);
    switchTrackMutation.mutate(next);
  };

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/enrollments", { courseId: course!.id, licenceTrack: track });
      return data;
    },
    onSuccess: () => router.push(`/student/courses/${slug}?track=${track}`),
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Enrollment failed"),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/payments/checkout", {
        courseId: course!.id,
        couponCode: couponCode || undefined,
        licenceTrack: track,
      });
      return data.data;
    },
    onSuccess: (result) => {
      if (result.free) {
        router.push(`/student/courses/${slug}?track=${track}`);
      } else {
        window.location.href = result.checkoutUrl;
      }
    },
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Checkout failed"),
  });

  if (isLoading) return <p className="p-8 text-neutral-400">Loading...</p>;
  if (!course) return <p className="p-8 text-neutral-400">Course not found.</p>;

  // Non-licensed: the count comes from the track-aware summary, so no lesson the track leaves out is counted.
  // Licensed: the legacy list, which shows every lesson on that track.
  const legacyLessonTotal = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const lessonTotal = track === "non-licensed" ? licenceSummary.data?.counts["non-licensed"] : legacyLessonTotal;
  const price = course.price;
  const isFree = Number(price) === 0;
  const brand = getBrand(course.slug);
  const heroSrc = brand?.hero[0] ?? brand?.banner ?? null;
  const topicEntries = brand ? Object.entries(brand.topics) : [];

  return (
    <div>
      <Topbar title={course.title} backHref="/courses" backLabel="Browse courses" />
      <main className="mx-auto max-w-3xl px-6 py-8">
        {brand && heroSrc && (
          <BrandImage
            sources={[heroSrc]}
            alt={course.title}
            width={1920}
            height={640}
            className="mb-6 h-48 w-full rounded-xl object-cover"
          />
        )}
        {brand && !heroSrc && (
          <BrandImage
            sources={[brand.thumb, brand.icon]}
            alt={course.title}
            width={400}
            height={225}
            className="mb-6 h-32 w-56 rounded-lg object-cover"
          />
        )}
        <p className="text-neutral-400">{course.description}</p>
        {topicEntries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {topicEntries.map(([name, src]) => (
              <div key={name} className="flex items-center gap-2 text-xs text-neutral-400">
                <BrandImage
                  sources={[src]}
                  alt=""
                  width={175}
                  height={225}
                  className="h-10 w-auto rounded"
                />
                <span>{topicLabel(name)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-sm text-neutral-500">
          by {course.teacher.fullName} · {course._count.enrollments} students{lessonTotal !== undefined && ` · ${lessonTotal} lessons`}
        </p>

        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          {!user ? (
            <p className="text-sm text-neutral-400">
              <a href="/login" className="underline">
                Log in
              </a>{" "}
              to enroll in this course.
            </p>
          ) : user.role !== "STUDENT" ? (
            <p className="text-sm text-neutral-400">Only student accounts can enroll in courses.</p>
          ) : alreadyEnrolled ? (
            <a
              href={`/student/courses/${slug}?track=${track}`}
              className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
            >
              Continue learning →
            </a>
          ) : isFree ? (
            <button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              {enrollMutation.isPending ? "Enrolling..." : "Enroll for free"}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-semibold">${price}</p>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code (optional)"
                aria-label="Coupon code"
                className="w-full max-w-xs rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-400"
              />
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                className="block rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
              >
                {checkoutMutation.isPending ? "Processing..." : `Buy for $${price}`}
              </button>
            </div>
          )}
        </div>

        <LicenceTrackChooser
          track={track}
          onChange={chooseTrack}
          summary={licenceSummary.data}
          isLoading={licenceSummary.isLoading}
          isError={licenceSummary.isError}
        />
        {switchNote && <p role="status" className="mt-2 text-sm text-neutral-300">{switchNote}</p>}

        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-medium text-neutral-300">Curriculum</h3>
          {track === "non-licensed" ? (
            // The legacy list is not shown on this track: it cannot be filtered by licence. The track-aware outline
            // needs an enrolment, so before enrolment the learner sees the count and the chooser's licence list.
            alreadyEnrolled ? (
              <TrackOutline courseId={course.id} track={track} />
            ) : (
              <p className="text-sm text-neutral-400">
                {lessonTotal !== undefined ? `${lessonTotal} ${lessonTotal === 1 ? "lesson" : "lessons"} on the Non-licensed track. ` : ""}
                Enrol to open the lesson list.
              </p>
            )
          ) : (
            course.modules.map((mod) => (
              <div key={mod.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <p className="font-medium">{mod.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-400">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      • {lesson.title} {lesson.isFreePreview && <span className="text-xs text-green-400">(preview)</span>}
                      {lesson.licence?.status === "required" && <span className="ml-2 text-xs text-amber-300">Needs a licence</span>}
                      {lesson.licence?.status === "threshold" && <span className="ml-2 text-xs text-neutral-300">Work limit</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
