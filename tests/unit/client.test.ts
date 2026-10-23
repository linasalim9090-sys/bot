import { GatewayIntentBits, Partials } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { createClient, registerEvents, shutdown } from '../../src/core/client.js';
import { defineEvent } from '../../src/core/event.js';

describe('client', () => {
  it('requests the required intents and partials', () => {
    const client = createClient();
    expect(client.options.intents.has(GatewayIntentBits.GuildMembers)).toBe(true);
    expect(client.options.intents.has(GatewayIntentBits.MessageContent)).toBe(true);
    expect(client.options.partials ?? []).toContain(Partials.Message);
    client.destroy();
  });

  it('registers events and isolates failures', async () => {
    const client = createClient();
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const failing = defineEvent({
      name: 'clientReady',
      once: true,
      execute: async () => {
        throw new Error('boom');
      },
    });
    registerEvents(client, [failing], logger as never);
    client.emit('clientReady', client as never);
    await vi.waitFor(() => expect(logger.error).toHaveBeenCalledOnce());
    client.destroy();
  });

  it('shuts down idempotently', async () => {
    const client = { destroy: vi.fn() } as never;
    const sqlite = { close: vi.fn() } as never;
    const logger = { info: vi.fn(), error: vi.fn() } as never;
    await shutdown(client, sqlite, logger);
    await shutdown(client, sqlite, logger);
    expect((client as { destroy: ReturnType<typeof vi.fn> }).destroy).toHaveBeenCalledOnce();
    expect((sqlite as { close: ReturnType<typeof vi.fn> }).close).toHaveBeenCalledOnce();
  });
});
