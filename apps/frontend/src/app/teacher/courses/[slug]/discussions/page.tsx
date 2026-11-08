"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import { fetchThreads, createThread } from "@/lib/discussion.api";
import { Topbar } from "@/components/Topbar";

export default function DiscussionsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const { data: threads } = useQuery({
    queryKey: ["threads", course?.id],
    queryFn: () => fetchThreads(course!.id),
    enabled: !!course,
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createThread(course!.id, title, body),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["threads", course?.id] });
    },
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to post"),
  });

  const basePath = user?.role === "STUDENT" ? "student" : "teacher";

  if (!user) return null;

  return (
    <div>
      <Topbar title={course ? `Discussions — ${course.title}` : "Discussions"} backHref={`/${basePath}/courses/${slug}`} backLabel="Back to course" />
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
        >
          {showForm ? "Cancel" : "+ New question"}
        </button>

        {showForm && (
          <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Your question..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => mutation.mutate()}
              disabled={!title || !body || mutation.isPending}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        )}

        <div className="space-y-2">
          {threads?.map((t) => (
            <Link
              key={t.id}
              href={`/${basePath}/courses/${slug}/discussions/${t.id}`}
              className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{t.title}</p>
                {t.isResolved && <span className="text-xs text-green-400">Resolved</span>}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-neutral-400">{t.body}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {t.student.fullName} · {t._count.replies} replies
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
