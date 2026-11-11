import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];
const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
dotenv.config({ path: envPath });

export async function runMigrations(databaseUrl?: string) {
  const url =
    databaseUrl ||
    process.env['DATABASE_URL'] ||
    'postgres://postgres:postgres@127.0.0.1:5432/versionflow_dev';
  console.log('[Database] Connecting for migration...');
  const migrationClient = postgres(url, {
    max: 1,
    ssl: url.includes('supabase.co') || url.includes('pooler.supabase.com') ? 'require' : undefined,
  });
  const db = drizzle(migrationClient);

  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  console.log(`[Database] Applying migrations from ${migrationsFolder}...`);

  await migrate(db, { migrationsFolder });
  console.log('[Database] Migrations applied successfully.');

  await migrationClient.end();
}

if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('[Database] Migration failed:', err);
    process.exit(1);
  });
}

