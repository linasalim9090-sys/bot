import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeDb, createDb } from '../../src/db/client.js';
import { migrateDb } from '../../src/db/migrate.js';
import { guildSettings } from '../../src/db/schema.js';

let sqlite: ReturnType<typeof createDb>['sqlite'] | undefined;
let dir: string | undefined;

afterEach(() => {
  if (sqlite) closeDb(sqlite);
  if (dir) rmSync(dir, { recursive: true, force: true });
  sqlite = undefined;
  dir = undefined;
});

describe('database', () => {
  it('enables WAL and creates the schema', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'nizam-db-'));
    const created = createDb(path.join(dir, 'test.db'));
    sqlite = created.sqlite;
    migrateDb(created.db);

    expect(sqlite.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(sqlite.pragma('busy_timeout', { simple: true })).toBe(5000);

    created.db
      .insert(guildSettings)
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

    expect(created.db.select().from(guildSettings).all()).toHaveLength(1);
  });
});
