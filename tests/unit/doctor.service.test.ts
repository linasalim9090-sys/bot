import { PermissionFlagsBits } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/config/env.js';
import { CommandRegistry } from '../../src/core/registry.js';
import { createTranslator } from '../../src/i18n/index.js';
import pingCommand from '../../src/modules/core/commands/ping.command.js';
import { runDoctor } from '../../src/services/doctor.service.js';
import { createTestServices } from '../fixtures/services.js';

const env: Env = {
  DISCORD_TOKEN: 'x'.repeat(60),
  CLIENT_ID: '123456789012345678',
  GUILD_ID: '123456789012345678',
  OWNER_ID: '323456789012345678',
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_PATH: ':memory:',
  LOG_DIR: './logs',
  DEFAULT_LOCALE: 'ar',
  DRY_RUN: false,
};

let services!: Awaited<ReturnType<typeof createTestServices>>;

beforeEach(async () => {
  services = await createTestServices();
});

afterEach(() => {
  services.cleanup();
});

function createHealthyFakeClient(
  memberPermissions: bigint = PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks |
    PermissionFlagsBits.ReadMessageHistory,
) {
  return {
    options: {
      intents: {
        has: vi.fn((_intent?: number | bigint) => true),
      },
    },
    guilds: {
      fetch: vi.fn().mockResolvedValue({
        members: {
          fetchMe: vi.fn().mockResolvedValue({
            permissions: {
              has: (perm: bigint) => (memberPermissions & perm) === perm,
            },
          }),
        },
        commands: {
          fetch: vi.fn().mockResolvedValue(new Map([['ping', {}]])),
        },
      }),
    },
  };
}

describe('runDoctor', () => {
  it('healthy environment, db, client and commands produce ok: true', async () => {
    const registry = new CommandRegistry();
    registry.register(pingCommand);
    const client = createHealthyFakeClient();
    const t = createTranslator('ar');

    const report = await runDoctor({
      env,
      db: services.db,
      client,
      registry,
      t,
    });

    expect(report.ok).toBe(true);
    expect(report.checks.every((c) => c.ok)).toBe(true);
  });

  it('missing EmbedLinks produces ok: false and failed permission check', async () => {
    const registry = new CommandRegistry();
    registry.register(pingCommand);
    const client = createHealthyFakeClient(
      PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages,
    );
    const t = createTranslator('ar');

    const report = await runDoctor({
      env,
      db: services.db,
      client,
      registry,
      t,
    });

    expect(report.ok).toBe(false);
    const permCheck = report.checks.find((c) => c.name === 'permissions');
    expect(permCheck?.ok).toBe(false);
    expect(permCheck?.detail).toContain('EmbedLinks');
  });

  it('missing intent produces a failed intent check', async () => {
    const registry = new CommandRegistry();
    registry.register(pingCommand);
    const client = createHealthyFakeClient();
    client.options.intents.has = vi.fn((intent?: number | bigint) => {
      // GuildMembers is 1 << 1 = 2
      return intent !== 2;
    });

    const t = createTranslator('ar');
    const report = await runDoctor({
      env,
      db: services.db,
      client,
      registry,
      t,
    });

    expect(report.ok).toBe(false);
    const intentCheck = report.checks.find((c) => c.name === 'intents');
    expect(intentCheck?.ok).toBe(false);
  });

  it('guild fetch failure produces failed guild check without throwing', async () => {
    const registry = new CommandRegistry();
    registry.register(pingCommand);
    const client = createHealthyFakeClient();
    client.guilds.fetch = vi.fn().mockRejectedValue(new Error('Discord API 404'));

    const t = createTranslator('ar');
    const report = await runDoctor({
      env,
      db: services.db,
      client,
      registry,
      t,
    });

    expect(report.ok).toBe(false);
    const guildCheck = report.checks.find((c) => c.name === 'guild');
    expect(guildCheck?.ok).toBe(false);
  });

  it('missing recommended permissions do not make ok false', async () => {
    const registry = new CommandRegistry();
    registry.register(pingCommand);
    // client only has the 4 required permissions, no recommended permissions
    const client = createHealthyFakeClient(
      PermissionFlagsBits.ViewChannel |
        PermissionFlagsBits.SendMessages |
        PermissionFlagsBits.EmbedLinks |
        PermissionFlagsBits.ReadMessageHistory,
    );

    const t = createTranslator('ar');
    const report = await runDoctor({
      env,
      db: services.db,
      client,
      registry,
      t,
    });

    expect(report.ok).toBe(true);
  });
});
