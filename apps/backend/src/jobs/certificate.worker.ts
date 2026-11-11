import { Worker } from "bullmq";
import { bullConnection } from "../config/redis";
import { logger } from "../config/logger";
import { issueCertificate } from "../modules/certificates/certificate.service";
import type { CertificateJobData } from "./certificate.queue";

export function startCertificateWorker() {
  const worker = new Worker<CertificateJobData>(
    "certificate",
    async (job) => {
      await issueCertificate(job.data.studentId, job.data.courseId);
    },
    { ...bullConnection, concurrency: 2 },
  );
  worker.on("completed", (job) => logger.info(`Certificate job completed: ${job.id}`));
  worker.on("failed", (job, err) => logger.error(`Certificate job failed: ${job?.id} - ${err.message}`));
  worker.on("error", (err) => logger.error(`Certificate worker error: ${err.message}`));
  return worker;
}
