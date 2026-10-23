import type { Client, ClientEvents } from 'discord.js';
import type { Logger } from 'pino';

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}

export interface AnyBotEvent {
  name: keyof ClientEvents;
  once?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => Promise<void> | void;
}

export function defineEvent<K extends keyof ClientEvents>(event: BotEvent<K>): BotEvent<K> {
  return event;
}

export function registerEvents(
  client: Client,
  events: AnyBotEvent[],
  logger: Pick<Logger, 'error' | 'info' | 'warn'>,
): void {
  for (const event of events) {
    const handler = async (...args: unknown[]) => {
      try {
        await (event.execute as (...a: unknown[]) => Promise<void>)(...args);
      } catch (err) {
        logger.error({ err, event: event.name }, `Error in event handler for ${String(event.name)}`);
      }
    };

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }
}
