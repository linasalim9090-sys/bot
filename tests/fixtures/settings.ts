import { DEFAULT_MODULES } from '../../src/config/constants.js';
import type { GuildSettings } from '../../src/services/settings.service.js';

export function makeSettings(overrides: Partial<GuildSettings> = {}): GuildSettings {
  const now = Date.now();
  return {
    guildId: '123456789012345678',
    locale: 'ar',
    timezone: 'Asia/Riyadh',
    version: 1,
    modulesJson: { ...DEFAULT_MODULES },
    loggingJson: {},
    welcomeJson: {},
    ticketsJson: {},
    musicJson: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
