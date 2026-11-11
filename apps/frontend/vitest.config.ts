import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Matches the Next.js runtime: the automatic JSX runtime and the "@/..." alias from tsconfig.json.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    // tests/browser/*.mjs are standalone browser and source-contract scripts, not vitest suites.
  },
});
