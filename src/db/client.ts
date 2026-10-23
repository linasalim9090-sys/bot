import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export type Db = BetterSQLite3Database<typeof schema>;

export function createDb(databasePath: string): {
  sqlite: Database.Database;
  db: Db;
} {
  if (databasePath !== ':memory:') {
    mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('temp_store = MEMORY');
  sqlite.pragma('cache_size = -64000');
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

export function closeDb(sqlite: Database.Database): void {
  sqlite.close();
}
