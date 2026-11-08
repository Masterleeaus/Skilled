"use client";

import { BookOpen, CircleAlert, ShieldCheck } from "lucide-react";
import { DEFAULT_LICENCE_TRACK, type LicenceTrack, type LicenceTrackSummary } from "@/lib/curriculum.api";

const OPTIONS: Array<{ value: LicenceTrack; title: string; explain: string; Icon: typeof BookOpen }> = [
  {
    value: "non-licensed",
    title: "Non-licensed",
    explain: "Covers the work that can be done without a licence. Work that needs a licence is named below and left out of this track.",
    Icon: BookOpen,
  },
  {
    value: "licensed",
    title: "Licensed",
    explain: "Includes the lessons on work that needs a licence, as well as the rest. It does not grant a licence.",
    Icon: ShieldCheck,
  },
];

const lessonCount = (n: number) => `${n} ${n === 1 ? "lesson" : "lessons"}`;

interface Props {
  track: LicenceTrack;
  onChange: (next: LicenceTrack) => void;
  summary: LicenceTrackSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

/** Choose the licence track for a course. Shows each track's lesson count and the lessons that need a licence. */
export function LicenceTrackChooser({ track, onChange, summary, isLoading, isError }: Props) {
  const excludedInTrack = track === "non-licensed" ? "Left out of this track" : "Included in this track";
  return (
    <section aria-labelledby="licence-track-heading" className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h3 id="licence-track-heading" className="text-sm font-medium text-neutral-300">Choose your track</h3>
      <p className="mt-1 text-xs text-neutral-500">Pick one track. Your choice decides which lessons are listed.</p>

      <div role="radiogroup" aria-labelledby="licence-track-heading" className="mt-3 grid gap-3 md:grid-cols-2">
        {OPTIONS.map(({ value, title, explain, Icon }) => {
          const selected = track === value;
          const count = summary?.counts[value];
          return (
            <label
              key={value}
              className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition ${
                selected ? "border-white bg-neutral-800" : "border-neutral-800 hover:bg-neutral-800/60"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium text-white">
                  <Icon size={16} aria-hidden="true" />
                  {title}
                </span>
                {value === DEFAULT_LICENCE_TRACK && <span className="text-xs text-neutral-400">Default</span>}
              </span>
              <span className="text-sm text-neutral-400">{explain}</span>
              <span className="text-xs text-neutral-300">{count !== undefined ? lessonCount(count) : isLoading ? "Counting lessons…" : ""}</span>
              <span className="flex items-center gap-2 text-sm text-neutral-200">
                <input
                  type="radio"
                  name="licence-track"
                  value={value}
                  checked={selected}
                  onChange={() => onChange(value)}
                  className="h-4 w-4 shrink-0 appearance-none rounded-full border border-neutral-500 checked:border-white checked:bg-white checked:shadow-[inset_0_0_0_3px_var(--color-neutral-800)]"
                />
                <span>{selected ? `${title} track selected` : `Choose ${title.toLowerCase()} track`}</span>
              </span>
            </label>
          );
        })}
      </div>

      {isError && <p role="status" className="mt-3 text-xs text-amber-300">Lesson counts are unavailable right now. You can still choose a track.</p>}

      {summary && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <CircleAlert size={16} aria-hidden="true" className="text-amber-300" />
              Needs a licence
            </h4>
            {summary.needsLicence.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {summary.needsLicence.map((item) => (
                  <li key={item.title} className="rounded-md bg-neutral-950 p-2">
                    <span className="font-medium text-neutral-200">{item.title}</span>
                    <span className="ml-2 text-xs text-amber-300">{excludedInTrack}</span>
                    <p className="mt-1 text-neutral-400">{item.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">No lessons in this course need a licence.</p>
            )}
          </div>

          {summary.limited.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-neutral-300">Work limits (in both tracks)</h4>
              <ul className="mt-2 space-y-1 text-sm text-neutral-400">
                {summary.limited.map((item) => (
                  <li key={item.title}>
                    <span className="text-neutral-200">{item.title}:</span> {item.limit}. Work over this limit needs a licence.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
