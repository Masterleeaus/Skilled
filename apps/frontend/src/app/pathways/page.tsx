"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchPathways, PathwaySummary } from "@/lib/pathway.api";
import { Topbar } from "@/components/Topbar";

function progressText(pathway: PathwaySummary): string {
  if (!pathway.enrolment) return "Not enrolled";
  if (!pathway.progress) return "Enrolled";
  const { requiredCompleted, requiredTotal, percentage } = pathway.progress;
  if (pathway.progress.status === "NO_REQUIRED_ITEMS") return "Enrolled. No required items are set yet.";
  return `${requiredCompleted} of ${requiredTotal} required items complete (${percentage}%)`;
}

export default function PathwaysListPage() {
  const { user } = useRequireAuth();

  const { data: pathways, isLoading, isError } = useQuery({
    queryKey: ["pathways"],
    queryFn: fetchPathways,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="Role pathways" />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-6 text-neutral-400">
          A pathway groups the courses for one role. Choose the pathway that matches your work.
        </p>

        {isLoading && <p className="text-neutral-400">Loading pathways...</p>}
        {isError && (
          <p role="alert" className="text-red-400">
            Pathways could not be loaded. Try again later.
          </p>
        )}

        {pathways && pathways.length === 0 && (
          <div className="rounded-lg border border-neutral-800 p-8 text-center text-neutral-400">
            No pathways are available yet.
          </div>
        )}

        {pathways && pathways.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {pathways.map((pathway) => (
              <li key={pathway.code}>
                <div className="flex h-full flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                  <h2 className="text-lg font-medium">
                    <Link
                      href={`/pathways/${encodeURIComponent(pathway.code)}`}
                      className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {pathway.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-neutral-400">{pathway.description}</p>
                  <p className="mt-3 text-xs text-neutral-500">
                    {pathway.itemCount} items, {pathway.requiredCount} required
                  </p>
                  <p className="mt-auto pt-4 text-sm text-neutral-300">{progressText(pathway)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
