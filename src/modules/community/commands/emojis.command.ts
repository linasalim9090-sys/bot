import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('emojis'),
    'commands.emojis.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 3000,
    defer: false,
    usage: '/emojis',
  },
  execute: async (ctx) => {
    const guild = ctx.interaction.guild;
    const count = guild?.emojis?.cache?.size ?? 0;

    const embed = createEmbed({
      title: ctx.t('commands.emojis.title'),
      fields: [{ name: 'Total Emojis', value: String(count) }],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
