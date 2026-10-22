import 'dotenv/config';
import { loadEnv } from '../src/config/env.js';
import { createDb, closeDb } from '../src/db/client.js';
import { migrateDb } from '../src/db/migrate.js';

const env = loadEnv();
const { sqlite, db } = createDb(env.DATABASE_PATH);
try {
  migrateDb(db);
  console.log('Migrations applied.');
} finally {
  closeDb(sqlite);
}
