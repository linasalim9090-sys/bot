import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('rules'),
    'commands.rules.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 3000,
    defer: false,
    usage: '/rules',
  },
  execute: async (ctx) => {
    const embed = createEmbed({
      title: ctx.t('commands.rules.title'),
      fields: [
        { name: '1. Respect', value: 'Be respectful to everyone.' },
        { name: '2. No Spam', value: 'Do not flood channels.' },
        { name: '3. Follow Discord ToS', value: 'Adhere to official Discord guidelines.' },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
