#!/usr/bin/env node
// Regenerates the regulated-content inventory and reconciles the review register.
// New in-scope items are added as "pending". Existing decisions are kept. Entries for items
// that left scope are removed and listed, so no decision is silently dropped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInventory, INVENTORY_PATH, REGISTER_PATH, readRegister } from './regulated-content-lib.mjs';

const rootArg = process.argv.slice(2).find(a => a.startsWith('--root='));
const root = rootArg ? path.resolve(rootArg.slice('--root='.length)) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = buildInventory(root);
const register = readRegister(root);
const entries = {};
const added = [];
for (const item of inventory.items) {
  if (Object.hasOwn(register.entries, item.path)) entries[item.path] = register.entries[item.path];
  else {
    entries[item.path] = { decision: 'pending', reviewerRole: null, reviewer: null, reviewedAt: null, expiresAt: null, reviewedSha256: null, jurisdiction: null, sourceReferences: [], requiredWarnings: [] };
    added.push(item.path);
  }
}
const removed = Object.keys(register.entries).filter(k => !Object.hasOwn(entries, k));
const inventoryFile = path.join(root, INVENTORY_PATH);
const registerFile = path.join(root, REGISTER_PATH);
fs.mkdirSync(path.dirname(inventoryFile), { recursive: true });
fs.writeFileSync(inventoryFile, JSON.stringify(inventory, null, 2) + '\n');
fs.writeFileSync(registerFile, JSON.stringify({
  schemaVersion: 1,
  policy: 'Fail closed. An item is publishable only when decision is approve, with a named reviewer role and reviewer, reviewedAt, a jurisdiction, https or citation source references, an expiresAt within the review interval, and reviewedSha256 equal to the current content hash.',
  entries,
}, null, 2) + '\n');
const byService = {};
for (const item of inventory.items) byService[item.service] = (byService[item.service] || 0) + 1;
console.log(JSON.stringify({ items: inventory.items.length, addedAsPending: added.length, removedFromScope: removed, byService }, null, 2));
