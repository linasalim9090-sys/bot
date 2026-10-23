import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('avatar')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(false),
      ),
    'commands.avatar.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: false,
    usage: '/avatar [user]',
  },
  execute: async (ctx) => {
    const user = ctx.interaction.options.getUser('user') ?? ctx.interaction.user;
    const avatarUrl = user.displayAvatarURL ? user.displayAvatarURL({ size: 1024 }) : 'https://discord.com';
    const embed = createEmbed({
      title: ctx.t('commands.avatar.title'),
      description: `[Avatar URL](${avatarUrl})`,
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
