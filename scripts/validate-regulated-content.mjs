#!/usr/bin/env node
// CI gate for regulated content. Fails on drift or malformed approvals. Blocked items do not fail CI:
// blocking is the default state until qualified review is recorded.
//   node scripts/validate-regulated-content.mjs [--root=DIR] [--publish=PATH]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildInventory, INVENTORY_PATH, publishCheck, readRegister, summarise, validateRegister,
} from './regulated-content-lib.mjs';

const args = process.argv.slice(2);
const rootArg = args.find(a => a.startsWith('--root='));
const root = rootArg ? path.resolve(rootArg.slice('--root='.length)) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publishArg = args.find(a => a.startsWith('--publish='));

if (publishArg) {
  const result = publishCheck(root, publishArg.slice('--publish='.length));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.publishable ? 0 : 1;
} else {
  const errors = [];
  const inventory = buildInventory(root);
  const committedFile = path.join(root, INVENTORY_PATH);
  const committed = fs.existsSync(committedFile) ? JSON.parse(fs.readFileSync(committedFile, 'utf8')) : null;
  if (JSON.stringify(committed) !== JSON.stringify(inventory)) errors.push('inventory_drift: run scripts/build-regulated-inventory.mjs and commit the result');
  const register = readRegister(root);
  errors.push(...validateRegister(inventory, register));
  const summary = summarise(inventory, register);
  const report = {
    total: summary.total,
    publishable: summary.publishable,
    blocked: summary.blocked,
    reasonCounts: summary.reasonCounts,
    flaggedStale: summary.flaggedStale,
    expiringSoon: summary.expiringSoon,
    errors,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = errors.length ? 1 : 0;
}
