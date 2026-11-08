/**
 * Publishes the curriculum files into the Academy database. Run from apps/backend.
 *
 *   npm run publish:curriculum          publish once, then exit
 *   npm run publish:curriculum:watch    publish now, then again after each change under curriculum/
 *
 * Needs the backend settings in apps/backend/.env (DATABASE_URL and the rest, loaded as usual) and
 * CURRICULUM_PUBLISH_ACTOR_ID, the ID of an existing user. That user is recorded on each revision and audit entry
 * this script writes. Set CURRICULUM_DIR to publish from another curriculum folder.
 *
 * Prints a JSON summary of counts and warnings. It never prints a key, a rationale or a connection string.
 * Exit code is 1 when the run itself fails. Lessons refused by the run are listed as warnings.
 */
import { watch } from "node:fs";
import path from "node:path";
import { prisma } from "../src/config/prisma";
import { publishCurriculumFiles } from "../src/modules/curriculum/curriculum-publisher";
import { curriculumRoot } from "../src/modules/curriculum/file-lesson-loader";

/** Folders under curriculum/ that hold publishable input. Other folders (research, planning, reports) are ignored. */
const WATCHED_FOLDERS = new Set(["courses", "shared", "structure", "assessments"]);
/** Editors and copy tools write several events per save. One run covers a burst of them. */
const DEBOUNCE_MS = 1500;

function actorId(): string {
  const id = process.env.CURRICULUM_PUBLISH_ACTOR_ID?.trim();
  if (!id) throw new Error("CURRICULUM_PUBLISH_ACTOR_ID is not set. Set it to the ID of an existing user.");
  return id;
}

async function publishOnce(): Promise<void> {
  const root = curriculumRoot();
  const summary = await publishCurriculumFiles({ root, actorId: actorId() });
  console.log(JSON.stringify(summary, null, 2));
}

/** Publishes now, then after each change to a watched folder. Runs never overlap; a change during a run queues one more. */
function watchAndPublish(): void {
  const root = curriculumRoot();
  let timer: NodeJS.Timeout | undefined;
  let running = false;
  let queued = false;

  const run = async (): Promise<void> => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await publishOnce();
    } catch (error) {
      console.error(`Curriculum publish failed: ${(error as Error).message}`);
    } finally {
      running = false;
    }
    if (queued) {
      queued = false;
      schedule();
    }
  };

  const schedule = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), DEBOUNCE_MS);
  };

  const watcher = watch(root, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const relative = String(filename);
    const [top] = relative.split(path.sep);
    if (WATCHED_FOLDERS.has(top) && relative.endsWith(".json")) schedule();
  });
  watcher.on("error", (error) => console.error(`Watcher stopped: ${error.message}`));
  console.log(`Watching ${root} for changes. Press Ctrl+C to stop.`);
  void run();
}

async function main(): Promise<void> {
  // Check the actor before anything else, so a missing setting fails at once rather than on the first change.
  actorId();
  if (process.argv.includes("--watch")) {
    watchAndPublish();
    return;
  }
  try {
    await publishOnce();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`Curriculum publish failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
