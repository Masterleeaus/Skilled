import { createHash } from "node:crypto";

/**
 * The one content-hash function for the backend. Every hash that is computed or compared
 * for stored content (lesson revisions, approvals, the publication gate, template documents)
 * goes through here.
 *
 * Postgres jsonb does not keep object key order, so a hash over JSON.stringify of a body
 * changes between the request that wrote it and the row read back. canonicalJson sorts
 * object keys at every level and keeps array order, so equal content always produces the
 * same string whatever order its keys arrived in.
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** SHA-256 hex of the canonical JSON form of a value. */
export function contentHash(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}
