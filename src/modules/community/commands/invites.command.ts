import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('invites')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(false),
      ),
    'commands.invites.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 3000,
    defer: false,
    usage: '/invites [user]',
  },
  execute: async (ctx) => {
    const user = ctx.interaction.options.getUser('user') ?? ctx.interaction.user;

    const embed = createEmbed({
      title: ctx.t('commands.invites.title'),
      fields: [
        { name: 'User', value: user.tag ?? user.id, inline: true },
        { name: 'Invites', value: '0', inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
