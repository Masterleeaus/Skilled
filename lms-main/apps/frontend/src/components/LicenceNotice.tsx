"use client";

import { LICENCE_NOTICE_BODY, LICENCE_NOTICE_TITLE } from "@/lib/licence-notice";

/** Shown above lesson content. It states that the lesson does not grant a licence. */
export function LicenceNotice({ points }: { points: string[] }) {
  if (points.length === 0) return null;
  return (
    <aside aria-labelledby="licence-notice-title" className="mb-5 rounded-lg border-2 border-amber-400 bg-amber-950 p-4 text-amber-50">
      <h4 id="licence-notice-title" className="text-base font-semibold text-amber-200">{LICENCE_NOTICE_TITLE}</h4>
      <p className="mt-1 text-sm">{LICENCE_NOTICE_BODY}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {points.map((point, index) => <li key={index}>{point}</li>)}
      </ul>
    </aside>
  );
}
