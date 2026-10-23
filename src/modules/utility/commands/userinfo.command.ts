import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('userinfo')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(false),
      ),
    'commands.userinfo.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: false,
    usage: '/userinfo [user]',
  },
  execute: async (ctx) => {
    const user = ctx.interaction.options.getUser('user') ?? ctx.interaction.user;
    const embed = createEmbed({
      title: ctx.t('commands.userinfo.title'),
      fields: [
        { name: 'Tag', value: user.tag ?? user.id, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
