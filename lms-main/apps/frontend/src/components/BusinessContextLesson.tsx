"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CurriculumLessonBody } from "@/components/CurriculumLessonBody";
import { fetchAcademyMemberships, fetchContextHistory, fetchContextSnapshot, presentContextLesson, type LessonContextDetail, type LessonContextSnapshot } from "@/lib/curriculum.api";

/** Context is shown only after the server verifies membership, assignment and enrolment. */
export function BusinessContextLesson({ revisionId }: { revisionId: string }) {
  const cache = useQueryClient();
  const memberships = useQuery({ queryKey: ["academy-memberships"], queryFn: fetchAcademyMemberships, retry: false });
  const [companyId, setCompanyId] = useState("");
  const [view, setView] = useState<LessonContextDetail | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<LessonContextSnapshot[]>([]);
  useEffect(() => { setCompanyId(""); setView(null); setCursor(undefined); setHistory([]); }, [revisionId]);
  const companies = memberships.data ?? [];
  const selectedOrg = companyId || (companies.length === 1 ? companies[0].companyId : "");
  const historyQuery = useQuery({ queryKey: ["academy-context-history", selectedOrg, revisionId, cursor], queryFn: () => fetchContextHistory(selectedOrg, revisionId, cursor), enabled: !!selectedOrg, retry: false });
  const present = useMutation({ mutationFn: () => presentContextLesson(selectedOrg, revisionId), onSuccess: (result) => { setView(result); setHistory([]); setCursor(undefined); cache.invalidateQueries({ queryKey: ["academy-context-history", selectedOrg, revisionId] }); } });
  const historical = useMutation({ mutationFn: (id: string) => fetchContextSnapshot(selectedOrg, id), onSuccess: setView });
  const page = historyQuery.data;
  const visibleHistory = [...history, ...(page?.items ?? [])].filter((item, index, all) => all.findIndex(other => other.contextSnapshotId === item.contextSnapshotId) === index);
  // ACA-023 item 10: after "Load earlier presentations", focus moves to the first newly loaded snapshot.
  const historyList = useRef<HTMLOListElement>(null);
  const firstNewIndex = useRef<number | null>(null);
  useEffect(() => {
    if (firstNewIndex.current === null) return;
    const target = historyList.current?.querySelectorAll("button")[firstNewIndex.current];
    firstNewIndex.current = null;
    target?.focus();
  }, [visibleHistory.length]);
  return <section aria-label="Business-specific lesson context" className="mt-5 rounded-lg border border-slate-600 p-4">
    <h4 className="font-semibold">Your organisation&apos;s lesson</h4>
    <p className="mt-1 text-xs text-slate-300">Business-specific values are approved by your organisation. Each presentation is saved as a historical snapshot.</p>
    {memberships.isError && <p role="alert" className="mt-2 text-amber-300">Organisation membership could not be loaded.</p>}
    {companies.length > 1 && <label className="mt-3 block text-sm">Organisation<select className="ml-2 rounded bg-slate-700 p-2" value={selectedOrg} onChange={e => { setCompanyId(e.target.value); setView(null); setHistory([]); setCursor(undefined); }}><option value="">Select an organisation</option>{companies.map(m => <option key={m.companyId} value={m.companyId}>{m.company.name}</option>)}</select></label>}
    {selectedOrg && <>{/* ACA-023 item 1: aria-disabled keeps focus on the button while the lesson is prepared. */}<button type="button" className="mt-3 rounded bg-blue-700 px-3 py-2 text-sm aria-disabled:opacity-50" aria-disabled={present.isPending} onClick={() => { if (!present.isPending) present.mutate(); }}>{present.isPending ? "Preparing…" : "Open my organisation's lesson"}</button>
      {present.isError && <p role="alert" className="mt-2 text-amber-300">This lesson is not available for your current organisation assignment and enrolment, or it could not be loaded.</p>}
      {view && <article className="mt-4 border-t border-slate-600 pt-3"><p className="mb-3 text-xs text-slate-400">{view.contextSnapshotId ? `Snapshot ${view.contextSnapshotId.slice(0, 8)} · ` : ""}{view.presentedAt ? new Date(view.presentedAt).toLocaleString() : "New presentation"}</p><CurriculumLessonBody body={view.body} /></article>}
      <div className="mt-4 border-t border-slate-600 pt-3"><h5 className="text-sm font-semibold">Previous presentations</h5>{historyQuery.isError && <p role="alert" className="text-amber-300">Could not load lesson history.</p>}{historyQuery.isLoading && <p className="text-sm text-slate-400">Loading history…</p>}<ol ref={historyList} className="mt-2 space-y-1">{visibleHistory.map(item => <li key={item.contextSnapshotId}><button type="button" className="text-left text-sm text-blue-300 underline aria-disabled:opacity-50" aria-disabled={historical.isPending} aria-current={view?.contextSnapshotId === item.contextSnapshotId ? "true" : undefined} onClick={() => { if (!historical.isPending) historical.mutate(item.contextSnapshotId); }}>{new Date(item.presentedAt).toLocaleString()} · {item.contentHash.slice(0, 12)}</button></li>)}</ol>{historical.isError && <p role="alert" className="text-amber-300">Snapshot unavailable or integrity verification failed.</p>}{page?.nextCursor && <button type="button" className="mt-2 text-sm text-blue-300 underline" onClick={() => { firstNewIndex.current = visibleHistory.length; setHistory(visibleHistory); setCursor(page.nextCursor!); }}>Load earlier presentations</button>}</div>
    </>}
    {!memberships.isLoading && companies.length === 0 && <p className="mt-2 text-sm text-slate-400">Join an organisation to access business-specific lessons.</p>}
  </section>;
}
