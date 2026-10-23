import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('rps')
      .addStringOption((opt) =>
        opt
          .setName('choice')
          .setDescription('rock, paper, or scissors')
          .setRequired(true)
          .addChoices(
            { name: 'rock', value: 'rock' },
            { name: 'paper', value: 'paper' },
            { name: 'scissors', value: 'scissors' },
          ),
      ),
    'commands.rps.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/rps [rock|paper|scissors]',
  },
  execute: async (ctx) => {
    const userChoice = ctx.interaction.options.getString('choice', true);
    const options = ['rock', 'paper', 'scissors'];
    const botChoice = options[Math.floor(Math.random() * options.length)] ?? 'rock';

    let result: string;
    if (userChoice === botChoice) {
      result = 'Draw';
    } else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'You Win';
    } else {
      result = 'You Lose';
    }

    const embed = createEmbed({
      title: ctx.t('commands.rps.title'),
      fields: [
        { name: 'Your Choice', value: userChoice, inline: true },
        { name: 'Bot Choice', value: botChoice, inline: true },
        { name: 'Result', value: result, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
