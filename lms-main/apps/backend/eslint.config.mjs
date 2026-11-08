// ESLint flat config for @lms/backend (ESLint 10).
// Replaces the legacy root .eslintrc.json, which ESLint 10 no longer reads.
// Equivalent to the old `extends: [eslint:recommended, plugin:@typescript-eslint/recommended]`.
//
// - Core rules: every rule ESLint marks as recommended (the same set `js.configs.recommended`
//   enables). Read from the installed ESLint's builtinRules because @eslint/js is not a
//   direct dependency of this workspace, and adding it would change pnpm-lock.yaml.
// - TypeScript rules: @typescript-eslint flat/recommended (parser, plugin and rules).
import { builtinRules } from "eslint/use-at-your-own-risk";
import tseslint from "@typescript-eslint/eslint-plugin";

const TS_FILES = ["**/*.ts", "**/*.mts", "**/*.cts"];

const eslintRecommended = Object.fromEntries(
  [...builtinRules.entries()]
    .filter(([, rule]) => rule.meta?.docs?.recommended === true)
    .map(([name]) => [name, "error"]),
);

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: TS_FILES,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: eslintRecommended,
  },
  ...tseslint.configs["flat/recommended"].map((config) => ({
    ...config,
    files: TS_FILES,
  })),
  {
    // The tutor wiring is loaded lazily on purpose (see app.ts and tests/tutor). This is the one
    // allowed require() in src, and the allow list names it exactly.
    files: TS_FILES,
    rules: {
      "@typescript-eslint/no-require-imports": [
        "error",
        { allow: ["^\\./tutor/route/tutor-wiring\\.js$"] },
      ],
    },
  },
  {
    // Same rule, with the usual exemption for names that start with "_". Express error
    // handlers must keep their four-argument signature even when `next` is not called.
    files: TS_FILES,
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];
