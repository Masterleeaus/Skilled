import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middleware/authenticate";
import { ForbiddenError, ValidationError } from "../../utils/AppError";
import { assertLessonOpen } from "../levels/level.service";
import { sendSuccess } from "../../utils/response";
import { createPrismaTemplateStore } from "./template.store";
import { TemplateService } from "./template.service";
import { renderDocumentPdf } from "./template.pdf";

/** Editable template lessons (PASS42). Mounted at /api/academy/templates. */
const router = Router();
const service = new TemplateService(createPrismaTemplateStore(prisma));
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => {
  try { await fn(req, res); } catch (error) { next(error); }
};

const param = (req: Request, name: string): string => {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) throw new ValidationError([{ fieldId: name, message: "is required" }], "Invalid path");
  return value;
};
const userId = (req: Request): string => {
  const id = req.user?.userId;
  if (!id) throw new ForbiddenError("Authentication required");
  return id;
};

const submitBody = z.object({
  companyId: z.string().min(1).max(64).nullable().optional(),
  fieldValues: z.unknown().optional(),
});
const signOffBody = z.object({
  decision: z.enum(["SIGNED_OFF", "CHANGES_REQUESTED"]),
  rubricResults: z.record(z.string().min(1).max(500), z.enum(["meets", "does_not_meet"])),
  notes: z.string().max(5000).nullable().optional(),
});

const lessonPath = "/lessons/:lessonId/revisions/:revisionId";
const templatePath = `${lessonPath}/templates/:templateId`;

// Level gate (PASS42): a learner cannot open or write a template lesson in a locked level. Staff and assessors pass.
const levelActor = (req: Request) => ({ userId: userId(req), role: req.user?.role ?? "" });

router.get(lessonPath, authenticate, run(async (req, res) => {
  await assertLessonOpen(levelActor(req), param(req, "lessonId"));
  sendSuccess(res, await service.getLearnerLesson(userId(req), param(req, "lessonId"), param(req, "revisionId")));
}));

router.put(`${templatePath}/draft`, authenticate, run(async (req, res) => {
  const body = submitBody.parse(req.body);
  await assertLessonOpen(levelActor(req), param(req, "lessonId"));
  const response = await service.saveDraft(userId(req), {
    lessonId: param(req, "lessonId"),
    revisionId: param(req, "revisionId"),
    templateId: param(req, "templateId"),
    companyId: body.companyId ?? null,
    fieldValues: body.fieldValues ?? {},
  });
  sendSuccess(res, response, "Draft saved");
}));

router.post(`${templatePath}/submit`, authenticate, run(async (req, res) => {
  const body = submitBody.parse(req.body);
  await assertLessonOpen(levelActor(req), param(req, "lessonId"));
  const result = await service.submit(userId(req), {
    lessonId: param(req, "lessonId"),
    revisionId: param(req, "revisionId"),
    templateId: param(req, "templateId"),
    companyId: body.companyId ?? null,
    fieldValues: body.fieldValues ?? {},
  });
  sendSuccess(res, result, "Submitted for assessor review", 201);
}));

router.get("/documents/me", authenticate, run(async (req, res) => {
  sendSuccess(res, await service.listIssuedDocuments(userId(req)));
}));

router.get("/documents/:documentId/pdf", authenticate, run(async (req, res) => {
  const { document, assembled } = await service.getIssuedDocument(userId(req), param(req, "documentId"));
  const bytes = await renderDocumentPdf({ assembled, version: document.version, contentHash: document.contentHash, issuedAt: document.issuedAt });
  const safeName = assembled.templateId.replace(/[^A-Za-z0-9_-]/g, "") || "document";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}-v${document.version}.pdf"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).send(Buffer.from(bytes));
}));

router.get("/companies/:companyId/submissions", authenticate, run(async (req, res) => {
  sendSuccess(res, await service.listSubmissionsForAssessor(userId(req), param(req, "companyId")));
}));

router.post("/companies/:companyId/responses/:responseId/sign-off", authenticate, run(async (req, res) => {
  const body = signOffBody.parse(req.body);
  const result = await service.signOff(userId(req), param(req, "companyId"), param(req, "responseId"), body);
  sendSuccess(res, result, body.decision === "SIGNED_OFF" ? "Document issued to learner" : "Changes requested", 201);
}));

export default router;
