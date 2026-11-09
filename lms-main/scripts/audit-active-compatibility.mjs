#!/usr/bin/env node
/**
 * Read-only compatibility audit for issue #72. It is a conservative source contract,
 * not a substitute for API, migration or staging integration tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'apps/backend');
const read = name => fs.readFileSync(path.join(base, name), 'utf8');

const requiredModels = [
  'User', 'RefreshToken', 'Course', 'Company', 'CompanyMember',
  'AcademyExternalIdentity', 'AcademyServiceCredential', 'AcademyIntegrationAudit',
  'AcademyContentLesson', 'AcademyLessonRevision', 'AcademyLessonReview',
  'AcademyCurriculumTrack', 'AcademyCourseTrack', 'AcademyLessonPlacement',
  'AcademyPracticalEvidence', 'AcademyVerifiedCompetency',
  'AcademyTutorConversation', 'AcademyChatbot',
];

export function inspectCompatibility({ backend = base } = {}) {
  const text = file => fs.readFileSync(path.join(backend, file), 'utf8');
  const violations = [];
  const check = (name, ok, detail) => {
    if (!ok) violations.push({ name, detail });
  };
  const schema = text('prisma/schema.prisma');
  const models = new Set([...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(x => x[1]));
  const migrationsRoot = path.join(backend, 'prisma/migrations');
  const dirs = fs.readdirSync(migrationsRoot, { withFileTypes: true })
    .filter(x => x.isDirectory()).map(x => x.name).sort();
  const migrations = [];
  for (const name of dirs) {
    const sql = path.join(migrationsRoot, name, 'migration.sql');
    if (!fs.existsSync(sql) || !fs.statSync(sql).size) {
      check('migration-sql', false, 'Missing or empty SQL in ' + name);
    } else migrations.push(name);
  }
  const migrationAnchors = [
    '20260717195126_init',
    '20261102000100_academy_external_identity_audit',
    '20261102000100_titan_academy_content_inventory',
    '20261108090000_academy_tenant_company_rename',
    '20261108100000_academy_external_identity_org_unique',
    '20261108120100_academy_chatbot',
    '20261108150000_video_object_cleanup',
  ];
  for (const id of migrationAnchors) check('migration-anchor', migrations.includes(id), id);
  for (const name of requiredModels) check('model', models.has(name), name);

  const app = text('src/app.ts');
  const auth = text('src/modules/auth/auth.routes.ts');
  const token = text('src/modules/auth/token.utils.ts');
  const integration = text('src/modules/curriculum/integration.routes.ts');
  const curriculum = text('src/modules/curriculum/curriculum.routes.ts');
  const review = text('src/modules/curriculum/lesson-review.routes.ts');
  const reviewService = text('src/modules/curriculum/lesson-review.service.ts');
  const fileLoader = text('src/modules/curriculum/file-lesson-loader.ts');

  const routes = [
    ['/api/auth', 'authRoutes'], ['/api/academy/curriculum', 'curriculumRoutes'],
    ['/api/titan/integration', 'integrationRoutes'], ['/api/courses', 'courseRoutes'],
    ['/api/certificates', 'certificateRoutes'], ['/api/quizzes', 'quizRoutes'],
  ];
  for (const [prefix, handler] of routes) {
    check('app-mount', app.includes('app.use("' + prefix + '", ' + handler), prefix + ' (' + handler + ')');
  }
  check('auth-required', auth.includes('router.get("/me", authenticate,') &&
    auth.includes('router.post("/logout-all", authenticate,'), 'authenticated account routes');
  check('auth-rate-limit', auth.includes('router.post("/login", authLimiter,') &&
    auth.includes('router.post("/reset-password", authLimiter,'), 'login and reset rate limit');
  check('jwt-algorithm', token.includes('algorithms: ["HS256"]'), 'JWT algorithm pinning');
  check('opaque-refresh', token.includes('crypto.randomBytes(48)') &&
    token.includes('sha256'), 'refresh token entropy and hashing');

  check('service-fail-closed', integration.includes('parseServiceScopes(process.env.INTEGRATION_SERVICE_SCOPES)') &&
    integration.includes('allowedRefs?.includes(credential.companyRef)'), 'mandatory service allowlist');
  check('integration-company', integration.includes('externalRef: externalOrganisationRef') &&
    integration.includes('identity.companyId !== company.id'), 'external to internal company boundary');
  check('integration-membership', integration.includes('companyId_userId: { companyId: company.id, userId: learnerId }'),
    'membership verification');
  check('integration-credential', integration.includes('tokenHash') && integration.includes('revokedAt') &&
    integration.includes('expiresAt'), 'hashed, expiring and revocable credential');
  check('learner-access', curriculum.includes('router.get("/courses/:courseId/lessons/:lessonId/body", authenticate') &&
    curriculum.includes('await assertEnrolled(learnerId, course.id)') &&
    curriculum.includes('p.revision?.status === "PUBLISHED"'), 'learner lesson guard');
  check('lesson-integrity', curriculum.includes('knowledgeChecksAgree(file.body, placement.revision.body)') &&
    curriculum.includes('contentHashOf(placement.revision.body) !== placement.revision.contentHash'),
    'published revision and assessment integrity');
  check('approved-not-live-file', curriculum.includes('publicLessonBody(placement.revision.body)'),
    'published revision is served instead of disk authoring draft');
  check('reviewer-route', review.includes('requireRole("ADMIN", "TEACHER")') &&
    review.includes('await publishRevision('), 'reviewer permission and single publish service');
  check('publication-gate', reviewService.includes('evaluatePublicationGate({') &&
    reviewService.includes('publicationGateEnabled('), 'publication review gate');
  check('loader-scope', fileLoader.includes('"courses"') &&
    fileLoader.includes('"shared"') && !fileLoader.includes('"converted"') &&
    !fileLoader.includes('"ready"'), 'canonical authored lesson roots');
  check('tutor-feature-flag', app.includes('process.env.TUTOR_ENABLED === "true"'), 'tutor remains opt-in');

  return {
    schemaVersion: 1, migrationCount: migrations.length, migrationDirectories: dirs,
    modelCount: models.size, requiredModels: requiredModels.length,
    checkedContracts: routes.length + requiredModels.length + migrationAnchors.length + 15,
    violations, compatibilityChecksPassed: violations.length === 0,
    verifiedRuntime: false, verifiedDatabase: false,
  };
}

export function runCli(args = process.argv.slice(2)) {
  let output;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--report needs a path');
      output = path.resolve(args[++i]);
    } else if (args[i] !== '--strict') throw new Error('Unknown argument: ' + args[i]);
  }
  const report = inspectCompatibility();
  if (output) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
  if (args.includes('--strict') && report.violations.length) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runCli(); } catch (e) { console.error(e); process.exitCode = 2; }
}
