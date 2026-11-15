import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(frontend, "public");
const layout = readFileSync(path.join(frontend, "src/app/layout.tsx"), "utf8");
const manifest = readFileSync(path.join(frontend, "src/app/manifest.ts"), "utf8");

// File is relative to public/, for example "icons/icon-192.png".
function pngSize(file) {
  const image = readFileSync(path.join(publicDir, file));
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${file} must be PNG`);
  return [image.readUInt32BE(16), image.readUInt32BE(20)];
}

test("manifest exposes Skilled install identity and all required icon variants", () => {
  assert.match(manifest, /name:\s*"SkilledAt\.Work"/);
  assert.match(manifest, /short_name:\s*"Skilled"/);
  assert.match(manifest, /display:\s*"standalone"/);
  for (const [name, size] of [["icons/icon-192.png", 192], ["icons/icon-512.png", 512]]) {
    assert.deepEqual(pngSize(name), [size, size]);
    assert.match(manifest, new RegExp(`"/${name.replace(".", "\\.")}"`));
  }
});

test("page metadata connects install, origin, Apple and social-card surfaces", () => {
  assert.match(layout, /NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /apple:\s*"\/academy\/skilled-apple-touch\.png"/);
  assert.match(layout, /\/icons\/og-image\.png/);
  assert.match(layout, /"\/icons\/icon-192\.png"/);
  assert.match(layout, /"\/icons\/icon-512\.png"/);
  assert.ok(existsSync(path.join(publicDir, "academy/skilled-apple-touch.png")));
  assert.deepEqual(pngSize("icons/og-image.png"), [1200, 630]);
});

test("production frontend is not indexed: noindex meta and disallow-all robots.txt", () => {
  const robotsRoute = readFileSync(path.join(frontend, "src/app/robots.ts"), "utf8");
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/);
  assert.match(robotsRoute, /userAgent:\s*"\*"/);
  assert.match(robotsRoute, /disallow:\s*"\/"/);
});

test("local demo identities use the Skilled reserved domain", () => {
  const seed = readFileSync(path.resolve(frontend, "../backend/prisma/seed.ts"), "utf8");
  for (const role of ["admin", "teacher", "student"]) assert.ok(seed.includes(`${role}@skilled.local`));
  assert.doesNotMatch(seed, /@lms\.local/);
});
