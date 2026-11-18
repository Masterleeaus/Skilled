// Regulated-content inventory and publication gate (Skilled issue #34).
// Fail closed: an inventoried item is publishable only with a complete, current,
// approve decision bound to the exact content hash that was reviewed.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const INVENTORY_PATH = 'curriculum/regulated/inventory.json';
export const REGISTER_PATH = 'curriculum/regulated/review-register.json';
export const MAX_REVIEW_INTERVAL_DAYS = 365;
export const EXPIRY_WARNING_DAYS = 30;
export const DECISIONS = ['pending', 'approve', 'revise', 'retire'];

// Service folders and course slugs whose content is regulated or safety-sensitive by default.
export const REGULATED_SERVICE_DIRS = ['healthcare', 'chemicals', 'safety', 'standards', 'nhs-sop', 'food-sanitation', 'caregiving'];
export const REGULATED_COURSE_SLUGS = ['high-risk', 'healthcare', 'medequip', 'pressure', 'window', 'roof', 'solar', 'pool', 'appliance'];
export const REGULATED_LAYERS = ['high-risk'];
// Narrow hazard and licensing terms matched against a lesson's title and safety/regulatory text.
export const HAZARD_PATTERN = /\b(asbestos|electrical|gas (?:fitting|appliance|leak)|coshh|pesticides?|herbicides?|working at height|confined space|first aid|medication|clinical|biohazard|legionella|body fluids?|sharps|safety data sheets?|hazardous (?:substances?|chemicals?)|chemical (?:handling|storage|competency))\b/i;
const MEDIA_EXT = /\.(mp4|webm|mov|mp3|wav|png|jpe?g|gif|webp|svg|pdf)$/i;

const PLACEHOLDER = /^(tbd|todo|n\/?a|none|null|unknown|test|placeholder|changeme|pending|reviewer|admin|example|dummy|x+|-+)$/i;
const NAMED_REVIEWER = /^[A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*)+$/;
const USER_ID = /^c[a-z0-9]{20,30}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;

const DAY_MS = 86400000;

export function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, predicate));
    else if (entry.isFile() && predicate(entry.name)) out.push(full);
  }
  return out.sort();
}

const rel = (root, file) => path.relative(root, file).split(path.sep).join('/');

// Lesson sources: curriculum/shared and curriculum/courses. The service is the folder below each root.
function lessonRecords(root) {
  const records = [];
  for (const base of ['curriculum/shared', 'curriculum/courses']) {
    for (const file of listFiles(path.join(root, base), n => n.endsWith('.json'))) {
      let data;
      try { data = readJson(file); } catch { continue; }
      if (!data || typeof data !== 'object' || typeof data.id !== 'string' || !data.id.trim()) continue;
      const service = path.relative(path.join(root, base), file).split(path.sep)[0];
      const reasons = [];
      if (REGULATED_SERVICE_DIRS.includes(service) && base === 'curriculum/shared') reasons.push('regulated-service-folder');
      if (base === 'curriculum/courses' && REGULATED_COURSE_SLUGS.includes(service)) reasons.push('regulated-course-folder');
      if (REGULATED_LAYERS.includes(data.layer)) reasons.push('high-risk-layer');
      if (Array.isArray(data.courseSlugs) && data.courseSlugs.some(s => REGULATED_COURSE_SLUGS.includes(s))) reasons.push('regulated-course-slug');
      const text = `${typeof data.title === 'string' ? data.title : ''} ${JSON.stringify(data.safetyAndRegulatory ?? '')}`;
      if (HAZARD_PATTERN.test(text)) reasons.push('hazard-or-licensing-terms');
      records.push({ path: rel(root, file), id: data.id, service, riskReasons: reasons });
    }
  }
  return records;
}

function assessmentRecords(root) {
  return listFiles(path.join(root, 'curriculum/assessments'), n => n.endsWith('.assessment.json')).map(file => {
    let lessonId = null;
    try { lessonId = readJson(file).lessonId ?? null; } catch { /* malformed: treated as unmapped */ }
    return { path: rel(root, file), lessonId: typeof lessonId === 'string' ? lessonId : null };
  });
}

function mediaRecords(root) {
  return listFiles(path.join(root, 'curriculum'), n => MEDIA_EXT.test(n)).map(file => {
    const p = rel(root, file);
    const segments = p.split('/');
    const reasons = segments.some(s => REGULATED_SERVICE_DIRS.includes(s) || REGULATED_COURSE_SLUGS.includes(s)) ? ['regulated-media-folder'] : [];
    return { path: p, service: segments[1] ?? 'root', riskReasons: reasons };
  }).filter(m => m.riskReasons.length);
}

// Deterministic inventory: no timestamps, sorted by path. Assessments inherit scope from their lesson;
// an assessment whose lesson cannot be found is kept in scope until it is mapped.
export function buildInventory(root) {
  const lessons = lessonRecords(root);
  const byId = new Map();
  for (const l of lessons) {
    if (!byId.has(l.id)) byId.set(l.id, []);
    byId.get(l.id).push(l);
  }
  const items = [];
  for (const l of lessons) {
    if (!l.riskReasons.length) continue;
    items.push({ kind: 'lesson', path: l.path, id: l.id, service: l.service, riskReasons: [...l.riskReasons].sort(), sha256: sha256(fs.readFileSync(path.join(root, l.path))) });
  }
  for (const a of assessmentRecords(root)) {
    const owners = a.lessonId ? byId.get(a.lessonId) : undefined;
    let reasons;
    let service = 'unmapped';
    if (!owners) reasons = ['unmapped-lesson-id'];
    else if (owners.some(o => o.riskReasons.length)) {
      reasons = ['assessment-of-regulated-lesson'];
      service = owners.find(o => o.riskReasons.length).service;
    } else continue;
    items.push({ kind: 'assessment', path: a.path, id: a.lessonId ?? a.path, service, riskReasons: reasons, sha256: sha256(fs.readFileSync(path.join(root, a.path))) });
  }
  for (const m of mediaRecords(root)) {
    items.push({ kind: 'media', path: m.path, id: m.path, service: m.service, riskReasons: m.riskReasons, sha256: sha256(fs.readFileSync(path.join(root, m.path))) });
  }
  items.sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
  return { schemaVersion: 1, source: 'scripts/regulated-content-lib.mjs', itemCount: items.length, items };
}

export function readRegister(root) {
  const file = path.join(root, REGISTER_PATH);
  if (!fs.existsSync(file)) return { schemaVersion: 1, entries: {} };
  return readJson(file);
}

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

function validDate(value) {
  return typeof value === 'string' && ISO_DATE.test(value) && Number.isFinite(Date.parse(value));
}

function reviewerOk(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return !PLACEHOLDER.test(v) && (NAMED_REVIEWER.test(v) || USER_ID.test(v));
}

function roleOk(value) {
  return typeof value === 'string' && value.trim().length >= 3 && !PLACEHOLDER.test(value.trim());
}

function sourceOk(list) {
  return Array.isArray(list) && list.length > 0 && list.every(s => isObject(s)
    && typeof s.title === 'string' && s.title.trim().length > 0
    && ((typeof s.url === 'string' && /^https:\/\/[^\s]+$/.test(s.url)) || (typeof s.citation === 'string' && s.citation.trim().length > 0)));
}

// Evaluates one inventoried item. Returns { publishable, reasons, flags }; reasons block publication.
export function evaluateItem(item, entry, now = Date.now()) {
  const reasons = [];
  const flags = [];
  if (!entry) return { publishable: false, reasons: ['missing_register_entry'], flags };
  if (!DECISIONS.includes(entry.decision)) return { publishable: false, reasons: ['invalid_decision'], flags };
  if (entry.decision !== 'approve') {
    reasons.push(`decision_${entry.decision}`);
    return { publishable: false, reasons, flags };
  }
  if (!roleOk(entry.reviewerRole)) reasons.push('missing_reviewer_role');
  if (!reviewerOk(entry.reviewer)) reasons.push('missing_named_reviewer');
  if (!validDate(entry.reviewedAt) || Date.parse(entry.reviewedAt) > now) reasons.push('invalid_review_date');
  if (typeof entry.jurisdiction !== 'string' || !entry.jurisdiction.trim()) reasons.push('missing_jurisdiction');
  if (!sourceOk(entry.sourceReferences)) reasons.push('missing_source_references');
  if (!Array.isArray(entry.requiredWarnings) || !entry.requiredWarnings.every(w => typeof w === 'string')) reasons.push('invalid_warnings');
  if (!validDate(entry.expiresAt)) reasons.push('invalid_expiry');
  else if (validDate(entry.reviewedAt)) {
    const span = (Date.parse(entry.expiresAt) - Date.parse(entry.reviewedAt)) / DAY_MS;
    if (span <= 0 || span > MAX_REVIEW_INTERVAL_DAYS) reasons.push('invalid_expiry');
  }
  if (entry.reviewedSha256 !== item.sha256) reasons.push('content_changed_since_review');
  if (validDate(entry.expiresAt)) {
    const left = (Date.parse(entry.expiresAt) - now) / DAY_MS;
    if (left < 0) reasons.push('stale_review_expired');
    else if (left <= EXPIRY_WARNING_DAYS) flags.push('expiring_soon');
  }
  return { publishable: reasons.length === 0, reasons: [...new Set(reasons)], flags };
}

// Register-level structural check. Errors fail CI; they are not the same as blocked items.
export function validateRegister(inventory, register) {
  const errors = [];
  const itemsByPath = new Map(inventory.items.map(i => [i.path, i]));
  if (!isObject(register) || !isObject(register.entries)) return ['register_malformed'];
  for (const key of Object.keys(register.entries)) {
    if (!itemsByPath.has(key)) errors.push(`register_unknown_item:${key}`);
  }
  for (const item of inventory.items) {
    const entry = Object.hasOwn(register.entries, item.path) ? register.entries[item.path] : undefined;
    if (!entry) { errors.push(`register_missing_item:${item.path}`); continue; }
    if (!DECISIONS.includes(entry.decision)) { errors.push(`invalid_decision:${item.path}`); continue; }
    if (entry.decision === 'approve') {
      const result = evaluateItem(item, entry);
      const structural = result.reasons.filter(r => r !== 'stale_review_expired' && r !== 'content_changed_since_review');
      for (const r of structural) errors.push(`approval_incomplete:${r}:${item.path}`);
    }
  }
  return errors;
}

export function summarise(inventory, register, now = Date.now()) {
  const results = inventory.items.map(item => {
    const entry = Object.hasOwn(register.entries ?? {}, item.path) ? register.entries[item.path] : undefined;
    return { path: item.path, kind: item.kind, service: item.service, jurisdiction: entry?.jurisdiction ?? 'unassigned', ...evaluateItem(item, entry, now) };
  });
  const counts = {};
  for (const r of results) for (const reason of r.reasons) counts[reason] = (counts[reason] || 0) + 1;
  return {
    total: results.length,
    publishable: results.filter(r => r.publishable).length,
    blocked: results.filter(r => !r.publishable).length,
    flaggedStale: results.filter(r => r.reasons.includes('stale_review_expired')).map(r => r.path),
    expiringSoon: results.filter(r => r.flags.includes('expiring_soon')).map(r => r.path),
    reasonCounts: counts,
    results,
  };
}

// Publication check for a single path. Unknown paths are blocked (fail closed).
export function publishCheck(root, itemPath, now = Date.now()) {
  const inventory = readJson(path.join(root, INVENTORY_PATH));
  const item = inventory.items.find(i => i.path === itemPath);
  if (!item) return { publishable: false, reasons: ['not_in_inventory'], flags: [] };
  const register = readRegister(root);
  const entry = Object.hasOwn(register.entries ?? {}, itemPath) ? register.entries[itemPath] : undefined;
  const file = path.join(root, itemPath);
  if (!fs.existsSync(file)) return { publishable: false, reasons: ['content_missing'], flags: [] };
  return evaluateItem({ ...item, sha256: sha256(fs.readFileSync(file)) }, entry, now);
}
