import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('snowflake')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('Discord Snowflake ID').setRequired(true),
      ),
    'commands.snowflake.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 2000,
    defer: false,
    usage: '/snowflake [id]',
  },
  execute: async (ctx) => {
    const id = ctx.interaction.options.getString('id', true);
    let createdDate = 'Invalid Snowflake';

    try {
      const ms = Number(BigInt(id) >> 22n) + 1420070400000;
      createdDate = new Date(ms).toISOString();
    } catch {
      // invalid bigint
    }

    const embed = createEmbed({
      title: ctx.t('commands.snowflake.title'),
      fields: [
        { name: 'Snowflake', value: id, inline: true },
        { name: 'Created At', value: createdDate, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
