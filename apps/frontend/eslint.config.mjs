import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { createBaseConfig } from "@lms/eslint-config";

const baseConfig = createBaseConfig();
// The shared baseline registers the "@typescript-eslint" plugin. The Next.js flat configs carry
// their own copy under the same name, which ESLint rejects as a redefinition. Point them at the
// baseline's plugin object so the name is defined once, with one instance, for every file.
const baseTsPlugin = baseConfig.find((config) => config.plugins?.["@typescript-eslint"]).plugins[
  "@typescript-eslint"
];
const sharedTsPlugin = (config) =>
  config.plugins && "@typescript-eslint" in config.plugins
    ? { ...config, plugins: { ...config.plugins, "@typescript-eslint": baseTsPlugin } }
    : config;

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  // Shared baseline first, then the Next.js rules (core-web-vitals and its TypeScript preset).
  ...baseConfig,
  ...[...coreWebVitals, ...nextTypescript].map(sharedTsPlugin),
];

export default eslintConfig;
