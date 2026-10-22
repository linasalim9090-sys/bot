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

describe('createLogger', () => {
  it('redacts secrets in top-level and nested fields', () => {
    let output = '';
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });

    const logger = createLogger(env, stream);
    logger.info({ token: 'abc', nested: { token: 'def' }, ok: 1 }, 'test');

    expect(output).not.toContain('abc');
    expect(output).not.toContain('def');
    expect(output).toContain('[Redacted]');
    expect(output).toContain('"ok":1');
  });
});
