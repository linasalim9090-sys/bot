import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('mathquiz'),
    'commands.mathquiz.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 3000,
    defer: false,
    usage: '/mathquiz',
  },
  execute: async (ctx) => {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;

    const embed = createEmbed({
      title: ctx.t('commands.mathquiz.title'),
      fields: [
        { name: 'Problem', value: `${a} + ${b} = ?` },
        { name: 'Answer', value: String(a + b) },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
