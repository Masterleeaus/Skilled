"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { enrolInPathway, fetchPathway, PathwayItem } from "@/lib/pathway.api";
import { Topbar } from "@/components/Topbar";

const STATE_LABEL: Record<PathwayItem["state"], string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In progress",
  NOT_STARTED: "Not started",
  NO_LESSONS: "No lessons yet",
  OPTIONAL: "Your choice",
};

function itemDetail(item: PathwayItem): string | null {
  if (item.kind === "MODULE" && item.lessonsTotal !== null) {
    return `${item.lessonsCompleted ?? 0} of ${item.lessonsTotal} lessons complete`;
  }
  if (item.kind === "COURSE" && !item.inCatalogue) return "Not yet available";
  if (item.kind === "SERVICE") return "Choose one or more service courses and enrol in them directly.";
  return null;
}

function errorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message ?? fallback;
}

export default function PathwayDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useRequireAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: pathway, isLoading, isError } = useQuery({
    queryKey: ["pathway", code],
    queryFn: () => fetchPathway(code),
    enabled: !!user && !!code,
  });

  const enrolMutation = useMutation({
    mutationFn: () => enrolInPathway(code),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["pathway", code] });
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
    },
    onError: (err) => setActionError(errorMessage(err, "Enrolment failed. Try again.")),
  });

  if (!user) return null;

  const progress = pathway?.progress;

  return (
    <div>
      <Topbar title={pathway?.title ?? "Pathway"} backHref="/pathways" backLabel="Pathways" />

      <main className="mx-auto max-w-3xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading pathway...</p>}
        {isError && (
          <p role="alert" className="text-red-400">
            This pathway could not be loaded.
          </p>
        )}

        {pathway && (
          <>
            <p className="text-neutral-400">{pathway.description}</p>

            <section aria-labelledby="progress-heading" className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <h2 id="progress-heading" className="text-base font-medium">
                Your progress
              </h2>

              {!pathway.enrolment && (
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <p className="text-sm text-neutral-400">You are not enrolled in this pathway.</p>
                  <button
                    type="button"
                    onClick={() => enrolMutation.mutate()}
                    disabled={enrolMutation.isPending}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {enrolMutation.isPending ? "Enrolling..." : "Enrol in this pathway"}
                  </button>
                </div>
              )}

              {pathway.enrolment && progress && (
                <div className="mt-3">
                  <p className="text-sm text-neutral-300">
                    {progress.requiredCompleted} of {progress.requiredTotal} required items complete ({progress.percentage}%)
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Required item progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress.percentage}
                    aria-valuetext={`${progress.percentage}% of required items complete`}
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800"
                  >
                    <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress.percentage}%` }} />
                  </div>
                  {progress.status === "COMPLETED" && <p className="mt-2 text-sm text-neutral-300">Pathway complete.</p>}
                  {progress.status === "NO_REQUIRED_ITEMS" && (
                    <p className="mt-2 text-sm text-neutral-400">No required items have been set for this pathway yet.</p>
                  )}
                </div>
              )}

              {actionError && (
                <p role="alert" className="mt-3 text-sm text-red-400">
                  {actionError}
                </p>
              )}
            </section>

            <section aria-labelledby="courses-heading" className="mt-6">
              <h2 id="courses-heading" className="mb-3 text-base font-medium">
                Items in order
              </h2>

              {pathway.items.length === 0 ? (
                <p className="text-sm text-neutral-400">No items have been added to this pathway yet.</p>
              ) : (
                <ol className="space-y-3">
                  {pathway.items.map((course, index) => (
                    <li
                      key={course.key}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
                    >
                      <div>
                        <p className="font-medium">
                          <span className="mr-2 text-neutral-500">{index + 1}.</span>
                          {course.label}
                        </p>
                        {itemDetail(course) && <p className="mt-1 text-xs text-neutral-500">{itemDetail(course)}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="rounded border border-neutral-700 px-2 py-0.5 text-neutral-300">
                          {course.required ? "Required" : "Optional"}
                        </span>
                        {pathway.enrolment && <span className="text-neutral-400">{STATE_LABEL[course.state]}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
