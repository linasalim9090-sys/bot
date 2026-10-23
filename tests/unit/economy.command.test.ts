import { describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../../src/core/context.js';
import { createDb } from '../../src/db/client.js';
import { createTranslator } from '../../src/i18n/index.js';
import dailyCommand from '../../src/modules/economy/commands/daily.command.js';
import payCommand from '../../src/modules/economy/commands/pay.command.js';

describe('economy commands edge cases', () => {
  it('exercises daily on cooldown and pay with insufficient funds', async () => {
    const { db } = createDb(':memory:');
    const t = createTranslator('ar');

    // 1. Daily first claim
    const replyDaily = vi.fn().mockResolvedValue(undefined);
    const ctxDaily: CommandContext = {
      interaction: {
        user: { id: 'u1' },
        reply: replyDaily,
      } as never,
      client: {} as never,
      env: {} as never,
      db,
      registry: {} as never,
      settings: { guildId: 'g1' } as never,
      settingsService: {} as never,
      auditService: {} as never,
      t,
      logger: { info: vi.fn() } as never,
    };
    await dailyCommand.execute(ctxDaily);
    expect(replyDaily).toHaveBeenCalledOnce();

    // 2. Daily second claim (cooldown branch)
    const replyDaily2 = vi.fn().mockResolvedValue(undefined);
    ctxDaily.interaction.reply = replyDaily2;
    await dailyCommand.execute(ctxDaily);
    expect(replyDaily2).toHaveBeenCalledOnce();

    // 3. Pay insufficient balance
    const replyPay = vi.fn().mockResolvedValue(undefined);
    const ctxPay: CommandContext = {
      interaction: {
        user: { id: 'u1' },
        options: {
          getUser: vi.fn(() => ({ id: 'u2', tag: 'user2#0001' })),
          getInteger: vi.fn(() => 99999), // more than wallet balance
        },
        reply: replyPay,
      } as never,
      client: {} as never,
      env: {} as never,
      db,
      registry: {} as never,
      settings: { guildId: 'g1' } as never,
      settingsService: {} as never,
      auditService: {} as never,
      t,
      logger: { info: vi.fn() } as never,
    };
    await payCommand.execute(ctxPay);
    expect(replyPay).toHaveBeenCalledOnce();
  });
});
