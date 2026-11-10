import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Every environment uses the same minimums, including development. The development
// templates (apps/backend/.env.example) already meet them, so there is no dev exception.
export const JWT_SECRET_MIN_LENGTH = 32;

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  HOST: z.string().default("127.0.0.1"),
  CLIENT_URL: z.string().url(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Connection URL without credentials, for example redis://127.0.0.1:6379. The password goes in REDIS_PASSWORD.
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  REDIS_PASSWORD: z.string().optional().default(""),

  JWT_ACCESS_SECRET: z.string().min(JWT_SECRET_MIN_LENGTH, `JWT_ACCESS_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`),
  JWT_REFRESH_SECRET: z.string().min(JWT_SECRET_MIN_LENGTH, `JWT_REFRESH_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),

  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default("lms-storage"),
  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  // Video upload admission control. A single maximum-size upload (500MB plus multipart framing) must always fit.
  VIDEO_UPLOAD_MAX_CONCURRENT_PER_USER: z.coerce.number().int().min(1).max(20).default(2),
  VIDEO_UPLOAD_MAX_INFLIGHT_BYTES: z.coerce
    .number()
    .int()
    .min(500 * 1024 * 1024 + 1024 * 1024, "Must hold at least one maximum-size video upload")
    .default(2 * 1024 * 1024 * 1024),

  // Assignment attachment admission control. One maximum submission (5 files of 20MB plus multipart allowance) must always fit.
  ASSIGNMENT_UPLOAD_MAX_CONCURRENT_PER_USER: z.coerce.number().int().min(1).max(20).default(2),
  ASSIGNMENT_UPLOAD_MAX_CONCURRENT_GLOBAL: z.coerce.number().int().min(1).max(200).default(8),
  ASSIGNMENT_UPLOAD_MAX_INFLIGHT_BYTES: z.coerce
    .number()
    .int()
    .min(101 * 1024 * 1024, "Must hold at least one maximum-size assignment submission")
    .default(512 * 1024 * 1024),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_FROM: z.string().default("no-reply@lms.local"),
  SMTP_TLS_MODE: z.enum(["none", "starttls", "implicit"]).default("none"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),

  // Root of the curriculum files read at runtime (courses/ and shared/). Empty means the repo's curriculum/ folder.
  CURRICULUM_DIR: z.string().optional().default(""),

  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
}).superRefine((values, context) => {
  if (values.JWT_ACCESS_SECRET === values.JWT_REFRESH_SECRET) {
    context.addIssue({ code: "custom", path: ["JWT_REFRESH_SECRET"], message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different" });
  }
  try {
    const redis = new URL(values.REDIS_URL);
    if (!["redis:", "rediss:"].includes(redis.protocol)) {
      context.addIssue({ code: "custom", path: ["REDIS_URL"], message: "REDIS_URL must use the redis:// or rediss:// scheme" });
    }
    if (redis.username !== "" || redis.password !== "") {
      context.addIssue({ code: "custom", path: ["REDIS_URL"], message: "REDIS_URL must not contain credentials; set REDIS_PASSWORD instead" });
    }
  } catch {
    context.addIssue({ code: "custom", path: ["REDIS_URL"], message: "Invalid Redis connection URL" });
  }
  if (values.NODE_ENV === "production") {
    // Academy must never silently attach to either existing Titan database.
    try {
      const db = new URL(values.DATABASE_URL);
      if (!["postgresql:", "postgres:"].includes(db.protocol) ||
          decodeURIComponent(db.pathname.slice(1)) !== "titan_academy" ||
          decodeURIComponent(db.username) !== "titan_academy") {
        context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "Production requires the dedicated titan_academy database and role" });
      }
    } catch {
      context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "Invalid PostgreSQL connection URL" });
    }
    if (!values.CLIENT_URL.startsWith("https://")) {
      context.addIssue({ code: "custom", path: ["CLIENT_URL"], message: "Production frontend must use HTTPS" });
    }
    if (!!values.STRIPE_SECRET_KEY !== !!values.STRIPE_WEBHOOK_SECRET) {
      context.addIssue({ code: "custom", path: ["STRIPE_WEBHOOK_SECRET"], message: "Production Stripe requires both secret and webhook signature key, or neither" });
    }
  }
  if (!!values.SMTP_USER !== !!values.SMTP_PASSWORD) {
    context.addIssue({ code: "custom", path: ["SMTP_PASSWORD"], message: "SMTP_USER and SMTP_PASSWORD must be supplied together" });
  }
  if (values.NODE_ENV === "production" && values.SMTP_TLS_MODE === "none") {
    context.addIssue({ code: "custom", path: ["SMTP_TLS_MODE"], message: "Production SMTP must use STARTTLS or implicit TLS" });
  }
  if (values.SMTP_TLS_MODE === "implicit" && values.SMTP_PORT !== 465) {
    context.addIssue({ code: "custom", path: ["SMTP_PORT"], message: "Implicit TLS should use port 465" });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
