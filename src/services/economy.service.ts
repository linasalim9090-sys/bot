import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { memberEconomy } from '../db/schema.js';

export interface BalanceResult {
  wallet: number;
  bank: number;
  netWorth: number;
}

export class EconomyService {
  constructor(private readonly db: Db) {}

  async getBalance(guildId: string, userId: string): Promise<BalanceResult> {
    const row = this.db
      .select()
      .from(memberEconomy)
      .where(and(eq(memberEconomy.guildId, guildId), eq(memberEconomy.userId, userId)))
      .get();

    const wallet = row?.wallet ?? 0;
    const bank = row?.bank ?? 0;
    return { wallet, bank, netWorth: wallet + bank };
  }

  async claimDaily(guildId: string, userId: string): Promise<{ ok: boolean; amount: number; remainingHours?: number }> {
    const row = this.db
      .select()
      .from(memberEconomy)
      .where(and(eq(memberEconomy.guildId, guildId), eq(memberEconomy.userId, userId)))
      .get();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    if (row && now - row.lastDailyAt < dayMs) {
      const remainingMs = dayMs - (now - row.lastDailyAt);
      const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
      return { ok: false, amount: 0, remainingHours };
    }

    const reward = 500;
    if (!row) {
      this.db
        .insert(memberEconomy)
        .values({
          guildId,
          userId,
          wallet: reward,
          bank: 0,
          lastDailyAt: now,
        })
        .run();
    } else {
      this.db
        .update(memberEconomy)
        .set({
          wallet: row.wallet + reward,
          lastDailyAt: now,
        })
        .where(and(eq(memberEconomy.guildId, guildId), eq(memberEconomy.userId, userId)))
        .run();
    }

    return { ok: true, amount: reward };
  }

  async transfer(
    guildId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): Promise<{ ok: boolean; reason?: 'insufficient' | 'invalidAmount' }> {
    if (amount <= 0 || !Number.isInteger(amount)) {
      return { ok: false, reason: 'invalidAmount' };
    }

    const sender = await this.getBalance(guildId, fromUserId);
    if (sender.wallet < amount) {
      return { ok: false, reason: 'insufficient' };
    }

    const receiver = await this.getBalance(guildId, toUserId);

    this.db
      .update(memberEconomy)
      .set({ wallet: sender.wallet - amount })
      .where(and(eq(memberEconomy.guildId, guildId), eq(memberEconomy.userId, fromUserId)))
      .run();

    const existingReceiver = this.db
      .select()
      .from(memberEconomy)
      .where(and(eq(memberEconomy.guildId, guildId), eq(memberEconomy.userId, toUserId)))
      .get();

    if (!existingReceiver) {
      this.db
        .insert(memberEconomy)
        .values({
          guildId,
          userId: toUserId,
          wallet: amount,
          bank: 0,
          lastDailyAt: 0,
        })
        .run();
    } else {
      this.db
        .update(memberEconomy)
        .set({ wallet: receiver.wallet + amount })
        .where(and(eq(memberEconomy.guildId, guildId), eq(memberEconomy.userId, toUserId)))
        .run();
    }

    return { ok: true };
  }
}
