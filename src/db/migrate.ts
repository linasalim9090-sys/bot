import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Db } from './client.js';

export function migrateDb(db: Db): void {
  migrate(db, { migrationsFolder: 'drizzle' });
}
