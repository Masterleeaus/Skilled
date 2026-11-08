#!/usr/bin/env node
/**
 * PASS42 browser suite for the Skilled lesson player (ACA-019) and the
 * accessibility audit (ACA-023).
 *
 * The API is mocked in the browser with Playwright routing. The dev server is started with
 * NEXT_PUBLIC_API_URL pointing at a same-origin mock path, so no backend, database or CORS
 * setup is needed. This verifies the UI contract only; it does not verify the live API.
 *
 * Usage:
 *   node tests/browser/academy-browser-suite.mjs [--report <path>]
 *   BASE_URL=http://localhost:3100 node tests/browser/academy-browser-suite.mjs   # reuse a server
 *     (that server must have been started with NEXT_PUBLIC_API_URL=$BASE_URL/__mock_api)
 *
 * Exit codes: 0 all passed, 1 at least one failed, 2 setup failure (server, browser or axe missing).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(here, '../..');
const require = createRequire(path.join(frontendDir, 'package.json'));
const reportIndex = process.argv.indexOf('--report');
const reportPath = reportIndex >= 0 ? path.resolve(process.argv[reportIndex + 1] ?? '') : null;
const PORT = Number(process.env.PORT ?? 3100);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const MOCK_API = `${BASE_URL}/__mock_api`;

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

// ---------- mock API state ----------
const ANSWER_KEY = [1, 1];
const ORG = { companyId: 'org-1', company: { id: 'org-1', name: 'Organisation One' } };
let state;
function freshState() {
  return {
    user: { id: 'learner-1', email: 'learner1@example.test', fullName: 'Learner One', role: 'STUDENT' },
    outlineStatus: 200,
    completions: [],
    calls: [],
    memberships: [{ ...ORG, role: 'LEARNER' }],
    snapshots: [],
    fields: [
      { fieldKey: 'business.name', value: 'Acme Field Services', status: 'APPROVED', revision: 1, sourceSystem: null, updatedAt: new Date().toISOString() },
    ],
  };
}
const REGISTRY = ['business.name', 'business.support_phone', 'safety.required_ppe'];
const OUTLINE = {
  courseId: 'course-1',
  tracks: [
    {
      id: 'ct-1',
      position: 1,
      required: true,
      track: {
        id: 'tr-1',
        slug: 'tr-one',
        title: 'Track One',
        scope: 'UNIVERSAL',
        placements: [
          {
            id: 'pl-1',
            position: 1,
            required: true,
            lesson: { id: 'lesson-a', sourceId: 'TST-A', title: 'Lesson A', layer: 'UNIVERSAL', serviceGroup: 'GENERAL' },
            revision: {
              id: 'rev-a1',
              version: 1,
              status: 'PUBLISHED',
              body: {
                introduction: 'Training for the crew on the approved kit.',
                procedure: ['Prepare the kit', 'Work from top to bottom'],
                resource: { url: 'https://example.test/guide', label: 'Guide' },
                knowledgeChecks: [
                  { question: 'Which tool is used first?', options: ['Scanner', 'Vacuum', 'Brush'] },
                  { question: 'What is the approved cleaner?', options: ['Water', 'Approved product'] },
                ],
              },
            },
          },
          {
            id: 'pl-2',
            position: 2,
            required: false,
            lesson: { id: 'lesson-b', sourceId: 'TST-B', title: 'Lesson B', layer: 'UNIVERSAL', serviceGroup: 'GENERAL' },
            revision: { id: 'rev-b1', version: 1, status: 'PUBLISHED', body: { introduction: 'Optional reading on equipment care.' } },
          },
        ],
      },
    },
  ],
};

const COURSE = { id: 'course-1', title: 'Field Safety', slug: 'field-safety', description: 'Course', price: '0', isPublished: true, teacher: { id: 't-1', fullName: 'Teacher' }, modules: [], _count: { enrollments: 2, reviews: 0 } };

function ok(data, status = 200) {
  return { status, body: JSON.stringify({ success: true, message: 'Success', data }), contentType: 'application/json' };
}

function handleApi(method, pathname, bodyText) {
  const body = bodyText ? JSON.parse(bodyText) : {};
  const route = `${method} ${pathname}`;
  state.calls.push({ route, body });
  if (route === 'POST /auth/refresh') return ok({ accessToken: 'pass42-access-token' });
  if (route === 'GET /academy/curriculum/courses/course-1/licence-tracks') return ok({ courseId: 'course-1', lessonCount: 5, counts: { 'non-licensed': 2, licensed: 3 }, needsLicence: [], limited: [] });
  if (method === 'GET' && pathname.startsWith('/academy/curriculum/courses/course-1/lessons/') && pathname.endsWith('/body')) {
    const sid = decodeURIComponent(pathname.split('/')[6]);
    const pl = OUTLINE.tracks[0].track.placements.find((x) => x.lesson.sourceId === sid);
    return pl ? ok(pl.revision.body) : { status: 404, body: JSON.stringify({ success: false, message: 'not found', errors: [] }), contentType: 'application/json' };
  }
  if (route === 'GET /auth/me') return ok(state.user);
  if (route === 'GET /courses/field-safety') return ok(COURSE);
  if (route === 'GET /enrollments/course-1/progress') return ok({ enrollment: { progressPercentage: 0 }, lessonProgress: [] });
  if (route === 'GET /academy/curriculum/courses/course-1/outline') {
    return state.outlineStatus === 200 ? ok(OUTLINE) : { status: state.outlineStatus, body: JSON.stringify({ success: false, message: 'Enrolment required', errors: [] }), contentType: 'application/json' };
  }
  if (route === 'GET /academy/curriculum/completions/me') return ok(state.completions);
  if (route === 'POST /academy/curriculum/completions') {
    const completion = { id: `c-${state.completions.length + 1}`, lessonId: body.lessonId, revisionId: body.revisionId, completedAt: new Date().toISOString() };
    state.completions.push(completion);
    return ok(completion);
  }
  if (route === 'POST /academy/curriculum/knowledge-checks/attempts') {
    const score = ANSWER_KEY.filter((correct, index) => body.answers?.[index] === correct).length;
    return ok({ id: 'att-1', score, total: ANSWER_KEY.length, passed: score / ANSWER_KEY.length >= 0.8, createdAt: new Date().toISOString() });
  }
  if (route === 'GET /academy/curriculum/companies/me') return ok(state.memberships);
  if (route === 'POST /academy/curriculum/companies/org-1/lessons/rev-a1/context') {
    const snapshot = { contextSnapshotId: 'snap-1', lessonRevisionId: 'rev-a1', presentedAt: new Date().toISOString(), contentHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789' };
    state.snapshots = [snapshot];
    return ok({ ...snapshot, companyId: 'org-1', body: { introduction: 'Training for Acme Field Services crews.' } });
  }
  if (route.startsWith('GET /academy/curriculum/companies/org-1/lesson-context-snapshots')) {
    return ok({ items: state.snapshots, nextCursor: null });
  }
  if (route === 'GET /academy/curriculum/business-fields/registry') return ok({ keys: REGISTRY });
  if (route === 'GET /academy/curriculum/companies/org-1/business-fields') return ok(state.fields);
  if (method === 'PUT' && pathname.startsWith('/academy/curriculum/companies/org-1/business-fields/')) {
    const key = decodeURIComponent(pathname.split('/').pop());
    const field = state.fields.find((item) => item.fieldKey === key) ?? { fieldKey: key, revision: 0, sourceSystem: null };
    Object.assign(field, { value: body.value, status: 'DRAFT', revision: (field.revision ?? 0) + 1, updatedAt: new Date().toISOString() });
    if (!state.fields.includes(field)) state.fields.push(field);
    return ok(field);
  }
  if (method === 'POST' && pathname.endsWith('/approve')) {
    const key = decodeURIComponent(pathname.split('/').at(-2));
    const field = state.fields.find((item) => item.fieldKey === key);
    if (field) field.status = 'APPROVED';
    return ok({ approved: true });
  }
  if (method === 'GET') return ok([]);
  return ok({});
}

async function installMocks(page) {
  await page.route(`${MOCK_API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.slice('/__mock_api'.length);
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    const response = handleApi(request.method(), pathname, request.postData());
    return route.fulfill(response);
  });
}

async function newPage(browser, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await installMocks(page);
  return { context, page };
}

const callsTo = (route) => state.calls.filter((call) => call.route === route);
const player = (page) => page.locator('section[aria-label="Shared curriculum"]');

async function openPlayer(page) {
  await page.goto(`${BASE_URL}/student/courses/field-safety`, { waitUntil: 'domcontentloaded' });
  await player(page).getByRole('heading', { name: 'Shared learning pathway' }).waitFor({ timeout: 60000 });
}

async function axeReport(page, selector) {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async (scope) => {
    const context = scope ? document.querySelector(scope) : document;
    const result = await window.axe.run(context, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
    }));
  }, selector);
}

// ---------- tests ----------
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const axeFindings = {};

test('ACA-019 learner sees the shared pathway with a progress count', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByText('0 of 2 lesson placements acknowledged').waitFor();
    assert.equal(await player(page).getByRole('button', { name: /Lesson A/ }).count(), 1);
    assert.equal(await player(page).getByRole('button', { name: /Lesson B/ }).count(), 1);
  } finally {
    await context.close();
  }
});

test('ACA-019 selecting a lesson renders its published content, not answer keys', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    await player(page).getByText('Training for the crew on the approved kit.').waitFor();
    const text = await player(page).innerText();
    assert.ok(!text.includes('correctIndex'), 'answer key field leaked into the rendered lesson');
    assert.ok(text.includes('Which tool is used first?'));
    assert.equal(await player(page).getByRole('button', { name: /Lesson A/ }).getAttribute('aria-current'), 'step');
  } finally {
    await context.close();
  }
});

test('ACA-019 knowledge check scores answers and reports a pass', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    const submit = player(page).getByRole('button', { name: /Submit answers/ });
    assert.equal(await submit.isDisabled(), true, 'submit must stay disabled until every question is answered');
    await player(page).getByLabel('Vacuum').check();
    await player(page).getByLabel('Approved product').check();
    await submit.click();
    await player(page).getByText('Score: 2/2. Passed').waitFor();
    const attempts = callsTo('POST /academy/curriculum/knowledge-checks/attempts');
    assert.equal(attempts.length, 1);
    assert.deepEqual(attempts[0].body.answers, [1, 1]);
  } finally {
    await context.close();
  }
});

test('ACA-019 acknowledging a lesson is recorded once and the control is then disabled', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    const mark = player(page).getByRole('button', { name: 'Mark lesson read' });
    await mark.click();
    await player(page).getByRole('button', { name: 'Acknowledged' }).waitFor();
    assert.equal(await player(page).getByRole('button', { name: 'Acknowledged' }).isDisabled(), true);
    await player(page).getByText('1 of 2 lesson placements acknowledged').waitFor();
    assert.equal(callsTo('POST /academy/curriculum/completions').length, 1);
    assert.deepEqual(callsTo('POST /academy/curriculum/completions')[0].body, { lessonId: 'lesson-a', revisionId: 'rev-a1' });
  } finally {
    await context.close();
  }
});

test('ACA-019 lessons are reachable and selectable from the keyboard alone', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await page.keyboard.press('Tab');
    const focusedNames = [];
    for (let step = 0; step < 40; step += 1) {
      const name = await page.evaluate(() => {
        const el = document.activeElement;
        return el && el.closest && el.closest('section[aria-label="Shared curriculum"]') ? (el.textContent || '').trim() : null;
      });
      if (name) focusedNames.push(name);
      if (focusedNames.some((item) => item.includes('Lesson B'))) break;
      await page.keyboard.press('Tab');
    }
    assert.ok(focusedNames.some((item) => item.includes('Lesson B')), `Lesson B not reached by Tab; saw ${JSON.stringify(focusedNames.slice(0, 8))}`);
    await page.keyboard.press('Enter');
    await player(page).getByText('Optional reading on equipment care.').waitFor();
  } finally {
    await context.close();
  }
});

test('ACA-019 a failed outline load shows an alert and keeps course lessons available', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    state.outlineStatus = 403;
    await page.goto(`${BASE_URL}/student/courses/field-safety`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('alert').filter({ hasText: 'Shared curriculum unavailable' }).waitFor({ timeout: 60000 });
  } finally {
    await context.close();
  }
});

test('ACA-019 learner organisation context is presented, saved and listed as history', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    const contextSection = page.getByRole('region', { name: "Business-specific lesson context" });
    await contextSection.getByRole('button', { name: "Open my organisation's lesson" }).click();
    await contextSection.getByText('Training for Acme Field Services crews.').waitFor();
    await contextSection.getByRole('button', { name: /abcdef012345/ }).waitFor();
    assert.equal(callsTo('POST /academy/curriculum/companies/org-1/lessons/rev-a1/context').length, 1);
  } finally {
    await context.close();
  }
});

test('ACA-019 manager regression: saving a business field creates a draft and never approves it', async (browser) => {
  state.user = { id: 'admin-1', email: 'admin@example.test', fullName: 'Admin Example', role: 'ADMIN' };
  state.memberships = [{ ...ORG, role: 'MANAGER' }];
  const { context, page } = await newPage(browser);
  try {
    await page.goto(`${BASE_URL}/admin/business-context`, { waitUntil: 'domcontentloaded' });
    const section = page.locator('section', { has: page.getByRole('heading', { name: 'business / name' }) });
    await section.getByText('APPROVED').waitFor({ timeout: 60000 });
    await section.getByRole('button', { name: 'Edit draft' }).click();
    await section.getByLabel('Field value').fill('Acme Renamed Services');
    await section.getByRole('button', { name: 'Save draft' }).click();
    await section.getByText(/DRAFT · Revision 2/).waitFor();
    assert.equal(callsTo('POST /academy/curriculum/companies/org-1/business-fields/business.name/approve').length, 0, 'saving must not approve');
    const put = callsTo('PUT /academy/curriculum/companies/org-1/business-fields/business.name');
    assert.deepEqual(put.map((call) => call.body), [{ value: 'Acme Renamed Services' }]);
    await section.getByRole('button', { name: 'Approve for learners' }).click();
    await section.getByText(/APPROVED · Revision 2/).waitFor();
    assert.equal(callsTo('POST /academy/curriculum/companies/org-1/business-fields/business.name/approve').length, 1);
  } finally {
    await context.close();
    state.user = freshState().user;
    state.memberships = freshState().memberships;
  }
});

test('ACA-023 axe finds no critical or serious WCAG A/AA violations in the player (desktop)', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    await player(page).getByText('Which tool is used first?').waitFor();
    const violations = await axeReport(page, 'section[aria-label="Shared curriculum"]');
    axeFindings.desktop = violations;
    const blocking = violations.filter((item) => item.impact === 'critical' || item.impact === 'serious');
    assert.deepEqual(blocking, [], `blocking axe violations: ${JSON.stringify(blocking)}`);
  } finally {
    await context.close();
  }
});

test('ACA-023 player fits a 375px viewport without horizontal scrolling and keeps lesson controls usable', async (browser) => {
  const { context, page } = await newPage(browser, { width: 375, height: 812 });
  try {
    await openPlayer(page);
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    await player(page).getByText('Which tool is used first?').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `horizontal overflow of ${overflow}px at 375px`);
    const box = await player(page).getByRole('button', { name: /Lesson B/ }).boundingBox();
    assert.ok(box && box.width >= 200, `lesson control too narrow: ${JSON.stringify(box)}`);
    const violations = await axeReport(page, 'section[aria-label="Shared curriculum"]');
    axeFindings.mobile = violations;
    const blocking = violations.filter((item) => item.impact === 'critical' || item.impact === 'serious');
    assert.deepEqual(blocking, [], `blocking axe violations at 375px: ${JSON.stringify(blocking)}`);
  } finally {
    await context.close();
  }
});

test('ACA-023 screen reader semantics: named progress bar, live lesson region, labelled radio groups', async (browser) => {
  const { context, page } = await newPage(browser);
  try {
    await openPlayer(page);
    await player(page).getByRole('progressbar', { name: 'Shared lesson acknowledgement progress' }).waitFor();
    await player(page).getByRole('button', { name: /Lesson A/ }).click();
    // ACA-023 item 3: the lesson article is not a live region; a small status element inside it is.
    const article = player(page).locator('article');
    assert.equal(await article.count(), 1);
    assert.equal(await article.getAttribute('aria-live'), null, 'lesson article must not be a live region');
    assert.equal(await player(page).locator('article [aria-live="polite"]').count(), 1, 'one small status element announces lesson load state');
    const groups = player(page).getByRole('group');
    assert.equal(await groups.count(), 2, 'one labelled group per knowledge-check question');
    for (let index = 0; index < 2; index += 1) {
      const name = await groups.nth(index).getAttribute('aria-labelledby') ?? (await groups.nth(index).locator('legend').innerText());
      assert.ok(name && name.trim().length > 0);
    }
  } finally {
    await context.close();
  }
});

// ---------- runner ----------
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
  const results = [];
  try {
    for (const item of tests) {
      state = freshState();
      const started = Date.now();
      try {
        await item.fn(browser);
        results.push({ name: item.name, status: 'passed', ms: Date.now() - started });
        console.log(`PASS ${item.name}`);
      } catch (error) {
        results.push({ name: item.name, status: 'failed', ms: Date.now() - started, error: String(error.message ?? error).slice(0, 800) });
        console.log(`FAIL ${item.name}\n     ${String(error.message ?? error).split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
    server?.kill('SIGTERM');
  }

  const counts = { passed: results.filter((r) => r.status === 'passed').length, failed: results.filter((r) => r.status === 'failed').length };
  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), baseUrl: BASE_URL, api: 'mocked in browser (Playwright routing)', counts, axe: axeFindings, results };
  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`Browser suite: ${counts.passed} passed, ${counts.failed} failed, ${results.length} total`);
  process.exit(counts.failed ? 1 : 0);
}

main().catch((error) => fail(`suite could not run: ${error.stack || error}`));
