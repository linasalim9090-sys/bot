import { Client, GatewayIntentBits, Options, Partials } from 'discord.js';
import type { Logger } from 'pino';

export function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [
      Partials.Channel,
      Partials.GuildMember,
      Partials.Message,
      Partials.Reaction,
      Partials.User,
    ],
    allowedMentions: { parse: [], repliedUser: false },
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        interval: 3600,
        lifetime: 1800,
      },
    },
  });
}

let isShuttingDown = false;

export async function shutdown(
  client: Pick<Client, 'destroy'>,
  sqlite: { close: () => void },
  logger: Pick<Logger, 'info' | 'error'>,
): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info('Shutting down gracefully...');
  try {
    client.destroy();
  } catch (err) {
    logger.error({ err }, 'Error destroying client');
  }

  try {
    sqlite.close();
  } catch (err) {
    logger.error({ err }, 'Error closing SQLite database');
  }
}

export { registerEvents } from './event.js';
