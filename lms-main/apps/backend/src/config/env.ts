import { z } from "zod";
import dotenv from "dotenv";
import { centralSsoProblems } from "./central-sso";

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

  // Global per-client-IP ceiling across every API request, on top of the per-route limiters. /api/health is exempt.
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(24 * 60 * 60 * 1000).default(15 * 60 * 1000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1_000_000).default(1000),

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

  // Central SSO (Titan Central / Logto). OFF by default: the existing email/password login is the rollback path.
  CENTRAL_SSO_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  CENTRAL_SSO_ISSUER: z.string().optional().default(""),
  CENTRAL_SSO_CLIENT_ID: z.string().optional().default(""),
  CENTRAL_SSO_CLIENT_SECRET: z.string().optional().default(""),
  CENTRAL_SSO_JWKS_URI: z.string().optional().default(""),
  CENTRAL_SSO_REDIRECT_URI: z.string().optional().default(""),
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
  for (const message of centralSsoProblems({
    enabled: values.CENTRAL_SSO_ENABLED,
    issuer: values.CENTRAL_SSO_ISSUER,
    clientId: values.CENTRAL_SSO_CLIENT_ID,
    clientSecret: values.CENTRAL_SSO_CLIENT_SECRET,
    jwksUri: values.CENTRAL_SSO_JWKS_URI,
    redirectUri: values.CENTRAL_SSO_REDIRECT_URI,
  })) {
    context.addIssue({ code: "custom", path: ["CENTRAL_SSO_ENABLED"], message });
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
    // Checkout is always on in production, so Stripe must be fully configured. Partial or absent config fails startup.
    if (!values.STRIPE_SECRET_KEY.trim()) {
      context.addIssue({ code: "custom", path: ["STRIPE_SECRET_KEY"], message: "Production checkout requires STRIPE_SECRET_KEY" });
    }
    if (!values.STRIPE_WEBHOOK_SECRET.trim()) {
      context.addIssue({ code: "custom", path: ["STRIPE_WEBHOOK_SECRET"], message: "Production checkout requires STRIPE_WEBHOOK_SECRET" });
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
