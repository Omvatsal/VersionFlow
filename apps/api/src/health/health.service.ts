import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { checkDatabaseHealth } from '@versionflow/database';
import { SystemHealth, ComponentHealth } from '@versionflow/contracts';
import Redis from 'ioredis';
import { getApiEnv } from '../config/env.js';

@Injectable()
export class HealthService implements OnModuleDestroy {
  private redisClient: Redis | null = null;
  private readonly startTime = Date.now();

  private getRedis(): Redis {
    if (!this.redisClient) {
      const env = getApiEnv();
      this.redisClient = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });
    }
    return this.redisClient;
  }

  async checkRedisHealth(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const redis = this.getRedis();
      if (redis.status !== 'ready' && redis.status !== 'connecting') {
        await redis.connect();
      }
      const pong = await redis.ping();
      const latency = Date.now() - start;
      return {
        status: pong === 'PONG' ? 'healthy' : 'degraded',
        latencyMs: latency,
        message: 'Redis ping successful',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message,
      };
    }
  }

  async checkDatabase(): Promise<ComponentHealth> {
    const env = getApiEnv();
    const result = await checkDatabaseHealth(env.DATABASE_URL);
    return {
      status: result.healthy ? 'healthy' : 'unhealthy',
      latencyMs: result.latencyMs,
      message: result.healthy ? 'Database ping successful' : result.error,
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [dbHealth, redisHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedisHealth(),
    ]);

    const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy';
    const isDegraded =
      (dbHealth.status === 'healthy' && redisHealth.status !== 'healthy') ||
      (dbHealth.status !== 'healthy' && redisHealth.status === 'healthy');

    return {
      status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: '0.1.0',
      services: {
        api: {
          status: 'healthy',
          message: 'API server operational',
        },
        database: dbHealth,
        redis: redisHealth,
      },
    };
  }

  async isReady(): Promise<boolean> {
    const db = await this.checkDatabase();
    return db.status === 'healthy';
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
      this.redisClient = null;
    }
  }
}

