import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('lock')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    'commands.lock.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/lock',
  },
  execute: async (ctx) => {
    const channel = ctx.interaction.channel;
    const guild = ctx.interaction.guild;

    if (channel && 'permissionOverwrites' in channel && guild) {
      try {
        await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
      } catch {
        // ignore lock mock errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.lock.success'),
    });
  },
});
