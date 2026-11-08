import crypto from "node:crypto";
import { Queue } from "bullmq";
import { bullConnection } from "../config/redis";

export interface CertificateJobData {
  studentId: string;
  courseId: string;
}

// Enqueuing a certificate never imports or starts its worker in the API process.
export const certificateQueue = new Queue<CertificateJobData>("certificate", bullConnection);

export async function queueCertificateIssuance(studentId: string, courseId: string) {
  const digest = crypto.createHash("sha256").update(JSON.stringify([studentId, courseId])).digest("hex");
  await certificateQueue.add("issue", { studentId, courseId }, {
    jobId: `cert-${digest}`, // suppress duplicate pending jobs; database unique constraint handles later retries
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 24 * 3600, count: 10000 },
    removeOnFail: { age: 30 * 24 * 3600 },
  });
}
