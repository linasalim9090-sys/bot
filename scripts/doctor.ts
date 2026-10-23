import 'dotenv/config';
import path from 'node:path';
import { loadEnv } from '../src/config/env.js';
import { createClient } from '../src/core/client.js';
import { CommandRegistry } from '../src/core/registry.js';
import { createDb } from '../src/db/client.js';
import { createTranslator } from '../src/i18n/index.js';
import { runDoctor } from '../src/services/doctor.service.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const t = createTranslator(env.DEFAULT_LOCALE);

  const { db, sqlite } = createDb(env.DATABASE_PATH);

  const registry = new CommandRegistry();
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  await registry.loadFromDirectory(modulesDir);

  const client = createClient();

  console.log('Connecting to Discord client for diagnostic check...');

  await new Promise<void>((resolve, reject) => {
    client.once('clientReady', () => resolve());
    client.login(env.DISCORD_TOKEN).catch(reject);
  });

  console.log('Connected. Running doctor diagnostics...\n');

  const report = await runDoctor({
    env,
    db,
    client: client as never,
    registry,
    t,
  });

  for (const check of report.checks) {
    const status = check.ok ? '[OK]' : '[FAIL]';
    console.log(`${status} ${check.name}: ${check.detail}`);
  }

  console.log(
    `\nOverall Result: ${report.ok ? 'HEALTHY (All required checks passed)' : 'UNHEALTHY (Action required)'}`,
  );

  client.destroy();
  sqlite.close();

  if (!report.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Doctor diagnostics failed to complete:', err);
  process.exit(1);
});
