"use client";

import type { ReactNode } from "react";
import { LicenceNotice } from "@/components/LicenceNotice";
import { licenceNoticePoints } from "@/lib/licence-notice";

type LessonBody = Record<string, unknown>;
const headingLabels: Record<string, string> = {
  objectives: "Learning objectives", learningOutcomes: "Learning outcomes", introduction: "Introduction",
  overview: "Overview", instructions: "Instructions", procedure: "Procedure", steps: "Procedure",
  equipment: "Equipment and materials", materials: "Materials", safety: "Safety precautions",
  hazards: "Hazards and controls", examples: "Worked examples", example: "Worked example",
  knowledgeChecks: "Knowledge checks", knowledgeCheck: "Knowledge check", summary: "Summary",
  resources: "Further resources", keyPoints: "Key points", assessment: "Assessment guidance",
};
function readable(key: string) { return headingLabels[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, c => c.toUpperCase()); }
function safeUrl(value: string): string | null {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function renderValue(value: unknown, depth = 0): ReactNode {
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") return <p className="whitespace-pre-wrap text-slate-200">{String(value)}</p>;
  if (Array.isArray(value)) return <ol className="list-decimal space-y-2 pl-5">{value.map((item, i) => <li key={i}>{renderValue(item, depth + 1)}</li>)}</ol>;
  if (typeof value === "object") {
    if (depth > 6) return <p className="text-slate-400">Additional structured content available in the lesson source.</p>;
    const object = value as Record<string, unknown>;
    return <div className="space-y-3">{Object.entries(object).filter(([, item]) => item != null).map(([key, item]) => {
      if (key === "url" && typeof item === "string") { const href = safeUrl(item); return href ? <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Open resource (opens in a new tab)</a> : null; }
      return <section key={key} className="space-y-1"><h5 className="font-medium text-slate-100">{readable(key)}</h5>{renderValue(item, depth + 1)}</section>;
    })}</div>;
  }
  return null;
}
/** Photo strip from the lesson's `images` field. Only library paths are accepted. */
function ImageStrip({ images }: { images: unknown }) {
  if (!Array.isArray(images)) return null;
  // ACA-023 item 6: an image without alt text is not rendered. An empty alt would mark it decorative, and a missing alt would announce the file name.
  // The lesson schema should require alt; that check is outside this file.
  const items = images.filter((item): item is { src: string; alt: string } =>
    typeof item === "object" && item !== null && typeof (item as { src?: unknown }).src === "string"
    && (item as { src: string }).src.startsWith("/academy/library/")
    && typeof (item as { alt?: unknown }).alt === "string" && (item as { alt: string }).alt.trim() !== "");
  if (items.length === 0) return null;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map((item, i) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={i} src={item.src} alt={item.alt} loading="lazy" className="w-full rounded-lg object-cover" />
  ))}</div>;
}

/** Renders structured lesson JSON as React text, never raw HTML. External URLs are protocol-checked. */
export function CurriculumLessonBody({ body }: { body: LessonBody | null | undefined }) {
  if (!body || Object.keys(body).length === 0) return <p className="text-amber-200">Instructional material has not been added to this lesson yet.</p>;
  const preferred = ["introduction", "overview", "objectives", "learningOutcomes", "safety", "hazards", "equipment", "materials", "procedure", "steps", "instructions", "examples", "example", "keyPoints", "summary", "knowledgeChecks", "knowledgeCheck", "assessment", "resources"];
  // Template lessons render their fill-in form separately, so the raw template structure is not shown as content.
  const templateOnly = body.lessonKind === "template" ? new Set(["editableTemplates", "outputDocument", "assessmentRubric"]) : new Set<string>();
  const ordered = Object.keys(body).filter(key => key !== "knowledgeChecks" && key !== "knowledgeCheck" && key !== "images" && !templateOnly.has(key)).sort((a, b) => {
    const ai = preferred.indexOf(a), bi = preferred.indexOf(b);
    return (ai < 0 ? preferred.length : ai) - (bi < 0 ? preferred.length : bi);
  });
  return <>
    <LicenceNotice points={licenceNoticePoints(body)} />
    <ImageStrip images={body.images} />
    <div className="space-y-5 text-sm leading-relaxed">{ordered.map(key => <section key={key} className="space-y-2"><h4 className="text-base font-semibold text-slate-100">{readable(key)}</h4>{renderValue(body[key])}</section>)}</div>
  </>;
}
