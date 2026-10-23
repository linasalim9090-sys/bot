import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { LevelService } from '../../../services/level.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('rank')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(false),
      ),
    'commands.rank.description',
  ),
  meta: {
    module: 'leveling',
    cooldownMs: 3000,
    defer: false,
    usage: '/rank [user]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user') ?? ctx.interaction.user;
    const levelService = new LevelService(ctx.db);
    const { xp, level, neededXp } = await levelService.getRank(ctx.settings.guildId, targetUser.id);

    const embed = createEmbed({
      title: `${ctx.t('commands.rank.title')} - ${targetUser.tag ?? targetUser.id}`,
      fields: [
        { name: ctx.t('commands.rank.level'), value: String(level), inline: true },
        { name: ctx.t('commands.rank.xp'), value: `${xp} / ${neededXp}`, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });

    await ctx.interaction.reply({ embeds: [embed] });
  },
});
