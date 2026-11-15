const isProduction = process.env.NODE_ENV === "production";

/**
 * Origin of an absolute URL env value, or null when the value is unset or relative (for example the "/api"
 * fallback in src/lib/api-client.ts, which is same-origin and needs no CSP entry). A malformed absolute value
 * throws, so a broken NEXT_PUBLIC_API_URL fails the build instead of silently blocking the API.
 */
function originOf(name, value) {
  if (!value || value.startsWith("/")) return null;
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} must be an absolute URL or a relative path, got an invalid value.`);
  }
}

/**
 * MinIO origin that presigned media URLs point at. The backend builds those URLs from MINIO_ENDPOINT,
 * MINIO_PORT and MINIO_USE_SSL (see apps/backend/src/config/env.ts), so the same values are read here.
 * They must be present in the environment that runs `next build` or `next start` for media to load.
 */
function minioOrigin() {
  const endpoint = process.env.MINIO_ENDPOINT;
  if (!endpoint) return null;
  const scheme = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : "";
  return originOf("MINIO_ENDPOINT", `${scheme}://${endpoint}${port}`);
}

/**
 * Content-Security-Policy for every route. Only origins the repo actually uses are listed:
 * - 'self' for the Next.js bundles, Tailwind CSS, the same-origin image optimiser, and fonts shipped with the app.
 * - the API origin (NEXT_PUBLIC_API_URL) for XHR/fetch.
 * - the MinIO origin for <img> and <video> sources, which are presigned URLs issued by the backend.
 * 'unsafe-inline' scripts remain because App Router inline bootstrap scripts and the no-flash theme script in
 * src/app/layout.tsx carry no nonce; a nonce from middleware would remove it and is the next step.
 */
function contentSecurityPolicy() {
  const api = originOf("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);
  const media = minioOrigin();
  const sources = (...values) => values.filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    // 'unsafe-eval' is needed only by the React Refresh dev runtime, so it is limited to non-production builds.
    `script-src ${sources("'self'", "'unsafe-inline'", !isProduction && "'unsafe-eval'")}`,
    `style-src ${sources("'self'", "'unsafe-inline'")}`,
    `img-src ${sources("'self'", "data:", "blob:", api, media)}`,
    `media-src ${sources("'self'", "blob:", media)}`,
    "font-src 'self' data:",
    // Next.js dev server hot reload uses a websocket on the page's own host.
    `connect-src ${sources("'self'", api, !isProduction && "ws:", !isProduction && "wss:")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// Baseline hardening headers for every route. The backend API sends its own set through helmet.
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS is only meaningful over HTTPS, so it is limited to production builds and not sent to local dev over http.
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
