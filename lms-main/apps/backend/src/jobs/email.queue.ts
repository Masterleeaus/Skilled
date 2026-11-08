import { Queue } from "bullmq";
import { bullConnection } from "../config/redis";
import { env } from "../config/env";
import { verificationEmailContent, resetPasswordEmailContent } from "./account-email-content";

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

// Queue producers do not create workers. API and workers are separate services.
export const emailQueue = new Queue<EmailJobData>("email", bullConnection);

const emailJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { age: 24 * 3600, count: 10000 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

export async function sendVerificationEmail(to: string, token: string) {
  await emailQueue.add("verify-email", {
    to,
    ...verificationEmailContent(env.CLIENT_URL, token),
  }, emailJobOptions);
}

export async function sendResetPasswordEmail(to: string, token: string) {
  await emailQueue.add("reset-password", {
    to,
    ...resetPasswordEmailContent(env.CLIENT_URL, token),
  }, emailJobOptions);
}
