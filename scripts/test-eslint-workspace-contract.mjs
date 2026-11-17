// ESLint workspace-version contract (issue #303).
// Run: node --test scripts/test-eslint-workspace-contract.mjs
// This must fail if packages or the frozen lockfile diverge between ESLint majors.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readJson = (path) => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const lock = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
const paths = ["apps/backend", "apps/frontend", "packages/eslint-config"];
const manifests = Object.fromEntries(paths.map((path) => [path, readJson(path + "/package.json")]));

function major(version) {
  const match = /^(?:\^|~|>=|=)?(\d+)\./.exec(version || "");
  assert.ok(match, `unrecognised semver range: ${version}`);
  return Number(match[1]);
}

function importer(name, text = lock) {
  const start = text.indexOf("\n  " + name + ":\n");
  assert.ok(start >= 0, `pnpm lockfile importer missing: ${name}`);
  const end = text.indexOf("\n  " + (name === "apps/backend" ? "apps/frontend" : name === "apps/frontend" ? "packages/eslint-config" : "packages/shared") + ":\n", start + 1);
  assert.ok(end > start, `pnpm importer boundary missing: ${name}`);
  return text.slice(start, end);
}

function lockedVersion(block, packageName) {
  const safe = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("^      ['\"]?" + safe + "['\"]?:\\n        specifier: ([^\\n]+)\\n        version: ([^\\n]+)", "m").exec(block);
  assert.ok(match, `lockfile entry for ${packageName} is missing`);
  return { range: match[1], resolved: match[2] };
}

test("both applications and the shared config declare the same ESLint 10 major", () => {
  for (const name of paths) {
    const p = manifests[name];
    const range = p.devDependencies?.eslint || p.peerDependencies?.eslint;
    assert.equal(major(range), 10, `${name} ESLint major drift`);
  }
  assert.equal(major(manifests["apps/backend"].devDependencies["@eslint/js"]), 10);
  assert.equal(major(manifests["packages/eslint-config"].dependencies["@eslint/js"]), 10);
});

test("frozen lockfile uses the same ESLint major and importer ranges", () => {
  for (const name of paths) {
    const block = importer(name);
    const manifest = manifests[name];
    const entry = lockedVersion(block, "eslint");
    const declared = manifest.devDependencies?.eslint || manifest.peerDependencies?.eslint;
    assert.equal(entry.range, declared, `${name} ESLint importer range diverges from package.json`);
    assert.equal(major(entry.resolved), 10, `${name} resolved to another ESLint major`);
  }
  for (const name of ["apps/backend", "packages/eslint-config"]) {
    const block = importer(name);
    const declared = name === "apps/backend" ? manifests[name].devDependencies["@eslint/js"] : manifests[name].dependencies["@eslint/js"];
    const entry = lockedVersion(block, "@eslint/js");
    assert.equal(entry.range, declared, `${name} @eslint/js importer range diverges`);
    assert.equal(major(entry.resolved), 10, `${name} resolved to another @eslint/js major`);
  }
  assert.doesNotMatch(lock, /(?:^|[(@])eslint@9\./m, "legacy ESLint 9 resolution remains");
});

test("the contract detects a mismatched ESLint 9 manifest and a stale importer", () => {
  assert.notEqual(major("^9.39.5"), 10);
  assert.throws(() => importer("apps/nonexistent"), /missing/);
  const original = importer("packages/eslint-config");
  const outdated = original.replace("specifier: ^10.14.0", "specifier: ^9.39.5");
  assert.notEqual(lockedVersion(outdated, "eslint").range, manifests["packages/eslint-config"].peerDependencies.eslint);
});
