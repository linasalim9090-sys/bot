import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildInviteUrl,
  validateGuild,
  validateToken,
  writeEnvFile,
} from '../../src/setup/helpers.js';

describe('setup helpers', () => {
  it('validates a token without leaking it', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: '1', username: 'bot' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );

    await expect(validateToken('secret-token', fetchImpl as never)).resolves.toEqual({
      id: '1',
      username: 'bot',
    });

    expect(fetchImpl).toHaveBeenCalledWith('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: 'Bot secret-token' },
    });
  });

  it('fails with a status, not the token', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('unauthorized', { status: 401 }),
    );

    await expect(validateToken('secret-token', fetchImpl as never)).rejects.toThrowError(
      /401/,
    );
  });

  it('builds an invite URL with bot and commands scopes', () => {
    const url = buildInviteUrl('123456789012345678', ['ViewChannel', 'SendMessages']);
    expect(url).toContain('client_id=123456789012345678');
    expect(url).toContain('scope=bot%20applications.commands');
    expect(url).toContain('permissions=');
  });

  it('writes key=value lines', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'nizam-env-'));
    const file = path.join(dir, '.env');
    writeEnvFile(file, { GUILD_ID: '123', OWNER_ID: '456' });
    expect(readFileSync(file, 'utf8')).toBe('GUILD_ID=123\nOWNER_ID=456\n');
    rmSync(dir, { recursive: true, force: true });
  });

  it('fails when guild fetch returns non-200 status', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('not found', { status: 404 }),
    );

    await expect(
      validateGuild('secret-token', '123456789012345678', fetchImpl as never),
    ).rejects.toThrowError(/404/);
  });

  it('fails when guild response is malformed', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );

    await expect(
      validateGuild('secret-token', '123456789012345678', fetchImpl as never),
    ).rejects.toThrowError(/Malformed/);
  });
});
