import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDb } from '../../src/db/client.js';
import { migrateDb } from '../../src/db/migrate.js';
import { AuditService } from '../../src/services/audit.service.js';
import { SettingsService } from '../../src/services/settings.service.js';

export async function createTestServices() {
  const dir = mkdtempSync(path.join(tmpdir(), 'nizam-test-services-'));
  const dbPath = path.join(dir, 'test.db');
  const { db, sqlite } = createDb(dbPath);
  migrateDb(db);
  const audit = new AuditService(db);
  const settings = new SettingsService(db, audit);

  const cleanup = () => {
    sqlite.close();
    rmSync(dir, { recursive: true, force: true });
  };

  return { dir, sqlite, db, audit, settings, cleanup };
}
