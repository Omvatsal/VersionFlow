import { z } from 'zod';
import { validateEnv } from '@versionflow/shared';

export const WebEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000/api/v1'),
});

export type WebEnv = z.infer<typeof WebEnvSchema>;

export function getWebEnv(): WebEnv {
  return validateEnv(WebEnvSchema, {
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
  });
}

