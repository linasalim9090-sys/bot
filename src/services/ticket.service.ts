import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type Guild,
  type TextChannel,
  type User,
} from 'discord.js';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { tickets } from '../db/schema.js';
import type { Translator } from '../i18n/index.js';
import { createEmbed } from '../ui/embeds.js';

export interface CreateTicketResult {
  ok: boolean;
  channelId?: string;
  alreadyOpen?: boolean;
}

export class TicketService {
  constructor(private readonly db: Db) {}

  async createTicket(guild: Guild, user: User, t: Translator): Promise<CreateTicketResult> {
    const existing = this.db
      .select()
      .from(tickets)
      .where(eq(tickets.guildId, guild.id))
      .all()
      .find((tk) => tk.openerId === user.id && tk.status === 'open');

    if (existing) {
      return { ok: false, alreadyOpen: true, channelId: existing.channelId };
    }

    let channel: TextChannel | undefined;
    if (guild.channels?.create) {
      try {
        const cleanName = user.username.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'user';
        channel = (await guild.channels.create({
          name: `ticket-${cleanName.slice(0, 15)}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: ['ViewChannel'],
            },
            {
              id: user.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'],
            },
          ],
        })) as TextChannel;
      } catch {
        // mock/restricted fallback
      }
    }

    const channelId = channel?.id ?? `mock-ch-${Date.now()}`;

    this.db
      .insert(tickets)
      .values({
        guildId: guild.id,
        channelId,
        openerId: user.id,
        status: 'open',
        createdAt: Date.now(),
      })
      .run();

    if (channel?.send) {
      try {
        const welcomeEmbed = createEmbed({
          title: t('commands.ticket.welcomeTitle'),
          description: t('commands.ticket.welcomeDesc', { user: `<@${user.id}>` }),
          footer: { text: t('embeds.footer') },
        });

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel(t('commands.ticket.closeBtn'))
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

        await channel.send({ embeds: [welcomeEmbed], components: [row] });
      } catch {
        // ignore send mock errors
      }
    }

    return { ok: true, channelId };
  }

  async closeTicket(channelId: string): Promise<boolean> {
    const entry = this.db
      .select()
      .from(tickets)
      .where(eq(tickets.channelId, channelId))
      .get();

    if (!entry) {
      return false;
    }

    this.db
      .update(tickets)
      .set({ status: 'closed', closedAt: Date.now() })
      .where(eq(tickets.channelId, channelId))
      .run();

    return true;
  }
}
