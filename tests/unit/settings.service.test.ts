import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDb, createDb, type Db } from '../../src/db/client.js';
import { migrateDb } from '../../src/db/migrate.js';
import { guildSettings } from '../../src/db/schema.js';
import { AuditService } from '../../src/services/audit.service.js';
import { SettingsConflictError, SettingsService } from '../../src/services/settings.service.js';

const GUILD = '123456789012345678';
const ACTOR = '323456789012345678';

let dir!: string;
let sqlite!: ReturnType<typeof createDb>['sqlite'];
let db!: Db;
let service!: SettingsService;
let audit!: AuditService;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'nizam-settings-'));
  const created = createDb(path.join(dir, 'test.db'));
  sqlite = created.sqlite;
  db = created.db;
  migrateDb(db);
  audit = new AuditService(db);
  service = new SettingsService(db, audit);
});

afterEach(() => {
  closeDb(sqlite);
  rmSync(dir, { recursive: true, force: true });
});

describe('SettingsService', () => {
  it('creates default settings once and serves the second read from cache', async () => {
    const first = await service.get(GUILD);
    db.update(guildSettings).set({ locale: 'en' }).where(eq(guildSettings.guildId, GUILD)).run();
    const second = await service.get(GUILD);
    expect(first.locale).toBe('ar');
    expect(second).toEqual(first);
  });

  it('updates settings, increments version, and writes an audit row', async () => {
    await service.get(GUILD);
    const updated = await service.update(GUILD, { locale: 'en' }, ACTOR, 1);
    expect(updated.locale).toBe('en');
    expect(updated.version).toBe(2);
    expect(await audit.list(GUILD)).toHaveLength(1);
  });

  it('rejects a stale expected version', async () => {
    await service.get(GUILD);
    await service.update(GUILD, { timezone: 'Africa/Cairo' }, ACTOR, 1);
    await expect(service.update(GUILD, { locale: 'en' }, ACTOR, 1)).rejects.toBeInstanceOf(
      SettingsConflictError,
    );
  });

  it('rejects an invalid timezone', async () => {
    await service.get(GUILD);
    await expect(service.update(GUILD, { timezone: 'Mars/Base' }, ACTOR)).rejects.toThrow();
  });
});
