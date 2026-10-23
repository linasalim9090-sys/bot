import type { ChatInputCommandInteraction, Client } from 'discord.js';
import type { Logger } from 'pino';
import type { Env } from '../config/env.js';
import type { Db } from '../db/client.js';
import { createTranslator } from '../i18n/index.js';
import type { AuditService } from '../services/audit.service.js';
import type { SettingsService } from '../services/settings.service.js';
import type { CommandContext } from './context.js';
import type { CooldownService } from './cooldowns.js';
import { handleCommandError } from './errors.js';
import { checkGuards } from './guards.js';
import type { CommandRegistry } from './registry.js';

export interface HandlerDeps {
  client: Client;
  env: Env;
  db: Db;
  registry: CommandRegistry;
  settingsService: SettingsService;
  auditService: AuditService;
  cooldowns: CooldownService;
  logger: Logger;
}

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  deps: HandlerDeps,
): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = deps.registry.get(interaction.commandName);
  if (!command) {
    deps.logger.warn({ command: interaction.commandName }, 'Unknown command invoked');
    return;
  }

  // If outside guild (e.g. DM), reject immediately with default locale translator
  if (!interaction.guildId || interaction.guildId !== deps.env.GUILD_ID) {
    const fallbackT = createTranslator(deps.env.DEFAULT_LOCALE);
    await interaction.reply({
      content: fallbackT('errors.guildOnly'),
      ephemeral: true,
    });
    return;
  }

  let t = createTranslator(deps.env.DEFAULT_LOCALE);

  try {
    const settings = await deps.settingsService.get(interaction.guildId);
    t = createTranslator(settings.locale);

    const guardResult = checkGuards({
      interaction,
      command,
      settings,
      env: deps.env,
      cooldowns: deps.cooldowns,
    });

    if (!guardResult.ok) {
      const vars: Record<string, string | number> = {};
      if (guardResult.retryAt) {
        vars.seconds = Math.max(1, Math.ceil((guardResult.retryAt - Date.now()) / 1000));
      }
      await interaction.reply({
        content: t(guardResult.messageKey, vars),
        ephemeral: true,
      });
      return;
    }

    if (command.meta.defer) {
      await interaction.deferReply({
        ephemeral: command.meta.defer === 'ephemeral',
      });
    }

    const ctx: CommandContext = {
      interaction,
      client: deps.client,
      env: deps.env,
      db: deps.db,
      registry: deps.registry,
      settings,
      settingsService: deps.settingsService,
      auditService: deps.auditService,
      t,
      logger: deps.logger,
    };

    await command.execute(ctx);
  } catch (error) {
    await handleCommandError(interaction, error, {
      logger: deps.logger,
      t,
    });
  }
}
