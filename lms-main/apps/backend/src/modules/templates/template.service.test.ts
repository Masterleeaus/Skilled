import { beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "../../utils/AppError";
import { MemoryTemplateStore } from "../../tests/support/template-memory-store";
import { TemplateDefinitionError } from "./template.model";
import { TemplateService } from "./template.service";

const LESSON = "lesson_1";
const REVISION = "rev_1";
const ORG = "org_1";
const LEARNER_A = "learner_a";
const LEARNER_B = "learner_b";
const ASSESSOR = "assessor_1";
const MANAGER = "manager_1";
const OTHER_ORG = "org_2";
const LEARNER_C = "learner_c";

const body = (overrides: Record<string, unknown> = {}) => ({
  lessonKind: "template",
  knowledgeChecks: [],
  editableTemplates: [{
    templateId: "TPL-1-T01",
    title: "Schedule",
    purpose: "Purpose",
    fields: [
      { fieldId: "f1", label: "Method", type: "text", prompt: "p", guidance: "g", required: true },
      { fieldId: "f2", label: "Due days", type: "number", prompt: "p", guidance: "g", required: true },
      { fieldId: "f3", label: "Notes", type: "longtext", prompt: "p", guidance: "g", required: false },
    ],
  }],
  outputDocument: {
    title: "Schedule",
    format: "contract",
    sections: [
      { heading: "Terms", fieldIds: ["f1", "f2"] },
      { heading: "Notes", fieldIds: ["f3"] },
    ],
    footer: "Footer",
  },
  assessmentRubric: [
    { criterion: "Due period stated", levels: { meets: "m", does_not_meet: "d" } },
    { criterion: "Method stated", levels: { meets: "m", does_not_meet: "d" } },
  ],
  ...overrides,
});

const valid = { f1: "Invoice per visit", f2: 14, f3: "" };
const rubricAllMet = { "Due period stated": "meets", "Method stated": "meets" } as const;

describe("TemplateService", () => {
  let store: MemoryTemplateStore;
  let service: TemplateService;

  beforeEach(() => {
    store = new MemoryTemplateStore();
    service = new TemplateService(store);
    store.seedRevision({ id: REVISION, lessonId: LESSON, status: "PUBLISHED", body: body() });
    store.grant(LEARNER_A, LESSON, REVISION);
    store.grant(LEARNER_B, LESSON, REVISION);
    store.member(ORG, LEARNER_A, "LEARNER");
    store.member(ORG, LEARNER_B, "LEARNER");
    store.member(ORG, ASSESSOR, "ASSESSOR");
    store.member(ORG, MANAGER, "MANAGER");
    store.member(ORG, LEARNER_A + "_also_assessor", "ASSESSOR");
    store.member(OTHER_ORG, ASSESSOR, "ASSESSOR");
    store.grant(ASSESSOR, LESSON, REVISION);
    store.grant(LEARNER_C, LESSON, REVISION);
    store.member(ORG, LEARNER_C, "ASSESSOR");
  });

  const key = { lessonId: LESSON, revisionId: REVISION, templateId: "TPL-1-T01", companyId: ORG };

  async function submitAsA() {
    return service.submit(LEARNER_A, { ...key, fieldValues: valid });
  }

  describe("learner drafts and submission", () => {
    it("saves a partial draft as IN_PROGRESS without enforcing required fields", async () => {
      const response = await service.saveDraft(LEARNER_A, { ...key, fieldValues: { f1: "Half done" } });
      expect(response.status).toBe("IN_PROGRESS");
      expect(response.companyId).toBe(ORG);
    });

    it("rejects a submit with a missing required field and leaves the draft unchanged", async () => {
      await service.saveDraft(LEARNER_A, { ...key, fieldValues: { f1: "Half done" } });
      await expect(service.submit(LEARNER_A, { ...key, fieldValues: { f1: "Half done" } })).rejects.toMatchObject({
        statusCode: 422,
        errors: [{ fieldId: "f2", message: "is required" }],
      });
      const stored = await store.findResponse(LEARNER_A, LESSON, "TPL-1-T01");
      expect(stored?.status).toBe("IN_PROGRESS");
      expect(store.documents).toHaveLength(0);
    });

    it("validates types on the server, not only the browser", async () => {
      await expect(service.saveDraft(LEARNER_A, { ...key, fieldValues: { f2: "fourteen" } })).rejects.toBeInstanceOf(ValidationError);
    });

    it("submits, stores a pending assembled document with a hash, and issues nothing", async () => {
      const result = await submitAsA();
      expect(result.response.status).toBe("SUBMITTED");
      expect(result.document.version).toBe(1);
      expect(result.document.issuedAt).toBeNull();
      expect(result.document.contentHash).toMatch(/^[0-9a-f]{64}$/);
      expect(store.documents[0].assembled).toEqual(expect.objectContaining({ title: "Schedule", unresolvedPlaceholders: [] }));
      expect(await service.listIssuedDocuments(LEARNER_A)).toEqual([]);
    });

    it("locks a submitted response against further learner edits", async () => {
      await submitAsA();
      await expect(service.saveDraft(LEARNER_A, { ...key, fieldValues: valid })).rejects.toMatchObject({ statusCode: 409 });
      await expect(submitAsA()).rejects.toMatchObject({ statusCode: 409 });
    });

    it("refuses a learner who is not enrolled in a course that reaches this revision", async () => {
      await expect(service.saveDraft("stranger", { ...key, fieldValues: valid })).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("refuses an organisation the learner does not belong to", async () => {
      await expect(service.saveDraft(LEARNER_A, { ...key, companyId: OTHER_ORG, fieldValues: valid })).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("uses the learner's only organisation when none is named, so assessors can reach the submission", async () => {
      const response = await service.saveDraft(LEARNER_B, { ...key, companyId: undefined, fieldValues: valid });
      expect(response.companyId).toBe(ORG);
    });

    it("asks a learner in several organisations to choose one", async () => {
      store.member(OTHER_ORG, LEARNER_B, "LEARNER");
      await expect(service.saveDraft(LEARNER_B, { ...key, companyId: undefined, fieldValues: valid })).rejects.toBeInstanceOf(ValidationError);
      const named = await service.saveDraft(LEARNER_B, { ...key, companyId: OTHER_ORG, fieldValues: valid });
      expect(named.companyId).toBe(OTHER_ORG);
    });

    it("refuses an unpublished revision", async () => {
      store.seedRevision({ id: "rev_draft", lessonId: LESSON, status: "DRAFT", body: body() });
      store.grant(LEARNER_A, LESSON, "rev_draft");
      await expect(service.saveDraft(LEARNER_A, { ...key, revisionId: "rev_draft", fieldValues: valid })).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("refuses a template id the lesson does not contain", async () => {
      await expect(service.saveDraft(LEARNER_A, { ...key, templateId: "TPL-NOPE", fieldValues: valid })).rejects.toBeInstanceOf(NotFoundError);
    });

    it("fails loudly when the stored lesson is malformed rather than assembling a partial document", async () => {
      const broken = body({ outputDocument: { ...(body().outputDocument as object), sections: [{ heading: "Terms", fieldIds: ["f1"] }] } });
      store.seedRevision({ id: REVISION, lessonId: LESSON, status: "PUBLISHED", body: broken });
      await expect(service.submit(LEARNER_A, { ...key, fieldValues: valid })).rejects.toBeInstanceOf(TemplateDefinitionError);
      expect(store.documents).toHaveLength(0);
    });
  });

  describe("learner isolation", () => {
    it("never returns another learner's response values in the learner view", async () => {
      await service.saveDraft(LEARNER_A, { ...key, fieldValues: { f1: "A's private text" } });
      const viewB = await service.getLearnerLesson(LEARNER_B, LESSON, REVISION);
      expect(viewB.templates[0].response).toBeNull();
      expect(JSON.stringify(viewB)).not.toContain("A's private text");
    });

    it("does not let a learner download another learner's issued document", async () => {
      await submitAsA();
      const docId = store.documents[0].id;
      await service.signOff(ASSESSOR, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet });
      await expect(service.getIssuedDocument(LEARNER_B, docId)).rejects.toBeInstanceOf(NotFoundError);
      const own = await service.getIssuedDocument(LEARNER_A, docId);
      expect(own.assembled.templateId).toBe("TPL-1-T01");
    });

    it("does not let a learner read the assessor submission queue", async () => {
      await submitAsA();
      await expect(service.listSubmissionsForAssessor(LEARNER_B, ORG)).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("assessor sign-off permission", () => {
    beforeEach(async () => {
      await submitAsA();
    });

    it("lets an ASSESSOR of the organisation sign off, issuing the document and moving the response", async () => {
      const result = await service.signOff(ASSESSOR, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet });
      expect(result.decision).toBe("SIGNED_OFF");
      expect(store.responses[0].status).toBe("SIGNED_OFF");
      expect(store.documents[0].issuedAt).toBeInstanceOf(Date);
      expect(store.documents[0].signOffId).toBe(result.signOffId);
      const issued = await service.listIssuedDocuments(LEARNER_A);
      expect(issued).toHaveLength(1);
      expect(issued[0]).toEqual(expect.objectContaining({ version: 1, title: "Schedule" }));
    });

    it("refuses a learner's own sign-off even when that learner also holds ASSESSOR", async () => {
      await service.submit(LEARNER_C, { ...key, fieldValues: valid });
      const own = store.responses.find(r => r.learnerId === LEARNER_C)!;
      await expect(service.signOff(LEARNER_C, ORG, own.id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toThrow("Learners cannot sign off their own response");
      expect(own.status).toBe("SUBMITTED");
    });

    it("refuses a learner without the ASSESSOR role from signing off, even their own", async () => {
      await expect(service.signOff(LEARNER_A, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it("refuses a learner member who is not an assessor", async () => {
      await expect(service.signOff(LEARNER_B, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it.each(["ASSESSOR", "OWNER", "MANAGER"])("lets a %s member of the organisation sign off", async role => {
      const reviewer = `reviewer_${role.toLowerCase()}`;
      store.member(ORG, reviewer, role);
      await service.submit(LEARNER_B, { ...key, fieldValues: valid });
      const response = store.responses.find(r => r.learnerId === LEARNER_B)!;
      const result = await service.signOff(reviewer, ORG, response.id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet });
      expect(result.decision).toBe("SIGNED_OFF");
      expect(response.status).toBe("SIGNED_OFF");
    });

    it("refuses a learner's own sign-off when that learner is an OWNER or MANAGER", async () => {
      for (const role of ["OWNER", "MANAGER"]) {
        const learner = `owner_learner_${role.toLowerCase()}`;
        store.grant(learner, LESSON, REVISION);
        store.member(ORG, learner, role);
        await service.submit(learner, { ...key, fieldValues: valid });
        const own = store.responses.find(r => r.learnerId === learner)!;
        await expect(service.signOff(learner, ORG, own.id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
          .rejects.toThrow("Learners cannot sign off their own response");
        expect(own.status).toBe("SUBMITTED");
      }
    });

    it("refuses a role outside the sign-off set, such as a learner with no elevated role", async () => {
      await expect(service.signOff(LEARNER_B, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it("refuses an assessor of another organisation", async () => {
      await expect(service.signOff(ASSESSOR, OTHER_ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it("refuses sign-off while a rubric criterion is not met", async () => {
      await expect(service.signOff(ASSESSOR, ORG, store.responses[0].id, {
        decision: "SIGNED_OFF",
        rubricResults: { "Due period stated": "does_not_meet", "Method stated": "meets" },
      })).rejects.toBeInstanceOf(ValidationError);
      expect(store.responses[0].status).toBe("SUBMITTED");
      expect(store.documents[0].issuedAt).toBeNull();
    });

    it("refuses a second sign-off once the response is signed off", async () => {
      await service.signOff(ASSESSOR, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet });
      await expect(service.signOff(ASSESSOR, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(store.signOffs).toHaveLength(1);
    });

    it("returns changes requested to the learner, who can edit and resubmit as version 2", async () => {
      await service.signOff(ASSESSOR, ORG, store.responses[0].id, {
        decision: "CHANGES_REQUESTED",
        rubricResults: { "Due period stated": "does_not_meet", "Method stated": "meets" },
        notes: "State the basis for the due period.",
      });
      expect(store.responses[0].status).toBe("IN_PROGRESS");
      expect(store.documents[0].issuedAt).toBeNull();
      await service.saveDraft(LEARNER_A, { ...key, fieldValues: { ...valid, f2: 30 } });
      const second = await service.submit(LEARNER_A, { ...key, fieldValues: { ...valid, f2: 30 } });
      expect(second.document.version).toBe(2);
    });

    it("requires notes when changes are requested", async () => {
      await expect(service.signOff(ASSESSOR, ORG, store.responses[0].id, {
        decision: "CHANGES_REQUESTED",
        rubricResults: { "Due period stated": "does_not_meet", "Method stated": "meets" },
      })).rejects.toBeInstanceOf(ValidationError);
    });


  });

  describe("business placeholders", () => {
    const withPlaceholder = () => {
      const placeholderBody = body({ outputDocument: { ...(body().outputDocument as object), title: "{{business:business.name}} schedule" } });
      store.seedRevision({ id: REVISION, lessonId: LESSON, status: "PUBLISHED", body: placeholderBody });
    };

    it("does not issue a document while a business placeholder remains unresolved", async () => {
      withPlaceholder();
      await submitAsA();
      await expect(service.signOff(ASSESSOR, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet }))
        .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("{{business:business.name}}") });
      expect(store.responses[0].status).toBe("SUBMITTED");
      expect(store.documents[0].issuedAt).toBeNull();
    });

    it("issues a document whose business value was approved before submission, using that value", async () => {
      withPlaceholder();
      store.businessFields.set(ORG, [{ fieldKey: "business.name", value: "Acme Cleaning", status: "APPROVED", revision: 1 }]);
      await submitAsA();
      await service.signOff(ASSESSOR, ORG, store.responses[0].id, { decision: "SIGNED_OFF", rubricResults: rubricAllMet });
      const issued = await service.listIssuedDocuments(LEARNER_A);
      expect(issued[0].title).toBe("Acme Cleaning schedule");
      expect(store.documents[0].assembled).toEqual(expect.objectContaining({ unresolvedPlaceholders: [] }));
    });

    it("does not use a draft (unapproved) business value", async () => {
      withPlaceholder();
      store.businessFields.set(ORG, [{ fieldKey: "business.name", value: "Unapproved", status: "DRAFT", revision: 1 }]);
      await submitAsA();
      expect(store.documents[0].assembled).toEqual(expect.objectContaining({ title: "{{business:business.name}} schedule" }));
    });
  });

  it("gives the assessor a queue of submissions that excludes their own", async () => {
    await submitAsA();
    await service.saveDraft(ASSESSOR, { ...key, fieldValues: valid });
    await service.submit(ASSESSOR, { ...key, fieldValues: valid });
    const queue = await service.listSubmissionsForAssessor(ASSESSOR, ORG);
    expect(queue.map(item => item.learnerId)).toEqual([LEARNER_A]);
    expect(queue[0].rubric).toHaveLength(2);
  });
});
