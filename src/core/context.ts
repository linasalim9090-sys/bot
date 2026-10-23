import type { ChatInputCommandInteraction, Client } from 'discord.js';
import type { Logger } from 'pino';
import type { Env } from '../config/env.js';
import type { Db } from '../db/client.js';
import type { Translator } from '../i18n/index.js';
import type { AuditService } from '../services/audit.service.js';
import type { GuildSettings, SettingsService } from '../services/settings.service.js';
import type { CommandRegistry } from './registry.js';

export type CommandContext = {
  interaction: ChatInputCommandInteraction;
  client: Client;
  env: Env;
  db: Db;
  registry: CommandRegistry;
  settings: GuildSettings;
  settingsService: SettingsService;
  auditService: AuditService;
  t: Translator;
  logger: Logger;
};
