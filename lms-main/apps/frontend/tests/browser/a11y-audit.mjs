#!/usr/bin/env node
/**
 * ACA-023 accessibility regression check for learner, assessor and manager pages.
 *
 * Covers login and registration, course browsing, the course player, quizzes, practical evidence
 * submission, assessor review and the manager context pages. Each page is rendered against mocked API
 * responses (Playwright routing), so no backend, database or CORS setup is needed. Axe-core runs on each
 * page in the dark theme, the design target, and the check fails on any violation.
 *
 * Not run in CI. Run it by hand, the same way as academy-browser-suite.mjs:
 *   node tests/browser/a11y-audit.mjs [--report <path>]
 *   BASE_URL=http://localhost:3101 node tests/browser/a11y-audit.mjs   # reuse a server started with
 *     NEXT_PUBLIC_API_URL=$BASE_URL/__mock_api
 *   A11Y_COLOR=light node tests/browser/a11y-audit.mjs                 # light theme, see the report for open items
 *
 * Exit codes: 0 all passed, 1 at least one page has a violation, 2 setup failure (server, browser or axe missing).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(here, '../..');
const require = createRequire(path.join(frontendDir, 'package.json'));
const reportIndex = process.argv.indexOf('--report');
const reportPath = reportIndex >= 0 ? path.resolve(process.argv[reportIndex + 1] ?? '') : null;
const PORT = Number(process.env.PORT ?? 3101);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const MOCK_API = `${BASE_URL}/__mock_api`;
const COLOR_SCHEME = process.env.A11Y_COLOR === 'light' ? 'light' : 'dark';

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    fail(`Playwright is not resolvable from ${frontendDir}: ${error.message}`);
  }
}

/** Finds axe-core without adding a dependency: env override, direct resolution, then the pnpm store. */
function findAxe() {
  if (process.env.AXE_CORE_PATH) return process.env.AXE_CORE_PATH;
  try {
    return require.resolve('axe-core/axe.min.js');
  } catch {
    // fall through to the pnpm store
  }
  const store = path.resolve(frontendDir, '../../node_modules/.pnpm');
  if (fs.existsSync(store)) {
    const match = fs.readdirSync(store).filter((name) => name.startsWith('axe-core@')).sort().pop();
    if (match) {
      const candidate = path.join(store, match, 'node_modules/axe-core/axe.min.js');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  fail('axe-core not found; set AXE_CORE_PATH to axe.min.js', 2);
}

const { chromium } = loadPlaywright();
const AXE_PATH = findAxe();

// ---------- mock API ----------
const ORG = { companyId: 'org-1', company: { id: 'org-1', name: 'Organisation One' } };
const USERS = {
  STUDENT: { id: 'learner-1', email: 'learner1@example.test', fullName: 'Learner One', role: 'STUDENT' },
  TEACHER: { id: 'teacher-1', email: 'teacher1@example.test', fullName: 'Teacher One', role: 'TEACHER' },
  ADMIN: { id: 'admin-1', email: 'admin1@example.test', fullName: 'Admin One', role: 'ADMIN' },
};
const LESSON_BODY = {
  introduction: 'Training for the crew on the approved kit.',
  procedure: ['Prepare the kit', 'Work from top to bottom'],
  knowledgeChecks: [
    { question: 'Which tool is used first?', options: ['Scanner', 'Vacuum', 'Brush'] },
    { question: 'What is the approved cleaner?', options: ['Water', 'Approved product'] },
  ],
};
const OUTLINE = {
  courseId: 'course-1',
  licenceTrack: 'non-licensed',
  tracks: [{
    id: 'ct-1',
    position: 1,
    required: true,
    track: {
      id: 'tr-1',
      slug: 'tr-one',
      title: 'Track One',
      scope: 'UNIVERSAL',
      placements: [
        { id: 'pl-1', position: 1, required: true, lesson: { id: 'lesson-a', sourceId: 'TST-A', title: 'Lesson A', layer: 'UNIVERSAL', serviceGroup: 'GENERAL' }, revision: { id: 'rev-a1', version: 1, status: 'PUBLISHED', body: LESSON_BODY } },
        { id: 'pl-2', position: 2, required: false, lesson: { id: 'lesson-b', sourceId: 'TST-B', title: 'Lesson B', layer: 'UNIVERSAL', serviceGroup: 'GENERAL' }, revision: { id: 'rev-b1', version: 1, status: 'PUBLISHED', body: { introduction: 'Optional reading on equipment care.' } } },
      ],
    },
  }],
};
const COURSE = { id: 'course-1', title: 'Field Safety', slug: 'field-safety', description: 'Course', price: '0', isPublished: true, teacher: { id: 't-1', fullName: 'Teacher' }, modules: [], _count: { enrollments: 2, reviews: 0 } };
const QUIZ = {
  id: 'quiz-1', title: 'Field safety quiz', totalMarks: 5, passingMarks: 3, timeLimitMinutes: 10, isPublished: true,
  questions: [
    { id: 'q1', text: 'Which PPE is required?', type: 'SINGLE_CHOICE', marks: 2, options: [{ id: 'o1', text: 'Gloves' }, { id: 'o2', text: 'Hat' }] },
    { id: 'q2', text: 'Select the hazards', type: 'MULTIPLE_CHOICE', marks: 2, options: [{ id: 'o3', text: 'Slips' }, { id: 'o4', text: 'Noise' }] },
    { id: 'q3', text: 'Describe the controls', type: 'TEXT', marks: 1, options: [] },
  ],
};
const PENDING_EVIDENCE = [{
  id: 'ev-1', companyId: 'org-1', learnerId: 'learner-1', lessonId: 'lesson-a', revisionId: 'rev-a1',
  description: 'I completed the isolation procedure on the test rig.',
  evidenceUrls: ['https://example.test/photo-1'], status: 'PENDING', createdAt: new Date().toISOString(),
}];
const REGISTRY = ['business.name', 'business.support_phone', 'safety.required_ppe'];
const FIELDS = [
  { fieldKey: 'business.name', value: 'Acme Field Services', status: 'APPROVED', revision: 1, sourceSystem: null, updatedAt: new Date().toISOString() },
  { fieldKey: 'safety.required_ppe', value: ['Gloves', 'Hat'], status: 'DRAFT', revision: 2, sourceSystem: null, updatedAt: new Date().toISOString() },
];

function json(data, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify({ success: status < 400, message: 'Success', data, errors: [] }) };
}

/** Answers the API calls these pages make. Unknown GETs return an empty list, unknown writes an empty object. */
function handleApi(role, method, pathname) {
  if (pathname === '/auth/refresh') return role ? json({ accessToken: 'a11y-access-token' }) : json(null, 401);
  if (pathname === '/auth/me') return json(USERS[role]);
  if (pathname === '/academy/curriculum/companies/me') {
    if (role === 'ADMIN') return json([{ ...ORG, role: 'OWNER' }]);
    if (role === 'TEACHER') return json([{ ...ORG, role: 'ASSESSOR' }]);
    return json([{ ...ORG, role: 'LEARNER' }]);
  }
  if (pathname === '/courses/field-safety') return json(COURSE);
  if (pathname === '/academy/curriculum/courses/course-1/outline') return json(OUTLINE);
  if (pathname === '/academy/curriculum/courses/course-1/licence-tracks') return json({ courseId: 'course-1', lessonCount: 2, counts: { 'non-licensed': 2, licensed: 2 }, needsLicence: [], limited: [] });
  if (method === 'GET' && pathname.startsWith('/academy/curriculum/courses/course-1/lessons/') && pathname.endsWith('/body')) return json(LESSON_BODY);
  if (pathname === '/academy/curriculum/completions/me') return json([]);
  if (pathname === '/enrollments/course-1/progress') return json({ enrollment: { progressPercentage: 0 }, lessonProgress: [] });
  if (pathname === '/quizzes/quiz-1/take') return json(QUIZ);
  if (pathname === '/quizzes/quiz-1/attempts' && method === 'POST') return json({ id: 'att-1', status: 'IN_PROGRESS', marksObtained: null, startedAt: new Date().toISOString(), submittedAt: null });
  if (pathname === '/assignments/as-1/my-submission') return json(null);
  if (pathname === '/academy/curriculum/companies/org-1/practical-evidence/pending') return json(PENDING_EVIDENCE);
  if (pathname === '/academy/curriculum/business-fields/registry') return json({ keys: REGISTRY });
  if (pathname === '/academy/curriculum/companies/org-1/business-fields') return json(FIELDS);
  if (pathname === '/academy/curriculum/companies/org-1/lesson-context-snapshots') return json({ items: [], nextCursor: null });
  if (method === 'GET') return json([]);
  return json({});
}

// ---------- pages under audit ----------
const CASES = [
  { id: 'login', path: '/login', role: null },
  { id: 'register', path: '/register', role: null },
  { id: 'course-browse', path: '/courses', role: null },
  { id: 'course-detail', path: '/courses/field-safety', role: null },
  { id: 'player', path: '/student/courses/field-safety', role: 'STUDENT', steps: ['open-lesson-a'] },
  { id: 'player-knowledge-check', path: '/student/courses/field-safety', role: 'STUDENT', steps: ['open-lesson-a', 'await-knowledge-check'] },
  { id: 'quiz', path: '/student/quizzes/quiz-1', role: 'STUDENT', steps: ['start-quiz'] },
  { id: 'practical-evidence-submission', path: '/student/assignments/as-1', role: 'STUDENT' },
  { id: 'profile', path: '/profile', role: 'STUDENT' },
  { id: 'assessor-review', path: '/academy/assessor', role: 'TEACHER' },
  { id: 'manager-context', path: '/admin/business-context', role: 'ADMIN' },
  { id: 'manager-lesson-review', path: '/admin/lesson-review', role: 'ADMIN' },
];

async function runStep(page, step) {
  if (step === 'open-lesson-a') await page.getByRole('button', { name: /Lesson A/ }).first().click();
  if (step === 'await-knowledge-check') await page.getByRole('button', { name: 'Mark lesson read' }).waitFor({ timeout: 10000 });
  if (step === 'start-quiz') await page.getByRole('button', { name: 'Start quiz' }).click();
  await page.waitForTimeout(300);
}

async function auditPage(browser, item) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: COLOR_SCHEME, reducedMotion: 'reduce' });
  try {
    const role = item.role ?? null;
    await context.route(`${MOCK_API}/**`, async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname.slice('/__mock_api'.length);
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 });
      return route.fulfill(handleApi(role, request.method(), pathname));
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    for (const step of item.steps ?? []) await runStep(page, step);
    await page.addScriptTag({ path: AXE_PATH });
    return await page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
      }));
    });
  } finally {
    await context.close();
  }
}

async function waitForServer(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  let server = null;
  if (!process.env.BASE_URL) {
    const nextBin = require.resolve('next/dist/bin/next');
    server = spawn(process.execPath, [nextBin, 'dev', '-p', String(PORT)], {
      cwd: frontendDir,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_API_URL: MOCK_API },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stderr.on('data', () => {});
  }
  const ready = await waitForServer(`${BASE_URL}/login`, 180000);
  if (!ready) {
    server?.kill('SIGTERM');
    fail(`server at ${BASE_URL} did not become ready`);
  }

  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const pages = {};
  let failed = 0;
  try {
    for (const item of CASES) {
      try {
        const violations = await auditPage(browser, item);
        pages[item.id] = { path: item.path, violations };
        if (violations.length) failed += 1;
        console.log(`${violations.length ? 'FAIL' : 'PASS'} ${item.id} (${violations.length} axe violations)`);
        for (const violation of violations) console.log(`     ${violation.impact} ${violation.id} x${violation.nodes} ${violation.targets.join(' | ')}`);
      } catch (error) {
        pages[item.id] = { path: item.path, error: String(error.message ?? error).slice(0, 400) };
        failed += 1;
        console.log(`FAIL ${item.id}\n     ${String(error.message ?? error).split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
    server?.kill('SIGTERM');
  }

  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), baseUrl: BASE_URL, colorScheme: COLOR_SCHEME, api: 'mocked in browser (Playwright routing)', failedPages: failed, pages };
  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`Accessibility audit: ${CASES.length - failed} pages clean, ${failed} with findings (${COLOR_SCHEME} theme)`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => fail(`audit could not run: ${error.stack || error}`));
