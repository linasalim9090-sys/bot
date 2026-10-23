import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('quote'),
    'commands.quote.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 3000,
    defer: false,
    usage: '/quote',
  },
  execute: async (ctx) => {
    const quotes = [
      'The journey of a thousand miles begins with a single step.',
      'Knowledge is power.',
      'Simplicity is the soul of efficiency.',
      'Patience is bitter, but its fruit is sweet.',
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)] ?? quotes[0];

    const embed = createEmbed({
      title: ctx.t('commands.quote.title'),
      description: quote,
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
