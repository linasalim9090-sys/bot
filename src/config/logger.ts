import path from 'node:path';
import pino from 'pino';
import type { Env } from './env.js';

export type Logger = pino.Logger;

const SECRET_KEYS = [
  'token',
  'DISCORD_TOKEN',
  'access_token',
  'refresh_token',
  'botToken',
  'authorization',
  'cookie',
  'password',
  'secret',
] as const;

const MAX_NESTING_DEPTH = 4;

// Pino wildcards match one object level each, so generate paths for every
// secret key at the top level and at one through four levels of nesting.
const redact = {
  paths: SECRET_KEYS.flatMap((key) => [
    key,
    ...Array.from({ length: MAX_NESTING_DEPTH }, (_, depth) => `${'*.'.repeat(depth + 1)}${key}`),
  ]),
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
