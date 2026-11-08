import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { bullConnection } from "../config/redis";
import { env } from "../config/env";
import { logger } from "../config/logger";
import type { EmailJobData } from "./email.queue";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_TLS_MODE === "implicit",
  requireTLS: env.SMTP_TLS_MODE === "starttls",
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  tls: { minVersion: "TLSv1.2" },
});

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    "email",
    async (job) => {
      await transport.sendMail({
        from: env.SMTP_FROM,
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
      });
    },
    { ...bullConnection, concurrency: 3 },
  );
  // Don't log recipients or embedded tokens as operational logs are widely accessible.
  worker.on("completed", (job) => logger.info(`Email job completed: ${job.id}`));
  worker.on("failed", (job, err) => logger.error(`Email job failed: ${job?.id} - ${err.message}`));
  worker.on("error", (err) => logger.error(`Email worker error: ${err.message}`));
  return worker;
}
