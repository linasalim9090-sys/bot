import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('poll')
      .addStringOption((opt) =>
        opt.setName('question').setDescription('Poll question').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('options').setDescription('Comma-separated options').setRequired(true),
      ),
    'commands.poll.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 5000,
    defer: false,
    usage: '/poll [question] [options]',
  },
  execute: async (ctx) => {
    const question = ctx.interaction.options.getString('question', true);
    const rawOptions = ctx.interaction.options.getString('options', true);
    const choices = rawOptions.split(',').map((o) => o.trim()).filter(Boolean);

    const embed = createEmbed({
      title: ctx.t('commands.poll.title'),
      description: question,
      fields: choices.map((c, idx) => ({ name: `Option ${idx + 1}`, value: c })),
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
