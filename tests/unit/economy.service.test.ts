import { describe, expect, it } from 'vitest';
import { createDb } from '../../src/db/client.js';
import { EconomyService } from '../../src/services/economy.service.js';

describe('EconomyService', () => {
  it('manages balance, daily reward, and peer-to-peer transfers', async () => {
    const { db } = createDb(':memory:');
    const service = new EconomyService(db);

    // Initial balance
    const init = await service.getBalance('g1', 'u1');
    expect(init.wallet).toBe(0);
    expect(init.netWorth).toBe(0);

    // Claim daily
    const daily1 = await service.claimDaily('g1', 'u1');
    expect(daily1.ok).toBe(true);
    expect(daily1.amount).toBe(500);

    // Claim daily duplicate within 24h
    const daily2 = await service.claimDaily('g1', 'u1');
    expect(daily2.ok).toBe(false);

    // Transfer
    const failTransfer = await service.transfer('g1', 'u1', 'u2', 1000);
    expect(failTransfer.ok).toBe(false);
    expect(failTransfer.reason).toBe('insufficient');

    const successTransfer = await service.transfer('g1', 'u1', 'u2', 200);
    expect(successTransfer.ok).toBe(true);

    const u1Bal = await service.getBalance('g1', 'u1');
    expect(u1Bal.wallet).toBe(300);

    const u2Bal = await service.getBalance('g1', 'u2');
    expect(u2Bal.wallet).toBe(200);
  });
});
