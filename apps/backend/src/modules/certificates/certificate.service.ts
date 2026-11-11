import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { evaluateCertificateEligibility } from "./certificate-eligibility.service";
import { minioClient, MINIO_BUCKET, buildObjectKey, STORAGE_FOLDERS } from "../../config/minio";

/**
 * Display reference printed on the PDF. It has only 32 bits of randomness, so it must never be the key that
 * the public verify endpoint uses for certificates issued after the verification-token migration.
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `LMS-${year}-${random}`;
}

/**
 * Verification key for newly issued certificates: 128 bits from the CSPRNG, base64url (22 characters, no padding).
 * Only the token shape is public; it is not derived from the learner, course or certificate number.
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/** Shape of a verification token. Anything else is tested against the legacy certificate-number shape. */
export const VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;
/** Shape of a certificate number issued before tokens existed (`LMS-YYYY-XXXXXXXX`). */
export const LEGACY_CERTIFICATE_NUMBER_PATTERN = /^LMS-\d{4}-[0-9A-F]{8}$/;

async function generateCertificatePdf(
  studentName: string,
  courseTitle: string,
  certNumber: string,
  verificationToken: string,
) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.1, 0.1, 0.4),
    borderWidth: 3,
  });

  page.drawText("Certificate of Completion", {
    x: width / 2 - 200,
    y: height - 140,
    size: 28,
    font,
    color: rgb(0.1, 0.1, 0.4),
  });

  page.drawText("This certifies that", {
    x: width / 2 - 70,
    y: height - 200,
    size: 14,
    font: regularFont,
  });

  page.drawText(studentName, {
    x: width / 2 - studentName.length * 6,
    y: height - 240,
    size: 24,
    font,
  });

  page.drawText(`has successfully completed the course`, {
    x: width / 2 - 130,
    y: height - 280,
    size: 14,
    font: regularFont,
  });

  page.drawText(courseTitle, {
    x: width / 2 - courseTitle.length * 5,
    y: height - 315,
    size: 18,
    font,
  });

  page.drawText(`Certificate No: ${certNumber}`, {
    x: 60,
    y: 60,
    size: 10,
    font: regularFont,
  });

  page.drawText(`Issued: ${new Date().toLocaleDateString()}`, {
    x: width - 220,
    y: 60,
    size: 10,
    font: regularFont,
  });

  page.drawText(`Verification code: ${verificationToken}`, {
    x: 60,
    y: 45,
    size: 10,
    font: regularFont,
  });

  return pdfDoc.save();
}

export async function issueCertificate(studentId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    include: { student: true, course: true },
  });
  if (!enrollment) throw new NotFoundError("Enrollment");
  if (enrollment.status !== "COMPLETED") {
    throw new AppError("Course must be 100% completed before issuing a certificate", 400);
  }

  const existing = await prisma.certificate.findFirst({ where: { studentId, courseId } });
  if (existing) return existing;

  // Recheck current assessment evidence when the background worker executes.
  // A queued job alone is never evidence of course competency.
  const eligibility = await evaluateCertificateEligibility(studentId, courseId);
  if (!eligibility.eligible) {
    throw new AppError(`Certificate requirements unmet: ${eligibility.blockers.join(", ")}`, 409);
  }

  const certificateNumber = generateCertificateNumber();
  const verificationToken = generateVerificationToken();
  const pdfBytes = await generateCertificatePdf(
    enrollment.student.fullName,
    enrollment.course.title,
    certificateNumber,
    verificationToken,
  );

  const objectKey = buildObjectKey(STORAGE_FOLDERS.certificates, `${certificateNumber}.pdf`);
  await minioClient.putObject(MINIO_BUCKET, objectKey, Buffer.from(pdfBytes), pdfBytes.length, {
    "Content-Type": "application/pdf",
  });

  try {
    return await prisma.certificate.create({
      data: { studentId, courseId, certificateNumber, verificationToken, pdfUrl: objectKey },
    });
  } catch (error) {
    // At-least-once queue delivery or concurrent workers: rely on the unique DB index.
    // Another worker may have successfully saved the same student/course certificate.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const alreadyIssued = await prisma.certificate.findFirst({ where: { studentId, courseId } });
      if (alreadyIssued) {
        // The PDF generated by this worker is not referenced by the winning row.
        // Cleanup is best effort; failure must not invalidate a valid certificate.
        try {
          await minioClient.removeObject(MINIO_BUCKET, objectKey);
        } catch {
          // Storage housekeeping may remove this orphan later.
        }
        return alreadyIssued;
      }
    }
    throw error;
  }
}

export async function listMyCertificates(studentId: string) {
  return prisma.certificate.findMany({
    where: { studentId },
    include: { student: { select: { fullName: true } } },
    orderBy: { issuedAt: "desc" },
  });
}

export async function getCertificateDownloadUrl(certificateId: string, studentId: string) {
  const certificate = await prisma.certificate.findUnique({ where: { id: certificateId } });
  if (!certificate) throw new NotFoundError("Certificate");
  if (certificate.studentId !== studentId) throw new AppError("Not your certificate", 403);

  return minioClient.presignedGetObject(MINIO_BUCKET, certificate.pdfUrl, 60 * 60);
}

/**
 * Public verification. `code` is either:
 *  - a verification token (new certificates): matched on verificationToken only; or
 *  - a legacy certificate number: matched only on rows whose verificationToken is NULL.
 * A new certificate therefore cannot be verified by its 32-bit display number.
 *
 * The response confirms authenticity and nothing more: the certificate number, the course title and the issue
 * date. The learner's full name is included only when the learner has opted in (showNameOnVerify).
 */
export async function verifyCertificate(code: string) {
  let where: { verificationToken: string } | { certificateNumber: string; verificationToken: null } | null = null;
  if (VERIFICATION_TOKEN_PATTERN.test(code)) {
    where = { verificationToken: code };
  } else if (LEGACY_CERTIFICATE_NUMBER_PATTERN.test(code)) {
    where = { certificateNumber: code, verificationToken: null };
  }
  if (!where) throw new NotFoundError("Certificate");

  const certificate = await prisma.certificate.findFirst({
    where,
    include: { student: { select: { fullName: true } } },
  });
  if (!certificate) throw new NotFoundError("Certificate");

  const course = await prisma.course.findUnique({
    where: { id: certificate.courseId },
    select: { title: true },
  });

  return {
    valid: true as const,
    certificateNumber: certificate.certificateNumber,
    courseTitle: course?.title ?? null,
    issuedAt: certificate.issuedAt,
    ...(certificate.showNameOnVerify ? { studentName: certificate.student.fullName } : {}),
  };
}

/** Learner opt-in: whether the public verify response includes their full name. Default is off. */
export async function setShowNameOnVerify(certificateId: string, studentId: string, show: boolean) {
  const certificate = await prisma.certificate.findUnique({ where: { id: certificateId } });
  if (!certificate) throw new NotFoundError("Certificate");
  if (certificate.studentId !== studentId) throw new AppError("Not your certificate", 403);

  return prisma.certificate.update({
    where: { id: certificateId },
    data: { showNameOnVerify: show },
    select: { id: true, showNameOnVerify: true },
  });
}
