import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { EconomyService } from '../../../services/economy.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('balance')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(false),
      ),
    'commands.balance.description',
  ),
  meta: {
    module: 'economy',
    cooldownMs: 3000,
    defer: false,
    usage: '/balance [user]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user') ?? ctx.interaction.user;
    const economyService = new EconomyService(ctx.db);
    const bal = await economyService.getBalance(ctx.settings.guildId, targetUser.id);

    const embed = createEmbed({
      title: `${ctx.t('commands.balance.title')} - ${targetUser.tag ?? targetUser.id}`,
      fields: [
        { name: ctx.t('commands.balance.wallet'), value: `${bal.wallet} coins`, inline: true },
        { name: ctx.t('commands.balance.bank'), value: `${bal.bank} coins`, inline: true },
        { name: ctx.t('commands.balance.net'), value: `${bal.netWorth} coins`, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });

    await ctx.interaction.reply({ embeds: [embed] });
  },
});
