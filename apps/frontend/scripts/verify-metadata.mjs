// Verifies the browser install and share metadata contract (issue #85) against the built app.
// Offline: reads .next/ output and public/ files only. Run `pnpm -C apps/frontend build` first.
// Icon and share-image checks fail until the Skilled mark is added under public/ and declared in the manifest and layout.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";

const appRoot = resolve(new URL("..", import.meta.url).pathname);
const built = (relative) => join(appRoot, ".next/server/app", relative);
const tokens = readFileSync(join(appRoot, "src/app/globals.css"), "utf8");
const home = join(appRoot, ".next/server/app/index.html");

if (!existsSync(home) || !existsSync(built("manifest.webmanifest.body"))) {
  console.log("FAIL build output missing: run `pnpm -C apps/frontend build` first");
  process.exit(1);
}

const html = readFileSync(home, "utf8");
const manifest = JSON.parse(readFileSync(built("manifest.webmanifest.body"), "utf8"));

// Returns the content attribute of the first <meta> tag matching the given attribute and value.
function meta(attr, value) {
  const tags = html.match(/<meta [^>]*>/g) ?? [];
  for (const tag of tags) {
    if (new RegExp(`\\b${attr}="${value}"`).test(tag)) {
      return (tag.match(/\bcontent="([^"]*)"/) ?? [])[1];
    }
  }
  return undefined;
}

const darkToken = (tokens.match(/:root\s*\{[^}]*--background:\s*(#[0-9a-fA-F]{6})/) ?? [])[1];
const lightToken = (tokens.match(/:root\.light\s*\{[^}]*--background:\s*(#[0-9a-fA-F]{6})/) ?? [])[1];
const publicFile = (url) => join(appRoot, "public", url.replace(/^\//, ""));
const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("manifest name and short name", () => {
  assert.equal(manifest.name, "SkilledAt.Work");
  assert.equal(manifest.short_name, "Skilled");
});

check("manifest start URL, scope and display mode", () => {
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
});

check("manifest colours match the globals.css tokens", () => {
  assert.ok(darkToken, "dark --background token not found in globals.css");
  assert.equal(manifest.background_color.toLowerCase(), darkToken.toLowerCase());
  assert.equal(manifest.theme_color.toLowerCase(), darkToken.toLowerCase());
  assert.ok(lightToken, "light --background token not found in globals.css");
});

check("manifest declares 192 and 512 px icons", () => {
  const sizes = (manifest.icons ?? []).map((icon) => icon.sizes);
  assert.ok(sizes.includes("192x192"), `no 192x192 icon declared (declared: ${JSON.stringify(sizes)})`);
  assert.ok(sizes.includes("512x512"), `no 512x512 icon declared (declared: ${JSON.stringify(sizes)})`);
});

check("every declared manifest icon exists in public/", () => {
  for (const icon of manifest.icons ?? []) {
    assert.ok(existsSync(publicFile(icon.src)), `missing file for icon ${icon.src}`);
  }
});

check("document links the manifest", () => {
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest"\/>/);
});

check("explicit theme colour for light and dark", () => {
  const themeTags = html.match(/<meta name="theme-color"[^>]*>/g) ?? [];
  assert.equal(themeTags.length, 2, "expected light and dark theme-color tags");
  assert.ok(themeTags.some((t) => t.includes(`content="${darkToken}"`)), "dark theme-color does not match the dark token");
  assert.ok(themeTags.some((t) => t.includes(`content="${lightToken}"`)), "light theme-color does not match the light token");
});

check("title, description and application name", () => {
  assert.match(html, /<title>SkilledAt\.Work<\/title>/);
  assert.equal(meta("name", "description"), "SkilledAt.Work — practical training, assessment and skills development for field and home-service businesses");
  assert.equal(meta("name", "application-name"), "SkilledAt.Work");
});

check("Open Graph title, description and URL", () => {
  assert.equal(meta("property", "og:title"), "SkilledAt.Work");
  assert.ok(meta("property", "og:description"), "og:description missing");
  assert.match(meta("property", "og:url") ?? "", /^https?:\/\//, "og:url must be absolute");
});

check("Open Graph image exists in public/", () => {
  const image = meta("property", "og:image");
  assert.ok(image, "og:image missing (no share image in the repository yet)");
  assert.ok(existsSync(publicFile(image.replace(/^https?:\/\/[^/]+/, ""))), `og:image file missing: ${image}`);
});

check("Twitter card title, description and image", () => {
  assert.ok(["summary", "summary_large_image"].includes(meta("name", "twitter:card")), "twitter:card missing");
  assert.equal(meta("name", "twitter:title"), "SkilledAt.Work");
  assert.ok(meta("name", "twitter:description"), "twitter:description missing");
  assert.ok(meta("name", "twitter:image"), "twitter:image missing (no share image in the repository yet)");
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log("PASS", name);
  } catch (error) {
    failed += 1;
    console.log("FAIL", name, "\n   ", error.message.split("\n").slice(0, 4).join("\n    "));
  }
}
console.log(`${checks.length - failed} of ${checks.length} metadata checks passed`);
process.exit(failed ? 1 : 0);
