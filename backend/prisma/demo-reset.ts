/**
 * `npm run demo:reset`: a clean demo database in one command (before every rehearsal and the demo).
 *
 * 1. Refuses unless DATABASE_URL is the local majlis_fund database (the same seed-safety check as
 *    prisma/seed.ts, with the same explicit override variable).
 * 2. `prisma migrate reset --force --skip-seed`: drops the schema and re-applies every migration.
 * 3. Empties the local uploads folder (seed images, receipts and proofs of the old database), but
 *    only when it lies inside this backend/ folder.
 * 4. Runs the deterministic demo seed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { relative, resolve, isAbsolute } from 'node:path';
import { loadEnvFile } from 'node:process';
import {
  checkSeedDatabaseUrl,
  SEED_SAFETY_OVERRIDE_ENV_VAR,
} from '../src/common/seed-safety.util';

function run(command: string): void {
  console.log(`> ${command}`);
  // shell: true resolves npx.cmd on Windows; the command is a fixed string, never user input.
  const result = spawnSync(command, { stdio: 'inherit', shell: true });
  if (result.status !== 0) throw new Error(`"${command}" failed (exit ${result.status})`);
}

async function main() {
  if (existsSync('.env')) loadEnvFile('.env');
  if (process.env.NODE_ENV === 'production')
    throw new Error('Refusing to reset in production');
  if (process.env[SEED_SAFETY_OVERRIDE_ENV_VAR] !== 'true') {
    const check = checkSeedDatabaseUrl(process.env.DATABASE_URL);
    if (!check.safe) {
      throw new Error(
        `Refusing to reset: DATABASE_URL is not the local majlis_fund database. ${check.reason}`,
      );
    }
  }

  run('npx prisma migrate reset --force --skip-seed --skip-generate');

  const uploads = resolve(process.env.STORAGE_LOCAL_DIR ?? 'uploads');
  const rel = relative(process.cwd(), uploads);
  if (rel && !rel.startsWith('..') && !isAbsolute(rel)) {
    await rm(uploads, { recursive: true, force: true });
    console.log(`Emptied ${rel}/`);
  } else {
    console.log(`Kept ${uploads} (outside backend/, not emptied)`);
  }

  run('npx ts-node prisma/seed.ts');
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
