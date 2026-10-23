import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('setup')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((sub) =>
        sub
          .setName('welcome')
          .setDescription('Setup welcome announcements channel')
          .setDescriptionLocalizations({ 'en-US': 'Setup welcome announcements channel' })
          .addChannelOption((opt) =>
            opt.setName('channel').setDescription('Welcome channel').setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('logs')
          .setDescription('Setup audit and moderation logs channel')
          .setDescriptionLocalizations({ 'en-US': 'Setup audit and moderation logs channel' })
          .addChannelOption((opt) =>
            opt.setName('channel').setDescription('Logs channel').setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('channels')
          .setDescription('Initialize basic server channels structure')
          .setDescriptionLocalizations({ 'en-US': 'Initialize basic server channels structure' }),
      )
      .addSubcommand((sub) =>
        sub
          .setName('security')
          .setDescription('Enable standard server security protection')
          .setDescriptionLocalizations({ 'en-US': 'Enable standard server security protection' }),
      ),
    'commands.setup.description',
  ),
  meta: {
    module: 'core',
    permissions: ['Administrator'],
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/setup [welcome|logs|channels|security]',
  },
  execute: async (ctx) => {
    const sub = ctx.interaction.options.getSubcommand();

    if (sub === 'welcome') {
      const channel = ctx.interaction.options.getChannel('channel', true);
      await ctx.settingsService.update(
        ctx.settings.guildId,
        { welcomeJson: { channelId: channel.id, enabled: true } },
        ctx.interaction.user.id,
        ctx.settings.version,
      );
      await ctx.interaction.editReply({ content: ctx.t('commands.setup.welcomeDone') });
      return;
    }

    if (sub === 'logs') {
      const channel = ctx.interaction.options.getChannel('channel', true);
      await ctx.settingsService.update(
        ctx.settings.guildId,
        { loggingJson: { channelId: channel.id, enabled: true } },
        ctx.interaction.user.id,
        ctx.settings.version,
      );
      await ctx.interaction.editReply({ content: ctx.t('commands.setup.logsDone') });
      return;
    }

    if (sub === 'channels') {
      const guild = ctx.interaction.guild;
      if (guild?.channels?.create) {
        try {
          await guild.channels.create({ name: 'chat-general', type: ChannelType.GuildText });
          await guild.channels.create({ name: 'audit-logs', type: ChannelType.GuildText });
        } catch {
          // ignore channel creation errors
        }
      }
      await ctx.interaction.editReply({ content: ctx.t('commands.setup.channelsDone') });
      return;
    }

    if (sub === 'security') {
      await ctx.settingsService.update(
        ctx.settings.guildId,
        {
          modulesJson: { ...ctx.settings.modulesJson, security: true, moderation: true },
        },
        ctx.interaction.user.id,
        ctx.settings.version,
      );
      await ctx.interaction.editReply({ content: ctx.t('commands.setup.securityDone') });
      return;
    }
  },
});
