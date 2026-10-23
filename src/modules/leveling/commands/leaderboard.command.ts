import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { LevelService } from '../../../services/level.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('leaderboard'),
    'commands.leaderboard.description',
  ),
  meta: {
    module: 'leveling',
    cooldownMs: 5000,
    defer: false,
    usage: '/leaderboard',
  },
  execute: async (ctx) => {
    const levelService = new LevelService(ctx.db);
    const leaders = await levelService.getLeaderboard(ctx.settings.guildId, 10);

    const description =
      leaders.length > 0
        ? leaders
            .map((u, i) => `#${i + 1} <@${u.userId}> - Level ${u.level} (${u.xp} XP)`)
            .join('\n')
        : 'No activity recorded yet.';

    const embed = createEmbed({
      title: ctx.t('commands.leaderboard.title'),
      description,
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });

    await ctx.interaction.reply({ embeds: [embed] });
  },
});
