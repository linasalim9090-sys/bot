import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('color')
      .addStringOption((opt) =>
        opt.setName('hex').setDescription('HEX color code (e.g. 5865F2)').setRequired(true),
      ),
    'commands.color.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 2000,
    defer: false,
    usage: '/color [hex]',
  },
  execute: async (ctx) => {
    const rawHex = ctx.interaction.options.getString('hex', true).replace('#', '');
    const validHex = /^[0-9A-Fa-f]{6}$/.test(rawHex) ? rawHex : '5865F2';
    const num = parseInt(validHex, 16);

    const embed = createEmbed({
      title: ctx.t('commands.color.title'),
      description: `#${validHex.toUpperCase()}`,
      color: num,
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
