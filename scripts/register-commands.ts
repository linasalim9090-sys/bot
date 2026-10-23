import 'dotenv/config';
import path from 'node:path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { loadEnv } from '../src/config/env.js';
import { CommandRegistry } from '../src/core/registry.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  const registry = new CommandRegistry();
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  await registry.loadFromDirectory(modulesDir);

  const commandsJson = registry.toJSON();
  console.log(`Registering ${commandsJson.length} commands to guild ${env.GUILD_ID}...`);

  await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), {
    body: commandsJson,
  });

  console.log(
    `Successfully registered ${commandsJson.length} commands: ${commandsJson.map((c) => c.name).join(', ')}`,
  );
}

main().catch((err) => {
  console.error('Failed to register commands:', err);
  process.exit(1);
});
