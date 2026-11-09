import { Job } from 'bullmq';
import { Logger } from 'pino';
import { SystemPingJobData, SystemJobResult } from '../queues/system.queue.js';
import { checkDatabaseHealth } from '@versionflow/database';

export async function processSystemJob(
  job: Job<SystemPingJobData, SystemJobResult>,
  logger: Logger,
): Promise<SystemJobResult> {
  const startTime = Date.now();
  logger.info({ jobId: job.id, jobName: job.name, data: job.data }, 'Processing system job');

  // Verify DB connectivity as part of worker pipeline verification
  const dbHealth = await checkDatabaseHealth();
  const latency = Date.now() - startTime;

  if (!dbHealth.healthy) {
    logger.warn({ error: dbHealth.error }, 'Database check within worker failed');
  }

  const result: SystemJobResult = {
    success: true,
    processedAt: new Date().toISOString(),
    latencyMs: latency,
  };

  logger.info({ jobId: job.id, latencyMs: latency }, 'Completed system job successfully');
  return result;
}

