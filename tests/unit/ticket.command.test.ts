import { describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../../src/core/context.js';
import { createDb } from '../../src/db/client.js';
import { createTranslator } from '../../src/i18n/index.js';
import ticketCommand from '../../src/modules/tickets/commands/ticket.command.js';

describe('ticket command subcommands', () => {
  it('handles close, add, and remove subcommands', async () => {
    const { db } = createDb(':memory:');
    const t = createTranslator('ar');

    for (const sub of ['close', 'add', 'remove'] as const) {
      const editReplyFn = vi.fn().mockResolvedValue(undefined);
      const fakeInteraction = {
        options: {
          getSubcommand: vi.fn(() => sub),
          getChannel: vi.fn(() => ({ id: 'ch-1' })),
          getUser: vi.fn(() => ({ id: 'user-2' })),
        },
        channelId: 'ch-1',
        channel: {
          permissionOverwrites: {
            edit: vi.fn().mockResolvedValue(undefined),
          },
        },
        editReply: editReplyFn,
      };

      const ctx: CommandContext = {
        interaction: fakeInteraction as never,
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

      await ticketCommand.execute(ctx);
      expect(editReplyFn).toHaveBeenCalled();
    }
  });
});
