import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { memberLevels } from '../db/schema.js';

export interface LevelResult {
  xp: number;
  level: number;
  leveledUp: boolean;
}

export class LevelService {
  constructor(private readonly db: Db) {}

  async addXp(guildId: string, userId: string, amount = 20): Promise<LevelResult> {
    const existing = this.db
      .select()
      .from(memberLevels)
      .where(and(eq(memberLevels.guildId, guildId), eq(memberLevels.userId, userId)))
      .get();

    const now = Date.now();
    if (!existing) {
      this.db
        .insert(memberLevels)
        .values({
          guildId,
          userId,
          xp: amount,
          level: 1,
          lastMessageAt: now,
        })
        .run();
      return { xp: amount, level: 1, leveledUp: false };
    }

    // Cooldown: 1 message per 30 seconds
    if (now - existing.lastMessageAt < 30_000) {
      return { xp: existing.xp, level: existing.level, leveledUp: false };
    }

    const newXp = existing.xp + amount;
    const requiredXp = existing.level * 100;
    const leveledUp = newXp >= requiredXp;
    const newLevel = leveledUp ? existing.level + 1 : existing.level;

    this.db
      .update(memberLevels)
      .set({
        xp: newXp,
        level: newLevel,
        lastMessageAt: now,
      })
      .where(and(eq(memberLevels.guildId, guildId), eq(memberLevels.userId, userId)))
      .run();

    return { xp: newXp, level: newLevel, leveledUp };
  }

  async getRank(guildId: string, userId: string): Promise<{ xp: number; level: number; neededXp: number }> {
    const row = this.db
      .select()
      .from(memberLevels)
      .where(and(eq(memberLevels.guildId, guildId), eq(memberLevels.userId, userId)))
      .get();

    const xp = row?.xp ?? 0;
    const level = row?.level ?? 1;
    const neededXp = level * 100;
    return { xp, level, neededXp };
  }

  async getLeaderboard(guildId: string, limit = 10): Promise<Array<{ userId: string; xp: number; level: number }>> {
    const safeLimit = Math.max(1, Math.min(limit, 25));
    return this.db
      .select()
      .from(memberLevels)
      .where(eq(memberLevels.guildId, guildId))
      .orderBy(desc(memberLevels.xp))
      .limit(safeLimit);
  }
}
