import { AppError, ForbiddenError, NotFoundError, ValidationError } from "../../utils/AppError";
import { resolveApprovedBusinessFields, resolveLessonText } from "../curriculum/business-lesson-fields";
import {
  assembleDocument,
  DocumentAssemblyError,
  evaluateRubric,
  readTemplateDefinition,
  validateFieldValues,
  type AssembledDocument,
  type EditableTemplate,
  type OutputDocumentDef,
  type RubricCriterion,
  type RubricResult,
  type SignOffDecision,
} from "./template.model";
import type { DocumentRecord, ResponseRecord, TemplateStore } from "./template.store";

/**
 * Template workflow: learner draft and submit, document assembly, assessor sign-off and
 * learner document access. Authorisation is checked here, not only in the routes.
 */

/** Owner decision: sign-off is open to ASSESSOR, OWNER and MANAGER members. Learners are refused on their own work separately. */
const SIGN_OFF_ROLES: readonly string[] = ["ASSESSOR", "OWNER", "MANAGER"];

export interface TemplateKey { lessonId: string; revisionId: string; templateId: string; companyId?: string | null }
export interface LoadedTemplate {
  response: ResponseRecord | null;
  revisionId: string;
  template: EditableTemplate;
  output: OutputDocumentDef;
  rubric: RubricCriterion[];
}

export class TemplateService {
  constructor(private readonly store: TemplateStore) {}

  /** Learner-scoped definition plus the learner's own responses. Other learners' data is never read. */
  async getLearnerLesson(learnerId: string, lessonId: string, revisionId: string) {
    const revision = await this.store.findPublishedRevision(revisionId, lessonId);
    if (!revision) throw new ForbiddenError("Published matching lesson revision required");
    const body = revision.body as { editableTemplates?: Array<{ templateId?: unknown }> };
    const ids = (body.editableTemplates ?? []).map(t => String(t.templateId));
    const templates = [];
    for (const templateId of ids) {
      const loaded = await this.loadTemplate(learnerId, { lessonId, revisionId, templateId });
      const latest = loaded.response ? await this.store.latestDocument(loaded.response.id) : null;
      templates.push({
        templateId,
        revisionId: loaded.revisionId,
        title: loaded.template.title,
        purpose: loaded.template.purpose,
        fields: loaded.template.fields,
        assessmentRubric: loaded.rubric,
        response: loaded.response
          ? { status: loaded.response.status, fieldValues: loaded.response.fieldValues, submittedAt: loaded.response.submittedAt }
          : null,
        document: latest && latest.issuedAt ? summariseDocument(latest) : null,
      });
    }
    return { lessonId, revisionId, templates };
  }

  async saveDraft(learnerId: string, input: TemplateKey & { fieldValues: unknown }) {
    const loaded = await this.loadTemplate(learnerId, input);
    if (loaded.response && loaded.response.status !== "IN_PROGRESS") {
      throw new AppError("This template is locked while it is submitted or signed off", 409);
    }
    const { values, errors } = validateFieldValues(loaded.template.fields, input.fieldValues, "draft");
    if (errors.length) throw new ValidationError(errors, "Template values are invalid");
    const companyId = loaded.response ? loaded.response.companyId : await this.resolveCompany(learnerId, input.companyId);
    return this.store.transaction(async tx => {
      if (loaded.response) {
        const changed = await tx.updateResponseIfStatus(loaded.response.id, "IN_PROGRESS", { fieldValues: values });
        if (changed !== 1) throw new AppError("This template was submitted while you were saving. Reload to see its status.", 409);
        return (await tx.findResponseById(loaded.response.id))!;
      }
      return tx.createResponse({
        companyId, learnerId, lessonId: input.lessonId, revisionId: loaded.revisionId, templateId: input.templateId,
        fieldValues: values, status: "IN_PROGRESS", submittedAt: null,
      });
    });
  }

  /** Validates every required field, assembles the document and stores it as a pending version. Nothing is issued here. */
  async submit(learnerId: string, input: TemplateKey & { fieldValues: unknown }) {
    const loaded = await this.loadTemplate(learnerId, input);
    if (loaded.response && loaded.response.status !== "IN_PROGRESS") {
      throw new AppError("This template has already been submitted", 409);
    }
    const { values, errors } = validateFieldValues(loaded.template.fields, input.fieldValues, "submit");
    if (errors.length) throw new ValidationError(errors, "Template values are invalid");
    const companyId = loaded.response ? loaded.response.companyId : await this.resolveCompany(learnerId, input.companyId);
    const businessFields = companyId ? resolveApprovedBusinessFields(await this.store.findApprovedBusinessFields(companyId)) : {};
    let assembled;
    try {
      assembled = assembleDocument(loaded.template, loaded.output, values, text => resolveLessonText(text, businessFields));
    } catch (error) {
      if (error instanceof DocumentAssemblyError) throw new AppError(`Template output document is incomplete for ${input.templateId}: ${error.message}`, 500);
      throw error;
    }
    const now = new Date();
    return this.store.transaction(async tx => {
      let response: ResponseRecord;
      if (loaded.response) {
        const changed = await tx.updateResponseIfStatus(loaded.response.id, "IN_PROGRESS", { fieldValues: values, status: "SUBMITTED", submittedAt: now });
        if (changed !== 1) throw new AppError("This template has already been submitted", 409);
        response = (await tx.findResponseById(loaded.response.id))!;
      } else {
        response = await tx.createResponse({
          companyId, learnerId, lessonId: input.lessonId, revisionId: loaded.revisionId, templateId: input.templateId,
          fieldValues: values, status: "SUBMITTED", submittedAt: now,
        });
      }
      const previous = await tx.latestDocument(response.id);
      const document = await tx.createDocument({
        templateResponseId: response.id,
        version: (previous?.version ?? 0) + 1,
        contentHash: assembled.contentHash,
        assembled: assembled.document,
        signOffId: null,
        issuedAt: null,
      });
      return { response, document: summariseDocument(document) };
    });
  }

  /** Assessor queue: submitted responses in the organisation. Assessors only, never the submitter's own. */
  async listSubmissionsForAssessor(assessorId: string, companyId: string) {
    await this.requireAssessor(assessorId, companyId);
    const responses = await this.store.listSubmittedResponses(companyId);
    const items = [];
    for (const response of responses) {
      if (response.learnerId === assessorId) continue;
      const revision = await this.store.findRevisionById(response.revisionId);
      if (!revision) continue;
      const { template, rubric } = readTemplateDefinition(revision.body, response.templateId);
      const latest = await this.store.latestDocument(response.id);
      items.push({
        responseId: response.id,
        lessonId: response.lessonId,
        revisionId: response.revisionId,
        templateId: response.templateId,
        title: template.title,
        learnerId: response.learnerId,
        submittedAt: response.submittedAt,
        fieldValues: response.fieldValues,
        rubric,
        document: latest ? { id: latest.id, version: latest.version, contentHash: latest.contentHash, issuedAt: latest.issuedAt, assembled: latest.assembled } : null,
      });
    }
    return items;
  }

  /**
   * Records an assessor decision. SIGNED_OFF issues the latest document and moves the response
   * to SIGNED_OFF in one serializable transaction. CHANGES_REQUESTED returns it to the learner.
   */
  async signOff(assessorId: string, companyId: string, responseId: string, input: { decision: SignOffDecision; rubricResults: Record<string, RubricResult>; notes?: string | null }) {
    await this.requireAssessor(assessorId, companyId);
    const response = await this.store.findResponseById(responseId);
    if (!response || response.companyId !== companyId) throw new NotFoundError("Template response");
    if (response.learnerId === assessorId) throw new ForbiddenError("Learners cannot sign off their own response");
    if (response.status !== "SUBMITTED") throw new AppError("Only a submitted response can be signed off", 409);
    if (input.decision === "CHANGES_REQUESTED" && !(input.notes && input.notes.trim().length >= 10)) {
      throw new ValidationError([{ fieldId: "notes", message: "must explain the changes requested" }], "Notes are required");
    }
    const revision = await this.store.findRevisionById(response.revisionId);
    if (!revision) throw new NotFoundError("Lesson revision");
    const { rubric } = readTemplateDefinition(revision.body, response.templateId);
    const rubricCheck = evaluateRubric(rubric, input.rubricResults, input.decision);
    if (rubricCheck.errors.length) throw new ValidationError(rubricCheck.errors.map(message => ({ fieldId: "rubricResults", message })), "Rubric results are invalid");
    const latest = await this.store.latestDocument(response.id);
    if (!latest || latest.issuedAt) throw new AppError("No submitted document is waiting for sign-off", 409);
    if (input.decision === "SIGNED_OFF") {
      const assembled = latest.assembled as AssembledDocument;
      if (assembled.unresolvedPlaceholders?.length) {
        throw new AppError(`Document cannot be issued until business values are approved: ${(assembled.unresolvedPlaceholders ?? []).join(", ")}`, 409);
      }
    }
    return this.store.transaction(async tx => {
      const decidedAt = new Date();
      const signOff = await tx.createSignOff({
        templateResponseId: response.id,
        assessorId,
        decision: input.decision,
        rubricResults: input.rubricResults,
        notes: input.notes?.trim() || null,
        decidedAt,
      });
      if (input.decision === "SIGNED_OFF") {
        const issued = await tx.issueDocumentIfUnissued(latest.id, signOff.id, decidedAt);
        if (issued !== 1) throw new AppError("The document was already issued", 409);
        const moved = await tx.updateResponseIfStatus(response.id, "SUBMITTED", { status: "SIGNED_OFF" });
        if (moved !== 1) throw new AppError("The response changed while it was being signed off", 409);
      } else {
        const moved = await tx.updateResponseIfStatus(response.id, "SUBMITTED", { status: "IN_PROGRESS" });
        if (moved !== 1) throw new AppError("The response changed while it was being reviewed", 409);
      }
      return { signOffId: signOff.id, decision: input.decision, responseId: response.id };
    });
  }

  async listIssuedDocuments(learnerId: string) {
    const rows = await this.store.listIssuedDocumentsForLearner(learnerId);
    return rows.map(({ document, response }) => ({ ...summariseDocument(document), responseId: response.id, lessonId: response.lessonId, templateId: response.templateId, title: (document.assembled as AssembledDocument).title }));
  }

  /** Returns the assembled document only to its own learner, and only once it is issued. */
  async getIssuedDocument(learnerId: string, documentId: string): Promise<{ document: DocumentRecord; assembled: AssembledDocument }> {
    const row = await this.store.findDocumentWithResponse(documentId);
    if (!row || row.response.learnerId !== learnerId || !row.document.issuedAt || row.response.status !== "SIGNED_OFF") {
      throw new NotFoundError("Document");
    }
    return { document: row.document, assembled: row.document.assembled as AssembledDocument };
  }

  private async loadTemplate(learnerId: string, input: TemplateKey): Promise<LoadedTemplate> {
    const existing = await this.store.findResponse(learnerId, input.lessonId, input.templateId);
    const revisionId = existing ? existing.revisionId : input.revisionId;
    const revision = await this.store.findPublishedRevision(revisionId, input.lessonId);
    if (!revision) throw new ForbiddenError("Published matching lesson revision required");
    if (!(await this.store.isLearnerEligible(learnerId, input.lessonId, revisionId))) {
      throw new ForbiddenError("Lesson is not assigned through an active enrolled course");
    }
    const body = revision.body as { editableTemplates?: Array<{ templateId?: unknown }> };
    if (!(body.editableTemplates ?? []).some(t => t.templateId === input.templateId)) throw new NotFoundError("Template");
    const { template, output, rubric } = readTemplateDefinition(revision.body, input.templateId);
    return { response: existing, revisionId, template, output, rubric };
  }

  /**
   * Organisation learners must be members of the organisation they name. When none is named, a learner
   * with exactly one membership uses it, so the submission reaches that organisation's assessors.
   * A learner with several memberships must choose. A learner with none is a solo learner.
   */
  private async resolveCompany(learnerId: string, companyId: string | null | undefined): Promise<string | null> {
    if (companyId) {
      const role = await this.store.findMembershipRole(companyId, learnerId);
      if (!role) throw new ForbiddenError("Organisation membership required");
      return companyId;
    }
    const memberships = await this.store.listMemberships(learnerId);
    if (memberships.length === 0) return null;
    if (memberships.length === 1) return memberships[0].companyId;
    throw new ValidationError([{ fieldId: "companyId", message: "is required when you belong to more than one organisation" }], "Choose an organisation");
  }

  private async requireAssessor(assessorId: string, companyId: string): Promise<void> {
    const role = await this.store.findMembershipRole(companyId, assessorId);
    if (!role || !SIGN_OFF_ROLES.includes(role)) throw new ForbiddenError("Organisation assessor membership required");
  }
}

function summariseDocument(document: DocumentRecord) {
  return { id: document.id, version: document.version, contentHash: document.contentHash, issuedAt: document.issuedAt };
}
