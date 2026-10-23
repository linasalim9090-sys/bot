import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { buildInviteUrl, validateGuild, validateToken, writeEnvFile } from '../src/setup/helpers.js';

async function main(): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('=== Nizam Bot Setup Wizard ===\n');

  try {
    const token = (await rl.question('Enter DISCORD_TOKEN: ')).trim();
    if (!token) throw new Error('DISCORD_TOKEN is required');

    console.log('Validating bot token with Discord API...');
    const botUser = await validateToken(token);
    console.log(`Bot authenticated successfully as: ${botUser.username} (${botUser.id})`);

    const clientId = (await rl.question(`Enter CLIENT_ID [default ${botUser.id}]: `)).trim() || botUser.id;
    const guildId = (await rl.question('Enter target GUILD_ID: ')).trim();
    if (!guildId) throw new Error('GUILD_ID is required');

    console.log('Validating target guild with Discord API...');
    const guild = await validateGuild(token, guildId);
    console.log(`Target guild verified: ${guild.name} (${guild.id})`);

    const ownerId = (await rl.question('Enter OWNER_ID (your Discord User Snowflake): ')).trim();
    if (!ownerId) throw new Error('OWNER_ID is required');

    const envValues: Record<string, string> = {
      DISCORD_TOKEN: token,
      CLIENT_ID: clientId,
      GUILD_ID: guildId,
      OWNER_ID: ownerId,
      NODE_ENV: 'development',
      LOG_LEVEL: 'info',
      DATABASE_PATH: './data/bot.db',
      LOG_DIR: './logs',
      DEFAULT_LOCALE: 'ar',
      DRY_RUN: 'false',
    };

    const envPath = path.resolve('.env');
    writeEnvFile(envPath, envValues);
    console.log('\nConfiguration written successfully to .env');

    const inviteUrl = buildInviteUrl(clientId, [
      'ViewChannel',
      'SendMessages',
      'EmbedLinks',
      'ReadMessageHistory',
    ]);
    console.log(`\nBot Invite URL:\n${inviteUrl}\n`);

    const runSetupMigrations = (
      await rl.question('Run database migrations now? (y/n) [default y]: ')
    ).trim().toLowerCase();

    if (runSetupMigrations !== 'n') {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      console.log('Running database migrations...');
      execFileSync(npmCmd, ['run', 'db:migrate'], { stdio: 'inherit' });
    }

    const runCommandReg = (
      await rl.question('Register application slash commands now? (y/n) [default y]: ')
    ).trim().toLowerCase();

    if (runCommandReg !== 'n') {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      console.log('Registering slash commands...');
      execFileSync(npmCmd, ['run', 'register'], { stdio: 'inherit' });
    }

    console.log('\nSetup completed successfully! Start the bot with: npm run dev\n');
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('\nSetup error:', err.message || err);
  process.exit(1);
});
