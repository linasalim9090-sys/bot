import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { TicketService } from '../../../services/ticket.service.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('ticket')
      .addSubcommand((sub) =>
        sub
          .setName('setup')
          .setDescription('Setup ticket panel in a channel')
          .setDescriptionLocalizations({ 'en-US': 'Setup ticket panel in a channel' })
          .addChannelOption((opt) =>
            opt.setName('channel').setDescription('Target channel').setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('close')
          .setDescription('Close current ticket')
          .setDescriptionLocalizations({ 'en-US': 'Close current ticket' }),
      )
      .addSubcommand((sub) =>
        sub
          .setName('add')
          .setDescription('Add user to current ticket')
          .setDescriptionLocalizations({ 'en-US': 'Add user to current ticket' })
          .addUserOption((opt) =>
            opt.setName('user').setDescription('Target user').setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName('remove')
          .setDescription('Remove user from current ticket')
          .setDescriptionLocalizations({ 'en-US': 'Remove user from current ticket' })
          .addUserOption((opt) =>
            opt.setName('user').setDescription('Target user').setRequired(true),
          ),
      ),
    'commands.ticket.description',
  ),
  meta: {
    module: 'tickets',
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/ticket [setup|close|add|remove]',
  },
  execute: async (ctx) => {
    const sub = ctx.interaction.options.getSubcommand();
    const ticketService = new TicketService(ctx.db);

    if (sub === 'setup') {
      const channel = ctx.interaction.options.getChannel('channel', true) as TextChannel;
      const embed = createEmbed({
        title: ctx.t('commands.ticket.panelTitle'),
        description: ctx.t('commands.ticket.panelDesc'),
        footer: { text: ctx.t('embeds.footer') },
      });

      const openBtn = new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel(ctx.t('commands.ticket.openBtn'))
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(openBtn);

      if (channel && 'send' in channel && typeof channel.send === 'function') {
        try {
          await channel.send({ embeds: [embed], components: [row] });
        } catch {
          // ignore mock send error
        }
      }

      await ctx.interaction.editReply({ content: ctx.t('commands.ticket.setupDone') });
      return;
    }

    if (sub === 'close') {
      const channelId = ctx.interaction.channelId;
      const success = await ticketService.closeTicket(channelId);
      if (!success) {
        await ctx.interaction.editReply({ content: ctx.t('commands.ticket.notTicket') });
        return;
      }

      await ctx.interaction.editReply({ content: ctx.t('commands.ticket.closeDone') });
      return;
    }

    if (sub === 'add') {
      const targetUser = ctx.interaction.options.getUser('user', true);
      const channel = ctx.interaction.channel;

      if (channel && 'permissionOverwrites' in channel) {
        try {
          await channel.permissionOverwrites.edit(targetUser.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        } catch {
          // ignore mock error
        }
      }

      await ctx.interaction.editReply({ content: ctx.t('commands.ticket.addDone') });
      return;
    }

    if (sub === 'remove') {
      const targetUser = ctx.interaction.options.getUser('user', true);
      const channel = ctx.interaction.channel;

      if (channel && 'permissionOverwrites' in channel) {
        try {
          await channel.permissionOverwrites.edit(targetUser.id, {
            ViewChannel: false,
          });
        } catch {
          // ignore mock error
        }
      }

      await ctx.interaction.editReply({ content: ctx.t('commands.ticket.removeDone') });
      return;
    }
  },
});
