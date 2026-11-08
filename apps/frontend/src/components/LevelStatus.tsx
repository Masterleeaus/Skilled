import type { LearnerLevels, LevelKey, LevelSummary } from "@/lib/curriculum.api";

const LEVEL_NAME: Record<LevelKey, string> = { base: "Base", group: "Group", specialised: "Specialised" };
const STATUS_TEXT: Record<LevelSummary["status"], string> = { locked: "Locked", in_progress: "In progress", finished: "Finished" };

/** Each level's status is written as text, and a locked level states what it is waiting on. */
export function LevelStatus({ levels }: { levels: LearnerLevels }) {
  return (
    <section aria-labelledby="level-status-heading" className="mb-4">
      <h3 id="level-status-heading" className="mb-2 text-sm font-semibold">Levels</h3>
      <ol className="space-y-2">
        {levels.levels.map((level) => (
          <li key={level.level} className="rounded bg-slate-800 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{LEVEL_NAME[level.level]} level</span>
              <span className="rounded bg-slate-700 px-2 py-0.5 text-xs">{STATUS_TEXT[level.status]}</span>
            </div>
            <p className="mt-1 text-slate-300">
              {level.completedCount} of {level.lessonCount} lessons acknowledged
              {level.knowledgeCheckLessons > 0 && <>. Knowledge checks passed: {level.knowledgeChecksPassed} of {level.knowledgeCheckLessons}</>}.
            </p>
            {level.reason && <p className="mt-1 text-amber-300">{level.reason}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
