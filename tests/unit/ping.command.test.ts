import { describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../../src/core/context.js';
import { createTranslator } from '../../src/i18n/index.js';
import pingCommand from '../../src/modules/core/commands/ping.command.js';
import { createFakeInteraction } from '../fixtures/interaction.js';

describe('ping command', () => {
  it('replies with an embed whose title is حالة البوت and has two fields', async () => {
    const interaction = createFakeInteraction();
    const t = createTranslator('ar');
    const ctx: CommandContext = {
      interaction,
      client: {
        ws: { ping: 42 },
        uptime: 120_000,
      } as never,
      env: {} as never,
      db: {} as never,
      registry: {} as never,
      settings: {} as never,
      settingsService: {} as never,
      auditService: {} as never,
      t,
      logger: { info: vi.fn(), error: vi.fn() } as never,
    };

    await pingCommand.execute(ctx);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const callArg = (interaction.reply as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      embeds: Array<{ data: { title: string; fields: Array<{ name: string; value: string }> } }>;
    };
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0]?.data.title).toBe('حالة البوت');
    expect(callArg.embeds[0]?.data.fields).toHaveLength(2);
  });
});
