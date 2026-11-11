"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCourseForManagement } from "@/lib/course-detail.api";
import {
  createModule,
  createLesson,
  setPublishStatus,
  uploadLessonVideo,
} from "@/lib/course-mutations.api";
import { Topbar } from "@/components/Topbar";

export default function ManageCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const queryClient = useQueryClient();

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({});

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseForManagement(slug),
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["course", slug] });

  const addModule = useMutation({
    mutationFn: () => createModule(course!.id, newModuleTitle),
    onSuccess: () => {
      setNewModuleTitle("");
      invalidate();
    },
  });

  const addLesson = useMutation({
    mutationFn: (moduleId: string) => createLesson(moduleId, newLessonTitle[moduleId] ?? ""),
    onSuccess: (_data, moduleId) => {
      setNewLessonTitle((prev) => ({ ...prev, [moduleId]: "" }));
      invalidate();
    },
  });

  const togglePublish = useMutation({
    mutationFn: () => setPublishStatus(course!.id, !course!.isPublished),
    onSuccess: invalidate,
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Failed to update"),
  });

  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

  const uploadVideo = useMutation({
    mutationFn: ({ lessonId, file }: { lessonId: string; file: File }) =>
      uploadLessonVideo(lessonId, file),
    onMutate: ({ lessonId }) => setUploadingLessonId(lessonId),
    onSuccess: invalidate,
    onError: (err: unknown) => alert(apiErrorMessage(err) ?? "Video upload failed"),
    onSettled: () => setUploadingLessonId(null),
  });

  if (!user) return null;
  if (isLoading) return <p className="p-8 text-neutral-400">Loading...</p>;
  if (!course) return <p className="p-8 text-neutral-400">Course not found.</p>;

  return (
    <div>
      <Topbar title={course.title} backHref="/teacher" backLabel="My Courses" />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div>
            <p className="text-sm text-neutral-400">Status</p>
            <p className="font-medium">{course.isPublished ? "Published" : "Draft"}</p>
          </div>
          <button
            onClick={() => togglePublish.mutate()}
            disabled={togglePublish.isPending}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            {course.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>

        <div className="space-y-4">
          {course.modules.map((mod) => (
            <div key={mod.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="font-medium">{mod.title}</h3>

              <ul className="mt-2 space-y-2 text-sm text-neutral-400">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between gap-2">
                    <span>• {lesson.title}</span>
                    <span className="flex items-center gap-2">
                      {lesson.videoUrl ? (
                        <span className="text-xs text-green-400">Video attached</span>
                      ) : uploadingLessonId === lesson.id ? (
                        <span className="text-xs text-neutral-500">Uploading...</span>
                      ) : (
                        <label className="cursor-pointer text-xs text-neutral-300 underline underline-offset-2">
                          Upload video
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadVideo.mutate({ lessonId: lesson.id, file });
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2">
                <input
                  value={newLessonTitle[mod.id] ?? ""}
                  onChange={(e) =>
                    setNewLessonTitle((prev) => ({ ...prev, [mod.id]: e.target.value }))
                  }
                  placeholder="New lesson title"
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
                />
                <button
                  onClick={() => addLesson.mutate(mod.id)}
                  disabled={!newLessonTitle[mod.id] || addLesson.isPending}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50"
                >
                  Add lesson
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="New module title"
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            onClick={() => addModule.mutate()}
            disabled={!newModuleTitle || addModule.isPending}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            Add module
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-neutral-800 pt-6">
          <Link
            href={`/teacher/courses/${slug}/students`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            👥 Students
          </Link>
          <Link
            href={`/teacher/courses/${slug}/quizzes`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            Assessments & grading
          </Link>
          <Link
            href={`/teacher/courses/${slug}/quizzes/new`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            + Add quiz
          </Link>
          <Link
            href={`/teacher/courses/${slug}/assignments`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            Assignment thresholds
          </Link>
          <Link
            href={`/teacher/courses/${slug}/assignments/new`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            + Add assignment
          </Link>
          <Link
            href={`/teacher/courses/${slug}/live-classes`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            📅 Live classes
          </Link>
          <Link
            href={`/teacher/courses/${slug}/discussions`}
            className="flex-1 rounded-lg border border-neutral-700 py-2 text-center text-sm hover:bg-neutral-800"
          >
            💬 Discussions
          </Link>
        </div>
      </main>
    </div>
  );
}
