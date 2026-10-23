import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/config/env.js';
import { CooldownService } from '../../src/core/cooldowns.js';
import { handleCommandError } from '../../src/core/errors.js';
import { handleChatInputCommand } from '../../src/core/handler.js';
import { CommandRegistry } from '../../src/core/registry.js';
import { createTranslator } from '../../src/i18n/index.js';
import pingCommand from '../fixtures/commands/ping.command.js';
import { createFakeInteraction } from '../fixtures/interaction.js';
import { makeSettings } from '../fixtures/settings.js';

const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
const t = createTranslator('ar');

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

describe('handleCommandError', () => {
  it('edits the reply when the interaction was deferred', async () => {
    const interaction = createFakeInteraction({ deferred: true });
    await handleCommandError(interaction, new Error('boom'), { logger, t });
    expect(interaction.editReply).toHaveBeenCalledOnce();
    expect(interaction.reply).not.toHaveBeenCalled();
    const editMock = interaction.editReply as unknown as { mock: { calls: unknown[][] } };
    expect(editMock.mock.calls[0]?.[0]).toMatchObject({
      content: expect.stringContaining('معرّف الخطأ'),
    });
  });

  it('uses followUp when the interaction was already replied', async () => {
    const interaction = createFakeInteraction({ replied: true });
    await handleCommandError(interaction, new Error('boom'), { logger, t });
    expect(interaction.followUp).toHaveBeenCalledOnce();
  });

  it('does not reply to an expired interaction', async () => {
    const interaction = createFakeInteraction();
    await handleCommandError(interaction, { code: 10062 }, { logger, t });
    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.editReply).not.toHaveBeenCalled();
    expect(interaction.followUp).not.toHaveBeenCalled();
  });
});

describe('handleChatInputCommand', () => {
  it('logs a warning for unknown commands and does not throw', async () => {
    const interaction = createFakeInteraction({ commandName: 'nonexistent' });
    const registry = new CommandRegistry();
    const deps = {
      client: {} as never,
      env,
      db: {} as never,
      registry,
      settingsService: {} as never,
      auditService: {} as never,
      cooldowns: new CooldownService(),
      logger: logger as never,
    };

    await handleChatInputCommand(interaction, deps);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('handles guard failures by replying with error message', async () => {
    const interaction = createFakeInteraction({ guildId: 'wrong-guild' });
    const registry = new CommandRegistry();
    registry.register(pingCommand);

    const deps = {
      client: {} as never,
      env,
      db: {} as never,
      registry,
      settingsService: {} as never,
      auditService: {} as never,
      cooldowns: new CooldownService(),
      logger: logger as never,
    };

    await handleChatInputCommand(interaction, deps);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.any(String),
      ephemeral: true,
    });
  });

  it('catches execution errors and invokes error boundary', async () => {
    const interaction = createFakeInteraction();
    const registry = new CommandRegistry();
    const failingCommand = {
      ...pingCommand,
      execute: vi.fn().mockRejectedValue(new Error('execution fail')),
    };
    registry.register(failingCommand);

    const mockSettingsService = {
      get: vi.fn().mockResolvedValue(makeSettings()),
    };

    const deps = {
      client: {} as never,
      env,
      db: {} as never,
      registry,
      settingsService: mockSettingsService as never,
      auditService: {} as never,
      cooldowns: new CooldownService(),
      logger: logger as never,
    };

    await handleChatInputCommand(interaction, deps);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('معرّف الخطأ'),
      ephemeral: true,
    });
  });
});
