import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { createLogger } from '@versionflow/shared';
import { getWorkerEnv } from './config/env.js';
import { SYSTEM_QUEUE_NAME, SystemPingJobData, SystemJobResult } from './queues/system.queue.js';
import { processSystemJob } from './processors/system.processor.js';

const env = getWorkerEnv();
const logger = createLogger({ service: 'worker', level: env.LOG_LEVEL });

logger.info('Starting VersionFlow background worker...');

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('connect', () => {
  logger.info('Worker connected to Redis successfully');
});

connection.on('error', (err) => {
  logger.error({ err }, 'Worker Redis connection error');
});

const worker = new Worker<SystemPingJobData, SystemJobResult>(
  SYSTEM_QUEUE_NAME,
  async (job) => {
    return processSystemJob(job, logger);
  },
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

worker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job execution failed');
});

worker.on('error', (err) => {
  logger.error({ err }, 'BullMQ worker internal error');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Gracefully shutting down worker...');
  await worker.close();
  await connection.quit();
  logger.info('Worker shutdown completed');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { worker, connection };

