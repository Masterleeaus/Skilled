// Shared ESLint flat-config baseline for every LMS app (frontend and backend).
// Both apps spread createBaseConfig() first, then add app-only rules in their own eslint.config.mjs.
// Change the baseline here only, so the two apps cannot drift apart.
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";

export const TS_FILES = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];

export function createBaseConfig() {
  return [
    // Core rules: @eslint/js recommended.
    { files: TS_FILES, ...js.configs.recommended },
    {
      files: TS_FILES,
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    // TypeScript rules: @typescript-eslint flat/recommended (parser, plugin and rules).
    ...tseslint.configs["flat/recommended"].map((config) => ({
      ...config,
      files: TS_FILES,
    })),
    // Shared unused-binding rule. Names starting with "_" are deliberately unused
    // (for example Express error handlers that must keep their four-argument signature).
    {
      files: TS_FILES,
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
        ],
      },
    },
  ];
}
