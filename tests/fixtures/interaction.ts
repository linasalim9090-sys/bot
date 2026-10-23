import type { ChatInputCommandInteraction } from 'discord.js';
import { vi } from 'vitest';

export function createFakeInteraction(
  overrides: Record<string, unknown> = {},
): ChatInputCommandInteraction {
  const replyFn = vi.fn().mockResolvedValue(undefined);
  const editReplyFn = vi.fn().mockResolvedValue(undefined);
  const followUpFn = vi.fn().mockResolvedValue(undefined);
  const deferReplyFn = vi.fn().mockImplementation(async () => {
    interaction.deferred = true;
  });

  const interaction = {
    commandName: 'ping',
    guildId: '123456789012345678',
    channelId: '223456789012345678',
    user: { id: '323456789012345678', tag: 'tester#0001' },
    memberPermissions: {
      has: vi.fn(() => true),
    },
    appPermissions: {
      has: vi.fn(() => true),
    },
    deferred: false,
    replied: false,
    isChatInputCommand: () => true,
    reply: replyFn,
    editReply: editReplyFn,
    followUp: followUpFn,
    deferReply: deferReplyFn,
    options: {
      getString: vi.fn(),
      getInteger: vi.fn(),
      getBoolean: vi.fn(),
      getUser: vi.fn(),
      getRole: vi.fn(),
      getSubcommand: vi.fn(),
    },
    ...overrides,
  };

  return interaction as unknown as ChatInputCommandInteraction;
}
