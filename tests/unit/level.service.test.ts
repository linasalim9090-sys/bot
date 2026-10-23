import { describe, expect, it } from 'vitest';
import { createDb } from '../../src/db/client.js';
import { LevelService } from '../../src/services/level.service.js';

describe('LevelService', () => {
  it('adds xp, handles leveling up, and retrieves leaderboard', async () => {
    const { db } = createDb(':memory:');
    const service = new LevelService(db);

    const r1 = await service.addXp('g1', 'u1', 50);
    expect(r1.xp).toBe(50);
    expect(r1.level).toBe(1);

    const rank = await service.getRank('g1', 'u1');
    expect(rank.xp).toBe(50);
    expect(rank.level).toBe(1);
    expect(rank.neededXp).toBe(100);

    const leaders = await service.getLeaderboard('g1', 5);
    expect(leaders.length).toBe(1);
    expect(leaders[0]?.userId).toBe('u1');
  });
});
