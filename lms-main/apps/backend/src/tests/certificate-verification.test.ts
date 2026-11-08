/**
 * Certificate verification (issue #57): token entropy and format, issuance of new certificates, the minimised
 * public verify response, legacy certificates that keep verifying by number, and the learner's name opt-in.
 * Prisma, object storage and the eligibility gate are mocked. The rate limit has its own file, because its
 * per-IP counter is shared by every request in one test module.
 */
import { inflateSync } from "node:zlib";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  prisma: {
    enrollment: { findUnique: vi.fn() },
    certificate: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    course: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  putObject: vi.fn(async (..._args: unknown[]) => undefined),
}));

vi.mock("../config/prisma", () => ({ prisma: db.prisma }));
vi.mock("../config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../config/minio", () => ({
  minioClient: { putObject: db.putObject, removeObject: vi.fn(), presignedGetObject: vi.fn() },
  MINIO_BUCKET: "test-bucket",
  buildObjectKey: (folder: string, name: string) => `${folder}/${name}`,
  STORAGE_FOLDERS: { videos: "videos", images: "images", certificates: "certificates", assignments: "assignments" },
}));
vi.mock("../modules/certificates/certificate-eligibility.service", () => ({
  evaluateCertificateEligibility: vi.fn(async () => ({ eligible: true, blockers: [] })),
}));

import { signAccessToken } from "../modules/auth/token.utils";
import {
  LEGACY_CERTIFICATE_NUMBER_PATTERN,
  VERIFICATION_TOKEN_PATTERN,
  generateVerificationToken,
  issueCertificate,
  setShowNameOnVerify,
  verifyCertificate,
} from "../modules/certificates/certificate.service";
import certificateRoutes from "../modules/certificates/certificate.routes";
import { errorHandler } from "../middleware/errorHandler";
import { NotFoundError } from "../utils/AppError";

const { prisma } = db;

/**
 * Text drawn into the PDF. pdf-lib Flate-compresses content streams and writes text as hex strings (<48656C6C6F>),
 * so inflate each stream and decode the hex strings before searching.
 */
function pdfText(pdf: Buffer): string {
  const source = pdf.toString("latin1");
  const pieces: string[] = [];
  for (const match of source.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let content: string;
    try {
      content = inflateSync(Buffer.from(match[1], "latin1")).toString("latin1");
    } catch {
      content = match[1];
    }
    pieces.push(content);
    for (const hex of content.matchAll(/<([0-9A-Fa-f]+)>/g)) {
      pieces.push(Buffer.from(hex[1], "hex").toString("latin1"));
    }
  }
  return pieces.join("\n");
}

const LEARNER = "cjld2cyuq0001t3rmniod1ste";
const OTHER_LEARNER = "cjld2cyuq0002t3rmniod1ste";
const COURSE = "cjld2cyuq0003t3rmniod1ste";
const TOKEN = "Zk3q_8vP0aBcD-eFgHiJkL"; // 22 characters in the base64url alphabet, shaped like a real token
const LEGACY_NUMBER = "LMS-2025-1A2B3C4D";
const FULL_NAME = "Ada Learner";

function certificateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "cert_1",
    studentId: LEARNER,
    courseId: COURSE,
    certificateNumber: "LMS-2026-0F0F0F0F",
    verificationToken: TOKEN,
    showNameOnVerify: false,
    pdfUrl: "certificates/LMS-2026-0F0F0F0F.pdf",
    issuedAt: new Date("2026-11-01T10:00:00.000Z"),
    student: { fullName: FULL_NAME },
    ...overrides,
  };
}

function authHeader(userId: string, role = "STUDENT") {
  return { Authorization: `Bearer ${signAccessToken({ userId, role: role as never })}` };
}

const app = express();
app.use(express.json());
app.use("/api/certificates", certificateRoutes);
app.use(errorHandler);

beforeEach(() => {
  vi.clearAllMocks();
  prisma.course.findUnique.mockResolvedValue({ title: "Fire Safety Basics" });
  prisma.user.findUnique.mockResolvedValue({ id: LEARNER, role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null });
});

describe("verification token", () => {
  it("is 128 bits of base64url: 22 characters that decode back to 16 random bytes", () => {
    const token = generateVerificationToken();
    expect(token).toHaveLength(22);
    expect(token).toMatch(VERIFICATION_TOKEN_PATTERN);
    const bytes = Buffer.from(token, "base64url");
    expect(bytes).toHaveLength(16);
    expect(bytes.toString("base64url")).toBe(token);
  });

  it("differs on every call and carries no sequence or certificate-number structure", () => {
    const tokens = new Set(Array.from({ length: 5000 }, () => generateVerificationToken()));
    expect(tokens.size).toBe(5000);
    for (const token of tokens) {
      expect(token).not.toMatch(/^LMS-/);
      expect(token).not.toMatch(LEGACY_CERTIFICATE_NUMBER_PATTERN);
    }
  });

  it("the token pattern rejects legacy numbers, short or long codes, and characters outside base64url", () => {
    expect(VERIFICATION_TOKEN_PATTERN.test(LEGACY_NUMBER)).toBe(false);
    expect(VERIFICATION_TOKEN_PATTERN.test(TOKEN.slice(0, 21))).toBe(false);
    expect(VERIFICATION_TOKEN_PATTERN.test(`${TOKEN}A`)).toBe(false);
    expect(VERIFICATION_TOKEN_PATTERN.test(`${TOKEN.slice(0, 21)}+`)).toBe(false);
    expect(VERIFICATION_TOKEN_PATTERN.test(`${TOKEN.slice(0, 21)}=`)).toBe(false);
  });
});

describe("issuing a new certificate", () => {
  beforeEach(() => {
    prisma.enrollment.findUnique.mockResolvedValue({
      status: "COMPLETED",
      student: { fullName: FULL_NAME },
      course: { title: "Fire Safety Basics" },
    });
    prisma.certificate.findFirst.mockResolvedValue(null);
    prisma.certificate.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      certificateRow({ ...data, id: "cert_new" }),
    );
  });

  it("stores a 128-bit verification token and prints the same token on the PDF", async () => {
    await issueCertificate(LEARNER, COURSE);

    const data = prisma.certificate.create.mock.calls[0][0].data as { verificationToken: string; certificateNumber: string };
    expect(data.verificationToken).toMatch(VERIFICATION_TOKEN_PATTERN);
    expect(data.certificateNumber).toMatch(/^LMS-\d{4}-[0-9A-F]{8}$/);

    const pdf = db.putObject.mock.calls[0][2] as Buffer;
    expect(pdfText(pdf)).toContain(`Verification code: ${data.verificationToken}`);
  });

  it("keeps the verification token separate from the 32-bit display number", async () => {
    await issueCertificate(LEARNER, COURSE);
    const data = prisma.certificate.create.mock.calls[0][0].data as { verificationToken: string; certificateNumber: string };
    expect(data.verificationToken).not.toMatch(LEGACY_CERTIFICATE_NUMBER_PATTERN);
    expect(data.verificationToken).not.toContain(data.certificateNumber);
  });
});

describe("public verification response", () => {
  it("looks up a token on verificationToken only", async () => {
    prisma.certificate.findFirst.mockResolvedValue(certificateRow());
    await verifyCertificate(TOKEN);
    expect(prisma.certificate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { verificationToken: TOKEN } }),
    );
  });

  it("returns only what confirms authenticity, and no learner name by default", async () => {
    prisma.certificate.findFirst.mockResolvedValue(certificateRow());
    const result = await verifyCertificate(TOKEN);

    expect(Object.keys(result).sort()).toEqual(["certificateNumber", "courseTitle", "issuedAt", "valid"]);
    expect(result).toMatchObject({ valid: true, certificateNumber: "LMS-2026-0F0F0F0F", courseTitle: "Fire Safety Basics" });
    expect(JSON.stringify(result)).not.toContain(FULL_NAME);
  });

  it("includes the learner's name only after the learner opts in", async () => {
    prisma.certificate.findFirst.mockResolvedValue(certificateRow({ showNameOnVerify: true }));
    const result = await verifyCertificate(TOKEN);
    expect(result).toMatchObject({ studentName: FULL_NAME });
  });

  it("keeps a legacy certificate verifiable by its number, only where no token was issued", async () => {
    prisma.certificate.findFirst.mockResolvedValue(certificateRow({ verificationToken: null, certificateNumber: LEGACY_NUMBER }));
    const result = await verifyCertificate(LEGACY_NUMBER);

    expect(prisma.certificate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { certificateNumber: LEGACY_NUMBER, verificationToken: null } }),
    );
    expect(result).toMatchObject({ valid: true, certificateNumber: LEGACY_NUMBER });
  });

  it("rejects codes that match neither shape without querying the database", async () => {
    for (const code of ["", "lms-2025-1a2b3c4d", "LMS-25-1A2B3C4D", `${TOKEN.slice(0, 21)}!`, "../../etc/passwd"]) {
      await expect(verifyCertificate(code)).rejects.toBeInstanceOf(NotFoundError);
    }
    expect(prisma.certificate.findFirst).not.toHaveBeenCalled();
  });

  it("answers an unknown token with not found", async () => {
    prisma.certificate.findFirst.mockResolvedValue(null);
    await expect(verifyCertificate(TOKEN)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("GET /api/certificates/verify/:code", () => {
  it("returns the minimised body, marks it no-store, and omits the name by default", async () => {
    prisma.certificate.findFirst.mockResolvedValue(certificateRow());
    const res = await request(app).get(`/api/certificates/verify/${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.text).not.toContain(FULL_NAME);
    expect(res.body.data).not.toHaveProperty("studentName");
  });
});

describe("learner opt-in for showing the name", () => {
  it("lets the owner change the setting", async () => {
    prisma.certificate.findUnique.mockResolvedValue(certificateRow());
    prisma.certificate.update.mockResolvedValue({ id: "cert_1", showNameOnVerify: true });

    const res = await request(app)
      .patch("/api/certificates/cert_1/verification-visibility")
      .set(authHeader(LEARNER))
      .send({ showNameOnVerify: true });

    expect(res.status).toBe(200);
    expect(prisma.certificate.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { showNameOnVerify: true } }),
    );
  });

  it("refuses a change by another learner", async () => {
    prisma.certificate.findUnique.mockResolvedValue(certificateRow());
    await expect(setShowNameOnVerify("cert_1", OTHER_LEARNER, true)).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.certificate.update).not.toHaveBeenCalled();
  });

  it("rejects a body that is not a boolean", async () => {
    const res = await request(app)
      .patch("/api/certificates/cert_1/verification-visibility")
      .set(authHeader(LEARNER))
      .send({ showNameOnVerify: "yes" });
    expect(res.status).toBe(400);
    expect(prisma.certificate.update).not.toHaveBeenCalled();
  });
});
