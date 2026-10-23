import type {
  PermissionResolvable,
  SharedSlashCommand,
} from 'discord.js';
import type { ModuleName } from '../config/constants.js';
import type { CommandContext } from './context.js';

export interface CommandMeta {
  module: ModuleName;
  permissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  ownerOnly?: boolean;
  cooldownMs?: number;
  defer?: 'ephemeral' | 'public' | false;
  usage?: string;
}

export interface Command {
  data: SharedSlashCommand;
  meta: CommandMeta;
  execute: (ctx: CommandContext) => Promise<void>;
}

export function defineCommand(command: Command): Command {
  return command;
}
