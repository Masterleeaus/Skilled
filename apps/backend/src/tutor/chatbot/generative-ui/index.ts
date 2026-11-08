export { createBuilderRegistry, BuilderRegistryError, BUILDER_COLLECTIONS } from "./builder-registry.js";
export type { BuilderRegistry, BuilderCatalogue, BuilderCollection } from "./builder-registry.js";
export { normaliseSpec, repairSpec, isSupportedSurface, MAX_ELEMENTS, SUPPORTED_SURFACES } from "./spec-normaliser.js";
export type { SpecChange } from "./spec-normaliser.js";
export { validateSpec, isSafeKey, isSafePointer, pointerToken } from "./spec-validator.js";
export type { SpecValidation, SpecIssue, IssueSeverity } from "./spec-validator.js";
export {
  DEFAULT_COMPOSER_OPTIONS,
  shouldGenerate,
  augmentPrompt,
  composeResponse,
  plainFallbackText,
  encodeEnvelope,
  decodeEnvelope,
} from "./response-composer.js";
export type { ComposerOptions, ComposeResult, DecodedEnvelope } from "./response-composer.js";
export type { Obj } from "./semantics.js";
