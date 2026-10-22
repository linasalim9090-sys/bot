import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { closeDb, createDb } from '../../src/db/client.js';
import { migrateDb } from '../../src/db/migrate.js';
import { auditLog, guildSettings, jobs, users } from '../../src/db/schema.js';

type CreatedDb = ReturnType<typeof createDb>;

function withMigratedDb(run: (created: CreatedDb) => void): void {
  const dir = mkdtempSync(path.join(tmpdir(), 'nizam-db-'));
  let created: CreatedDb | undefined;
  try {
    created = createDb(path.join(dir, 'test.db'));
    migrateDb(created.db);
    run(created);
  } finally {
    try {
      if (created) closeDb(created.sqlite);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

describe('database', () => {
  it('enables WAL and creates the schema', () => {
    withMigratedDb(({ sqlite, db }) => {
      expect(sqlite.pragma('journal_mode', { simple: true })).toBe('wal');
      expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
      expect(sqlite.pragma('busy_timeout', { simple: true })).toBe(5000);

      db.insert(guildSettings)
        .values({
          guildId: '123456789012345678',
          locale: 'ar',
          timezone: 'Asia/Riyadh',
          version: 1,
          modulesJson: { core: true },
          loggingJson: {},
          welcomeJson: {},
          ticketsJson: {},
          musicJson: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        .run();

      expect(db.select().from(guildSettings).all()).toHaveLength(1);
    });
  });

  it('runs migrations idempotently and preserves defaults, JSON, and unique keys', () => {
    withMigratedDb(({ db }) => {
      expect(() => migrateDb(db)).not.toThrow();

      db.insert(users).values({ userId: 'user-1', createdAt: 1000 }).run();
      const [user] = db.select().from(users).all();
      expect(user).toMatchObject({
        userId: 'user-1',
        locale: null,
        timezone: null,
        createdAt: 1000,
      });

      const metadata = { reason: 'test', nested: { enabled: true }, count: 2 };
      db.insert(auditLog)
        .values({
          guildId: 'guild-1',
          actorId: 'actor-1',
          action: 'test.action',
          metadataJson: metadata,
          createdAt: 2000,
        })
        .run();
      const [entry] = db.select().from(auditLog).all();
      expect(entry?.metadataJson).toEqual(metadata);
      expect(entry?.targetId).toBeNull();

      const payload = { channelId: '123456789012345678', options: { notify: true } };
      db.insert(jobs)
        .values({
          type: 'reminder',
          runAt: 5000,
          payloadJson: payload,
          uniqueKey: 'unique-job-1',
          createdAt: 3000,
        })
        .run();
      const [job] = db.select().from(jobs).all();
      expect(job).toMatchObject({
        type: 'reminder',
        runAt: 5000,
        payloadJson: payload,
        status: 'pending',
        attempts: 0,
        lockedUntil: null,
        uniqueKey: 'unique-job-1',
      });

      expect(() =>
        db
          .insert(jobs)
          .values({
            type: 'reminder',
            runAt: 6000,
            payloadJson: {},
            uniqueKey: 'unique-job-1',
            createdAt: 4000,
          })
          .run(),
      ).toThrow(/UNIQUE constraint failed: jobs\.unique_key/);
      expect(db.select().from(jobs).all()).toHaveLength(1);
    });
  });
});
