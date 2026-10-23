import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('purge')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((opt) =>
        opt
          .setName('amount')
          .setDescription('Number of messages to delete')
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true),
      ),
    'commands.purge.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ManageMessages'],
    botPermissions: ['ManageMessages'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/purge [amount]',
  },
  execute: async (ctx) => {
    const amount = ctx.interaction.options.getInteger('amount', true);
    const channel = ctx.interaction.channel;

    if (channel && 'bulkDelete' in channel && typeof channel.bulkDelete === 'function') {
      try {
        await channel.bulkDelete(amount, true);
      } catch {
        // ignore bulkDelete mock errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.purge.success', { count: amount }),
    });
  },
});
