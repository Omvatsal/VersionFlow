import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { getWorkerEnv } from '../config/env.js';

export const SYSTEM_QUEUE_NAME = 'versionflow-system';

export interface SystemPingJobData {
  timestamp: string;
  source: string;
}

export interface SystemJobResult {
  success: boolean;
  processedAt: string;
  latencyMs: number;
}

export function createSystemQueue(connection?: Redis): Queue<SystemPingJobData, SystemJobResult> {
  const env = getWorkerEnv();
  const redisConnection =
    connection ||
    new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

  return new Queue<SystemPingJobData, SystemJobResult>(SYSTEM_QUEUE_NAME, {
    connection: redisConnection,
  });
}

