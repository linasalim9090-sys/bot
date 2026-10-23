import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { formatDuration } from '../../../core/format.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('botinfo'),
    'commands.botinfo.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: false,
    usage: '/botinfo',
  },
  execute: async (ctx) => {
    const uptime = ctx.client.uptime ?? 0;
    const embed = createEmbed({
      title: ctx.t('commands.botinfo.title'),
      fields: [
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'Uptime', value: formatDuration(uptime, ctx.t), inline: true },
        { name: 'Ping', value: `${ctx.client.ws.ping >= 0 ? ctx.client.ws.ping : 0}ms`, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
