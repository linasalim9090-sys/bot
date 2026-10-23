import { randomUUID } from 'node:crypto';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Logger } from 'pino';
import type { Translator } from '../i18n/index.js';

export class CommandError extends Error {
  constructor(
    public readonly userKey: string,
    override readonly cause?: unknown,
  ) {
    super(userKey);
    this.name = 'CommandError';
  }
}

export function isUnknownInteraction(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return code === 10062 || code === 40060;
  }
  return false;
}

export interface ErrorBoundaryDeps {
  logger: Pick<Logger, 'error' | 'info' | 'warn'>;
  t: Translator;
}

export async function handleCommandError(
  interaction: ChatInputCommandInteraction,
  error: unknown,
  deps: ErrorBoundaryDeps,
): Promise<void> {
  if (isUnknownInteraction(error)) {
    return;
  }

  const errorId = randomUUID();
  deps.logger.error({
    err: error,
    errorId,
    command: interaction.commandName,
    guildId: interaction.guildId,
    userId: interaction.user?.id,
  });

  const content =
    error instanceof CommandError
      ? deps.t(error.userKey)
      : deps.t('errors.unexpected', { id: errorId });

  try {
    if (interaction.deferred) {
      await interaction.editReply({ content });
    } else if (interaction.replied) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  } catch (replyError) {
    if (!isUnknownInteraction(replyError)) {
      deps.logger.error({ err: replyError, errorId, msg: 'Failed to reply to command error' });
    }
  }
}
