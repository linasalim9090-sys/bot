import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('raidmode')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addBooleanOption((opt) =>
        opt.setName('enabled').setDescription('Enable or disable raidmode').setRequired(true),
      ),
    'commands.raidmode.description',
  ),
  meta: {
    module: 'security',
    permissions: ['Administrator'],
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/raidmode [enabled]',
  },
  execute: async (ctx) => {
    const enabled = ctx.interaction.options.getBoolean('enabled', true);

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'raidmode',
      metadataJson: { enabled },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.raidmode.success'),
    });
  },
});
