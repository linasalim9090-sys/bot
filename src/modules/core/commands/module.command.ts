import { SlashCommandBuilder } from 'discord.js';
import { MODULE_NAMES, type ModuleName } from '../../../config/constants.js';
import { defineCommand } from '../../../core/command.js';
import { CommandError } from '../../../core/errors.js';
import { withDescriptions } from '../../../core/localize.js';
import { SettingsConflictError } from '../../../services/settings.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('module')
      .addSubcommand((sub) =>
        sub
          .setName('list')
          .setDescription('List all modules and their status')
          .setDescriptionLocalizations({ 'en-US': 'List all modules and their status' }),
      )
      .addSubcommand((sub) =>
        sub
          .setName('enable')
          .setDescription('Enable a specific module')
          .setDescriptionLocalizations({ 'en-US': 'Enable a specific module' })
          .addStringOption((opt) =>
            opt
              .setName('name')
              .setDescription('Module name')
              .setRequired(true)
              .addChoices(
                ...MODULE_NAMES.map((name) => ({ name, value: name })),
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('disable')
          .setDescription('Disable a specific module')
          .setDescriptionLocalizations({ 'en-US': 'Disable a specific module' })
          .addStringOption((opt) =>
            opt
              .setName('name')
              .setDescription('Module name')
              .setRequired(true)
              .addChoices(
                ...MODULE_NAMES.map((name) => ({ name, value: name })),
              ),
          ),
      ),
    'commands.module.description',
  ),
  meta: {
    module: 'core',
    permissions: ['ManageGuild'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/module',
  },
  execute: async (ctx) => {
    const sub = ctx.interaction.options.getSubcommand();

    try {
      if (sub === 'list') {
        const lines = MODULE_NAMES.map((name) => {
          const isEnabled = ctx.settings.modulesJson[name] !== false;
          return `${name}: ${isEnabled ? ctx.t('common.enabled') : ctx.t('common.disabled')}`;
        });

        const embed = createEmbed({
          title: ctx.t('commands.module.title'),
          description: lines.join('\n'),
          footer: { text: ctx.t('embeds.footer') },
        });

        await ctx.interaction.editReply({ embeds: [embed] });
        return;
      }

      if (sub === 'enable' || sub === 'disable') {
        const moduleName = (ctx.interaction.options.getString('name') ??
          ctx.interaction.options.getString('module')) as ModuleName;

        if (sub === 'disable' && moduleName === 'core') {
          throw new CommandError('commands.module.coreLocked');
        }

        const isEnable = sub === 'enable';
        const updatedModules = {
          ...ctx.settings.modulesJson,
          [moduleName]: isEnable,
        };

        await ctx.settingsService.update(
          ctx.settings.guildId,
          { modulesJson: updatedModules },
          ctx.interaction.user.id,
          ctx.settings.version,
        );

        await ctx.interaction.editReply({
          content: ctx.t('commands.module.updated'),
        });
        return;
      }
    } catch (err) {
      if (err instanceof SettingsConflictError) {
        throw new CommandError('commands.settings.conflict');
      }
      throw err;
    }
  },
});
