/**
 * In-memory Prisma double for Academy quality tests (PASS42).
 *
 * It implements only the query shapes used by the enrolment, snapshot and
 * completion-report code: scalar filters, relation filters (to-one and to-many
 * with some/every/none), compound unique keys, include/select and cursor paging.
 *
 * Constraints are read from prisma/schema.prisma when the module loads, so they cannot drift from the schema:
 *  - @id, @unique and @@unique throw P2002 on a clash. NULLs are distinct, as in PostgreSQL.
 *  - A relation's foreign key throws P2003 when its non-null value has no parent row.
 *  - Deleting a parent applies onDelete: Cascade, SetNull, or Restrict (the Prisma default for a required
 *    relation). Restrict throws P2003 while children exist.
 *  - Partial unique indexes from migrations, which Prisma cannot express, are listed in PARTIAL_UNIQUES.
 *
 * Writes are atomic. A failed create, update, delete or batch leaves the tables unchanged. $transaction rolls
 * back when its work throws, in both the interactive and the array form. Operations are deferred until awaited,
 * as Prisma's PrismaPromise is, so an array $transaction can run and roll back its operations.
 *
 * Limits: it does not reproduce SQL planning, indexes, isolation levels, NOT NULL checks, required-relation nulls,
 * or nested writes (connect, create). Real PostgreSQL behaviour remains unverified (ACA-003).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

type Row = Record<string, unknown>;

/** Untyped fake: any property read or call yields another FakeNode. Stands in for the Prisma client in tests. */
interface FakeNode {
  (...args: unknown[]): FakeNode;
  [key: string]: FakeNode;
}
type Relation = { model: string; fk: string; many?: boolean };
type Unique = { fields: string[]; where?: Row };
type ForeignKey = {
  name: string;
  child: string;
  fields: string[];
  parent: string;
  refs: string[];
  onDelete: "Cascade" | "SetNull" | "Restrict";
};

const relations: Record<string, Record<string, Relation>> = {
  user: {},
  course: {
    modules: { model: "module", fk: "courseId", many: true },
  },
  module: {
    lessons: { model: "lesson", fk: "moduleId", many: true },
  },
  lesson: { module: { model: "module", fk: "moduleId" } },
  lessonProgress: {
    lesson: { model: "lesson", fk: "lessonId" },
    student: { model: "user", fk: "studentId" },
  },
  enrollment: {
    course: { model: "course", fk: "courseId" },
    student: { model: "user", fk: "studentId" },
  },
  academyContentLesson: {
    revisions: { model: "academyLessonRevision", fk: "lessonId", many: true },
    placements: { model: "academyLessonPlacement", fk: "lessonId", many: true },
  },
  academyLessonRevision: {
    lesson: { model: "academyContentLesson", fk: "lessonId" },
    lessonReviews: { model: "academyLessonReview", fk: "revisionId", many: true },
  },
  academyLessonReview: {
    revision: { model: "academyLessonRevision", fk: "revisionId" },
    reviewer: { model: "user", fk: "reviewerId" },
  },
  academyCurriculumTrack: {
    placements: { model: "academyLessonPlacement", fk: "trackId", many: true },
  },
  academyLessonPlacement: {
    track: { model: "academyCurriculumTrack", fk: "trackId" },
    lesson: { model: "academyContentLesson", fk: "lessonId" },
    revision: { model: "academyLessonRevision", fk: "revisionId" },
  },
  academyCourseTrack: {
    track: { model: "academyCurriculumTrack", fk: "trackId" },
    course: { model: "course", fk: "courseId" },
  },
  academyLearnerCompletion: {
    revision: { model: "academyLessonRevision", fk: "revisionId" },
  },
  academyKnowledgeAttempt: {
    revision: { model: "academyLessonRevision", fk: "revisionId" },
  },
  academyKnowledgeAnswerKey: {
    revision: { model: "academyLessonRevision", fk: "revisionId" },
  },
  academyPracticalEvidence: {
    revision: { model: "academyLessonRevision", fk: "revisionId" },
    company: { model: "company", fk: "companyId" },
  },
  academyVerifiedCompetency: {
    evidence: { model: "academyPracticalEvidence", fk: "evidenceId" },
    learner: { model: "user", fk: "learnerId" },
  },
  company: {
    memberships: { model: "companyMember", fk: "companyId", many: true },
  },
  companyMember: {
    company: { model: "company", fk: "companyId" },
    user: { model: "user", fk: "userId" },
  },
  academyTrainingAssignment: {
    course: { model: "course", fk: "courseId" },
    company: { model: "company", fk: "companyId" },
    learner: { model: "user", fk: "learnerId" },
  },
  academyBusinessLessonField: {},
  academyLessonContextSnapshot: {},
  quiz: { questions: { model: "question", fk: "quizId", many: true } },
  question: { options: { model: "option", fk: "questionId", many: true } },
  quizAttempt: { quiz: { model: "quiz", fk: "quizId" } },
  option: {},
  answer: {},
};

// Partial unique indexes from migrations. Prisma cannot express them, so they are listed here by hand.
// Keep these in step with the migration SQL: quiz_attempts one-active index (20261102220000) and
// the course-wide selection index (20261102260000, renamed in 20261108090000).
const PARTIAL_UNIQUES: Record<string, Unique[]> = {
  quizAttempt: [{ fields: ["studentId", "quizId"], where: { status: "IN_PROGRESS" } }],
  academyCourseLessonSelection: [{ fields: ["courseId", "sourceId"], where: { companyId: null } }],
};

// Column defaults mirrored from the schema for fields the code under test relies on.
const defaults: Record<string, () => Row> = {
  enrollment: () => ({ progressPercentage: 0, status: "ACTIVE", enrolledAt: new Date(), completedAt: null, licenceTrack: "non-licensed" }),
  payment: () => ({ licenceTrack: "non-licensed" }),
  lessonProgress: () => ({ watchedSeconds: 0, completed: false, lastAccessedAt: new Date() }),
  academyContentLesson: () => ({ contentStatus: "BRIEF", createdAt: new Date() }),
  academyLessonRevision: () => ({ status: "DRAFT", publishedAt: null, createdAt: new Date() }),
  academyLessonReview: () => ({ notes: null, decidedAt: new Date() }),
  academyCurriculumTrack: () => ({ status: "DRAFT", serviceGroup: null, createdAt: new Date() }),
  academyLessonPlacement: () => ({ required: true, revisionId: null, createdAt: new Date() }),
  academyCourseTrack: () => ({ required: true, createdAt: new Date() }),
  academyLearnerCompletion: () => ({ completedAt: new Date() }),
  academyKnowledgeAttempt: () => ({ createdAt: new Date() }),
  academyKnowledgeAnswerKey: () => ({ rationale: null, loadedAt: new Date() }),
  academyPracticalEvidence: () => ({ status: "PENDING", assessorId: null, assessorFeedback: null, reviewedAt: null, expiresAt: undefined, createdAt: new Date() }),
  academyVerifiedCompetency: () => ({ verifiedAt: new Date(), expiresAt: null }),
  company: () => ({ externalRef: null, createdAt: new Date() }),
  companyMember: () => ({ role: "LEARNER", createdAt: new Date() }),
  academyTrainingAssignment: () => ({ status: "ASSIGNED", dueAt: null, createdAt: new Date() }),
  academyBusinessLessonField: () => ({ status: "DRAFT", revision: 1, approvedById: null, approvedAt: null, sourceSystem: null, sourceRecordRef: null, createdAt: new Date(), updatedAt: new Date() }),
  academyLessonContextSnapshot: () => ({ createdAt: new Date() }),
  academyCourseLessonSelection: () => ({ savedAt: new Date() }),
  course: () => ({ isPublished: false, price: 0, slug: null }),
  quiz: () => ({ isPublished: false }),
  quizAttempt: () => ({ status: "IN_PROGRESS", startedAt: new Date(), submittedAt: null, marksObtained: null }),
  answer: () => ({ marksObtained: null, textAnswer: null, selectedOptionId: null }),
  user: () => ({ isActive: true, deletedAt: null }),
};

const SCHEMA_PATH = path.resolve(__dirname, "../../../prisma/schema.prisma");

function modelKey(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function listOf(value: string): string[] {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

/** Reads @id, @unique, @@unique and owning relations (fields, references, onDelete) from the Prisma schema. */
function readSchema(text: string): { uniques: Map<string, Unique[]>; foreignKeys: ForeignKey[] } {
  const uniques = new Map<string, Unique[]>();
  const foreignKeys: ForeignKey[] = [];
  const models = new Set<string>();
  let model: string | null = null;
  const addUnique = (key: string, unique: Unique) => {
    if (!uniques.has(key)) uniques.set(key, []);
    uniques.get(key)!.push(unique);
  };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/(^|\s)\/\/.*$/, "").trim();
    const start = line.match(/^model (\w+) \{$/);
    if (start) {
      model = start[1];
      models.add(model);
      continue;
    }
    if (line === "}") {
      model = null;
      continue;
    }
    if (!model || !line) continue;
    const key = modelKey(model);
    const composite = line.match(/^@@unique\(\[([^\]]*)\]/);
    if (composite) {
      addUnique(key, { fields: listOf(composite[1]) });
      continue;
    }
    const field = line.match(/^(\w+)\s+(\w+)(\[\]|\?)?\s*(.*)$/);
    if (!field) continue;
    const [, name, type, modifier = "", attrs] = field;
    if (/@id\b/.test(attrs) || /@unique\b/.test(attrs)) addUnique(key, { fields: [name] });
    const relation = attrs.match(/@relation\(([^)]*)\)/);
    const fieldList = relation?.[1].match(/fields:\s*\[([^\]]*)\]/);
    if (relation && fieldList) {
      const refList = relation[1].match(/references:\s*\[([^\]]*)\]/);
      const onDelete = relation[1].match(/onDelete:\s*(\w+)/)?.[1];
      // Prisma defaults: SetNull for an optional relation, Restrict for a required one. NoAction behaves as Restrict.
      const action: ForeignKey["onDelete"] =
        onDelete === "Cascade" ? "Cascade" : onDelete === "SetNull" ? "SetNull" : onDelete === undefined && modifier === "?" ? "SetNull" : "Restrict";
      foreignKeys.push({
        name: `${model}_${listOf(fieldList[1]).join("_")}_fkey`,
        child: key,
        fields: listOf(fieldList[1]),
        parent: modelKey(type),
        refs: listOf(refList?.[1] ?? "id"),
        onDelete: action,
      });
    }
  }
  for (const fk of foreignKeys) {
    if (!models.has(fk.parent[0].toUpperCase() + fk.parent.slice(1))) throw new Error(`Schema relation ${fk.name} points at unknown model ${fk.parent}`);
  }
  return { uniques, foreignKeys };
}

const parsedSchema = readSchema(readFileSync(SCHEMA_PATH, "utf8"));
const UNIQUES = new Map<string, Unique[]>();
for (const [key, list] of [...parsedSchema.uniques, ...Object.entries(PARTIAL_UNIQUES)] as [string, Unique[]][]) {
  UNIQUES.set(key, [...(UNIQUES.get(key) ?? []), ...list]);
}
const OUTGOING = new Map<string, ForeignKey[]>();
const INCOMING = new Map<string, ForeignKey[]>();
for (const fk of parsedSchema.foreignKeys) {
  OUTGOING.set(fk.child, [...(OUTGOING.get(fk.child) ?? []), fk]);
  INCOMING.set(fk.parent, [...(INCOMING.get(fk.parent) ?? []), fk]);
}

const tables: Record<string, Row[]> = {};
let sequence = 0;

function table(model: string): Row[] {
  if (!tables[model]) tables[model] = [];
  return tables[model];
}

function nextId(model: string): string {
  sequence += 1;
  return `${model.slice(0, 6)}_${String(sequence).padStart(8, "0")}`;
}

function prismaError(code: string, message: string, meta?: Row): Error {
  const error = new Error(message) as Error & { code?: string; meta?: Row };
  error.code = code;
  if (meta) error.meta = meta;
  return error;
}

function uniqueError(model: string, fields: string[]): Error {
  return prismaError("P2002", `Unique constraint failed on ${model} (${fields.join(",")})`, { modelName: model, target: fields });
}

function foreignKeyError(fk: ForeignKey): Error {
  return prismaError("P2003", `Foreign key constraint failed on the field: \`${fk.name}\``, { modelName: fk.child, field_name: fk.name });
}

function notFoundError(model: string): Error {
  return prismaError("P2025", `No ${model} record found`);
}

function isPlainObject(value: unknown): value is Row {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

/** Narrows an untyped query argument to an object, or undefined when it is not one. */
function asRow(value: unknown): Row | undefined {
  return isPlainObject(value) ? value : undefined;
}

/** Narrows an untyped query argument (skip, take) to a number, or undefined when it is not one. */
function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** The data, create or update payload of a write; an absent payload is an empty object. */
function dataOf(value: unknown): Row {
  return asRow(value) ?? {};
}

/** Prisma compound unique keys (e.g. studentId_courseId) are flattened into plain filters. */
function normalizeWhere(where: unknown): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(asRow(where) ?? {})) {
    if (key.includes("_") && isPlainObject(value)) Object.assign(out, value);
    else out[key] = value;
  }
  return out;
}

function equal(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a == null && b == null) return true;
  return a === b;
}

function compare(a: unknown, b: unknown): number {
  const av = a instanceof Date ? a.getTime() : (a as number | string);
  const bv = b instanceof Date ? b.getTime() : (b as number | string);
  if (av === bv) return 0;
  return av! < bv! ? -1 : 1;
}

const OPERATORS = new Set(["in", "notIn", "not", "gt", "gte", "lt", "lte", "equals"]);

function matchValue(actual: unknown, cond: unknown): boolean {
  if (cond === undefined) return true;
  if (isPlainObject(cond) && Object.keys(cond).some((key) => OPERATORS.has(key))) {
    return Object.entries(cond).every(([op, value]) => {
      switch (op) {
        case "in": return Array.isArray(value) && value.some((item) => equal(actual, item));
        case "notIn": return !(Array.isArray(value) && value.some((item) => equal(actual, item)));
        case "not": return isPlainObject(value) ? !matchValue(actual, value) : !equal(actual, value);
        case "gt": return actual != null && compare(actual, value) > 0;
        case "gte": return actual != null && compare(actual, value) >= 0;
        case "lt": return actual != null && compare(actual, value) < 0;
        case "lte": return actual != null && compare(actual, value) <= 0;
        case "equals": return equal(actual, value);
        default: return false;
      }
    });
  }
  return equal(actual, cond);
}

function relatedOne(row: Row, rel: Relation): Row | null {
  const key = row[rel.fk];
  if (key == null) return null;
  return table(rel.model).find((candidate) => candidate.id === key) ?? null;
}

function relatedMany(row: Row, rel: Relation): Row[] {
  return table(rel.model).filter((candidate) => candidate[rel.fk] === row.id);
}

function matchWhere(row: Row, rawWhere: unknown, model: string): boolean {
  const where = normalizeWhere(rawWhere);
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (key === "AND") {
      if (!(Array.isArray(cond) ? cond : [cond]).every((part) => matchWhere(row, part, model))) return false;
      continue;
    }
    if (key === "OR") {
      if (!(cond as Row[]).some((part) => matchWhere(row, part, model))) return false;
      continue;
    }
    const rel = relations[model]?.[key];
    if (rel) {
      if (rel.many) {
        const list = relatedMany(row, rel);
        const filter = cond as Row;
        if (filter.some !== undefined && !list.some((item) => matchWhere(item, filter.some, rel.model))) return false;
        if (filter.every !== undefined && !list.every((item) => matchWhere(item, filter.every, rel.model))) return false;
        if (filter.none !== undefined && list.some((item) => matchWhere(item, filter.none, rel.model))) return false;
        continue;
      }
      const target = relatedOne(row, rel);
      if (cond === null) {
        if (target) return false;
        continue;
      }
      if (!target || !matchWhere(target, cond as Row, rel.model)) return false;
      continue;
    }
    if (!matchValue(row[key] ?? null, cond)) return false;
  }
  return true;
}

function sortRows(rows: Row[], orderBy: unknown): Row[] {
  const clauses = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []) as Row[];
  if (!clauses.length) return rows;
  return [...rows].sort((left, right) => {
    for (const clause of clauses) {
      for (const [field, direction] of Object.entries(clause)) {
        const result = compare(left[field], right[field]);
        if (result !== 0) return direction === "desc" ? -result : result;
      }
    }
    return 0;
  });
}

function project(row: Row | null, model: string, args: Row | undefined): Row | null {
  if (!row) return null;
  if (args?.select) {
    const out: Row = {};
    for (const [key, value] of Object.entries(asRow(args.select) ?? {})) {
      if (!value) continue;
      if (relations[model]?.[key]) out[key] = resolveRelation(row, model, key, value === true ? {} : (asRow(value) ?? {}));
      else out[key] = row[key];
    }
    return out;
  }
  const out: Row = { ...row };
  if (args?.include) {
    for (const [key, value] of Object.entries(asRow(args.include) ?? {})) {
      if (!value || !relations[model]?.[key]) continue;
      out[key] = resolveRelation(row, model, key, value === true ? {} : (asRow(value) ?? {}));
    }
  }
  return out;
}

function resolveRelation(row: Row, model: string, key: string, opts: Row): unknown {
  const rel = relations[model][key];
  if (!rel.many) {
    const target = relatedOne(row, rel);
    return target ? project(target, rel.model, opts) : null;
  }
  let list = relatedMany(row, rel).filter((item) => matchWhere(item, opts.where, rel.model));
  list = sortRows(list, opts.orderBy);
  const start = asNumber(opts.skip) ?? 0;
  const take = asNumber(opts.take);
  if (take !== undefined) list = list.slice(start, start + take);
  else list = list.slice(start);
  return list.map((item) => project(item, rel.model, opts));
}

function findRaw(model: string, args: Row): Row[] {
  let rows = table(model).filter((row) => matchWhere(row, args.where, model));
  rows = sortRows(rows, args.orderBy);
  if (args.cursor) {
    const index = rows.findIndex((row) => matchWhere(row, args.cursor, model));
    if (index < 0) return [];
    rows = rows.slice(index + (asNumber(args.skip) ?? 0));
  } else if (args.skip) {
    rows = rows.slice(asNumber(args.skip) ?? 0);
  }
  const take = asNumber(args.take);
  if (take !== undefined) rows = rows.slice(0, take);
  return rows;
}

function applyData(row: Row, data: Row): void {
  for (const [key, value] of Object.entries(data ?? {})) {
    if (isPlainObject(value) && typeof value.increment === "number") row[key] = (asNumber(row[key]) ?? 0) + value.increment;
    else row[key] = value;
  }
}

function matchesPartial(row: Row, where: Row): boolean {
  return Object.entries(where).every(([field, value]) => equal(row[field] ?? null, value ?? null));
}

/** Throws P2002 when another row shares a unique key. A key with any NULL part cannot clash (PostgreSQL default). */
function checkUnique(model: string, candidate: Row, ignore?: Row): void {
  for (const unique of UNIQUES.get(model) ?? []) {
    if (unique.where && !matchesPartial(candidate, unique.where)) continue;
    const values = unique.fields.map((field) => candidate[field] ?? null);
    if (values.some((value) => value === null)) continue;
    const clash = table(model).some(
      (row) =>
        row !== ignore &&
        (!unique.where || matchesPartial(row, unique.where)) &&
        unique.fields.every((field, index) => equal(row[field] ?? null, values[index])),
    );
    if (clash) throw uniqueError(model, unique.fields);
  }
}

/** Throws P2003 when a non-null foreign key has no parent row. A NULL key is not checked (MATCH SIMPLE). */
function checkForeignKeys(model: string, candidate: Row): void {
  for (const fk of OUTGOING.get(model) ?? []) {
    const values = fk.fields.map((field) => candidate[field] ?? null);
    if (values.some((value) => value === null)) continue;
    const exists = table(fk.parent).some((row) => fk.refs.every((ref, index) => equal(row[ref] ?? null, values[index])));
    if (!exists) throw foreignKeyError(fk);
  }
}

function referencing(fk: ForeignKey, parent: Row): Row[] {
  return table(fk.child).filter((child) => fk.fields.every((field, index) => child[field] != null && equal(child[field], parent[fk.refs[index]] ?? null)));
}

/** Removes rows and applies each incoming relation's onDelete action first. */
function deleteRows(model: string, targets: Row[]): void {
  for (const fk of INCOMING.get(model) ?? []) {
    const children = [...new Set(targets.flatMap((parent) => referencing(fk, parent)))];
    if (!children.length) continue;
    if (fk.onDelete === "Restrict") throw foreignKeyError(fk);
    if (fk.onDelete === "SetNull") {
      for (const child of children) for (const field of fk.fields) child[field] = null;
    } else {
      deleteRows(fk.child, children);
    }
  }
  tables[model] = table(model).filter((row) => !targets.includes(row));
}

function insertRow(model: string, data: Row): Row {
  const row: Row = { ...(defaults[model]?.() ?? {}), ...data };
  if (row.id === undefined) row.id = nextId(model);
  checkUnique(model, row);
  checkForeignKeys(model, row);
  table(model).push(row);
  return row;
}

function updateRow(model: string, row: Row, data: Row): void {
  const candidate = { ...row };
  applyData(candidate, data);
  checkUnique(model, candidate, row);
  checkForeignKeys(model, candidate);
  applyData(row, data);
}

type Snapshot = Record<string, Row[]>;

function snapshotTables(): Snapshot {
  return structuredClone(tables);
}

function restoreTables(snapshot: Snapshot): void {
  for (const key of Object.keys(tables)) delete tables[key];
  Object.assign(tables, snapshot);
}

/** Runs work so that a throw leaves every table as it was. */
function atomically<T>(work: () => T): T {
  const snapshot = snapshotTables();
  try {
    return work();
  } catch (error) {
    restoreTables(snapshot);
    throw error;
  }
}

/** PrismaPromise-like: the work runs on the first await or then, not when the method is called. */
function deferred<T>(work: () => T): Promise<T> {
  let started: Promise<T> | undefined;
  const run = (): Promise<T> => (started ??= new Promise<T>((resolve) => resolve(work())));
  const thenable = {
    then: (onFulfilled?: ((value: T) => unknown) | null, onRejected?: ((reason: unknown) => unknown) | null) => run().then(onFulfilled, onRejected),
    catch: (onRejected?: ((reason: unknown) => unknown) | null) => run().catch(onRejected),
    finally: (onFinally?: (() => void) | null) => run().finally(onFinally),
    [Symbol.toStringTag]: "Promise",
  };
  return thenable as unknown as Promise<T>;
}

function modelApi(model: string) {
  return {
    findUnique: (args: Row) => deferred(() => project(findRaw(model, { ...args, take: 1 })[0] ?? null, model, args)),
    findFirst: (args: Row) => deferred(() => project(findRaw(model, { ...args, take: 1 })[0] ?? null, model, args)),
    findMany: (args: Row = {}) => deferred(() => findRaw(model, args).map((row) => project(row, model, args) as Row)),
    count: (args: Row = {}) => deferred(() => table(model).filter((row) => matchWhere(row, args.where, model)).length),
    aggregate: (args: Row = {}) =>
      deferred(() => {
        const result: Record<string, Record<string, number | null>> = {};
        const rows = table(model).filter((row) => matchWhere(row, args.where, model));
        for (const [op, fields] of Object.entries(args)) {
          if (op === "where" || !op.startsWith("_") || !isPlainObject(fields)) continue;
          const perField: Record<string, number | null> = {};
          result[op] = perField;
          for (const field of Object.keys(fields)) {
            const values = rows.flatMap((row) => (typeof row[field] === "number" ? [row[field]] : []));
            if (op === "_avg") perField[field] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
            if (op === "_count") perField[field] = values.length;
          }
        }
        return result;
      }),
    createMany: (args: Row) =>
      deferred(() =>
        atomically(() => {
          const data = (args.data ?? []) as Row[];
          for (const item of data) insertRow(model, item);
          return { count: data.length };
        }),
      ),
    create: (args: Row) => deferred(() => project(insertRow(model, dataOf(args.data)), model, args)),
    update: (args: Row) =>
      deferred(() => {
        const row = findRaw(model, { where: args.where, take: 1 })[0];
        if (!row) throw notFoundError(model);
        updateRow(model, row, dataOf(args.data));
        return project(row, model, args);
      }),
    updateMany: (args: Row) =>
      deferred(() =>
        atomically(() => {
          const rows = findRaw(model, { where: args.where });
          for (const row of rows) updateRow(model, row, dataOf(args.data));
          return { count: rows.length };
        }),
      ),
    upsert: (args: Row) =>
      deferred(() => {
        const existing = findRaw(model, { where: args.where, take: 1 })[0];
        if (existing) {
          updateRow(model, existing, dataOf(args.update));
          return project(existing, model, args);
        }
        return project(insertRow(model, dataOf(args.create)), model, args);
      }),
    delete: (args: Row) =>
      deferred(() =>
        atomically(() => {
          const row = findRaw(model, { where: args.where, take: 1 })[0];
          if (!row) throw notFoundError(model);
          deleteRows(model, [row]);
          return row;
        }),
      ),
    deleteMany: (args: Row = {}) =>
      deferred(() =>
        atomically(() => {
          const matched = findRaw(model, { where: args.where });
          deleteRows(model, matched);
          return { count: matched.length };
        }),
      ),
  };
}

async function transaction(arg: unknown): Promise<unknown> {
  const snapshot = snapshotTables();
  if (typeof arg === "function") {
    try {
      return await (arg as (tx: unknown) => Promise<unknown>)(fakePrisma);
    } catch (error) {
      restoreTables(snapshot);
      throw error;
    }
  }
  const results: unknown[] = [];
  try {
    for (const operation of arg as PromiseLike<unknown>[]) results.push(await operation);
  } catch (error) {
    restoreTables(snapshot);
    throw error;
  }
  return results;
}

const apis = new Map<string, ReturnType<typeof modelApi>>();

export const fakePrisma: FakeNode = new Proxy(
  {} as FakeNode,
  {
    get(_target, property) {
      if (property === "$transaction") return transaction;
      if (typeof property !== "string" || property === "then") return undefined;
      if (!apis.has(property)) apis.set(property, modelApi(property));
      return apis.get(property);
    },
  },
);

/** Test helpers: seed rows through the same create path (defaults, uniqueness and foreign keys apply). */
export async function seed(model: string, rows: Row[]): Promise<void> {
  for (const row of rows) insertRow(model, row);
}

export function rows(model: string): Row[] {
  return table(model);
}

/** Narrows a stored field the test reads as text. Throws when the stored value is not a string. */
export function stringOf(value: unknown): string {
  if (typeof value !== "string") throw new TypeError(`expected a string, got ${typeof value}`);
  return value;
}

/** Narrows a stored field the test reads as a number. Throws when the stored value is not a number. */
export function numberOf(value: unknown): number {
  if (typeof value !== "number") throw new TypeError(`expected a number, got ${typeof value}`);
  return value;
}

export function resetFakeDb(): void {
  for (const key of Object.keys(tables)) delete tables[key];
  sequence = 0;
}
