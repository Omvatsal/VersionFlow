import { z } from 'zod';
import { validateEnv } from '@versionflow/shared';
import * as dotenv from 'dotenv';

dotenv.config();

export const ApiEnvSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/versionflow_dev'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.string().default('info'),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export function getApiEnv(): ApiEnv {
  return validateEnv(ApiEnvSchema, process.env);
}

