import path from 'node:path';
import pino from 'pino';
import type { Env } from './env.js';

export type Logger = pino.Logger;

const redact = {
  paths: [
    'token',
    'DISCORD_TOKEN',
    'authorization',
    'cookie',
    'password',
    'secret',
    '*.token',
    '*.authorization',
    '*.cookie',
    '*.password',
    '*.secret',
  ],
  censor: '[Redacted]',
};

export function createLogger(env: Env, destination?: pino.DestinationStream): Logger {
  if (destination) {
    return pino({ level: env.LOG_LEVEL, redact }, destination);
  }

  if (env.NODE_ENV === 'production') {
    const transport = pino.transport({
      target: 'pino-roll',
      options: {
        file: path.join(env.LOG_DIR, 'bot'),
        frequency: 'daily',
        mkdir: true,
        size: '10m',
      },
    });
    return pino({ level: env.LOG_LEVEL, redact }, transport);
  }

  return pino({ level: env.LOG_LEVEL, redact });
}
