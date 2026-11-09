import { z } from 'zod';

export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const ComponentHealthSchema = z.object({
  status: HealthStatusSchema,
  latencyMs: z.number().optional(),
  message: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});
export type ComponentHealth = z.infer<typeof ComponentHealthSchema>;

export const SystemHealthSchema = z.object({
  status: HealthStatusSchema,
  timestamp: z.string(),
  uptime: z.number(),
  version: z.string(),
  services: z.record(ComponentHealthSchema),
});
export type SystemHealth = z.infer<typeof SystemHealthSchema>;

export const ApiResponseEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .optional(),
  });

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

