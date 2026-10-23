import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('trivia'),
    'commands.trivia.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 3000,
    defer: false,
    usage: '/trivia',
  },
  execute: async (ctx) => {
    const questions = [
      { q: 'What is the largest planet in our solar system?', a: 'Jupiter' },
      { q: 'How many days are in a leap year?', a: '366' },
    ];
    const fallback = { q: 'What is the largest planet in our solar system?', a: 'Jupiter' };
    const item = questions[Math.floor(Math.random() * questions.length)] ?? fallback;

    const embed = createEmbed({
      title: ctx.t('commands.trivia.title'),
      fields: [
        { name: 'Question', value: item.q },
        { name: 'Answer', value: item.a },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
