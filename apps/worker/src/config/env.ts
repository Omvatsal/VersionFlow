import { z } from 'zod';
import { validateEnv } from '@versionflow/shared';
import * as dotenv from 'dotenv';

dotenv.config();

export const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/versionflow_dev'),
  LOG_LEVEL: z.string().default('info'),
  WORKER_CONCURRENCY: z.string().default('5').transform((v) => parseInt(v, 10)),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function getWorkerEnv(): WorkerEnv {
  return validateEnv(WorkerEnvSchema, process.env);
}

