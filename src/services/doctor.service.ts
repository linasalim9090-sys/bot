import { GatewayIntentBits, PermissionFlagsBits, type PermissionsBitField } from 'discord.js';
import { sql } from 'drizzle-orm';
import type { Env } from '../config/env.js';
import type { CommandRegistry } from '../core/registry.js';
import type { Db } from '../db/client.js';
import type { Translator } from '../i18n/index.js';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  required: boolean;
  detail: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
}

export interface DoctorDeps {
  env: Env;
  db: Db;
  client: {
    options: {
      intents: {
        has: (intent: number | bigint) => boolean;
      };
    };
    guilds: {
      fetch: (guildId: string) => Promise<{
        members: {
          fetchMe: () => Promise<{
            permissions: PermissionsBitField | { has: (perm: bigint) => boolean };
          }>;
        };
        commands: {
          fetch: () => Promise<Map<string, unknown> | Array<unknown>>;
        };
      }>;
    };
  };
  registry: CommandRegistry;
  t: Translator;
}

export const REQUIRED_PERMISSIONS = [
  { name: 'ViewChannel', bit: PermissionFlagsBits.ViewChannel },
  { name: 'SendMessages', bit: PermissionFlagsBits.SendMessages },
  { name: 'EmbedLinks', bit: PermissionFlagsBits.EmbedLinks },
  { name: 'ReadMessageHistory', bit: PermissionFlagsBits.ReadMessageHistory },
] as const;

export const RECOMMENDED_PERMISSIONS = [
  { name: 'ManageMessages', bit: PermissionFlagsBits.ManageMessages },
  { name: 'ManageChannels', bit: PermissionFlagsBits.ManageChannels },
  { name: 'ManageRoles', bit: PermissionFlagsBits.ManageRoles },
  { name: 'KickMembers', bit: PermissionFlagsBits.KickMembers },
  { name: 'BanMembers', bit: PermissionFlagsBits.BanMembers },
  { name: 'ModerateMembers', bit: PermissionFlagsBits.ModerateMembers },
  { name: 'ManageGuild', bit: PermissionFlagsBits.ManageGuild },
] as const;

export async function runDoctor(deps: DoctorDeps): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  // 1. Environment check
  const envOk = Boolean(
    deps.env.DISCORD_TOKEN && deps.env.CLIENT_ID && deps.env.GUILD_ID && deps.env.OWNER_ID,
  );
  checks.push({
    name: 'environment',
    ok: envOk,
    required: true,
    detail: envOk ? deps.t('commands.doctor.detail.ok') : deps.t('commands.doctor.detail.failed'),
  });

  // 2. Database check
  try {
    deps.db.run(sql`SELECT 1`);
    checks.push({
      name: 'database',
      ok: true,
      required: true,
      detail: deps.t('commands.doctor.detail.ok'),
    });
  } catch {
    checks.push({
      name: 'database',
      ok: false,
      required: true,
      detail: deps.t('commands.doctor.detail.error'),
    });
  }

  // 3. Guild check
  let guild: Awaited<ReturnType<typeof deps.client.guilds.fetch>> | undefined;
  try {
    guild = await deps.client.guilds.fetch(deps.env.GUILD_ID);
    checks.push({
      name: 'guild',
      ok: true,
      required: true,
      detail: deps.t('commands.doctor.detail.ok'),
    });
  } catch {
    checks.push({
      name: 'guild',
      ok: false,
      required: true,
      detail: deps.t('commands.doctor.detail.failed'),
    });
  }

  // 4. Bot Member check
  let botMember: Awaited<ReturnType<NonNullable<typeof guild>['members']['fetchMe']>> | undefined;
  if (guild) {
    try {
      botMember = await guild.members.fetchMe();
      checks.push({
        name: 'botMember',
        ok: true,
        required: true,
        detail: deps.t('commands.doctor.detail.ok'),
      });
    } catch {
      checks.push({
        name: 'botMember',
        ok: false,
        required: true,
        detail: deps.t('commands.doctor.detail.failed'),
      });
    }
  } else {
    checks.push({
      name: 'botMember',
      ok: false,
      required: true,
      detail: deps.t('commands.doctor.detail.failed'),
    });
  }

  // 5. Intents check
  const hasMembers = deps.client.options.intents.has(GatewayIntentBits.GuildMembers);
  const hasMessageContent = deps.client.options.intents.has(GatewayIntentBits.MessageContent);
  const missingIntents: string[] = [];
  if (!hasMembers) missingIntents.push('GuildMembers');
  if (!hasMessageContent) missingIntents.push('MessageContent');

  checks.push({
    name: 'intents',
    ok: missingIntents.length === 0,
    required: true,
    detail:
      missingIntents.length === 0
        ? deps.t('commands.doctor.detail.ok')
        : deps.t('commands.doctor.detail.missing', { items: missingIntents.join(', ') }),
  });

  // 6. Permissions check
  if (botMember) {
    const missingRequired: string[] = [];
    for (const perm of REQUIRED_PERMISSIONS) {
      if (!botMember.permissions.has(perm.bit)) {
        missingRequired.push(perm.name);
      }
    }

    if (missingRequired.length > 0) {
      checks.push({
        name: 'permissions',
        ok: false,
        required: true,
        detail: deps.t('commands.doctor.detail.missing', {
          items: missingRequired.join(', '),
        }),
      });
    } else {
      checks.push({
        name: 'permissions',
        ok: true,
        required: true,
        detail: deps.t('commands.doctor.detail.ok'),
      });
    }
  } else {
    checks.push({
      name: 'permissions',
      ok: false,
      required: true,
      detail: deps.t('commands.doctor.detail.failed'),
    });
  }

  // 7. Commands check
  let fetchedCommandsCount = 0;
  if (guild) {
    try {
      const cmds = await guild.commands.fetch();
      fetchedCommandsCount = 'size' in cmds ? (cmds as Map<string, unknown>).size : (cmds as unknown[]).length;
    } catch {
      fetchedCommandsCount = 0;
    }
  }

  const hasLocalCommands = deps.registry.all().length > 0;
  const commandsOk = hasLocalCommands && fetchedCommandsCount > 0;
  checks.push({
    name: 'commands',
    ok: commandsOk,
    required: true,
    detail: commandsOk
      ? deps.t('commands.doctor.detail.ok')
      : deps.t('commands.doctor.detail.failed'),
  });

  const overallOk = checks.filter((c) => c.required).every((c) => c.ok);
  return { ok: overallOk, checks };
}
