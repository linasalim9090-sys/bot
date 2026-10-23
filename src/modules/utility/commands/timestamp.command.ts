import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('timestamp')
      .addIntegerOption((opt) =>
        opt.setName('seconds').setDescription('Seconds from now').setRequired(false),
      ),
    'commands.timestamp.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 2000,
    defer: false,
    usage: '/timestamp [seconds]',
  },
  execute: async (ctx) => {
    const addSecs = ctx.interaction.options.getInteger('seconds') ?? 0;
    const unix = Math.floor(Date.now() / 1000) + addSecs;

    const embed = createEmbed({
      title: ctx.t('commands.timestamp.title'),
      fields: [
        { name: 'Short Time', value: `<t:${unix}:t>`, inline: true },
        { name: 'Relative', value: `<t:${unix}:R>`, inline: true },
        { name: 'Raw Unix', value: String(unix), inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
