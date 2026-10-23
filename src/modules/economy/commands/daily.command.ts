import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { EconomyService } from '../../../services/economy.service.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('daily'),
    'commands.daily.description',
  ),
  meta: {
    module: 'economy',
    cooldownMs: 5000,
    defer: false,
    usage: '/daily',
  },
  execute: async (ctx) => {
    const economyService = new EconomyService(ctx.db);
    const result = await economyService.claimDaily(ctx.settings.guildId, ctx.interaction.user.id);

    if (!result.ok) {
      await ctx.interaction.reply({
        content: ctx.t('commands.daily.cooldown', { hours: result.remainingHours ?? 1 }),
        ephemeral: true,
      });
      return;
    }

    await ctx.interaction.reply({
      content: ctx.t('commands.daily.success', { amount: result.amount }),
    });
  },
});
