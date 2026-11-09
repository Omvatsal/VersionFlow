import pino, { Logger, LoggerOptions } from 'pino';

export interface CreateLoggerOptions {
  service: string;
  level?: string;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const isDevelopment = process.env['NODE_ENV'] !== 'production';

  const pinoOptions: LoggerOptions = {
    level: options.level || process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),
    base: {
      service: options.service,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (isDevelopment) {
    return pino({
      ...pinoOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(pinoOptions);
}

