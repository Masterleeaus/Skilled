import manifest from "./academy-brand.manifest.json";

/**
 * Course artwork lookup. Keys are canonical course slugs from the merged manifest.
 * If an app slug differs from a manifest key, add it to SLUG_ALIASES (app slug -> manifest key).
 */
const SLUG_ALIASES: Record<string, string> = {};

interface ManifestEntry {
  icon: string | null;
  iconSvg: string | null;
  logo: string | null;
  thumb: string | null;
  banner: string | null;
  topics: Record<string, string>;
  hero: string[];
  sourceKeys: string[];
  flags: string[];
  notes: string;
}

const entries = manifest as unknown as Record<string, ManifestEntry>;

export interface CourseBrand {
  /** Square icon, also used as the fallback when thumb is missing. */
  icon: string | null;
  /** Card image. Falls back to icon when the manifest thumb is null. */
  thumb: string | null;
  /** Logo. Not rendered by the UI at present. */
  logo: string | null;
  /** Wide banner, 1920x640 (3:1). One per course. */
  banner: string | null;
  /** Topic name (slug) -> image path. Empty for most courses. */
  topics: Record<string, string>;
  /** Large hero images (about 1920x640). Empty for now. */
  hero: string[];
}

export function getBrand(slug: string): CourseBrand | null {
  const key = SLUG_ALIASES[slug] ?? slug;
  const entry = Object.prototype.hasOwnProperty.call(entries, key) ? entries[key] : undefined;
  if (!entry) return null;
  return {
    icon: entry.icon,
    thumb: entry.thumb ?? entry.icon,
    logo: entry.logo,
    banner: entry.banner,
    topics: entry.topics ?? {},
    hero: entry.hero ?? [],
  };
}

/** Turns a topic slug such as "workstation-desk-cleaning" into "Workstation desk cleaning". */
export function topicLabel(name: string): string {
  const words = name.replace(/-/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
