import type { BusinessFieldRecord } from "../../modules/curriculum/business-lesson-fields";
import type { DocumentRecord, ResponseRecord, ResponseStatus, RevisionRecord, SignOffRecord, TemplateStore } from "../../modules/templates/template.store";

/**
 * In-memory TemplateStore for service tests. It mirrors the unique constraints and conditional
 * updates of the Prisma adapter, and rolls back a transaction when its work throws.
 */
export class MemoryTemplateStore implements TemplateStore {
  revisions = new Map<string, RevisionRecord>();
  eligible = new Set<string>();
  memberships = new Map<string, string>();
  businessFields = new Map<string, BusinessFieldRecord[]>();
  responses: ResponseRecord[] = [];
  documents: DocumentRecord[] = [];
  signOffs: SignOffRecord[] = [];
  private sequence = 0;

  private nextId(prefix: string) {
    this.sequence += 1;
    return `${prefix}_${this.sequence}`;
  }
  private snapshot() {
    return structuredClone({ responses: this.responses, documents: this.documents, signOffs: this.signOffs, sequence: this.sequence });
  }
  private restore(state: ReturnType<MemoryTemplateStore["snapshot"]>) {
    this.responses = state.responses;
    this.documents = state.documents;
    this.signOffs = state.signOffs;
    this.sequence = state.sequence;
  }

  seedRevision(revision: RevisionRecord) {
    this.revisions.set(revision.id, revision);
  }
  grant(learnerId: string, lessonId: string, revisionId: string) {
    this.eligible.add(`${learnerId}|${lessonId}|${revisionId}`);
  }
  member(companyId: string, userId: string, role: string) {
    this.memberships.set(`${companyId}|${userId}`, role);
  }

  async transaction<T>(work: (tx: TemplateStore) => Promise<T>): Promise<T> {
    const state = this.snapshot();
    try {
      return await work(this);
    } catch (error) {
      this.restore(state);
      throw error;
    }
  }
  async findPublishedRevision(revisionId: string, lessonId: string) {
    const row = this.revisions.get(revisionId);
    return row && row.lessonId === lessonId && row.status === "PUBLISHED" ? structuredClone(row) : null;
  }
  async findRevisionById(revisionId: string) {
    const row = this.revisions.get(revisionId);
    return row ? structuredClone(row) : null;
  }
  async isLearnerEligible(learnerId: string, lessonId: string, revisionId: string) {
    return this.eligible.has(`${learnerId}|${lessonId}|${revisionId}`);
  }
  async findMembershipRole(companyId: string, userId: string) {
    return this.memberships.get(`${companyId}|${userId}`) ?? null;
  }
  async listMemberships(userId: string) {
    return [...this.memberships].filter(([key]) => key.endsWith(`|${userId}`)).map(([key, role]) => ({ companyId: key.split("|")[0], role }));
  }
  async findApprovedBusinessFields(companyId: string) {
    return (this.businessFields.get(companyId) ?? []).filter(f => f.status === "APPROVED").map(f => ({ ...f }));
  }
  async findResponse(learnerId: string, lessonId: string, templateId: string) {
    const row = this.responses.find(r => r.learnerId === learnerId && r.lessonId === lessonId && r.templateId === templateId);
    return row ? structuredClone(row) : null;
  }
  async findResponseById(responseId: string) {
    const row = this.responses.find(r => r.id === responseId);
    return row ? structuredClone(row) : null;
  }
  async listSubmittedResponses(companyId: string) {
    return this.responses.filter(r => r.companyId === companyId && r.status === "SUBMITTED").map(r => structuredClone(r));
  }
  async createResponse(data: Parameters<TemplateStore["createResponse"]>[0]) {
    if (this.responses.some(r => r.learnerId === data.learnerId && r.lessonId === data.lessonId && r.templateId === data.templateId)) {
      const error = new Error("Unique constraint failed on academy_template_responses") as Error & { code?: string };
      error.code = "P2002";
      throw error;
    }
    const now = new Date();
    const row: ResponseRecord = { ...structuredClone(data), id: this.nextId("resp"), createdAt: now, updatedAt: now };
    this.responses.push(row);
    return structuredClone(row);
  }
  async updateResponseIfStatus(responseId: string, fromStatus: ResponseStatus, data: Partial<Pick<ResponseRecord, "status" | "fieldValues" | "submittedAt">>) {
    const row = this.responses.find(r => r.id === responseId && r.status === fromStatus);
    if (!row) return 0;
    if (data.status !== undefined) row.status = data.status;
    if (data.fieldValues !== undefined) row.fieldValues = structuredClone(data.fieldValues);
    if (data.submittedAt !== undefined) row.submittedAt = data.submittedAt;
    row.updatedAt = new Date();
    return 1;
  }
  async latestDocument(responseId: string) {
    const rows = this.documents.filter(d => d.templateResponseId === responseId).sort((a, b) => b.version - a.version);
    return rows[0] ? structuredClone(rows[0]) : null;
  }
  async createDocument(data: Parameters<TemplateStore["createDocument"]>[0]) {
    if (this.documents.some(d => d.templateResponseId === data.templateResponseId && d.version === data.version)) {
      const error = new Error("Unique constraint failed on academy_generated_documents") as Error & { code?: string };
      error.code = "P2002";
      throw error;
    }
    const row: DocumentRecord = { ...structuredClone(data), id: this.nextId("doc"), signOffId: null, issuedAt: null, createdAt: new Date() };
    this.documents.push(row);
    return structuredClone(row);
  }
  async issueDocumentIfUnissued(documentId: string, signOffId: string, issuedAt: Date) {
    const row = this.documents.find(d => d.id === documentId && d.signOffId === null && d.issuedAt === null);
    if (!row) return 0;
    row.signOffId = signOffId;
    row.issuedAt = issuedAt;
    return 1;
  }
  async createSignOff(data: Parameters<TemplateStore["createSignOff"]>[0]) {
    const row: SignOffRecord = { ...structuredClone(data), id: this.nextId("sign") };
    this.signOffs.push(row);
    return structuredClone(row);
  }
  async findDocumentWithResponse(documentId: string) {
    const document = this.documents.find(d => d.id === documentId);
    if (!document) return null;
    const response = this.responses.find(r => r.id === document.templateResponseId)!;
    return { document: structuredClone(document), response: structuredClone(response) };
  }
  async listIssuedDocumentsForLearner(learnerId: string) {
    return this.documents
      .filter(d => d.issuedAt !== null)
      .map(d => ({ document: d, response: this.responses.find(r => r.id === d.templateResponseId)! }))
      .filter(row => row.response.learnerId === learnerId && row.response.status === "SIGNED_OFF")
      .map(row => ({ document: structuredClone(row.document), response: structuredClone(row.response) }));
  }
}
