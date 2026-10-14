// Runs every supabase/tests/*.sql file against the local Supabase database container.
// Each test file manages its own transaction and rolls back. Requires `supabase start`.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const container = process.env.SADU_DB_CONTAINER ?? 'supabase_db_SADUMAHA-main';
const dir = 'supabase/tests';
const only = process.argv.slice(2);
const files = readdirSync(dir).filter(f => f.endsWith('.sql') && (!only.length || only.some(o => f.includes(o)))).sort();

let failed = 0;
for (const file of files) {
  const run = spawnSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'],
    { input: readFileSync(join(dir, file)), encoding: 'utf8' });
  if (run.status === 0) { console.log(`PASS ${file}`); continue; }
  failed++;
  const detail = `${run.stderr ?? ''}${run.error?.message ?? ''}`.split('\n').filter(l => /ERROR|FATAL|CONTEXT|Error/.test(l)).slice(0, 3).join('\n  ');
  console.log(`FAIL ${file}\n  ${detail}`);
}
console.log(`\n${files.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
