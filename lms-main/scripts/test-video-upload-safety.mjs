#!/usr/bin/env node
/** Execute the real upload service against a mocked MinIO client. No network or DB. */
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, realpathSync, statSync, utimesSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let ts;
try { ts = require(join(root, 'apps/backend/node_modules/typescript')); }
catch { ts = require(dirname(dirname(realpathSync(execFileSync('which', ['tsc'], { encoding: 'utf8' }).trim())))); }
const source = readFileSync(join(root, 'apps/backend/src/modules/courses/video-upload.service.ts'), 'utf8');
const routes = readFileSync(join(root, 'apps/backend/src/modules/courses/module.routes.ts'), 'utf8');
const lessonSource = readFileSync(join(root, 'apps/backend/src/modules/courses/lesson.service.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
let assertions = 0;
function check(ok, msg) { assert.ok(ok, msg); assertions++; }
let storageConfig, uploadedBytes, shouldFail = false;
const fakeMulter = (config) => { storageConfig = config; return { single: () => () => undefined }; };
fakeMulter.diskStorage = (config) => ({ diskStorageConfig: config });
const minioClient = { async putObject(bucket, key, stream, size, metadata) {
  check(bucket === 'academy-private', 'Academy-only storage bucket');
  check(key.startsWith('videos/'), 'Private video key prefix');
  check(metadata['Content-Type'] === 'video/mp4', 'Content type preserved');
  let bytes = Buffer.alloc(0);
  for await (const chunk of stream) bytes = Buffer.concat([bytes, chunk]);
  uploadedBytes = bytes;
  check(bytes.length === size, 'Full stream transferred');
  if (shouldFail) throw new Error('storage down');
} };
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)((id) => {
  if (id === 'multer') return { __esModule: true, default: fakeMulter };
  if (id.endsWith('config/env')) return { env: {} };
  if (id.endsWith('config/logger')) return { logger: { info() {}, warn() {}, error() {}, debug() {} } };
  if (id.endsWith('config/prisma')) return { prisma: {} };
  if (id.endsWith('config/minio')) return { minioClient, MINIO_BUCKET: 'academy-private', buildObjectKey: (folder, name) => folder + '/' + name, STORAGE_FOLDERS: { videos: 'videos' } };
  if (id.endsWith('utils/AppError')) return { AppError: class AppError extends Error {} };
  if (['crypto', 'path', 'os', 'fs', 'fs/promises'].includes(id)) return require('node:' + id);
  throw Error('Unexpected dependency: ' + id);
}, module, module.exports);
const { uploadLessonVideo, cleanupStaleVideoUploads } = module.exports;
check(!!storageConfig.storage.diskStorageConfig, 'Uploads use disk storage instead of memory buffers');
check(storageConfig.limits.fileSize === 500 * 1024 * 1024, 'Size limit retained');
const uploadDir = storageConfig.storage.diskStorageConfig.destination;
check((statSync(uploadDir).mode & 0o077) === 0, 'Upload directory is private (no group/other access)');
const temp = mkdtempSync(join(tmpdir(), 'academy-video-pass52-'));
try {
  const video = { originalname: 'training.mp4', mimetype: 'video/mp4', size: 14, path: join(temp, 'video1') };
  writeFileSync(video.path, 'training video');
  const key = await uploadLessonVideo(video);
  check(key.endsWith('.mp4'), 'Original extension is preserved for media');
  check(uploadedBytes.toString() === 'training video', 'Uploaded video bytes are intact');
  check(!existsSync(video.path), 'Temporary file removed after success');
  shouldFail = true;
  const failed = { ...video, path: join(temp, 'video2') };
  writeFileSync(failed.path, 'training video');
  await assert.rejects(() => uploadLessonVideo(failed), /storage down/); assertions++;
  check(!existsSync(failed.path), 'Temporary file removed after object storage failure');
} finally { await rm(temp, { recursive: true, force: true }); }
// Recovery after crashed uploads: delete only old regular Academy temp files.
const oldName = 'titan-academy-video-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const recentName = 'titan-academy-video-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const unrelatedName = 'not-academy-video';
const oldFile = join(uploadDir, oldName);
const recentFile = join(uploadDir, recentName);
const unrelatedFile = join(uploadDir, unrelatedName);
try {
  writeFileSync(oldFile, 'old');
  writeFileSync(recentFile, 'recent');
  writeFileSync(unrelatedFile, 'unrelated');
  const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
  utimesSync(oldFile, old, old);
  check((await cleanupStaleVideoUploads()) >= 1, 'Stale Academy files removed');
  check(!existsSync(oldFile), 'Stale temp video removed');
  check(existsSync(recentFile), 'Recent upload preserved');
  check(existsSync(unrelatedFile), 'Unrelated file preserved');
} finally {
  await rm(oldFile,{force:true}); await rm(recentFile,{force:true}); await rm(unrelatedFile,{force:true});
}
const videoRoute = routes.slice(routes.indexOf('// ---------------- Video upload ----------------'), routes.indexOf('"/lessons/:lessonId/video-url"'));
check(videoRoute.includes('async function authorizeVideoUpload'), 'Upload authorization middleware exists');
check(videoRoute.indexOf('authorizeVideoUpload,') < videoRoute.indexOf('uploadVideo.single("video")'), 'Authorization runs before multipart processing');
check(videoRoute.indexOf('await assertCourseOwnership') < videoRoute.indexOf('router.post('), 'Ownership lookup exists before the upload route');
// The attach step moved from the route into lesson.service: a failed database update removes the new object.
const attachService = lessonSource.split('export async function attachUploadedLessonVideo(')[1].split('export async function deleteLesson(')[0];
check(/catch \(error\) \{\s*await removeVideoObject\(objectKey\);\s*throw error;/.test(attachService), 'Database update failures trigger object cleanup');
check(videoRoute.includes('await lessonService.attachUploadedLessonVideo('), 'Existing ownership-checked update remains in use');
const setKeyService = lessonSource.split('export async function setLessonVideoKey(')[1].split('/**')[0];
check(setKeyService.includes('await assertCourseOwnership(lesson.module.courseId, userId, role)') && setKeyService.includes('tx.lesson.update('), 'Video attach checks ownership before the database update');
console.log(`PASS: ${assertions} streaming-upload and authorization assertions (real TS service, mocked MinIO)`);
