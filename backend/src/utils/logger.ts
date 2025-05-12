import pino from 'pino';
import { config } from '../config';

// Configure logger based on environment
export const logger = pino({
  level: config.isDev ? 'debug' : 'info',
  transport: config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.passwordConfirmation'],
    remove: true
  }
});