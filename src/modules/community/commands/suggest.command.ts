import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('suggest')
      .addStringOption((opt) =>
        opt.setName('suggestion').setDescription('Your suggestion').setRequired(true),
      ),
    'commands.suggest.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/suggest [suggestion]',
  },
  execute: async (ctx) => {
    const suggestion = ctx.interaction.options.getString('suggestion', true);

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'suggest',
      metadataJson: { suggestion },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.suggest.success'),
    });
  },
});
