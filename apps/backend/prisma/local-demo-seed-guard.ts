/**
 * Guard the destructive demo seed before PrismaClient is instantiated.
 *
 * This is intentionally narrower than the production database-target guard:
 * demo data may be wiped ONLY in a local throwaway database.
 */
export interface LocalDemoSeedTarget {
  host: string;
  name: string;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const BLOCKED_NAMES = new Set(["titan_academy", "postgres", "template0", "template1"]);

export function validateLocalDemoSeedTarget(
  environment: NodeJS.ProcessEnv,
  argv: string[],
): LocalDemoSeedTarget {
  const nodeEnv = (environment.NODE_ENV ?? "").toLowerCase();
  if (nodeEnv !== "development" && nodeEnv !== "test") {
    throw new Error("NODE_ENV must explicitly be development or test. Demo seeding is forbidden in staging and production.");
  }
  if (argv.some((arg) => arg !== "--confirm-wipe")) {
    throw new Error("Unknown seed arguments. The only accepted flag is --confirm-wipe.");
  }
  if (!argv.includes("--confirm-wipe") && environment.SEED_CONFIRM_WIPE !== "1") {
    throw new Error("Demo seed deletes all data. Supply --confirm-wipe or SEED_CONFIRM_WIPE=1.");
  }
  const raw = environment.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL must identify the throwaway local database.");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("DATABASE_URL is not a valid connection URL."); }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("Demo seed requires a PostgreSQL connection URL.");
  }
  if (!LOCAL_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Demo seed can only connect to a loopback PostgreSQL host.");
  }
  if (!url.username || !url.password) {
    throw new Error("Demo seed requires explicit database credentials.");
  }
  let name: string;
  try { name = decodeURIComponent(url.pathname.slice(1)); }
  catch { throw new Error("Database name encoding is invalid."); }
  if (!name || BLOCKED_NAMES.has(name.toLowerCase()) || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    throw new Error("A named, non-system throwaway database other than titan_academy is required.");
  }
  // This guard prevents common operator errors, not intentional DNS/proxy or
  // container port-forwarding to production. Never seed a forwarded database.
  return { host: url.port ? `${url.hostname}:${url.port}` : url.hostname, name };
}
