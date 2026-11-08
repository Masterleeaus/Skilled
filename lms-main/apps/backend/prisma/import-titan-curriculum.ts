/** Idempotent, non-destructive Titan Academy curriculum brief import. */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const prisma = new PrismaClient();
const source = resolve(dirname(fileURLToPath(import.meta.url)), 'curriculum/titan-three-layer-lessons.json');
type Brief = { id:string; layer:string; service_group:string; unit:string; title:string; objective:string; assessment:string; status:string };
const payload = JSON.parse(readFileSync(source, 'utf8')) as { version:string; lessons:Brief[] };

async function main() {
  if (!Array.isArray(payload.lessons) || payload.lessons.length === 0) throw new Error('No lessons in inventory');
  const seen = new Set<string>();
  let created=0, updated=0, unchanged=0, protectedCount=0;
  for (const row of payload.lessons) {
    if (!row.id || !row.title || !row.layer || !row.unit || !row.objective) throw new Error(`Invalid brief ${row.id}`);
    if (seen.has(row.id)) throw new Error(`Duplicate source ID ${row.id}`);
    seen.add(row.id);
    const content = {layer:row.layer, serviceGroup:row.service_group, unit:row.unit, title:row.title, objective:row.objective, assessment:row.assessment};
    const sourceHash = createHash('sha256').update(JSON.stringify(content)).digest('hex');
    const current = await prisma.academyContentLesson.findUnique({where:{sourceId:row.id}});
    if (!current) {
      await prisma.academyContentLesson.create({data:{sourceId:row.id, ...content, sourceVersion:payload.version, sourceHash, contentStatus:'BRIEF'}});
      created++;
    } else if (current.sourceHash === sourceHash) unchanged++;
    else if (current.contentStatus !== 'BRIEF') protectedCount++;
    else {
      await prisma.academyContentLesson.update({where:{sourceId:row.id},data:{...content, sourceVersion:payload.version, sourceHash}});
      updated++;
    }
  }
  console.log(JSON.stringify({total:seen.size,created,updated,unchanged,protected:protectedCount}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>prisma.$disconnect());
