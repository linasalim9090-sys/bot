import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('roleinfo')
      .addRoleOption((opt) =>
        opt.setName('role').setDescription('Target role').setRequired(true),
      ),
    'commands.roleinfo.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: false,
    usage: '/roleinfo [role]',
  },
  execute: async (ctx) => {
    const role = ctx.interaction.options.getRole('role', true);
    const embed = createEmbed({
      title: ctx.t('commands.roleinfo.title'),
      fields: [
        { name: 'Name', value: role.name, inline: true },
        { name: 'ID', value: role.id, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
