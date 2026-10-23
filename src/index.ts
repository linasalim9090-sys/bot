import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ActivityType, type Interaction } from 'discord.js';
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
import { SettingsService } from './services/settings.service.js';

export function getCommandsDirectory(): string {
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
      }
    },
  });

  registerEvents(client, [clientReadyEvent, interactionCreateEvent], logger);

  // Process signals
  const handleExitSignal = async (signal: string) => {
    logger.info({ signal }, 'Received exit signal');
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
    await client.login(env.DISCORD_TOKEN);
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
