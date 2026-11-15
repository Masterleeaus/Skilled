/**
 * Central-governed feature flags (#208). Every read names a local declared default, and that default is the answer
 * whenever Central is absent, slow, unreachable, or returns a value of the wrong type.
 *
 * Resolution order when a source answers: organisation override, then rollout, then global value, then the declared
 * default. Central's flag read endpoint is a contract only; until it is live, no source is wired in production and
 * every read returns its declared default. Central is never called from this module on its own.
 */

export type FlagValue = boolean | string | number;

export interface FlagScope {
  organisationId?: string;
}

/** Returns a Central value for the flag, or undefined when Central has no value for this scope. Must not throw on purpose. */
export type FlagSource = (name: string, scope: FlagScope) => Promise<unknown>;

export interface FlagSources {
  organisation?: FlagSource;
  rollout?: FlagSource;
  global?: FlagSource;
}

export interface ReadFlagOptions {
  sources?: FlagSources;
  organisationId?: string;
  /** Per-source wait. A slow Central answer counts as no answer. */
  timeoutMs?: number;
}

const NAME = /^[a-z][a-z0-9_.-]{0,99}$/;
const DEFAULT_TIMEOUT_MS = 500;

/** Resolves to the source's answer, or to undefined on error, timeout or a wrong type. Never rejects. */
async function askSource(
  source: FlagSource | undefined,
  name: string,
  scope: FlagScope,
  declaredDefault: FlagValue,
  timeoutMs: number,
): Promise<FlagValue | undefined> {
  if (typeof source !== "function") return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const answer = await Promise.race([
      source(name, scope),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);
    if (answer === undefined || answer === null) return undefined;
    if (typeof answer !== typeof declaredDefault) return undefined;
    if (typeof answer === "number" && !Number.isFinite(answer)) return undefined;
    return answer as FlagValue;
  } catch {
    return undefined;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Reads one flag. The declared default is required at every call site, so no read can lack a local default.
 * Throws only on programmer error (an invalid name), which is caught in development rather than at runtime.
 */
export async function readFlag<T extends FlagValue>(name: string, declaredDefault: T, options: ReadFlagOptions = {}): Promise<T> {
  if (typeof name !== "string" || !NAME.test(name)) throw new TypeError("invalid flag name");
  const t = typeof declaredDefault;
  if (t !== "boolean" && t !== "string" && !(t === "number" && Number.isFinite(declaredDefault))) {
    throw new TypeError("flag default must be a boolean, string or finite number");
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > 5000) throw new TypeError("invalid flag timeout");
  const sources = options.sources ?? {};
  const scope: FlagScope = options.organisationId ? { organisationId: options.organisationId } : {};

  const ordered: Array<FlagSource | undefined> = [
    options.organisationId ? sources.organisation : undefined,
    sources.rollout,
    sources.global,
  ];
  for (const source of ordered) {
    const answer = await askSource(source, name, scope, declaredDefault, timeoutMs);
    if (answer !== undefined) return answer as T;
  }
  return declaredDefault;
}
