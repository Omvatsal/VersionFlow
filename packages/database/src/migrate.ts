import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(databaseUrl?: string) {
  const url =
    databaseUrl ||
    process.env['DATABASE_URL'] ||
    'postgres://postgres:postgres@localhost:5432/versionflow_dev';
  console.log('[Database] Connecting for migration...');
  const migrationClient = postgres(url, { max: 1 });
  const db = drizzle(migrationClient);

  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  console.log(`[Database] Applying migrations from ${migrationsFolder}...`);

  await migrate(db, { migrationsFolder });
  console.log('[Database] Migrations applied successfully.');

  await migrationClient.end();
}

if (process.argv[1] === __filename) {
  runMigrations().catch((err) => {
    console.error('[Database] Migration failed:', err);
    process.exit(1);
  });
}

