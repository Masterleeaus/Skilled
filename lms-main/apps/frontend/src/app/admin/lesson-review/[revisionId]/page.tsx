"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AdminNav } from "@/components/AdminNav";
import { Topbar } from "@/components/Topbar";
import {
  failureFrom,
  fetchRevisionForReview,
  publishReviewedRevision,
  submitReviewDecision,
  type ApiFailure,
  type ReviewDecision,
} from "@/lib/lesson-review.api";

const DECISIONS: Array<{ value: ReviewDecision; label: string; help: string }> = [
  { value: "APPROVED", label: "Approve", help: "Allows publication of this exact content once the structural checks pass." },
  { value: "CHANGES_REQUESTED", label: "Request changes", help: "Returns the revision to its author. Notes are required." },
  { value: "REJECTED", label: "Reject", help: "Records that this content must not be published. Notes are required." },
];

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asText = (value: unknown): string => (typeof value === "string" ? value : "");
const asObject = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

function FailureNotice({ failure, id }: { failure: ApiFailure; id: string }) {
  return (
    <div id={id} role="alert" className="rounded border border-amber-600 bg-amber-950 p-3 text-sm text-amber-200">
      <p>{failure.message}</p>
      {failure.reasons.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {failure.reasons.map((reason) => <li key={reason.code}>{reason.message}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function LessonReviewPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const params = useParams<{ revisionId: string }>();
  const revisionId = params.revisionId;
  const cache = useQueryClient();
  const detail = useQuery({ queryKey: ["lesson-review", revisionId], queryFn: () => fetchRevisionForReview(revisionId), enabled: !!user && !!revisionId, retry: false });
  const [decision, setDecision] = useState<ReviewDecision>("APPROVED");
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");
  const [status, setStatus] = useState("");
  const [submitFailure, setSubmitFailure] = useState<ApiFailure | null>(null);
  const [publishFailure, setPublishFailure] = useState<ApiFailure | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const refresh = () => {
    cache.invalidateQueries({ queryKey: ["lesson-review", revisionId] });
    cache.invalidateQueries({ queryKey: ["lesson-review-queue"] });
  };

  const decide = useMutation({
    mutationFn: (input: { decision: ReviewDecision; contentHash: string; notes?: string }) => submitReviewDecision(revisionId, input),
    onSuccess: (_data, input) => {
      setNotes("");
      setNotesError("");
      setSubmitFailure(null);
      setStatus(`Decision recorded: ${DECISIONS.find((d) => d.value === input.decision)?.label ?? input.decision}.`);
      refresh();
    },
    onError: (error) => setSubmitFailure(failureFrom(error)),
  });

  const publish = useMutation({
    mutationFn: () => publishReviewedRevision(revisionId),
    onSuccess: () => {
      setPublishFailure(null);
      setStatus("Revision published.");
      refresh();
    },
    onError: (error) => setPublishFailure(failureFrom(error)),
  });

  if (!user) return null;
  if (detail.isLoading) return <><Topbar title="Lesson review" /><AdminNav /><main className="px-6 py-7 text-slate-100"><p role="status">Loading the revision.</p></main></>;
  if (detail.isError || !detail.data) {
    return (
      <>
        <Topbar title="Lesson review" />
        <AdminNav />
        <main className="mx-auto max-w-3xl space-y-4 px-6 py-7 text-slate-100">
          <p role="alert" className="text-amber-300">This revision could not be loaded. It may not exist, or your account may not have review access.</p>
          <Link href="/admin/lesson-review" className="text-blue-300 underline">Back to the review queue</Link>
        </main>
      </>
    );
  }

  const { revision, lesson, body, gate, publicationGate, reviews } = detail.data;
  const sections = asArray(body.instruction);
  const knowledgeChecks = asArray(body.knowledgeChecks);
  const templates = asArray(body.editableTemplates);
  const decisionLabel = DECISIONS.find((d) => d.value === decision);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = notes.trim();
    if (decision !== "APPROVED" && !trimmed) {
      setNotesError("Add notes explaining the decision.");
      notesRef.current?.focus();
      return;
    }
    setNotesError("");
    decide.mutate({ decision, contentHash: gate.currentHash, notes: trimmed || undefined });
  };

  return (
    <>
      <Topbar title="Lesson review" />
      <AdminNav />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-7 text-slate-100">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link href="/admin/lesson-review" className="text-blue-300 underline">Review queue</Link>
        </nav>

        <header className="space-y-1">
          <h1 className="text-xl font-semibold">{lesson.title}</h1>
          <p className="text-sm text-slate-400">
            <span className="font-mono">{lesson.sourceId}</span> · Revision {revision.version} · Status {revision.status} · {lesson.layer}
          </p>
        </header>

        <div aria-live="polite" className="min-h-[1.5rem] text-sm text-green-300">{status}</div>

        <section aria-labelledby="hash-heading" className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 id="hash-heading" className="font-medium">Content hash</h2>
          <p className="mt-2 break-all font-mono text-xs text-slate-300">{gate.currentHash}</p>
          <p className="mt-2 text-sm">
            {gate.hashIntegrity ? "The stored hash matches this content." : "The stored hash does not match this content. Publication is blocked."}
          </p>
          <p className="mt-1 text-sm">
            Latest decision for this exact content: {gate.latestDecisionForHash ?? "none yet"}.
          </p>
        </section>

        <section aria-labelledby="gate-heading" className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 id="gate-heading" className="font-medium">Publication gate</h2>
          <p className="mt-2 text-sm text-slate-300">
            Setting {publicationGate.setting} is {publicationGate.enabled ? "ON" : "OFF"}.
            {!publicationGate.enabled && " With the gate off, publication does not check approval or structure. Each publish is recorded as a gate bypass."}
          </p>
          <p className="mt-2 text-sm">
            {gate.allowed ? "This revision can be published now." : "This revision cannot be published yet."}
          </p>
          {gate.reasons.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-200">
              {gate.reasons.map((reason) => <li key={reason.code}>{reason.message}</li>)}
            </ul>
          )}
          <h3 className="mt-4 text-sm font-medium">Structural checks ({gate.structure.lessonKind} lesson)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {gate.structure.checks.map((check) => (
              <li key={check.id}>
                <span className="font-medium">{check.passed ? "Met" : "Not met"}:</span> {check.label}
                {!check.passed && <span className="text-amber-200"> ({check.detail})</span>}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded bg-green-800 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              disabled={!gate.allowed || publish.isPending}
              aria-describedby={gate.allowed ? undefined : "publish-note"}
              onClick={() => { setPublishFailure(null); publish.mutate(); }}
            >
              {publish.isPending ? "Publishing" : "Publish this revision"}
            </button>
            {!gate.allowed && <span id="publish-note" className="text-sm text-slate-400">Publishing is available after the reasons above are resolved.</span>}
          </div>
          {publishFailure && <div className="mt-3"><FailureNotice failure={publishFailure} id="publish-error" /></div>}
        </section>

        <section aria-labelledby="content-heading" className="space-y-4">
          <h2 id="content-heading" className="font-medium">Lesson content</h2>
          {asText(lesson.objective) && <p className="text-sm text-slate-300"><span className="font-medium">Objective:</span> {lesson.objective}</p>}

          {sections.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Instruction</h3>
              {sections.map((section, index) => {
                const item = asObject(section);
                const heading = asText(item.heading) || `Section ${index + 1}`;
                const bodyText = asText(item.body) || (typeof section === "string" ? section : "");
                return (
                  <article key={index} className="rounded border border-slate-800 p-3">
                    <h4 className="text-sm font-medium">{heading}</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{bodyText}</p>
                  </article>
                );
              })}
            </div>
          )}

          {asArray(body.procedure).length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Procedure</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                {asArray(body.procedure).map((step, index) => <li key={index}>{String(step)}</li>)}
              </ol>
            </div>
          )}

          {asArray(body.summary).length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Summary</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {asArray(body.summary).map((item, index) => <li key={index}>{String(item)}</li>)}
              </ul>
            </div>
          )}

          {asArray(body.qualityStandard).length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Quality standard</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {asArray(body.qualityStandard).map((item, index) => <li key={index}>{String(item)}</li>)}
              </ul>
            </div>
          )}

          {knowledgeChecks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Knowledge checks (answer key is held in the assessment file, not shown here)</h3>
              <ol className="mt-1 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                {knowledgeChecks.map((check, index) => {
                  const item = asObject(check);
                  return (
                    <li key={index}>
                      {asText(item.question)}
                      <ul className="mt-1 list-disc pl-5">{asArray(item.options).map((option, o) => <li key={o}>{String(option)}</li>)}</ul>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {templates.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Editable templates</h3>
              {templates.map((template, index) => {
                const item = asObject(template);
                return (
                  <div key={index} className="mt-1 text-sm text-slate-300">
                    <p className="font-medium">{asText(item.title) || asText(item.templateId)}</p>
                    <ul className="list-disc pl-5">{asArray(item.fields).map((field, f) => <li key={f}>{asText(asObject(field).label)}</li>)}</ul>
                  </div>
                );
              })}
            </div>
          )}

          <details className="rounded border border-slate-800 p-3">
            <summary className="cursor-pointer text-sm">Full revision content (JSON)</summary>
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{JSON.stringify(body, null, 2)}</pre>
          </details>
        </section>

        <section aria-labelledby="decision-heading" className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 id="decision-heading" className="font-medium">Reviewer decision</h2>
          <p className="mt-1 text-sm text-slate-400">The decision is recorded against the hash above. If the content changes, the decision no longer applies.</p>
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Decision</legend>
              {DECISIONS.map((option) => (
                <label key={option.value} className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={decision === option.value}
                    onChange={() => setDecision(option.value)}
                    className="mt-1 focus-visible:ring-2 focus-visible:ring-blue-400"
                  />
                  <span>
                    <span className="font-medium">{option.label}</span>
                    <span className="block text-slate-400">{option.help}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div>
              <label htmlFor="review-notes" className="block text-sm font-medium">Notes {decision === "APPROVED" ? "(optional)" : "(required)"}</label>
              <textarea
                id="review-notes"
                ref={notesRef}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-invalid={notesError ? true : undefined}
                aria-describedby={notesError ? "review-notes-error" : "review-notes-help"}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-800 p-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-400"
              />
              <p id="review-notes-help" className="mt-1 text-xs text-slate-400">Notes are shown in the review history.</p>
              {notesError && <p id="review-notes-error" role="alert" className="mt-1 text-sm text-amber-300">{notesError}</p>}
            </div>

            <button type="submit" disabled={decide.isPending} className="rounded bg-blue-700 px-4 py-2 text-sm disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
              {decide.isPending ? "Recording" : `Record decision: ${decisionLabel?.label ?? decision}`}
            </button>
            {submitFailure && <FailureNotice failure={submitFailure} id="submit-error" />}
          </form>
        </section>

        <section aria-labelledby="history-heading" className="space-y-2">
          <h2 id="history-heading" className="font-medium">Review history</h2>
          {reviews.length === 0 && <p className="text-sm text-slate-400">No decisions recorded for this revision.</p>}
          {reviews.length > 0 && (
            <ol className="space-y-2 text-sm">
              {reviews.map((review) => (
                <li key={review.id} className="rounded border border-slate-800 p-3">
                  <p>
                    <span className="font-medium">{review.decision}</span>
                    {" · "}{review.reviewer?.fullName ?? "Unknown reviewer"}
                    {" · "}{new Date(review.decidedAt).toLocaleString("en-AU")}
                    {review.contentHash === gate.currentHash ? " · current content" : " · earlier content"}
                  </p>
                  {review.notes && <p className="mt-1 whitespace-pre-wrap text-slate-300">{review.notes}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>

        {detail.isFetching && <p role="status" className="text-sm text-slate-400">Refreshing</p>}
      </main>
    </>
  );
}
