import { z } from 'zod';
import { validateEnv } from '@versionflow/shared';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envCandidates = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')];
dotenv.config({ path: envCandidates.find((candidate) => fs.existsSync(candidate)) });
const numericEnv = (fallback: number, minimum: number) => z.preprocess(
  (value) => value === undefined || (typeof value === 'string' && value.trim() === '') ? fallback : value,
  z.coerce.number().int().min(minimum).max(65535),
);

export const ApiEnvSchema = z.object({
  PORT: numericEnv(4000, 0),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@127.0.0.1:5432/versionflow_dev'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.string().default('info'),
  JWT_SECRET: z.string().min(32).default('development-only-versionflow-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_DAYS: numericEnv(30, 1),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/v1/auth/google/callback'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITHUB_OAUTH_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/v1/auth/github/callback'),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_APP_SLUG: z.string().optional(),
  GITHUB_APP_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/v1/integrations/github/callback'),
  GITHUB_APP_WEBHOOK_SECRET: z.string().optional(),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export function getApiEnv(): ApiEnv {
  return validateEnv(ApiEnvSchema, process.env);
}

