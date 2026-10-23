import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('channelinfo')
      .addChannelOption((opt) =>
        opt.setName('channel').setDescription('Target channel').setRequired(false),
      ),
    'commands.channelinfo.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: false,
    usage: '/channelinfo [channel]',
  },
  execute: async (ctx) => {
    const channel = ctx.interaction.options.getChannel('channel') ?? ctx.interaction.channel;
    const name = channel && 'name' in channel ? String(channel.name) : 'current';
    const id = channel?.id ?? 'unknown';

    const embed = createEmbed({
      title: ctx.t('commands.channelinfo.title'),
      fields: [
        { name: 'Name', value: name, inline: true },
        { name: 'ID', value: id, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
