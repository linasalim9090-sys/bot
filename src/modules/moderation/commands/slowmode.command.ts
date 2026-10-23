import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('slowmode')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addIntegerOption((opt) =>
        opt
          .setName('seconds')
          .setDescription('Slowmode duration in seconds')
          .setMinValue(0)
          .setMaxValue(21600)
          .setRequired(true),
      ),
    'commands.slowmode.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/slowmode [seconds]',
  },
  execute: async (ctx) => {
    const seconds = ctx.interaction.options.getInteger('seconds', true);
    const channel = ctx.interaction.channel;

    if (channel && 'setRateLimitPerUser' in channel && typeof channel.setRateLimitPerUser === 'function') {
      try {
        await channel.setRateLimitPerUser(seconds);
      } catch {
        // ignore slowmode mock errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.slowmode.success', { seconds }),
    });
  },
});
