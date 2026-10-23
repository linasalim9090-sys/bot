import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('membercount'),
    'commands.membercount.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 3000,
    defer: false,
    usage: '/membercount',
  },
  execute: async (ctx) => {
    const guild = ctx.interaction.guild;
    const count = guild?.memberCount ?? 1;

    const embed = createEmbed({
      title: ctx.t('commands.membercount.title'),
      fields: [{ name: 'Total Members', value: String(count) }],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
