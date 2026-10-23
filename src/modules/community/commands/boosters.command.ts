import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('boosters'),
    'commands.boosters.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 3000,
    defer: false,
    usage: '/boosters',
  },
  execute: async (ctx) => {
    const guild = ctx.interaction.guild;
    const boostCount = guild?.premiumSubscriptionCount ?? 0;
    const tier = guild?.premiumTier ?? 0;

    const embed = createEmbed({
      title: ctx.t('commands.boosters.title'),
      fields: [
        { name: 'Boost Level', value: `Tier ${tier}`, inline: true },
        { name: 'Boost Count', value: String(boostCount), inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
