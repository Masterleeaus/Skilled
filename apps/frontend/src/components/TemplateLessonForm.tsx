"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadTemplateDocument,
  fetchTemplateLesson,
  fieldErrorsFrom,
  saveTemplateDraft,
  submitTemplate,
  type TemplateDefinition,
} from "@/lib/template.api";
import { initialFormValues, missingRequiredLabels, toPayload, type FormValues, type TemplateFieldDef } from "@/lib/template-form";

const inputClass = "mt-1 w-full rounded bg-slate-900 p-2 text-sm text-slate-100 disabled:opacity-60";

/** Fill-in template for a template lesson. The server decides validity; these checks only help the learner. */
export function TemplateLessonForm({ lessonId, revisionId }: { lessonId: string; revisionId: string }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["academy-template-lesson", lessonId, revisionId],
    queryFn: () => fetchTemplateLesson(lessonId, revisionId),
    retry: false,
  });
  if (query.isLoading) return <p className="mt-6 text-sm text-slate-400">Loading the template…</p>;
  if (query.isError) return <p role="alert" className="mt-6 text-sm text-amber-300">This template is not available. It needs an active course enrolment that includes this lesson.</p>;
  const templates = query.data?.templates ?? [];
  if (!templates.length) return null;
  const refresh = () => client.invalidateQueries({ queryKey: ["academy-template-lesson", lessonId, revisionId] });
  return (
    <section aria-label="Fill-in template" className="mt-6 space-y-6">
      <h4 className="text-base font-semibold">Complete the template</h4>
      <p className="text-sm text-slate-300">Save a draft as you go. When every required field is complete, submit it for assessor review. Your document is issued only after the assessor signs it off.</p>
      {templates.map(template => (
        <TemplateCard key={template.templateId} lessonId={lessonId} revisionId={revisionId} template={template} onChanged={refresh} />
      ))}
    </section>
  );
}

function TemplateCard({ lessonId, revisionId, template, onChanged }: { lessonId: string; revisionId: string; template: TemplateDefinition; onChanged: () => void }) {
  const fields = template.fields;
  const status = template.response?.status ?? "NEW";
  const locked = status === "SUBMITTED" || status === "SIGNED_OFF";
  const [form, setForm] = useState<FormValues>(() => initialFormValues(fields, template.response?.fieldValues));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Re-read the saved copy when the server status changes (submit, changes requested, sign-off).
  const serverKey = `${status}|${template.response?.submittedAt ?? ""}|${template.document?.id ?? ""}`;
  useEffect(() => {
    setForm(initialFormValues(fields, template.response?.fieldValues));
    setFieldErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey, template.templateId]);

  const onError = (error: unknown, fallback: string) => {
    const errors = fieldErrorsFrom(error);
    setFieldErrors(errors ?? {});
    setMessage({ tone: "error", text: errors ? "Some answers need correcting. Check the highlighted fields." : fallback });
  };
  const save = useMutation({
    mutationFn: () => saveTemplateDraft(lessonId, revisionId, template.templateId, toPayload(fields, form)),
    onSuccess: () => { setFieldErrors({}); setMessage({ tone: "ok", text: "Draft saved." }); onChanged(); },
    onError: error => onError(error, "The draft could not be saved. Please try again."),
  });
  const submit = useMutation({
    mutationFn: () => submitTemplate(lessonId, revisionId, template.templateId, toPayload(fields, form)),
    onSuccess: () => { setFieldErrors({}); setMessage({ tone: "ok", text: "Submitted for assessor review." }); onChanged(); },
    onError: error => onError(error, "The template could not be submitted. Please try again."),
  });

  const missing = missingRequiredLabels(fields, form);
  const busy = save.isPending || submit.isPending;

  function requestSubmit() {
    if (missing.length) {
      const missingIds = fields.filter(f => f.required && missingRequiredLabels([f], form).length > 0).map(f => f.fieldId);
      setFieldErrors(Object.fromEntries(missingIds.map(id => [id, "This field is required."])));
      setMessage({ tone: "error", text: `Complete the required fields: ${missing.join(", ")}.` });
      return;
    }
    submit.mutate();
  }

  async function download() {
    if (!template.document) return;
    setDownloading(true);
    try {
      const blob = await downloadTemplateDocument(template.document.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${template.templateId}-v${template.document.version}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ tone: "error", text: "The document could not be downloaded. Please try again." });
    } finally {
      setDownloading(false);
    }
  }

  const statusText: Record<string, string> = {
    NEW: "Not started.",
    IN_PROGRESS: "Draft. Submit when every required field is complete.",
    SUBMITTED: "Submitted. An assessor is reviewing it against the checks below.",
    SIGNED_OFF: "Signed off by an assessor. Your document is ready to download.",
  };

  return (
    <article aria-label={template.title} className="rounded-lg border border-slate-600 p-4">
      <h5 className="font-semibold">{template.title}</h5>
      <p className="mt-1 text-sm text-slate-300">{template.purpose}</p>
      <p className="mt-2 text-xs text-slate-400" aria-live="polite">{statusText[status] ?? statusText.NEW}</p>

      <form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); requestSubmit(); }} noValidate>
        {fields.map(field => (
          <FieldInput
            key={field.fieldId}
            templateId={template.templateId}
            field={field}
            value={form[field.fieldId] ?? ""}
            disabled={locked || busy}
            error={fieldErrors[field.fieldId]}
            onChange={value => setForm(current => ({ ...current, [field.fieldId]: value }))}
          />
        ))}

        {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>{message.text}</p>}

        {!locked && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded bg-slate-700 px-4 py-2 text-sm disabled:opacity-50" disabled={busy} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save draft"}
            </button>
            <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium disabled:opacity-50" disabled={busy}>
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        )}
      </form>

      {status === "SIGNED_OFF" && template.document && (
        <button type="button" className="mt-4 rounded bg-emerald-700 px-4 py-2 text-sm font-medium disabled:opacity-50" disabled={downloading} onClick={download}>
          {downloading ? "Preparing PDF…" : `Download document (version ${template.document.version})`}
        </button>
      )}

      <details className="mt-4 text-sm text-slate-300">
        <summary className="cursor-pointer text-slate-200">How this template is assessed</summary>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          {template.assessmentRubric.map(item => (
            <li key={item.criterion}><span className="font-medium text-slate-100">{item.criterion}.</span> Meets: {item.levels.meets} Does not meet: {item.levels.does_not_meet}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function FieldInput({ templateId, field, value, disabled, error, onChange }: {
  templateId: string;
  field: TemplateFieldDef;
  value: string;
  disabled: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `tpl-${templateId}-${field.fieldId}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(" ");
  const common = {
    id,
    disabled,
    value,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    "aria-required": field.required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: inputClass,
  };
  const hint = {
    text: "",
    longtext: "",
    number: "",
    currency: "Enter an amount with at most two decimal places.",
    date: "",
    checklist: "One item per line.",
    table: "One row per line. Separate cells with a vertical bar (|).",
  }[field.type];

  let control;
  switch (field.type) {
    case "longtext":
      control = <textarea {...common} rows={5} maxLength={10000} />;
      break;
    case "number":
      control = <input {...common} type="number" step="any" />;
      break;
    case "currency":
      control = <input {...common} type="number" step="0.01" min="0" inputMode="decimal" />;
      break;
    case "date":
      control = <input {...common} type="date" />;
      break;
    case "checklist":
    case "table":
      control = <textarea {...common} rows={4} />;
      break;
    default:
      control = <input {...common} type="text" maxLength={500} />;
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-100">
        {field.label}{field.required ? <span className="ml-1 text-amber-300">(required)</span> : <span className="ml-1 text-slate-400">(optional)</span>}
      </label>
      <p className="mt-1 text-sm text-slate-300">{field.prompt}</p>
      <p id={hintId} className="text-xs text-slate-400">{[field.guidance, hint].filter(Boolean).join(" ")}</p>
      {control}
      {error && <p id={errorId} className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
