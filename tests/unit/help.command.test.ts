import { describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../../src/core/context.js';
import { CommandRegistry } from '../../src/core/registry.js';
import { createTranslator } from '../../src/i18n/index.js';
import helpCommand from '../../src/modules/core/commands/help.command.js';
import pingCommand from '../../src/modules/core/commands/ping.command.js';
import { containsEmoji } from '../../src/ui/emoji.js';
import { createFakeInteraction } from '../fixtures/interaction.js';

describe('help command', () => {
  it('lists every registered command name and contains no emoji', async () => {
    const interaction = createFakeInteraction({ deferred: true });
    const registry = new CommandRegistry();
    registry.register(pingCommand);
    registry.register(helpCommand);

    const t = createTranslator('ar');
    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env: {} as never,
      db: {} as never,
      registry,
      settings: {} as never,
      settingsService: {} as never,
      auditService: {} as never,
      t,
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await helpCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const callArg = (interaction.editReply as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      embeds: Array<{ data: { title: string; fields: Array<{ name: string; value: string }> } }>;
    };
    expect(callArg.embeds).toBeDefined();
    const embed = callArg.embeds[0]!;
    expect(embed.data.title).toBe('دليل الأوامر');
    const coreField = embed.data.fields.find((f) => f.name === 'core');
    expect(coreField).toBeDefined();
    expect(coreField?.value).toContain('/ping');
    expect(coreField?.value).toContain('/help');
    expect(containsEmoji(coreField?.value ?? '')).toBe(false);
  });

  it('returns specific command usage when command option is passed', async () => {
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getString: vi.fn(() => 'ping'),
      },
    });
    const registry = new CommandRegistry();
    registry.register(pingCommand);

    const t = createTranslator('ar');
    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env: {} as never,
      db: {} as never,
      registry,
      settings: {} as never,
      settingsService: {} as never,
      auditService: {} as never,
      t,
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await helpCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const callArg = (interaction.editReply as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      embeds: Array<{ data: { fields: Array<{ name: string; value: string }> } }>;
    };
    expect(callArg.embeds[0]?.data.fields[0]?.value).toBe('/ping');
  });

  it('returns noCommands message when registry is empty', async () => {
    const interaction = createFakeInteraction({
      deferred: true,
      options: {
        getString: vi.fn(() => undefined),
      },
    });
    const registry = new CommandRegistry();
    const t = createTranslator('ar');
    const ctx: CommandContext = {
      interaction,
      client: {} as never,
      env: {} as never,
      db: {} as never,
      registry,
      settings: {} as never,
      settingsService: {} as never,
      auditService: {} as never,
      t,
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await helpCommand.execute(ctx);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: 'لا توجد أوامر مسجلة.',
    });
  });
});
