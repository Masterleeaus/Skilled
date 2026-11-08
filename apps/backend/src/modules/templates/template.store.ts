import type { Prisma } from "@prisma/client";
import type { prisma as appPrisma } from "../../config/prisma";
import type { BusinessFieldRecord } from "../curriculum/business-lesson-fields";

/** Narrow persistence boundary for template workflows. Keeps the service testable without a database. */

export type ResponseStatus = "IN_PROGRESS" | "SUBMITTED" | "SIGNED_OFF";

export interface ResponseRecord {
  id: string;
  companyId: string | null;
  learnerId: string;
  lessonId: string;
  revisionId: string;
  templateId: string;
  fieldValues: unknown;
  status: string;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface RevisionRecord { id: string; lessonId: string; status: string; body: unknown }
export interface DocumentRecord {
  id: string;
  templateResponseId: string;
  version: number;
  contentHash: string;
  assembled: unknown;
  signOffId: string | null;
  issuedAt: Date | null;
  createdAt: Date;
}
export interface SignOffRecord {
  id: string;
  templateResponseId: string;
  assessorId: string;
  decision: string;
  rubricResults: unknown;
  notes: string | null;
  decidedAt: Date;
}

export interface TemplateStore {
  transaction<T>(work: (tx: TemplateStore) => Promise<T>): Promise<T>;
  findPublishedRevision(revisionId: string, lessonId: string): Promise<RevisionRecord | null>;
  findRevisionById(revisionId: string): Promise<RevisionRecord | null>;
  /** True when an active enrolment reaches a published track placement of this exact lesson revision. */
  isLearnerEligible(learnerId: string, lessonId: string, revisionId: string): Promise<boolean>;
  findMembershipRole(companyId: string, userId: string): Promise<string | null>;
  listMemberships(userId: string): Promise<Array<{ companyId: string; role: string }>>;
  findApprovedBusinessFields(companyId: string): Promise<BusinessFieldRecord[]>;
  findResponse(learnerId: string, lessonId: string, templateId: string): Promise<ResponseRecord | null>;
  findResponseById(responseId: string): Promise<ResponseRecord | null>;
  listSubmittedResponses(companyId: string): Promise<ResponseRecord[]>;
  createResponse(data: Omit<ResponseRecord, "id" | "createdAt" | "updatedAt" | "submittedAt"> & { submittedAt: Date | null }): Promise<ResponseRecord>;
  /** Conditional update. Returns the number of rows changed, so callers can detect a race. */
  updateResponseIfStatus(responseId: string, fromStatus: ResponseStatus, data: Partial<Pick<ResponseRecord, "status" | "fieldValues" | "submittedAt">>): Promise<number>;
  latestDocument(responseId: string): Promise<DocumentRecord | null>;
  createDocument(data: Omit<DocumentRecord, "id" | "createdAt" | "signOffId" | "issuedAt"> & { signOffId: null; issuedAt: null }): Promise<DocumentRecord>;
  /** Issues only a document that has no sign-off yet. Returns the number of rows changed. */
  issueDocumentIfUnissued(documentId: string, signOffId: string, issuedAt: Date): Promise<number>;
  createSignOff(data: Omit<SignOffRecord, "id" | "decidedAt"> & { decidedAt: Date }): Promise<SignOffRecord>;
  findDocumentWithResponse(documentId: string): Promise<{ document: DocumentRecord; response: ResponseRecord } | null>;
  listIssuedDocumentsForLearner(learnerId: string): Promise<Array<{ document: DocumentRecord; response: ResponseRecord }>>;
}

type AppPrisma = typeof appPrisma;

/** Json columns accept any serialisable value; the service validates shape before it reaches the store. */
const json = (value: unknown) => value as Prisma.InputJsonValue;

const TERMINAL = "SIGNED_OFF";

/** Prisma implementation. `db` is the application client or an interactive transaction client. */
export function createPrismaTemplateStore(db: AppPrisma): TemplateStore {
  const store: TemplateStore = {
    transaction: (work) => db.$transaction((tx) => work(createPrismaTemplateStore(tx as unknown as AppPrisma)), { isolationLevel: "Serializable" }),
    findPublishedRevision: async (revisionId, lessonId) => {
      const row = await db.academyLessonRevision.findFirst({ where: { id: revisionId, lessonId, status: "PUBLISHED" } });
      return row ? { id: row.id, lessonId: row.lessonId, status: row.status, body: row.body } : null;
    },
    findRevisionById: async (revisionId) => {
      const row = await db.academyLessonRevision.findUnique({ where: { id: revisionId } });
      return row ? { id: row.id, lessonId: row.lessonId, status: row.status, body: row.body } : null;
    },
    isLearnerEligible: async (learnerId, lessonId, revisionId) => {
      const enrolments = await db.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true } });
      if (!enrolments.length) return false;
      const eligible = await db.academyCourseTrack.findFirst({
        where: { courseId: { in: enrolments.map(e => e.courseId) }, track: { status: "PUBLISHED", placements: { some: { lessonId, revisionId } } } },
      });
      return !!eligible;
    },
    findMembershipRole: async (companyId, userId) => {
      const member = await db.companyMember.findUnique({ where: { companyId_userId: { companyId, userId } } });
      return member?.role ?? null;
    },
    listMemberships: async (userId) => db.companyMember.findMany({ where: { userId }, select: { companyId: true, role: true }, orderBy: { createdAt: "asc" } }),
    findApprovedBusinessFields: async (companyId) => {
      const rows = await db.academyBusinessLessonField.findMany({ where: { companyId, status: "APPROVED" }, select: { fieldKey: true, value: true, status: true, revision: true } });
      return rows;
    },
    findResponse: async (learnerId, lessonId, templateId) => {
      return (await db.academyTemplateResponse.findUnique({ where: { learnerId_lessonId_templateId: { learnerId, lessonId, templateId } } })) as ResponseRecord | null;
    },
    findResponseById: async (responseId) => (await db.academyTemplateResponse.findUnique({ where: { id: responseId } })) as ResponseRecord | null,
    listSubmittedResponses: async (companyId) =>
      (await db.academyTemplateResponse.findMany({ where: { companyId, status: "SUBMITTED" }, orderBy: { submittedAt: "asc" }, take: 100 })) as ResponseRecord[],
    createResponse: async (data) => (await db.academyTemplateResponse.create({ data: { ...data, fieldValues: json(data.fieldValues) } })) as ResponseRecord,
    updateResponseIfStatus: async (responseId, fromStatus, data) => {
      const patch: Prisma.AcademyTemplateResponseUpdateManyMutationInput = { status: data.status, submittedAt: data.submittedAt, fieldValues: data.fieldValues === undefined ? undefined : json(data.fieldValues) };
      const result = await db.academyTemplateResponse.updateMany({ where: { id: responseId, status: fromStatus }, data: patch });
      return result.count;
    },
    latestDocument: async (responseId) =>
      (await db.academyGeneratedDocument.findFirst({ where: { templateResponseId: responseId }, orderBy: { version: "desc" } })) as DocumentRecord | null,
    createDocument: async (data) => (await db.academyGeneratedDocument.create({ data: { ...data, assembled: json(data.assembled) } })) as DocumentRecord,
    issueDocumentIfUnissued: async (documentId, signOffId, issuedAt) => {
      const result = await db.academyGeneratedDocument.updateMany({ where: { id: documentId, signOffId: null, issuedAt: null }, data: { signOffId, issuedAt } });
      return result.count;
    },
    createSignOff: async (data) => (await db.academyTemplateSignOff.create({ data: { ...data, rubricResults: json(data.rubricResults) } })) as SignOffRecord,
    findDocumentWithResponse: async (documentId) => {
      const row = await db.academyGeneratedDocument.findUnique({ where: { id: documentId }, include: { templateResponse: true } });
      if (!row) return null;
      const { templateResponse, ...document } = row;
      return { document: document as DocumentRecord, response: templateResponse as ResponseRecord };
    },
    listIssuedDocumentsForLearner: async (learnerId) => {
      const rows = await db.academyGeneratedDocument.findMany({
        where: { issuedAt: { not: null }, templateResponse: { learnerId, status: TERMINAL } },
        include: { templateResponse: true },
        orderBy: { issuedAt: "desc" },
        take: 200,
      });
      return rows.map(({ templateResponse, ...document }) => ({ document: document as DocumentRecord, response: templateResponse as ResponseRecord }));
    },
  };
  return store;
}
