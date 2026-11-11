// ESLint flat config for @lms/backend. The rule baseline lives in @lms/eslint-config and is
// shared with the frontend. Only backend-specific rules are defined here.
import { createBaseConfig, TS_FILES } from "@lms/eslint-config";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  ...createBaseConfig(),
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
];
