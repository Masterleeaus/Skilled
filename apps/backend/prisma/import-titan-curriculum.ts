/**
 * Idempotent, revision-safe Titan Academy curriculum brief import (ACA-009).
 *
 * Usage (from apps/backend):
 *   pnpm curriculum:import                       # reads prisma/curriculum/titan-three-layer-lessons.json
 *   tsx prisma/import-titan-curriculum.ts --source <path>   # reads another copy of the same inventory format
 *   tsx prisma/import-titan-curriculum.ts --validate-only    # checks input without connecting to a DB
 *
 * Policy and identity rules: docs/CURRICULUM-IMPORT-IDENTITY-AND-CONFLICT-POLICY.md (repo lms-main/docs).
 * The logic lives in curriculum-brief-import.ts so that tests can run it without a file or a database.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyBriefImport, validateBriefInventory } from './curriculum-brief-import';

const defaultSource = resolve(dirname(fileURLToPath(import.meta.url)), 'curriculum/titan-three-layer-lessons.json');

function sourcePath(argv: string[]): string {
  const index = argv.indexOf('--source');
  if (index === -1) return defaultSource;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error('--source needs a file path');
  return resolve(value);
}

async function main() {
  const args = process.argv.slice(2);
  const supported = new Set(['--source', '--validate-only', '--help']);
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--') || !supported.has(args[i])) {
      throw new Error('Unknown argument: ' + args[i]);
    }
    if (args[i] === '--source') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error('--source needs a file path');
    }
  }
  if (args.includes('--help')) {
    console.log('Usage: curriculum:import [--source inventory.json] [--validate-only]');
    return;
  }
  const input = sourcePath(args);
  const inventory = validateBriefInventory(JSON.parse(readFileSync(input, 'utf8')));
  if (args.includes('--validate-only')) {
    const layers: Record<string, number> = {};
    for (const lesson of inventory.lessons) {
      layers[lesson.layer] = (layers[lesson.layer] ?? 0) + 1;
    }
    console.log(JSON.stringify({
      mode: 'validate-only',
      databaseConnected: false,
      writes: 0,
      source: input,
      sourceVersion: inventory.version,
      total: inventory.lessons.length,
      layers,
      contentStage: 'briefs-only',
      publicationApproved: false,
    }));
    return;
  }
  const prisma = new PrismaClient();
  try {
    const stats = await applyBriefImport(prisma, inventory);
    console.log(JSON.stringify({ sourceVersion: inventory.version, ...stats }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
