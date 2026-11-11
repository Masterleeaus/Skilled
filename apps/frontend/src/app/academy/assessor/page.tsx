"use client";

import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Topbar } from "@/components/Topbar";
import { fetchAcademyMemberships } from "@/lib/curriculum.api";
import { fetchPendingPracticalEvidence, reviewPracticalEvidence, type PendingPracticalEvidence, type PracticalEvidenceDecision } from "@/lib/assessor.api";

const ASSESSOR_ROLES = ["OWNER", "MANAGER", "ASSESSOR"];
const MIN_NOTES = 10;
const MAX_NOTES = 5000;

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as AxiosError<{ message?: string }>)?.response?.data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export default function AssessorPracticalEvidencePage() {
  const { user } = useRequireAuth();
  const cache = useQueryClient();
  const statusRef = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const memberships = useQuery({ queryKey: ["academy-memberships"], queryFn: fetchAcademyMemberships, enabled: !!user });
  const assessorOrgs = (memberships.data ?? []).filter(m => m.role && ASSESSOR_ROLES.includes(m.role));
  const companyId = chosen || (assessorOrgs.length === 1 ? assessorOrgs[0].companyId : "");
  const pending = useQuery({
    queryKey: ["academy-pending-evidence", companyId],
    queryFn: () => fetchPendingPracticalEvidence(companyId),
    enabled: !!companyId && !!user,
    retry: false,
  });
  if (!user) return null;

  const items = pending.data ?? [];
  const recorded = (outcome: "approved" | "rejected", evidenceId: string) => {
    setAnnouncement(`Evidence ${evidenceId} ${outcome}. The decision is recorded.`);
    cache.invalidateQueries({ queryKey: ["academy-pending-evidence", companyId] });
    statusRef.current?.focus();
  };

  return <>
    <Topbar title="Practical evidence review" />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl space-y-6 px-6 py-7 text-slate-100">
      <p className="text-sm text-slate-300">
        Review practical evidence submitted by learners. Approving evidence creates a verified competency. A knowledge check result is not practical evidence.
      </p>

      {memberships.isError && <p role="alert" className="text-amber-300">Could not load your organisations. Try again.</p>}
      {memberships.isSuccess && assessorOrgs.length === 0 && <p className="text-slate-300">You do not hold an assessor, manager or owner role in any organisation.</p>}

      {assessorOrgs.length > 1 && (
        <div>
          <label htmlFor="organisation-select" className="text-sm">Organisation</label>
          <select id="organisation-select" className="ml-3 rounded bg-slate-800 p-2" value={companyId} onChange={e => setChosen(e.target.value)}>
            <option value="">Select an organisation</option>
            {assessorOrgs.map(m => <option key={m.companyId} value={m.companyId}>{m.company.name}</option>)}
          </select>
        </div>
      )}

      <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="min-h-6 text-sm text-green-300 focus:outline-none">{announcement}</div>

      {companyId && pending.isLoading && <p>Loading evidence awaiting approval…</p>}
      {companyId && pending.isError && <p role="alert" className="text-amber-300">Evidence could not be loaded. Only organisation owners, managers and assessors can view it.</p>}
      {companyId && pending.isSuccess && items.length === 0 && <p className="text-slate-300">No evidence is waiting for a decision.</p>}
      {items.length > 0 && <h2 className="text-lg font-medium">{items.length} {items.length === 1 ? "item" : "items"} awaiting decision</h2>}

      <ol className="space-y-5">
        {items.map(item => <li key={item.id}><EvidenceReviewCard companyId={companyId} item={item} onRecorded={recorded} /></li>)}
      </ol>
    </main>
  </>;
}

function EvidenceReviewCard({ companyId, item, onRecorded }: {
  companyId: string;
  item: PendingPracticalEvidence;
  onRecorded: (outcome: "approved" | "rejected", evidenceId: string) => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [notes, setNotes] = useState("");
  const [expiry, setExpiry] = useState("");
  const [formError, setFormError] = useState("");
  const headingId = `evidence-${item.id}-heading`;
  const notesId = `evidence-${item.id}-notes`;
  const notesHintId = `evidence-${item.id}-notes-hint`;
  const expiryId = `evidence-${item.id}-expiry`;
  const expiryHintId = `evidence-${item.id}-expiry-hint`;
  const errorId = `evidence-${item.id}-error`;
  const mutation = useMutation({
    mutationFn: (payload: PracticalEvidenceDecision) => reviewPracticalEvidence(companyId, item.id, payload),
    onSuccess: () => onRecorded(decision === "APPROVED" ? "approved" : "rejected", item.id),
    onError: error => setFormError(errorMessage(error, "The decision was not recorded. Check your assessor role and try again.")),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const feedback = notes.trim();
    if (feedback.length < MIN_NOTES) return setFormError(`Enter assessor notes of at least ${MIN_NOTES} characters.`);
    if (feedback.length > MAX_NOTES) return setFormError(`Assessor notes must be ${MAX_NOTES} characters or fewer.`);
    let expiresAt: string | undefined;
    if (decision === "APPROVED" && expiry) {
      const end = new Date(`${expiry}T23:59:59`);
      if (Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) return setFormError("The expiry date must be in the future, or left blank.");
      expiresAt = end.toISOString();
    }
    setFormError("");
    mutation.mutate({ decision, feedback, ...(expiresAt ? { expiresAt } : {}) });
  }

  return (
    <article aria-labelledby={headingId} className="rounded-lg border border-slate-700 bg-slate-900 p-5">
      <h3 id={headingId} className="font-medium">Lesson {item.lessonId}</h3>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-slate-300">
        <dt className="text-slate-400">Learner reference</dt><dd>{item.learnerId}</dd>
        <dt className="text-slate-400">Submitted</dt><dd><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-AU")}</time></dd>
      </dl>
      <h4 className="mt-4 text-sm font-medium">Learner description</h4>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{item.description}</p>
      {item.evidenceUrls.length > 0 && <>
        <h4 className="mt-4 text-sm font-medium">Evidence links</h4>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {item.evidenceUrls.map((url, index) => <li key={url}><a className="text-blue-300 underline" href={url} target="_blank" rel="noopener noreferrer">Evidence link {index + 1} (opens in a new tab)</a></li>)}
        </ul>
      </>}

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Decision</legend>
          <label className="mr-6 inline-flex items-center gap-2 text-sm">
            <input type="radio" name={`decision-${item.id}`} value="APPROVED" checked={decision === "APPROVED"} onChange={() => setDecision("APPROVED")} className="h-4 w-4" />
            Approve
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name={`decision-${item.id}`} value="REJECTED" checked={decision === "REJECTED"} onChange={() => setDecision("REJECTED")} className="h-4 w-4" />
            Reject
          </label>
        </fieldset>

        <div>
          <label htmlFor={notesId} className="block text-sm font-medium">Assessor notes (required)</label>
          <p id={notesHintId} className="text-xs text-slate-400">Record what you observed against each practical criterion. Between {MIN_NOTES} and {MAX_NOTES} characters. The learner sees these notes.</p>
          <textarea id={notesId} rows={4} maxLength={MAX_NOTES} value={notes} onChange={e => setNotes(e.target.value)} aria-describedby={formError ? `${notesHintId} ${errorId}` : notesHintId} aria-invalid={formError.startsWith("Enter assessor notes") ? true : undefined} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 p-2 text-sm" />
        </div>

        {decision === "APPROVED" && (
          <div>
            <label htmlFor={expiryId} className="block text-sm font-medium">Competency expiry date (optional)</label>
            <p id={expiryHintId} className="text-xs text-slate-400">Leave blank for no expiry. Only applies to approvals.</p>
            <input id={expiryId} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} aria-describedby={expiryHintId} className="mt-1 rounded border border-slate-600 bg-slate-800 p-2 text-sm" />
          </div>
        )}

        {formError && <p id={errorId} role="alert" className="text-sm text-amber-300">{formError}</p>}
        {mutation.isError && !formError && <p role="alert" className="text-sm text-amber-300">The decision was not recorded.</p>}

        <button type="submit" disabled={mutation.isPending} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium disabled:opacity-50">
          {mutation.isPending ? "Recording decision…" : decision === "APPROVED" ? "Approve evidence" : "Reject evidence"}
        </button>
      </form>
    </article>
  );
}
