import { z, ZodSchema } from 'zod';

export function validateEnv<T>(schema: ZodSchema<T>, env: Record<string, unknown> = process.env): T {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  return result.data;
}

