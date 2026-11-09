import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { getApiEnv } from './config/env.js';
import { createLogger } from '@versionflow/shared';

async function bootstrap() {
  const env = getApiEnv();
  const logger = createLogger({ service: 'api', level: env.LOG_LEVEL });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: env.CORS_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(env.PORT);
  logger.info(`VersionFlow API listening on port ${env.PORT} (prefix: /api/v1)`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during API bootstrap:', err);
  process.exit(1);
});

