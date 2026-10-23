import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('serverinfo'),
    'commands.serverinfo.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: false,
    usage: '/serverinfo',
  },
  execute: async (ctx) => {
    const guild = ctx.interaction.guild;
    const memberCount = guild?.memberCount ?? 1;
    const embed = createEmbed({
      title: ctx.t('commands.serverinfo.title'),
      fields: [
        { name: 'Server Name', value: guild?.name ?? 'Server', inline: true },
        { name: 'Members', value: String(memberCount), inline: true },
        { name: 'ID', value: ctx.settings.guildId, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
