#!/usr/bin/env node
/**
 * End-to-end API smoke test for the Titan Academy LMS backend.
 *
 * Runs against a live API that was started with a seeded, throwaway database. Uses Node's built-in fetch only.
 * Each step prints PASS, FAIL or BLOCKED. BLOCKED means the step could not be exercised for a stated reason
 * (for example object storage is absent, or no published academy content exists). BLOCKED is never counted as a pass.
 * Exits 1 when any step FAILs. Exits 2 when the API is unreachable.
 *
 * Usage (from lms-main/, after `pnpm -C apps/backend dev` is running against a seeded database):
 *   node scripts/smoke-e2e.mjs
 *   API_BASE=http://127.0.0.1:5000/api node scripts/smoke-e2e.mjs
 *
 * Environment:
 *   API_BASE          API root (default http://127.0.0.1:5000/api)
 *   SMOKE_PASSWORD    shared demo password from prisma/seed.ts (default Password123!)
 *   SMOKE_COURSE      legacy seeded course slug (default nodejs-masterclass)
 *
 * The script writes demo rows: one quiz on the seeded course, its questions and one attempt. Run it only against
 * a database you own and can reseed. It never prints access tokens or password values.
 */

const API_BASE = (process.env.API_BASE || "http://127.0.0.1:5000/api").replace(/\/+$/, "");
const PASSWORD = process.env.SMOKE_PASSWORD || "Password123!";
const COURSE_SLUG = process.env.SMOKE_COURSE || "nodejs-masterclass";
const TIMEOUT_MS = 20000;

const results = [];
const tokens = {};

function record(id, name, result, detail) {
  results.push({ id, name, result, detail });
  console.log(`${result.padEnd(7)} ${id} ${name}: ${detail}`);
}

async function call(method, path, { token, body, headers = {} } = {}) {
  const init = { method, headers: { accept: "application/json", ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "manual" };
  if (token) init.headers.authorization = `Bearer ${token}`;
  if (body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const response = await fetch(API_BASE + path, init);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, json, text };
}

const dataOf = (res) => (res.json && typeof res.json === "object" ? res.json.data : undefined);
const messageOf = (res) => (res.json?.message ?? res.text.slice(0, 160));

/** Wraps one step so that an exception becomes a FAIL for that step only. */
async function step(id, name, fn) {
  try {
    await fn();
  } catch (error) {
    record(id, name, "FAIL", `exception: ${error?.message ?? error}`);
  }
}

// Expected denials are PASS only when the API refuses with the expected status.
function expectDenied(id, name, res, expectedStatus) {
  if (res.status === expectedStatus) record(id, name, "PASS", `denied with HTTP ${expectedStatus}`);
  else record(id, name, "FAIL", `expected HTTP ${expectedStatus}, got ${res.status}: ${messageOf(res)}`);
}

async function main() {
  // Reachability first. If the API is down, nothing else can be meaningful.
  try {
    await call("GET", "/health");
  } catch (error) {
    console.error(`API not reachable at ${API_BASE}: ${error.message}`);
    process.exit(2);
  }

  let storageReady = false;
  let courseId = null;
  let courseLessons = [];

  await step("S01", "health", async () => {
    const res = await call("GET", "/health");
    const checks = dataOf(res)?.checks;
    if (!checks) return record("S01", "health", "FAIL", `no checks object, HTTP ${res.status}: ${messageOf(res)}`);
    storageReady = checks.storage === "ok";
    if (checks.database !== "ok" || checks.redis !== "ok") {
      return record("S01", "health", "FAIL", `database=${checks.database} redis=${checks.redis} storage=${checks.storage}`);
    }
    if (checks.storage === "down") {
      return record("S01", "health", "PASS", `database=ok redis=ok storage=down (HTTP ${res.status}); expected while MinIO is absent`);
    }
    record("S01", "health", "PASS", `all dependencies ok (HTTP ${res.status}); MinIO reachable`);
  });

  const roles = [
    ["S02", "login admin", "admin@lms.local", "ADMIN"],
    ["S03", "login teacher", "teacher@lms.local", "TEACHER"],
    ["S04", "login student", "student@lms.local", "STUDENT"],
  ];
  for (const [id, name, email, role] of roles) {
    await step(id, name, async () => {
      const res = await call("POST", "/auth/login", { body: { email, password: PASSWORD } });
      const token = dataOf(res)?.accessToken;
      if (res.status !== 200 || !token) return record(id, name, "FAIL", `HTTP ${res.status}: ${messageOf(res)}`);
      const me = await call("GET", "/auth/me", { token });
      const actual = dataOf(me)?.role ?? dataOf(me)?.user?.role;
      if (me.status !== 200 || actual !== role) return record(id, name, "FAIL", `/auth/me HTTP ${me.status}, role ${actual}, expected ${role}`);
      tokens[role] = token;
      record(id, name, "PASS", `role ${role} confirmed by /auth/me`);
    });
  }

  await step("S05", "course listing", async () => {
    const res = await call("GET", "/courses");
    const list = dataOf(res);
    if (res.status !== 200 || !Array.isArray(list)) return record("S05", "course listing", "FAIL", `HTTP ${res.status}, body is not an array`);
    const seeded = list.find((c) => c.slug === COURSE_SLUG);
    if (!seeded) return record("S05", "course listing", "FAIL", `${COURSE_SLUG} missing from ${list.length} published courses`);
    courseId = seeded.id;
    record("S05", "course listing", "PASS", `${list.length} published courses; ${COURSE_SLUG} present`);
  });

  await step("S06", "learner course view", async () => {
    if (!tokens.STUDENT) return record("S06", "learner course view", "BLOCKED", "no student token (S04 failed)");
    const res = await call("GET", `/courses/${COURSE_SLUG}`, { token: tokens.STUDENT });
    const course = dataOf(res);
    const lessons = (course?.modules ?? []).flatMap((m) => m.lessons ?? []);
    if (res.status !== 200 || !lessons.length) return record("S06", "learner course view", "FAIL", `HTTP ${res.status}, ${lessons.length} lessons`);
    courseLessons = lessons;
    record("S06", "learner course view", "PASS", `course "${course.title}" with ${course.modules.length} module(s), ${lessons.length} lesson(s)`);
  });

  await step("S07", "learner enrolment progress", async () => {
    if (!tokens.STUDENT || !courseId) return record("S07", "learner enrolment progress", "BLOCKED", "no student token or course ID");
    const res = await call("GET", `/enrollments/${courseId}/progress`, { token: tokens.STUDENT });
    if (res.status !== 200) return record("S07", "learner enrolment progress", "FAIL", `HTTP ${res.status}: ${messageOf(res)}`);
    record("S07", "learner enrolment progress", "PASS", "progress readable for the enrolled student");
  });

  await step("S08", "lesson acknowledgement (course lesson)", async () => {
    if (!tokens.STUDENT || !courseLessons.length) return record("S08", "lesson acknowledgement (course lesson)", "BLOCKED", "no student token or lessons");
    const lesson = courseLessons[0];
    const res = await call("PATCH", `/enrollments/lessons/${lesson.id}/progress`, { token: tokens.STUDENT, body: { watchedSeconds: 0, completed: true } });
    if (res.status !== 200) return record("S08", "lesson acknowledgement (course lesson)", "FAIL", `HTTP ${res.status}: ${messageOf(res)}`);
    record("S08", "lesson acknowledgement (course lesson)", "PASS", `lesson "${lesson.title}" acknowledged, HTTP 200`);
  });

  await step("S09", "academy lesson acknowledgement", async () => {
    if (!tokens.STUDENT) return record("S09", "academy lesson acknowledgement", "BLOCKED", "no student token");
    record("S09", "academy lesson acknowledgement", "BLOCKED",
      "no PUBLISHED academy lesson revision exists on a fresh database: the review gate holds every lesson and answer keys need an approval record (see publish summary in the report)");
  });

  await step("S09d", "denied: acknowledge unpublished academy revision", async () => {
    const res = await call("POST", "/academy/curriculum/completions", { token: tokens.STUDENT, body: { lessonId: "missing-lesson", revisionId: "missing-revision" } });
    expectDenied("S09d", "denied: acknowledge unpublished academy revision", res, 403);
  });

  // Knowledge check through the legacy quiz system on the seeded course. Setup is by the teacher, the attempt by the student.
  let quizId = null;
  let attemptId = null;
  let questions = [];
  await step("S10", "knowledge check submission and grading (course quiz)", async () => {
    if (!tokens.TEACHER || !tokens.STUDENT || !courseId) return record("S10", "knowledge check submission and grading (course quiz)", "BLOCKED", "missing tokens or course");
    const created = await call("POST", "/quizzes", { token: tokens.TEACHER, body: { courseId, title: `Smoke check ${Date.now()}`, totalMarks: 2, passingMarks: 1, timeLimitMinutes: 15 } });
    quizId = dataOf(created)?.id;
    if (created.status !== 201 || !quizId) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `create quiz HTTP ${created.status}: ${messageOf(created)}`);
    const qs = [
      { text: "Which answer is correct?", type: "SINGLE_CHOICE", marks: 1, options: [{ text: "Right", isCorrect: true }, { text: "Wrong" }] },
      { text: "Pick the other correct answer", type: "SINGLE_CHOICE", marks: 1, options: [{ text: "Nope" }, { text: "Yes", isCorrect: true }] },
    ];
    for (const q of qs) {
      const added = await call("POST", `/quizzes/${quizId}/questions`, { token: tokens.TEACHER, body: q });
      if (added.status !== 201) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `add question HTTP ${added.status}: ${messageOf(added)}`);
    }
    const published = await call("PATCH", `/quizzes/${quizId}/publish`, { token: tokens.TEACHER });
    if (published.status !== 200) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `publish HTTP ${published.status}: ${messageOf(published)}`);

    const take = await call("GET", `/quizzes/${quizId}/take`, { token: tokens.STUDENT });
    questions = dataOf(take)?.questions ?? [];
    if (take.status !== 200 || questions.length !== 2) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `take HTTP ${take.status}, ${questions.length} question(s)`);
    if (/"isCorrect"/.test(take.text)) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", "answer key (isCorrect) sent to the student");

    const started = await call("POST", `/quizzes/${quizId}/attempts`, { token: tokens.STUDENT });
    attemptId = dataOf(started)?.id;
    if (started.status !== 201 || !attemptId) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `start attempt HTTP ${started.status}: ${messageOf(started)}`);

    // One correct answer and one wrong answer: expect 1 of 2 marks, which meets passingMarks 1.
    const correct = (q) => q.options.find((o) => o.text === "Right" || o.text === "Yes");
    const wrong = (q) => q.options.find((o) => o.text !== "Right" && o.text !== "Yes");
    const answers = [
      { questionId: questions[0].id, selectedOptionId: correct(questions[0]).id },
      { questionId: questions[1].id, selectedOptionId: wrong(questions[1]).id },
    ];
    const submitted = await call("POST", `/quizzes/attempts/${attemptId}/submit`, { token: tokens.STUDENT, body: { answers } });
    const result = dataOf(submitted);
    if (submitted.status !== 200) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `submit HTTP ${submitted.status}: ${messageOf(submitted)}`);
    const score = result?.marksObtained;
    if (result?.status !== "GRADED" || score !== 1) return record("S10", "knowledge check submission and grading (course quiz)", "FAIL", `expected GRADED with marksObtained 1, got status ${result?.status}, marksObtained ${score}`);
    record("S10", "knowledge check submission and grading (course quiz)", "PASS", `quiz ${quizId}: 1 correct of 2 submitted, status GRADED, marksObtained ${score}/2, answer key not sent to student`);
  });

  await step("S10a", "academy knowledge check submission and grading", async () => {
    record("S10a", "academy knowledge check submission and grading", "BLOCKED",
      "needs a PUBLISHED academy lesson revision with approved answer keys; none exist on a fresh database (answer keys held: no approval record)");
  });

  await step("S10d", "denied: academy knowledge-check attempt on unpublished revision", async () => {
    const res = await call("POST", "/academy/curriculum/knowledge-checks/attempts", { token: tokens.STUDENT, body: { lessonId: "missing-lesson", revisionId: "missing-revision", answers: [0] } });
    expectDenied("S10d", "denied: academy knowledge-check attempt on unpublished revision", res, 403);
  });

  await step("S11", "practical evidence submission", async () => {
    // Evidence is submitted as URLs, so object storage is not needed for this route. It still needs a PUBLISHED
    // practical revision, an organisation assignment and membership, none of which exist on a fresh database.
    record("S11", "practical evidence submission", "BLOCKED", `needs a PUBLISHED academy practical revision and an organisation assignment (none on a fresh database). Object storage is ${storageReady ? "up" : "down"}; evidence is URL-based so storage is not the blocker`);
  });

  await step("S11d", "denied: practical evidence for unpublished revision", async () => {
    const res = await call("POST", "/academy/curriculum/practical-evidence", {
      token: tokens.STUDENT,
      body: { companyId: "missing-company", lessonId: "missing-lesson", revisionId: "missing-revision", description: "Smoke probe evidence text", evidenceUrls: ["https://example.com/evidence"] },
    });
    expectDenied("S11d", "denied: practical evidence for unpublished revision", res, 403);
  });

  await step("S12", "assessor approval", async () => {
    record("S12", "assessor approval", "BLOCKED", "no practical evidence can be pending (S11 blocked); assessor approval needs an organisation ASSESSOR and a PENDING record from another learner");
  });

  await step("S12d", "denied: student approves practical evidence", async () => {
    const res = await call("POST", "/academy/curriculum/companies/missing-company/practical-evidence/missing-id/review", {
      token: tokens.STUDENT,
      body: { decision: "APPROVED", feedback: "Smoke probe feedback text", expiresAt: undefined },
    });
    expectDenied("S12d", "denied: student approves practical evidence", res, 403);
  });

  await step("S13a", "denied: request without a token", async () => {
    const res = await call("GET", "/admin/users");
    expectDenied("S13a", "denied: request without a token", res, 401);
  });

  await step("S13b", "denied: student calls admin route", async () => {
    const res = await call("GET", "/admin/users", { token: tokens.STUDENT });
    expectDenied("S13b", "denied: student calls admin route", res, 403);
  });

  await step("S13c", "denied: student creates a quiz", async () => {
    const res = await call("POST", "/quizzes", { token: tokens.STUDENT, body: { courseId: courseId ?? "missing", title: "Denied smoke quiz", totalMarks: 1, passingMarks: 0, timeLimitMinutes: 1 } });
    expectDenied("S13c", "denied: student creates a quiz", res, 403);
  });

  await step("S14", "video upload (object storage)", async () => {
    if (storageReady) return record("S14", "video upload (object storage)", "BLOCKED", "storage is up but this smoke script does not upload media");
    record("S14", "video upload (object storage)", "BLOCKED", "object storage (MinIO) is down; uploads are disabled");
  });

  // Summary
  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0 };
  for (const r of results) counts[r.result] += 1;
  console.log("\n| Step | Result | Check |");
  console.log("| --- | --- | --- |");
  for (const r of results) console.log(`| ${r.id} | ${r.result} | ${r.name} |`);
  console.log(`\nSUMMARY: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED`);
  if (quizId) console.log(`quiz created by this run: ${quizId}, attempt ${attemptId ?? "none"}`);
  if (counts.FAIL > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
