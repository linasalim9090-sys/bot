import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { formatDuration } from '../../../core/format.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('ping'),
    'commands.ping.description',
  ),
  meta: {
    module: 'core',
    cooldownMs: 3000,
    defer: false,
    usage: '/ping',
  },
  execute: async (ctx) => {
    const wsPing = ctx.client.ws.ping;
    const uptime = ctx.client.uptime ?? 0;

    const embed = createEmbed({
      title: ctx.t('commands.ping.title'),
      fields: [
        {
          name: ctx.t('commands.ping.latency'),
          value: `${wsPing >= 0 ? wsPing : 0}ms`,
          inline: true,
        },
        {
          name: ctx.t('commands.ping.uptime'),
          value: formatDuration(uptime, ctx.t),
          inline: true,
        },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });

    await ctx.interaction.reply({ embeds: [embed] });
  },
});
