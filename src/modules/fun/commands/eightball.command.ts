import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('eightball')
      .addStringOption((opt) =>
        opt.setName('question').setDescription('Your question').setRequired(true),
      ),
    'commands.eightball.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/eightball [question]',
  },
  execute: async (ctx) => {
    const question = ctx.interaction.options.getString('question', true);
    const answers = [
      'It is certain.',
      'Without a doubt.',
      'You may rely on it.',
      'Ask again later.',
      'Better not tell you now.',
      'Don count on it.',
      'My sources say no.',
      'Outlook not so good.',
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)] ?? 'Yes';

    const embed = createEmbed({
      title: ctx.t('commands.eightball.title'),
      fields: [
        { name: 'Question', value: question },
        { name: 'Answer', value: answer },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
