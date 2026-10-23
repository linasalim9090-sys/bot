import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/config/env.js';
import type { CommandContext } from '../../src/core/context.js';
import { CommandError } from '../../src/core/errors.js';
import { createTranslator } from '../../src/i18n/index.js';
import moduleCommand from '../../src/modules/core/commands/module.command.js';
import { createFakeInteraction } from '../fixtures/interaction.js';
import { createTestServices } from '../fixtures/services.js';

const GUILD_ID = '123456789012345678';
const OWNER_ID = '323456789012345678';

const env: Env = {
  DISCORD_TOKEN: 'x'.repeat(60),
  CLIENT_ID: '123456789012345678',
  GUILD_ID,
  OWNER_ID,
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

describe('module command', () => {
  it('list shows every module and its state', async () => {
    const settings = await services.settings.get(GUILD_ID);
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'list'),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await moduleCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const arg = (interaction.editReply as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      embeds: Array<{ data: { title: string; description: string } }>;
    };
    expect(arg.embeds).toBeDefined();
    expect(arg.embeds[0]?.data.description).toContain('core:');
    expect(arg.embeds[0]?.data.description).toContain('economy:');
  });

  it('disable economy updates modulesJson.economy to false', async () => {
    const settings = await services.settings.get(GUILD_ID);
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'disable'),
        getString: vi.fn((name) => (name === 'name' || name === 'module' ? 'economy' : undefined)),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await moduleCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: 'تم تحديث حالة الوحدة.',
    });

    const updated = await services.settings.get(GUILD_ID);
    expect(updated.modulesJson['economy']).toBe(false);
  });

  it('disable core is refused with commands.module.coreLocked', async () => {
    const settings = await services.settings.get(GUILD_ID);
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'disable'),
        getString: vi.fn((name) => (name === 'name' || name === 'module' ? 'core' : undefined)),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await expect(moduleCommand.execute(ctx)).rejects.toThrowError(
      new CommandError('commands.module.coreLocked'),
    );
  });

  it('enable economy restores it', async () => {
    await services.settings.update(
      GUILD_ID,
      { modulesJson: { economy: false } },
      OWNER_ID,
    );

    const settings = await services.settings.get(GUILD_ID);
    expect(settings.modulesJson['economy']).toBe(false);

    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'enable'),
        getString: vi.fn((name) => (name === 'name' || name === 'module' ? 'economy' : undefined)),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await moduleCommand.execute(ctx);

    const restored = await services.settings.get(GUILD_ID);
    expect(restored.modulesJson['economy']).toBe(true);
  });
});
