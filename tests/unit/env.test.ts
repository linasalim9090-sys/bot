import { describe, expect, it } from 'vitest';
import { EnvError, loadEnv } from '../../src/config/env.js';

const valid = {
  DISCORD_TOKEN: 'x'.repeat(60),
  CLIENT_ID: '123456789012345678',
  GUILD_ID: '223456789012345678',
  OWNER_ID: '323456789012345678',
};

describe('loadEnv', () => {
  it('parses a valid environment and applies defaults', () => {
    const env = loadEnv(valid);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_PATH).toBe('./data/bot.db');
    expect(env.DEFAULT_LOCALE).toBe('ar');
    expect(env.DRY_RUN).toBe(false);
  });

  it('names a missing key without echoing secret values', () => {
    expect(() => loadEnv({})).toThrowError(EnvError);
    expect(() => loadEnv({})).toThrowError(/DISCORD_TOKEN/);
  });

  it('rejects malformed snowflakes', () => {
    expect(() => loadEnv({ ...valid, GUILD_ID: 'abc' })).toThrowError(/GUILD_ID/);
  });

  it('parses DRY_RUN=true', () => {
    expect(loadEnv({ ...valid, DRY_RUN: 'true' }).DRY_RUN).toBe(true);
  });

  it('sanitizes quotes and trailing commas from tokens and snowflakes', () => {
    const parsed = loadEnv({
      ...valid,
      DISCORD_TOKEN: `"${'y'.repeat(60)}"`,
      GUILD_ID: '"223456789012345678",',
    });
    expect(parsed.DISCORD_TOKEN).toBe('y'.repeat(60));
    expect(parsed.GUILD_ID).toBe('223456789012345678');
  });
});
