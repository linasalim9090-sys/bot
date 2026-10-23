import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/config/env.js';
import type { CommandContext } from '../../src/core/context.js';
import { CommandError } from '../../src/core/errors.js';
import { createTranslator } from '../../src/i18n/index.js';
import settingsCommand from '../../src/modules/core/commands/settings.command.js';
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

describe('settings command', () => {
  it('view replies ephemerally with locale, timezone, version, and module states', async () => {
    const settings = await services.settings.get(GUILD_ID);
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'view'),
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

    await settingsCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const arg = (interaction.editReply as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      embeds: Array<{ data: { title: string; fields: Array<{ name: string; value: string }> } }>;
    };
    expect(arg.embeds).toBeDefined();
    const fields = arg.embeds[0]!.data.fields;
    expect(fields.some((f) => f.value === 'ar')).toBe(true);
    expect(fields.some((f) => f.value === 'Asia/Riyadh')).toBe(true);
  });

  it('locale updates the row to en, increments version, and writes an audit row', async () => {
    const initial = await services.settings.get(GUILD_ID);
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'locale'),
        getString: vi.fn((name) => (name === 'value' || name === 'locale' ? 'en' : undefined)),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings: initial,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await settingsCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: 'تم تحديث الإعدادات.',
    });

    const updated = await services.settings.get(GUILD_ID);
    expect(updated.locale).toBe('en');
    expect(updated.version).toBe(2);

    const auditLogs = await services.audit.list(GUILD_ID);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe('settings.update');
  });

  it('timezone rejects an invalid value with a user-safe error', async () => {
    const initial = await services.settings.get(GUILD_ID);
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'timezone'),
        getString: vi.fn((name) =>
          name === 'value' || name === 'timezone' ? 'Invalid/Zone' : undefined,
        ),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings: initial,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await expect(settingsCommand.execute(ctx)).rejects.toThrowError(CommandError);
  });

  it('reset rejects a non-owner and succeeds for the owner', async () => {
    const initial = await services.settings.get(GUILD_ID);
    const nonOwnerInteraction = createFakeInteraction({
      deferred: true,
      user: { id: '999999999999999999' },
      options: {
        getSubcommand: vi.fn(() => 'reset'),
      },
    });

    const nonOwnerCtx: CommandContext = {
      interaction: nonOwnerInteraction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings: initial,
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await expect(settingsCommand.execute(nonOwnerCtx)).rejects.toThrowError(CommandError);

    const ownerInteraction = createFakeInteraction({
      deferred: true,
      user: { id: OWNER_ID },
      options: {
        getSubcommand: vi.fn(() => 'reset'),
      },
    });

    const ownerCtx: CommandContext = {
      ...nonOwnerCtx,
      interaction: ownerInteraction,
    };

    await settingsCommand.execute(ownerCtx);
    expect(ownerInteraction.editReply).toHaveBeenCalledWith({
      content: 'تمت إعادة الإعدادات إلى الوضع الافتراضي.',
    });
  });

  it('a stale expectedVersion produces commands.settings.conflict', async () => {
    const initial = await services.settings.get(GUILD_ID);
    // Mutate behind ctx's back
    await services.settings.update(GUILD_ID, { locale: 'en' }, OWNER_ID, initial.version);

    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getSubcommand: vi.fn(() => 'locale'),
        getString: vi.fn(() => 'ar'),
      },
    });

    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env,
      db: services.db,
      registry: {} as never,
      settings: initial, // stale version
      settingsService: services.settings,
      auditService: services.audit,
      t: createTranslator('ar'),
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await expect(settingsCommand.execute(ctx)).rejects.toThrowError(
      new CommandError('commands.settings.conflict'),
    );
  });
});
