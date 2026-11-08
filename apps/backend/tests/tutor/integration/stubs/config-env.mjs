// Edge stub for src/config/env. Only the curriculum folder is needed by the tutor wiring.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const env = { CURRICULUM_DIR: path.join(here, '..', 'fixtures', 'curriculum') };
