import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Owner decision: logout is local only. Skilled revokes its own session and clears its own cookie. It does not call
// Central's end-session or any global logout endpoint. This guard fails if a Central logout call is added.
const here = path.dirname(fileURLToPath(import.meta.url));
const LOGOUT_MODULES = [
  "../modules/auth/central-browser-lifecycle.ts",
  "../modules/auth/central-session-http.ts",
];

describe("Central logout is local only", () => {
  for (const relative of LOGOUT_MODULES) {
    it(`${path.basename(relative)} makes no outbound request and names no global logout`, () => {
      const source = readFileSync(path.join(here, relative), "utf8");
      expect(source).not.toMatch(/end_session|endSession|end-session|global[-_ ]?logout/i);
      expect(source).not.toMatch(/\bfetch\s*\(/);
      expect(source).not.toMatch(/\bhttps?:\/\//);
    });
  }
});
