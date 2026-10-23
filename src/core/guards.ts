import type { ChatInputCommandInteraction } from 'discord.js';
import type { Env } from '../config/env.js';
import type { GuildSettings } from '../services/settings.service.js';
import type { Command } from './command.js';
import type { CooldownService } from './cooldowns.js';

export interface GuardInput {
  interaction: ChatInputCommandInteraction;
  command: Command;
  settings: GuildSettings;
  env: Env;
  cooldowns: CooldownService;
  now?: number;
}

export type GuardFailureReason =
  | 'guild'
  | 'module'
  | 'owner'
  | 'permissions'
  | 'botPermissions'
  | 'cooldown';

export interface GuardFailure {
  ok: false;
  reason: GuardFailureReason;
  messageKey: string;
  retryAt?: number;
}

export type GuardResult = GuardFailure | { ok: true };

export function checkGuards(input: GuardInput): GuardResult {
  const { interaction, command, settings, env, cooldowns, now } = input;

  // 1. Guild guard
  if (!interaction.guildId || interaction.guildId !== env.GUILD_ID) {
    return { ok: false, reason: 'guild', messageKey: 'errors.guildOnly' };
  }

  // 2. Module guard (core is always enabled)
  if (command.meta.module !== 'core') {
    const isModuleEnabled = settings.modulesJson[command.meta.module] !== false;
    if (!isModuleEnabled) {
      return { ok: false, reason: 'module', messageKey: 'errors.moduleDisabled' };
    }
  }

  // 3. Owner guard
  if (command.meta.ownerOnly && interaction.user.id !== env.OWNER_ID) {
    return { ok: false, reason: 'owner', messageKey: 'errors.ownerOnly' };
  }

  // 4. User permissions guard
  if (command.meta.permissions && command.meta.permissions.length > 0) {
    const hasUserPerms = interaction.memberPermissions?.has(command.meta.permissions);
    if (!hasUserPerms) {
      return { ok: false, reason: 'permissions', messageKey: 'errors.permissions' };
    }
  }

  // 5. Bot permissions guard
  if (command.meta.botPermissions && command.meta.botPermissions.length > 0) {
    const hasBotPerms = interaction.appPermissions?.has(command.meta.botPermissions);
    if (!hasBotPerms) {
      return { ok: false, reason: 'botPermissions', messageKey: 'errors.botPermissions' };
    }
  }

  // 6. Cooldown guard
  if (command.meta.cooldownMs && command.meta.cooldownMs > 0) {
    const key = `${interaction.guildId}:${interaction.user.id}:${command.data.name}`;
    const result = cooldowns.check(key, command.meta.cooldownMs, now);
    if (!result.allowed) {
      return {
        ok: false,
        reason: 'cooldown',
        messageKey: 'errors.cooldown',
        retryAt: result.retryAt,
      };
    }
  }

  return { ok: true };
}
