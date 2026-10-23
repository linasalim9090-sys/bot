import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/config/env.js';
import type { CommandContext } from '../../src/core/context.js';
import { CommandRegistry } from '../../src/core/registry.js';
import { createTranslator } from '../../src/i18n/index.js';
import doctorCommand from '../../src/modules/core/commands/doctor.command.js';
import pingCommand from '../../src/modules/core/commands/ping.command.js';
import { createFakeInteraction } from '../fixtures/interaction.js';

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

describe('doctor command', () => {
  it('executes and replies with status embed', async () => {
    const interaction = createFakeInteraction({ deferred: true });
    const registry = new CommandRegistry();
    registry.register(pingCommand);

    const client = {
      options: {
        intents: {
          has: vi.fn(() => true),
        },
      },
      guilds: {
        fetch: vi.fn().mockResolvedValue({
          members: {
            fetchMe: vi.fn().mockResolvedValue({
              permissions: {
                has: vi.fn(() => true),
              },
            }),
          },
          commands: {
            fetch: vi.fn().mockResolvedValue(new Map([['ping', {}]])),
          },
        }),
      },
    };

    const mockDb = {
      run: vi.fn(),
    };

    const ctx: CommandContext = {
      interaction,
      client: client as never,
      env,
      db: mockDb as never,
      registry,
      settings: {} as never,
      settingsService: {} as never,
      auditService: {} as never,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await doctorCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const arg = (interaction.editReply as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      embeds: Array<{ data: { title: string; color: number } }>;
    };
    expect(arg.embeds).toBeDefined();
    expect(arg.embeds[0]?.data.title).toBe('فحص الحالة');
    expect(arg.embeds[0]?.data.color).toBe(0x57f287);
  });
});
