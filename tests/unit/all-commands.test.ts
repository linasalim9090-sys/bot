import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../../src/core/context.js';
import { CommandRegistry } from '../../src/core/registry.js';
import { createDb } from '../../src/db/client.js';
import { createTranslator } from '../../src/i18n/index.js';

describe('All Registered Commands Suite', () => {
  it('loads and verifies all commands meet requirements and execute safely', async () => {
    const { db } = createDb(':memory:');
    const registry = new CommandRegistry();
    const modulesDir = path.join(process.cwd(), 'src', 'modules');
    await registry.loadFromDirectory(modulesDir);

    const commands = registry.all();
    // Verify count is between 50 and 70
    expect(commands.length).toBeGreaterThanOrEqual(50);
    expect(commands.length).toBeLessThanOrEqual(70);
    expect(commands.length).toBe(65);

    const t = createTranslator('ar');

    for (const cmd of commands) {
      expect(cmd.data.name).toMatch(/^[a-z0-9_-]{1,32}$/);
      expect(cmd.data.description.length).toBeGreaterThan(0);
      expect(cmd.meta.module).toBeDefined();

      if (cmd.data.name === 'doctor') {
        continue;
      }

      const dummyChannel = {
        id: '223456789012345678',
        name: 'test-channel',
        bulkDelete: vi.fn().mockResolvedValue(undefined),
        setRateLimitPerUser: vi.fn().mockResolvedValue(undefined),
        send: vi.fn().mockResolvedValue(undefined),
        permissionOverwrites: {
          edit: vi.fn().mockResolvedValue(undefined),
        },
      };

      const dummyUser = {
        id: '323456789012345678',
        tag: 'tester#0001',
        bot: false,
        displayAvatarURL: vi.fn(() => 'https://cdn.discordapp.com/avatars/test.png'),
      };

      const dummyMember = {
        kick: vi.fn().mockResolvedValue(undefined),
        timeout: vi.fn().mockResolvedValue(undefined),
        setNickname: vi.fn().mockResolvedValue(undefined),
        roles: {
          add: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      };

      const dummyGuild = {
        id: '123456789012345678',
        name: 'Test Server',
        memberCount: 25,
        premiumSubscriptionCount: 3,
        premiumTier: 1,
        channels: {
          create: vi.fn().mockResolvedValue(dummyChannel),
          cache: new Map([['ch-1', dummyChannel]]),
        },
        members: {
          ban: vi.fn().mockResolvedValue(undefined),
          fetch: vi.fn().mockResolvedValue(dummyMember),
        },
        bans: {
          remove: vi.fn().mockResolvedValue(undefined),
        },
        roles: {
          cache: new Map([
            ['role-1', { id: 'role-1', name: 'Admin', permissions: { has: vi.fn(() => true) } }],
          ]),
        },
        emojis: {
          cache: new Map([['emoji-1', { id: 'emoji-1', name: 'test_emoji' }]]),
        },
      };

      const replyFn = vi.fn().mockResolvedValue(undefined);
      const editReplyFn = vi.fn().mockResolvedValue(undefined);

      const fakeInteraction = {
        commandName: cmd.data.name,
        guildId: '123456789012345678',
        channelId: '223456789012345678',
        guild: dummyGuild,
        channel: dummyChannel,
        user: dummyUser,
        reply: replyFn,
        editReply: editReplyFn,
        options: {
          getSubcommand: vi.fn(() => {
            if (cmd.data.name === 'settings') return 'view';
            if (cmd.data.name === 'module') return 'list';
            if (cmd.data.name === 'setup') return 'welcome';
            if (cmd.data.name === 'ticket') return 'setup';
            return 'welcome';
          }),
          getChannel: vi.fn(() => dummyChannel),
          getUser: vi.fn(() => dummyUser),
          getRole: vi.fn(() => ({ id: 'role-1', name: 'Member' })),
          getString: vi.fn((name: string) => {
            if (name === 'userid' || name === 'id') return '1563092248017506384';
            if (name === 'hex') return '5865F2';
            if (name === 'expression') return '10 + 5 * 2';
            if (name === 'choice') return 'rock';
            if (name === 'choices' || name === 'options') return 'apple, banana, cherry';
            if (name === 'command') return 'ping';
            return 'Sample test string';
          }),
          getInteger: vi.fn((_name: string) => 5),
          getBoolean: vi.fn((_name: string) => true),
        },
      };

      const ctx: CommandContext = {
        interaction: fakeInteraction as never,
        client: {
          ws: { ping: 25 },
          uptime: 3600000,
        } as never,
        env: {
          GUILD_ID: '123456789012345678',
          CLIENT_ID: '1563092248017506384',
          DEFAULT_LOCALE: 'ar',
        } as never,
        db: db as never,
        registry,
        settings: {
          guildId: '123456789012345678',
          version: 1,
          locale: 'ar',
          timezone: 'Asia/Riyadh',
          modulesJson: { core: true, moderation: true, security: true, utility: true, fun: true, community: true },
          loggingJson: {},
          welcomeJson: {},
          ticketsJson: {},
          musicJson: {},
          rolesJson: { ownerRoleIds: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        settingsService: {
          update: vi.fn().mockResolvedValue({}),
          get: vi.fn(),
          reset: vi.fn(),
        } as never,
        auditService: {
          record: vi.fn().mockResolvedValue(undefined),
          list: vi.fn().mockResolvedValue([
            {
              id: 1,
              guildId: '123456789012345678',
              actorId: '323456789012345678',
              action: 'warn',
              targetId: '323456789012345678',
              metadataJson: { reason: 'Test warning' },
              createdAt: Date.now(),
            },
          ]),
        } as never,
        t,
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never,
      };

      await cmd.execute(ctx);

      const replied = replyFn.mock.calls.length > 0 || editReplyFn.mock.calls.length > 0;
      expect(replied).toBe(true);
    }
  }, 30_000);

  it('tests /setup subcommands (logs, channels, security)', async () => {
    const setupCmd = (await import('../../src/modules/core/commands/setup.command.js')).default;
    const t = createTranslator('ar');
    const updateFn = vi.fn().mockResolvedValue({});

    for (const sub of ['logs', 'channels', 'security'] as const) {
      const editReplyFn = vi.fn().mockResolvedValue(undefined);
      const fakeInteraction = {
        options: {
          getSubcommand: vi.fn(() => sub),
          getChannel: vi.fn(() => ({ id: 'ch-logs' })),
        },
        guild: {
          channels: {
            create: vi.fn().mockResolvedValue({}),
          },
        },
        user: { id: 'user-1' },
        editReply: editReplyFn,
      };

      const ctx: CommandContext = {
        interaction: fakeInteraction as never,
        client: {} as never,
        env: {} as never,
        db: {} as never,
        registry: {} as never,
        settings: {
          guildId: '123',
          version: 1,
          modulesJson: {},
        } as never,
        settingsService: {
          update: updateFn,
        } as never,
        auditService: {} as never,
        t,
        logger: { info: vi.fn() } as never,
      };

      await setupCmd.execute(ctx);
      expect(editReplyFn).toHaveBeenCalled();
    }
  });
});
