"use client";

import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CurriculumLessonBody } from "@/components/CurriculumLessonBody";
import { fetchSuperadminLesson, saveSuperadminLesson, type SuperadminLesson, type SuperadminLessonStatus } from "@/lib/superadmin-curriculum.api";

// Keys the server will not change. Shown read-only where useful.
const PROTECTED_KEYS = new Set(["id", "title", "courseSlugs", "lessonType", "reviewStatus", "status", "knowledgeChecks", "knowledgeCheck"]);
const STATUSES: SuperadminLessonStatus[] = ["DRAFT", "READY"];

function labelFor(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, c => c.toUpperCase());
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.response?.status === 409) return "This lesson changed since you opened it. Reload it, then apply your edit again.";
  }
  return "Save failed. Check the lesson and try again.";
}

/** One lesson with superadmin controls: a field for each editable key, a status control, and save. */
export function SuperadminLessonEditor({ lessonId, onSaved }: { lessonId: string; onSaved: (message: string) => void }) {
  const lesson = useQuery({ queryKey: ["superadmin-lesson", lessonId], queryFn: () => fetchSuperadminLesson(lessonId), retry: false });
  if (lesson.isPending) return <p role="status" className="text-sm text-neutral-400">Loading lesson…</p>;
  if (lesson.isError || !lesson.data) return <p role="alert" className="text-sm text-amber-300">This lesson could not be loaded. It may be missing from the curriculum files.</p>;
  // Keyed by the file hash: after a save the form reloads with the new file, so no stale draft is kept.
  return <LessonForm key={lesson.data.sourceHash} lesson={lesson.data} onSaved={onSaved} />;
}

function LessonForm({ lesson, onSaved }: { lesson: SuperadminLesson; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const formId = useId();
  const editableKeys = Object.keys(lesson.record).filter(key => !PROTECTED_KEYS.has(key));
  const initialText = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value, null, 2));
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(editableKeys.map(key => [key, initialText(lesson.record[key])])));
  const [status, setStatus] = useState<string>(lesson.status);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const changedKeys = editableKeys.filter(key => drafts[key] !== initialText(lesson.record[key]));
  const statusChanged = STATUSES.includes(status as SuperadminLessonStatus) && status !== lesson.status;
  const dirty = changedKeys.length > 0 || statusChanged;

  const save = useMutation({
    mutationFn: async () => {
      const changes: Record<string, unknown> = {};
      const errors: Record<string, string> = {};
      for (const key of changedKeys) {
        const original = lesson.record[key];
        if (typeof original === "string") {
          changes[key] = drafts[key];
          continue;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(drafts[key]);
        } catch {
          errors[key] = "This section must be valid JSON. Check commas, quotes and brackets.";
          continue;
        }
        // The server accepts text, a list, an object or null for these keys. Numbers and true/false are refused.
        if (typeof parsed === "number" || typeof parsed === "boolean") {
          errors[key] = "This section must be a list, an object or text.";
          continue;
        }
        changes[key] = parsed;
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) throw new Error("validation");
      return saveSuperadminLesson(lesson.id, {
        expectedHash: lesson.sourceHash,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
        status: statusChanged ? (status as SuperadminLessonStatus) : undefined,
      });
    },
    onSuccess: async () => {
      setFormError(null);
      await client.invalidateQueries({ queryKey: ["superadmin-lesson", lesson.id] });
      await client.invalidateQueries({ queryKey: ["superadmin-course-lessons"] });
      onSaved(`Saved "${lesson.record.title ?? lesson.id}".`);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validation") return;
      setFormError(errorMessage(error));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold">{String(lesson.record.title ?? lesson.id)}</h2>
          <p className="mt-1 text-xs text-neutral-400">{lesson.id} · {lesson.file}</p>
          {typeof lesson.record.moduleTitle === "string" && <p className="text-xs text-neutral-400">Module: {lesson.record.moduleTitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400">Status</span>
            <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm">
              {STATUSES.map(option => <option key={option} value={option}>{option === "READY" ? "Approved (READY)" : "Draft"}</option>)}
            </select>
          </label>
          <button type="button" disabled={!dirty || save.isPending} onClick={() => { setFormError(null); save.mutate(); }} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {save.isPending ? "Saving…" : "Save lesson"}
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-400">Status records your approval in the lesson file. It does not publish the lesson to learners.</p>
      {formError && <p role="alert" className="text-sm text-red-300">{formError}</p>}

      <div className="space-y-5">
        {editableKeys.map(key => {
          const isText = typeof lesson.record[key] === "string";
          const fieldId = `${formId}-${key}`;
          const hintId = `${fieldId}-hint`;
          const errorId = `${fieldId}-error`;
          const describedBy = [isText ? null : hintId, fieldErrors[key] ? errorId : null].filter(Boolean).join(" ") || undefined;
          return (
            <div key={key} className="block space-y-1">
              <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-200">{labelFor(key)}</label>
              <textarea
                id={fieldId}
                value={drafts[key]}
                onChange={e => {
                  const text = e.target.value;
                  setDrafts(prev => ({ ...prev, [key]: text }));
                  // Clear this field's error as soon as it is edited, so a stale message does not stay on screen.
                  setFieldErrors(prev => {
                    if (!(key in prev)) return prev;
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }}
                rows={isText ? 5 : 10}
                spellCheck={isText}
                aria-invalid={fieldErrors[key] ? true : undefined}
                aria-describedby={describedBy}
                className={`w-full rounded border bg-neutral-900 p-2 font-mono text-xs leading-relaxed ${fieldErrors[key] ? "border-red-400" : "border-neutral-700"}`}
              />
              {!isText && <span id={hintId} className="block text-xs text-neutral-500">Structured content, edited as JSON.</span>}
              {fieldErrors[key] && <span id={errorId} role="alert" className="block text-xs text-red-300">{fieldErrors[key]}</span>}
            </div>
          );
        })}
      </div>

      {"knowledgeChecks" in lesson.record && (
        <section className="rounded border border-neutral-800 p-3 text-sm text-neutral-400">
          <p className="font-medium text-neutral-300">Knowledge checks are not editable here.</p>
          <p className="mt-1">They are graded against the published revision and its answer keys, so changing them here would break grading. Change them through the review process.</p>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-300">Preview of the saved lesson</h3>
        <div className="rounded border border-neutral-800 p-4">
          <CurriculumLessonBody body={lesson.record} />
        </div>
      </section>
    </div>
  );
}
