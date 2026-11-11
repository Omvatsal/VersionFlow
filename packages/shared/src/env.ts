import { z, type ZodTypeAny } from 'zod';

export function validateEnv<T extends ZodTypeAny>(schema: T, env: Record<string, unknown> = process.env): z.output<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  return result.data;
}

