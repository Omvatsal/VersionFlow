import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

let sqlClient: postgres.Sql | null = null;
let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabaseConnection(connectionString?: string) {
  if (!sqlClient) {
    const url =
      connectionString ||
      process.env['DATABASE_URL'] ||
      'postgres://postgres:postgres@127.0.0.1:5432/versionflow_dev';
    sqlClient = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: url.includes('supabase.co') || url.includes('pooler.supabase.com') ? 'require' : undefined,
    });
    drizzleDb = drizzle(sqlClient, { schema });
  }
  return { db: drizzleDb!, sql: sqlClient };
}

export async function closeDatabaseConnection(): Promise<void> {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    drizzleDb = null;
  }
}

export async function checkDatabaseHealth(connectionString?: string): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const { sql } = getDatabaseConnection(connectionString);
    await sql`SELECT 1`;
    return {
      healthy: true,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

