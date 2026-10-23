import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('help')
      .addStringOption((opt) =>
        opt
          .setName('command')
          .setDescription('Command name to view details')
          .setRequired(false),
      ),
    'commands.help.description',
  ),
  meta: {
    module: 'core',
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/help [command]',
  },
  execute: async (ctx) => {
    const commandName = ctx.interaction.options.getString('command')?.toLowerCase();
    const allCommands = ctx.registry.all();

    if (commandName) {
      const command = ctx.registry.get(commandName);
      if (!command) {
        await ctx.interaction.editReply({
          content: ctx.t('commands.help.noCommands'),
        });
        return;
      }

      const usage = command.meta.usage ?? `/${command.data.name}`;
      const embed = createEmbed({
        title: `/${command.data.name}`,
        description: command.data.description,
        fields: [
          {
            name: ctx.t('commands.help.usage'),
            value: usage,
          },
        ],
        footer: { text: ctx.t('embeds.footer') },
      });

      await ctx.interaction.editReply({ embeds: [embed] });
      return;
    }

    if (allCommands.length === 0) {
      await ctx.interaction.editReply({
        content: ctx.t('commands.help.noCommands'),
      });
      return;
    }

    // Group commands by module
    const grouped = new Map<string, string[]>();
    for (const cmd of allCommands) {
      const mod = cmd.meta.module;
      const list = grouped.get(mod) ?? [];
      list.push(`/${cmd.data.name} - ${cmd.data.description}`);
      grouped.set(mod, list);
    }

    const fields = Array.from(grouped.entries())
      .slice(0, 25)
      .map(([modName, lines]) => ({
        name: modName,
        value: lines.join('\n'),
      }));

    const embed = createEmbed({
      title: ctx.t('commands.help.title'),
      fields,
      footer: { text: ctx.t('embeds.footer') },
    });

    await ctx.interaction.editReply({ embeds: [embed] });
  },
});
