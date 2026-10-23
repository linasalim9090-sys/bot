import 'dotenv/config';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ActivityType, type GuildMember, type Interaction, type Message } from 'discord.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { createClient, registerEvents, shutdown } from './core/client.js';
import { CooldownService } from './core/cooldowns.js';
import { defineEvent } from './core/event.js';
import { handleChatInputCommand } from './core/handler.js';
import { CommandRegistry } from './core/registry.js';
import { createDb } from './db/client.js';
import { migrateDb } from './db/migrate.js';
import { createTranslator } from './i18n/index.js';
import { AuditService } from './services/audit.service.js';
import { LevelService } from './services/level.service.js';
import { SettingsService } from './services/settings.service.js';
import { TicketService } from './services/ticket.service.js';
import { createEmbed } from './ui/embeds.js';

export function getCommandsDirectory(): string {
  try {
    const urlDir = fileURLToPath(new URL('./modules', import.meta.url));
    if (existsSync(urlDir)) {
      return urlDir;
    }
  } catch {
    // URL resolution fallback
  }
  const distDir = path.join(process.cwd(), 'dist', 'modules');
  if (existsSync(distDir)) {
    return distDir;
  }
  return path.join(process.cwd(), 'src', 'modules');
}

export async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);

  logger.info({ nodeEnv: env.NODE_ENV, logLevel: env.LOG_LEVEL }, 'Starting Nizam Bot...');

  // Database and migrations
  const { db, sqlite } = createDb(env.DATABASE_PATH);
  migrateDb(db);
  logger.info('Database initialized and migrations applied.');

  // Services
  const auditService = new AuditService(db);
  const settingsService = new SettingsService(db, auditService);
  const cooldowns = new CooldownService();

  // Command Registry
  const registry = new CommandRegistry();
  const commandsDir = getCommandsDirectory();
  await registry.loadFromDirectory(commandsDir);
  logger.info({ count: registry.all().length }, 'Loaded application commands.');

  // Client
  const client = createClient();

  const clientReadyEvent = defineEvent({
    name: 'clientReady',
    once: true,
    execute: async (readyClient) => {
      const t = createTranslator(env.DEFAULT_LOCALE);
      const activityName = t('presence.watching');

      readyClient.user.setPresence({
        activities: [{ name: activityName, type: ActivityType.Watching }],
        status: 'online',
      });

      logger.info(
        {
          tag: readyClient.user.tag,
          guildCount: readyClient.guilds.cache.size,
          commandsCount: registry.all().length,
        },
        'Bot is ready and listening for interactions.',
      );
    },
  });

  const interactionCreateEvent = defineEvent({
    name: 'interactionCreate',
    execute: async (interaction: Interaction) => {
      if (interaction.isChatInputCommand()) {
        await handleChatInputCommand(interaction, {
          client,
          env,
          db,
          registry,
          settingsService,
          auditService,
          cooldowns,
          logger,
        });
        return;
      }

      if (interaction.isButton()) {
        const t = createTranslator(env.DEFAULT_LOCALE);
        try {
          const ticketService = new TicketService(db);

          if (interaction.customId === 'ticket_open') {
            if (!interaction.guild) return;
            await interaction.deferReply({ ephemeral: true });
            const res = await ticketService.createTicket(interaction.guild, interaction.user, t);
            if (res.alreadyOpen) {
              await interaction.editReply({
                content: t('commands.ticket.alreadyOpen', { channel: `<#${res.channelId}>` }),
              });
              return;
            }
            await interaction.editReply({
              content: t('commands.ticket.created', { channel: `<#${res.channelId}>` }),
            });
            return;
          }

          if (interaction.customId === 'ticket_close') {
            await interaction.deferReply({ ephemeral: true });
            const closed = await ticketService.closeTicket(interaction.channelId);
            if (!closed) {
              await interaction.editReply({ content: t('commands.ticket.notTicket') });
              return;
            }
            await interaction.editReply({ content: t('commands.ticket.closeDone') });
            return;
          }
        } catch (buttonErr) {
          logger.error({ err: buttonErr }, 'Error handling button interaction');
          const msg = t('errors.unexpected');
          if (interaction.isRepliable()) {
            if (interaction.deferred || interaction.replied) {
              await interaction.editReply({ content: msg }).catch(() => {});
            } else {
              await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
            }
          }
        }
      }
    },
  });

  const levelService = new LevelService(db);
  const messageCreateEvent = defineEvent({
    name: 'messageCreate',
    execute: async (message: Message) => {
      if (!message.guild || message.author.bot) return;
      try {
        await levelService.addXp(message.guild.id, message.author.id, 20);
      } catch (err) {
        logger.error({ err }, 'Error in messageCreate event');
      }
    },
  });

  const guildMemberAddEvent = defineEvent({
    name: 'guildMemberAdd',
    execute: async (member: GuildMember) => {
      try {
        const settings = await settingsService.get(member.guild.id);
        const welcome = settings.welcomeJson as { enabled?: boolean; channelId?: string };
        if (welcome?.enabled && welcome?.channelId) {
          const ch = member.guild.channels.cache.get(welcome.channelId);
          if (ch && 'send' in ch && typeof ch.send === 'function') {
            const t = createTranslator(settings.locale);
            const embed = createEmbed({
              title: 'Welcome',
              description: `Welcome to the server, <@${member.id}>!`,
              fields: [{ name: 'Member Count', value: String(member.guild.memberCount) }],
              footer: { text: t('embeds.footer') },
              timestamp: true,
            });
            await ch.send({ embeds: [embed] });
          }
        }
      } catch (err) {
        logger.error({ err }, 'Error in guildMemberAdd event');
      }
    },
  });

  registerEvents(
    client,
    [clientReadyEvent, interactionCreateEvent, messageCreateEvent, guildMemberAddEvent],
    logger,
  );

  // Start health server for cloud platforms (Render, Koyeb, etc.)
  const port = Number(process.env.PORT || 3000);
  const healthServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      }),
    );
  });
  healthServer.listen(port, () => {
    logger.info({ port }, 'Health-check HTTP server listening.');
  });

  // Process signals
  const handleExitSignal = async (signal: string) => {
    logger.info({ signal }, 'Received exit signal');
    healthServer.close();
    await shutdown(client, sqlite, logger);
    process.exit(0);
  };

  process.on('SIGINT', () => void handleExitSignal('SIGINT'));
  process.on('SIGTERM', () => void handleExitSignal('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled rejection detected');
  });

  process.on('uncaughtException', async (error) => {
    logger.fatal({ err: error }, 'Uncaught exception detected, terminating');
    await shutdown(client, sqlite, logger);
    process.exit(1);
  });

  // Login
  if (!env.DRY_RUN) {
    try {
      await client.login(env.DISCORD_TOKEN);
    } catch (loginErr: unknown) {
      const errMessage = loginErr instanceof Error ? loginErr.message : String(loginErr);
      const isDisallowed =
        errMessage.toLowerCase().includes('disallowed') ||
        (typeof loginErr === 'object' &&
          loginErr !== null &&
          'code' in loginErr &&
          (loginErr as { code?: string }).code === 'DisallowedIntents');

      if (isDisallowed) {
        logger.fatal(
          'DISALLOWED INTENTS: Discord bot requires privileged Gateway Intents (GuildMembers and/or MessageContent). ' +
            'Please enable them in the Discord Developer Portal: Applications -> Bot -> Privileged Gateway Intents.',
        );
      } else {
        logger.fatal({ err: loginErr }, 'Failed to login to Discord');
      }
      throw loginErr;
    }
  } else {
    logger.info('DRY_RUN is enabled. Skipping Discord gateway login.');
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}
