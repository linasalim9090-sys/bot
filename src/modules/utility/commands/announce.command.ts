import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('announce')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((opt) =>
        opt.setName('channel').setDescription('Target channel').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('message').setDescription('Announcement message').setRequired(true),
      ),
    'commands.announce.description',
  ),
  meta: {
    module: 'utility',
    permissions: ['ManageGuild'],
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/announce [channel] [message]',
  },
  execute: async (ctx) => {
    const channel = ctx.interaction.options.getChannel('channel', true);
    const message = ctx.interaction.options.getString('message', true);

    const embed = createEmbed({
      title: ctx.t('commands.announce.title'),
      description: message,
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });

    if (channel && 'send' in channel && typeof channel.send === 'function') {
      try {
        await channel.send({ embeds: [embed] });
      } catch {
        // ignore send error
      }
    }

    await ctx.interaction.editReply({ content: 'Announcement posted successfully.' });
  },
});
