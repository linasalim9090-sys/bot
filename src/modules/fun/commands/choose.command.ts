import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('choose')
      .addStringOption((opt) =>
        opt.setName('choices').setDescription('Comma-separated choices').setRequired(true),
      ),
    'commands.choose.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/choose [choices]',
  },
  execute: async (ctx) => {
    const raw = ctx.interaction.options.getString('choices', true);
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    const chosen = parts[Math.floor(Math.random() * parts.length)] ?? raw;

    await ctx.interaction.reply({
      content: ctx.t('commands.choose.result', { choice: chosen }),
    });
  },
});
