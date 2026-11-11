"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AdminNav } from "@/components/AdminNav";
import { Topbar } from "@/components/Topbar";
import { approveOrganisationBusinessField, fetchAcademyMemberships, fetchBusinessFieldRegistry, fetchOrganisationBusinessFields, retireOrganisationBusinessField, saveOrganisationBusinessField, type BusinessField } from "@/lib/curriculum.api";

function formatValue(value: BusinessField["value"]): string { return Array.isArray(value) ? value.join("\n") : String(value); }
function parseValue(text: string, old?: BusinessField["value"]): BusinessField["value"] {
  if (Array.isArray(old)) return text.split("\n").map(x => x.trim()).filter(Boolean);
  if (typeof old === "boolean") return text.trim().toLowerCase() === "true";
  if (typeof old === "number") { const value = Number(text); if (!Number.isFinite(value) || !text.trim()) throw new Error("Enter a valid number"); return value; }
  return text.trim();
}
export default function BusinessContextAdminPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const cache = useQueryClient();
  const memberships = useQuery({ queryKey: ["academy-memberships"], queryFn: fetchAcademyMemberships, enabled: !!user });
  const registry = useQuery({ queryKey: ["academy-business-field-registry"], queryFn: fetchBusinessFieldRegistry, enabled: !!user });
  const [companyId, setCompanyId] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const companies = memberships.data ?? [];
  const selected = companyId || (companies.length === 1 ? companies[0].companyId : "");
  const fields = useQuery({ queryKey: ["academy-business-fields", selected], queryFn: () => fetchOrganisationBusinessFields(selected), enabled: !!selected && !!user, retry: false });
  const rows = useMemo(() => { const map = new Map((fields.data ?? []).map(x => [x.fieldKey, x])); return (registry.data ?? []).filter(key => key.toLowerCase().includes(search.toLowerCase())).map(key => ({ key, field: map.get(key) })); }, [fields.data, registry.data, search]);
  const refresh = () => cache.invalidateQueries({ queryKey: ["academy-business-fields", selected] });
  const save = useMutation({ mutationFn: ({ key, value }: { key: string; value: BusinessField["value"] }) => saveOrganisationBusinessField(selected, key, value), onSuccess: () => { setEditing(null); setError(""); refresh(); } });
  const approve = useMutation({ mutationFn: (key: string) => approveOrganisationBusinessField(selected, key), onSuccess: refresh });
  const retire = useMutation({ mutationFn: (key: string) => retireOrganisationBusinessField(selected, key), onSuccess: refresh });
  if (!user) return null;
  return <><Topbar title="Business-specific lesson configuration"/><AdminNav/><main className="mx-auto max-w-5xl space-y-5 px-6 py-7 text-slate-100">
    <p className="text-sm text-slate-400">Set the values used in your organisation&apos;s training. Saving creates a draft; only explicitly approved values appear in learner lessons. Previously presented lessons remain preserved.</p>
    {memberships.isError && <p role="alert">Could not load organisation memberships.</p>}
    <label className="block text-sm">Organisation <select aria-label="Organisation" className="ml-3 rounded bg-slate-800 p-2" value={selected} onChange={e => { setCompanyId(e.target.value); setEditing(null); }}><option value="">Select organisation</option>{companies.map(m => <option key={m.companyId} value={m.companyId}>{m.company.name}</option>)}</select></label>
    {selected && <><label className="block text-sm">Filter fields <input className="ml-3 rounded bg-slate-800 p-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. safety, equipment" /></label>
      {fields.isError && <p role="alert" className="text-amber-300">Configuration is unavailable. Only organisation owners and managers may edit these fields.</p>}
      {(registry.isLoading || fields.isLoading) && <p>Loading configuration…</p>}
      {rows.map(({ key, field }) => <section key={key} className="rounded-lg border border-slate-700 bg-slate-900 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">{key.replaceAll(".", " / ").replaceAll("_", " ")}</h2><span className="text-xs text-slate-400">{field?.status ?? "NOT SET"}{field ? ` · Revision ${field.revision}` : ""}</span></div>
        {editing === key ? <div className="mt-3 space-y-2"><label className="block text-sm" htmlFor={`value-${key}`}>Field value</label><textarea id={`value-${key}`} rows={3} className="w-full rounded border border-slate-600 bg-slate-800 p-2" value={draft} onChange={e => setDraft(e.target.value)}/><p className="text-xs text-slate-400">For list fields, enter one item per line. Review before approval.</p><button className="rounded bg-blue-700 px-3 py-2 disabled:opacity-50" disabled={save.isPending} onClick={() => { try { setError(""); save.mutate({ key, value: parseValue(draft, field?.value) }); } catch (e) { setError(String(e)); } }}>Save draft</button><button className="ml-3 underline" onClick={() => setEditing(null)}>Cancel</button></div> : <><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{field ? formatValue(field.value) : "Not configured"}</p><div className="mt-3 flex flex-wrap gap-3 text-sm"><button className="text-blue-300 underline" onClick={() => { setEditing(key); setDraft(field ? formatValue(field.value) : ""); setError(""); }}>{field ? "Edit draft" : "Configure"}<span className="sr-only"> for {key}</span></button>{field?.status === "DRAFT" && <button className="text-green-300 underline disabled:opacity-50" disabled={approve.isPending} onClick={() => approve.mutate(key)}>Approve for learners<span className="sr-only"> for {key}</span></button>}{field && field.status !== "RETIRED" && <button className="text-amber-300 underline disabled:opacity-50" disabled={retire.isPending} onClick={() => { if (window.confirm(`Retire ${key} from future lesson presentations?`)) retire.mutate(key); }}>Retire<span className="sr-only"> {key}</span></button>}</div></>}
      </section>)}
      {error && <p role="alert" className="text-amber-300">{error}</p>}
      {(save.isError || approve.isError || retire.isError) && <p role="alert" className="text-amber-300">Operation failed. Check your permissions and retry.</p>}
    </>}
  </main></>;
}
