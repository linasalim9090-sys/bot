import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { EconomyService } from '../../../services/economy.service.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('pay')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Recipient user').setRequired(true),
      )
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('Amount to transfer').setMinValue(1).setRequired(true),
      ),
    'commands.pay.description',
  ),
  meta: {
    module: 'economy',
    cooldownMs: 3000,
    defer: false,
    usage: '/pay [user] [amount]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const amount = ctx.interaction.options.getInteger('amount', true);

    const economyService = new EconomyService(ctx.db);
    const result = await economyService.transfer(
      ctx.settings.guildId,
      ctx.interaction.user.id,
      targetUser.id,
      amount,
    );

    if (!result.ok) {
      if (result.reason === 'insufficient') {
        await ctx.interaction.reply({
          content: ctx.t('commands.pay.insufficient'),
          ephemeral: true,
        });
        return;
      }
      await ctx.interaction.reply({
        content: ctx.t('commands.pay.invalidAmount'),
        ephemeral: true,
      });
      return;
    }

    await ctx.interaction.reply({
      content: ctx.t('commands.pay.success', {
        amount,
        user: targetUser.tag ?? targetUser.id,
      }),
    });
  },
});
