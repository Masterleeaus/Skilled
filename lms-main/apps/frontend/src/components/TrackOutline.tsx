"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurriculumOutline, type LicenceTrack } from "@/lib/curriculum.api";

/**
 * The track-aware lesson list for one course, from the curriculum outline. The outline needs an active enrolment,
 * so render this only for enrolled learners. Lessons the track leaves out are not in the outline at all.
 */
export function TrackOutline({ courseId, track }: { courseId: string; track: LicenceTrack }) {
  const outline = useQuery({
    queryKey: ["academy-outline", courseId, track],
    queryFn: () => fetchCurriculumOutline(courseId, track),
    retry: false,
  });

  if (outline.isLoading) return <p className="text-sm text-neutral-400">Loading lessons…</p>;
  if (outline.isError) return <p role="status" className="text-sm text-amber-300">The lesson list is unavailable right now.</p>;
  const tracks = outline.data?.tracks ?? [];
  if (!tracks.length) return <p className="text-sm text-neutral-400">No lessons are listed on this track yet.</p>;

  return (
    <>
      {tracks.map(({ id, track: curriculumTrack }) => (
        <div key={id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="font-medium">{curriculumTrack.title}</p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-400">
            {curriculumTrack.placements.map((placement) => (
              <li key={placement.id}>
                • {placement.lesson.title}
                {placement.licence?.status === "required" && <span className="ml-2 text-xs text-amber-300">Needs a licence</span>}
                {placement.licence?.status === "threshold" && <span className="ml-2 text-xs text-neutral-300">Work limit</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
