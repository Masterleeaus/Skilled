"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { fetchThread, addReply, resolveThread, pinReply } from "@/lib/discussion.api";
import { Topbar } from "@/components/Topbar";

export function DiscussionThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread(threadId),
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["thread", threadId] });

  const replyMutation = useMutation({
    mutationFn: () => addReply(threadId, reply),
    onSuccess: () => {
      setReply("");
      invalidate();
    },
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to reply"),
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveThread(threadId),
    onSuccess: invalidate,
  });

  const pinMutation = useMutation({
    mutationFn: (replyId: string) => pinReply(replyId),
    onSuccess: invalidate,
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Only teachers can pin replies"),
  });

  if (!user) return null;
  if (isLoading) return <p className="p-8 text-neutral-400">Loading...</p>;
  if (!thread) return <p className="p-8 text-neutral-400">Thread not found.</p>;

  return (
    <div>
      <Topbar title={thread.title} backHref="back" backLabel="Back to discussions" />
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-300">{thread.body}</p>
          <p className="mt-2 text-xs text-neutral-500">
            {thread.student.fullName} · {new Date(thread.createdAt).toLocaleString()}
          </p>
          {!thread.isResolved && (
            <button
              onClick={() => resolveMutation.mutate()}
              className="mt-2 text-xs text-neutral-400 underline"
            >
              Mark as resolved
            </button>
          )}
          {thread.isResolved && <p className="mt-2 text-xs text-green-400">✓ Resolved</p>}
        </div>

        <div className="space-y-2">
          {thread.replies.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border p-3 ${
                r.isPinned ? "border-yellow-600/50 bg-yellow-500/5" : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <p className="text-sm text-neutral-300">{r.body}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {r.user.fullName} ({r.user.role}) · {new Date(r.createdAt).toLocaleString()}
                  {r.isPinned && " · 📌 Pinned"}
                </p>
                {user.role !== "STUDENT" && !r.isPinned && (
                  <button
                    onClick={() => pinMutation.mutate(r.id)}
                    className="text-xs text-neutral-400 underline"
                  >
                    Pin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!reply || replyMutation.isPending}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      </main>
    </div>
  );
}
