import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { CommandError } from '../../../core/errors.js';
import { withDescriptions } from '../../../core/localize.js';
import { SettingsConflictError } from '../../../services/settings.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('settings')
      .addSubcommand((sub) =>
        sub
          .setName('view')
          .setDescription('View current server settings')
          .setDescriptionLocalizations({ 'en-US': 'View current server settings' }),
      )
      .addSubcommand((sub) =>
        sub
          .setName('locale')
          .setDescription('Change bot language')
          .setDescriptionLocalizations({ 'en-US': 'Change bot language' })
          .addStringOption((opt) =>
            opt
              .setName('value')
              .setDescription('Language')
              .setRequired(true)
              .addChoices(
                { name: 'Arabic', value: 'ar' },
                { name: 'English', value: 'en' },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('timezone')
          .setDescription('Change server timezone')
          .setDescriptionLocalizations({ 'en-US': 'Change server timezone' })
          .addStringOption((opt) =>
            opt
              .setName('value')
              .setDescription('Timezone (e.g. Asia/Riyadh)')
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('reset')
          .setDescription('Reset settings to defaults')
          .setDescriptionLocalizations({ 'en-US': 'Reset settings to defaults' }),
      ),
    'commands.settings.description',
  ),
  meta: {
    module: 'core',
    permissions: ['ManageGuild'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/settings',
  },
  execute: async (ctx) => {
    const sub = ctx.interaction.options.getSubcommand();

    try {
      if (sub === 'view') {
        const modulesList = Object.entries(ctx.settings.modulesJson)
          .map(
            ([name, enabled]) =>
              `${name}: ${enabled ? ctx.t('common.enabled') : ctx.t('common.disabled')}`,
          )
          .join('\n');

        const embed = createEmbed({
          title: ctx.t('commands.settings.title'),
          fields: [
            {
              name: ctx.t('commands.settings.locale'),
              value: ctx.settings.locale,
              inline: true,
            },
            {
              name: ctx.t('commands.settings.timezone'),
              value: ctx.settings.timezone,
              inline: true,
            },
            {
              name: ctx.t('commands.settings.version'),
              value: String(ctx.settings.version),
              inline: true,
            },
            {
              name: ctx.t('commands.settings.modules'),
              value: modulesList,
              inline: false,
            },
          ],
          footer: { text: ctx.t('embeds.footer') },
        });

        await ctx.interaction.editReply({ embeds: [embed] });
        return;
      }

      if (sub === 'locale') {
        const locale = (ctx.interaction.options.getString('value') ??
          ctx.interaction.options.getString('locale')) as 'ar' | 'en';

        await ctx.settingsService.update(
          ctx.settings.guildId,
          { locale },
          ctx.interaction.user.id,
          ctx.settings.version,
        );

        await ctx.interaction.editReply({
          content: ctx.t('commands.settings.updated'),
        });
        return;
      }

      if (sub === 'timezone') {
        const timezone =
          ctx.interaction.options.getString('value') ??
          ctx.interaction.options.getString('timezone') ??
          '';

        try {
          await ctx.settingsService.update(
            ctx.settings.guildId,
            { timezone },
            ctx.interaction.user.id,
            ctx.settings.version,
          );
        } catch (err) {
          if (err instanceof SettingsConflictError) {
            throw err;
          }
          throw new CommandError('errors.invalidTimezone', err);
        }

        await ctx.interaction.editReply({
          content: ctx.t('commands.settings.updated'),
        });
        return;
      }

      if (sub === 'reset') {
        if (ctx.interaction.user.id !== ctx.env.OWNER_ID) {
          throw new CommandError('errors.ownerOnly');
        }

        await ctx.settingsService.reset(ctx.settings.guildId, ctx.interaction.user.id);
        await ctx.interaction.editReply({
          content: ctx.t('commands.settings.resetDone'),
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
