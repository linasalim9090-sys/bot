import 'dotenv/config';
import { createDb, closeDb } from '../src/db/client.js';
import { migrateDb } from '../src/db/migrate.js';

const databasePath = process.env.DATABASE_PATH || './data/bot.db';
const { sqlite, db } = createDb(databasePath);
try {
  migrateDb(db);
  console.log('Migrations applied.');
} finally {
  closeDb(sqlite);
}
