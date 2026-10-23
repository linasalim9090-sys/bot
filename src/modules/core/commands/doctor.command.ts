import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { runDoctor } from '../../../services/doctor.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('doctor'),
    'commands.doctor.description',
  ),
  meta: {
    module: 'core',
    permissions: ['ManageGuild'],
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/doctor',
  },
  execute: async (ctx) => {
    const report = await runDoctor({
      env: ctx.env,
      db: ctx.db,
      client: ctx.client as never,
      registry: ctx.registry,
      t: ctx.t,
    });

    const fields = report.checks.map((check) => ({
      name: ctx.t(`commands.doctor.checks.${check.name}`),
      value: check.detail,
      inline: true,
    }));

    const embed = createEmbed({
      title: ctx.t('commands.doctor.title'),
      description: report.ok
        ? ctx.t('commands.doctor.ok')
        : ctx.t('commands.doctor.failed'),
      color: report.ok ? 0x57f287 : 0xed4245,
      fields,
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });

    await ctx.interaction.editReply({ embeds: [embed] });
  },
});
