import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { createBaseConfig } from "@lms/eslint-config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  // Shared baseline first, then the Next.js rules (core-web-vitals and its TypeScript preset).
  ...createBaseConfig(),
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
