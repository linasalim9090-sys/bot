import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/config/logger.js';
import type { Env } from '../../src/config/env.js';

const env: Env = {
  DISCORD_TOKEN: 'super-secret-token-value',
  CLIENT_ID: '123456789012345678',
  GUILD_ID: '223456789012345678',
  OWNER_ID: '323456789012345678',
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  DATABASE_PATH: './data/test.db',
  LOG_DIR: './logs',
  DEFAULT_LOCALE: 'ar',
  DRY_RUN: false,
};

function createCapturingLogger(): {
  logger: ReturnType<typeof createLogger>;
  output: () => string;
} {
  let output = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  return {
    logger: createLogger(env, stream),
    output: () => output,
  };
}

describe('createLogger', () => {
  it('redacts secrets in top-level and nested fields', () => {
    const { logger, output } = createCapturingLogger();
    logger.info({ token: 'abc', nested: { token: 'def' }, ok: 1 }, 'test');

    expect(output()).not.toContain('abc');
    expect(output()).not.toContain('def');
    expect(output()).toContain('[Redacted]');
    expect(output()).toContain('"ok":1');
  });

  it('redacts token variants at the top level', () => {
    const { logger, output } = createCapturingLogger();
    logger.info(
      {
        access_token: 'access-token-value',
        refresh_token: 'refresh-token-value',
        botToken: 'bot-token-value',
      },
      'token variants',
    );

    expect(output()).not.toContain('access-token-value');
    expect(output()).not.toContain('refresh-token-value');
    expect(output()).not.toContain('bot-token-value');
    expect(output()).toContain('[Redacted]');
  });

  it('redacts secrets nested three levels deep and keeps non-secret fields', () => {
    const { logger, output } = createCapturingLogger();
    logger.info(
      {
        outer: {
          middle: {
            inner: {
              token: 'deep-token-value',
              password: 'deep-password-value',
            },
          },
        },
        visible: 'non-secret-value',
      },
      'deep nesting',
    );

    expect(output()).not.toContain('deep-token-value');
    expect(output()).not.toContain('deep-password-value');
    expect(output()).toContain('[Redacted]');
    expect(output()).toContain('"visible":"non-secret-value"');
  });

  it('redacts secrets nested four levels deep', () => {
    const { logger, output } = createCapturingLogger();
    logger.info(
      {
        first: {
          second: {
            third: {
              fourth: {
                token: 'four-level-token-value',
              },
            },
          },
        },
      },
      'boundary nesting',
    );

    expect(output()).not.toContain('four-level-token-value');
    expect(output()).toContain('[Redacted]');
  });
});
