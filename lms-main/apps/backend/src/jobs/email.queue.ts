import { Queue } from "bullmq";
import { bullConnection } from "../config/redis";
import { env } from "../config/env";

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
  const link = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await emailQueue.add("verify-email", {
    to,
    subject: "Verify your SkilledAt.Work account",
    html: `<p>Verify your SkilledAt.Work account:</p><p>Click to verify your email: <a href="${link}">${link}</a></p><p>Expires in 24 hours.</p>`,
  }, emailJobOptions);
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const link = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await emailQueue.add("reset-password", {
    to,
    subject: "Reset your SkilledAt.Work password",
    html: `<p>Reset your SkilledAt.Work password:</p><p>Click to reset your password: <a href="${link}">${link}</a></p><p>Expires in 1 hour.</p>`,
  }, emailJobOptions);
}
