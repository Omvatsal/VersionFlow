import { z } from 'zod';
import { validateEnv } from '@versionflow/shared';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envCandidates = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')];
dotenv.config({ path: envCandidates.find((candidate) => fs.existsSync(candidate)) });

export const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Use IPv4 explicitly for Windows local development. `localhost` may resolve
  // to ::1 while the Docker-published Redis port is listening on 127.0.0.1.
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@127.0.0.1:5432/versionflow_dev'),
  LOG_LEVEL: z.string().default('info'),
  WORKER_CONCURRENCY: z.string().default('5').transform((v) => parseInt(v, 10)),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function getWorkerEnv(): WorkerEnv {
  return validateEnv(WorkerEnvSchema, process.env);
}

