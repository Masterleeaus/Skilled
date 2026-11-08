"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Topbar } from "@/components/Topbar";
import { AdminNav } from "@/components/AdminNav";
import { SuperadminLessonEditor } from "@/components/SuperadminLessonEditor";
import { fetchSuperadminCourseLessons, type SuperadminLessonRow } from "@/lib/superadmin-curriculum.api";

export default function SuperadminCurriculumPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const lessons = useQuery({
    queryKey: ["superadmin-course-lessons", courseSlug],
    queryFn: () => fetchSuperadminCourseLessons(courseSlug),
    enabled: !!user && !!courseSlug,
    retry: false,
  });

  if (!user) return null;

  const rows = lessons.data ?? [];
  const groups = rows.reduce<Record<string, SuperadminLessonRow[]>>((acc, row) => {
    const key = row.moduleTitle ?? "No module";
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div>
      <Topbar title="Lesson editor" backHref="/admin/courses" backLabel="All courses" />
      <AdminNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <p className="mb-6 rounded border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-200">
          Superadmin editing. Saving changes the lesson file on the server. Every save is recorded in the audit log.
        </p>
        {lessons.isPending && <p className="text-neutral-400">Loading lessons…</p>}
        {lessons.isError && <p role="alert" className="text-amber-300">The lesson list could not be loaded.</p>}
        {lessons.data && rows.length === 0 && <p className="text-neutral-400">No lesson files list this course ({courseSlug}).</p>}

        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <aside className="space-y-5">
            <p className="text-sm text-neutral-400">{rows.length} lessons · {rows.filter(r => r.status === "READY").length} approved</p>
            {Object.entries(groups).map(([module, items]) => (
              <section key={module}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{module}</h3>
                <ul className="space-y-1">
                  {items.map(row => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => { setMessage(null); setSelectedId(row.id); }}
                        aria-current={selectedId === row.id ? "true" : undefined}
                        className={`flex w-full items-start justify-between gap-2 rounded px-2 py-1.5 text-left text-sm ${selectedId === row.id ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-900"}`}
                      >
                        <span>{row.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${row.status === "READY" ? "bg-green-500/10 text-green-400" : "bg-neutral-700/50 text-neutral-400"}`}>
                          {row.status === "READY" ? "Approved" : "Draft"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </aside>

          <section className="min-w-0">
            {/* The status region stays in the DOM so screen readers announce the save message when it appears. */}
            <div role="status">
              {message && <p className="mb-4 rounded border border-green-700/50 bg-green-950/30 p-3 text-sm text-green-200">{message}</p>}
            </div>
            {selectedId
              ? <SuperadminLessonEditor key={selectedId} lessonId={selectedId} onSaved={setMessage} />
              : <p className="text-neutral-400">Choose a lesson to view and edit it.</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
