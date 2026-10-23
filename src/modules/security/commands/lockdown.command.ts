import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('lockdown')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    'commands.lockdown.description',
  ),
  meta: {
    module: 'security',
    permissions: ['Administrator'],
    botPermissions: ['ManageChannels'],
    cooldownMs: 10000,
    defer: 'ephemeral',
    usage: '/lockdown',
  },
  execute: async (ctx) => {
    const guild = ctx.interaction.guild;
    if (guild?.channels?.cache) {
      try {
        for (const [, channel] of guild.channels.cache) {
          if ('permissionOverwrites' in channel && typeof channel.permissionOverwrites.edit === 'function') {
            await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
          }
        }
      } catch {
        // ignore lockdown errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.lockdown.success'),
    });
  },
});
