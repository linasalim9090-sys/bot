import { describe, expect, it, vi } from 'vitest';
import { createDb } from '../../src/db/client.js';
import { createTranslator } from '../../src/i18n/index.js';
import { TicketService } from '../../src/services/ticket.service.js';

describe('TicketService', () => {
  it('creates a ticket, prevents duplicate open tickets, and closes ticket', async () => {
    const { db } = createDb(':memory:');
    const service = new TicketService(db);
    const t = createTranslator('ar');

    const mockSend = vi.fn().mockResolvedValue(undefined);
    const mockChannel = {
      id: 'ch-ticket-1',
      send: mockSend,
    };

    const mockGuild = {
      id: 'guild-1',
      channels: {
        create: vi.fn().mockResolvedValue(mockChannel),
      },
    };

    const mockUser = {
      id: 'user-1',
      username: 'tester',
    };

    // 1. Create ticket
    const res1 = await service.createTicket(mockGuild as never, mockUser as never, t);
    expect(res1.ok).toBe(true);
    expect(res1.channelId).toBe('ch-ticket-1');

    // 2. Prevent duplicate open ticket
    const res2 = await service.createTicket(mockGuild as never, mockUser as never, t);
    expect(res2.ok).toBe(false);
    expect(res2.alreadyOpen).toBe(true);

    // 3. Close ticket
    const closed = await service.closeTicket('ch-ticket-1');
    expect(closed).toBe(true);

    // 4. Closing nonexistent ticket returns false
    const closedAgain = await service.closeTicket('non-existent');
    expect(closedAgain).toBe(false);
  });
});
