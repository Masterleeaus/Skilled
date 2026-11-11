"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AdminNav } from "@/components/AdminNav";
import { Topbar } from "@/components/Topbar";
import { fetchReviewQueue, type ReviewState } from "@/lib/lesson-review.api";

const STATE_TEXT: Record<ReviewState, string> = {
  NOT_REVIEWED: "Not reviewed",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
  APPROVED: "Approved",
};

export default function LessonReviewQueuePage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const queue = useQuery({ queryKey: ["lesson-review-queue"], queryFn: fetchReviewQueue, enabled: !!user });
  if (!user) return null;

  return (
    <>
      <Topbar title="Lesson review" />
      <AdminNav />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-5 px-6 py-7 text-slate-100">
        <h1 className="text-xl font-semibold">Review queue</h1>
        <p className="text-sm text-slate-400">
          Draft lesson revisions that do not yet have an approval for their current content. Approval applies only to the content hash shown on the review page. Publishing is blocked until a reviewer approves that exact content and it passes the structural checks.
        </p>

        {queue.isLoading && <p role="status">Loading the review queue.</p>}
        {queue.isError && <p role="alert" className="text-amber-300">The review queue could not be loaded. Check that you are signed in as an administrator.</p>}

        {queue.data && queue.data.length === 0 && <p role="status" className="text-slate-300">No draft revisions are waiting for review.</p>}

        {queue.data && queue.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="mb-2 text-left text-slate-400">{queue.data.length} revision(s) awaiting a decision</caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="py-2 pr-4 font-medium">Lesson</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Source ID</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Version</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Review state</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Hash check</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {queue.data.map((item) => (
                  <tr key={item.revisionId} className="border-b border-slate-800">
                    <td className="py-3 pr-4">{item.title}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{item.sourceId}</td>
                    <td className="py-3 pr-4">{item.version}</td>
                    <td className="py-3 pr-4">{STATE_TEXT[item.reviewState]}</td>
                    <td className="py-3 pr-4">{item.hashIntegrity ? "Matches stored hash" : "Stored hash does not match: block"}</td>
                    <td className="py-3">
                      <Link href={`/admin/lesson-review/${encodeURIComponent(item.revisionId)}`} className="text-blue-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                        Review<span className="sr-only"> {item.title}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
