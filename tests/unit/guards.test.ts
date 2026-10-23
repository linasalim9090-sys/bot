import { describe, expect, it } from 'vitest';
import { DEFAULT_MODULES } from '../../src/config/constants.js';
import type { Env } from '../../src/config/env.js';
import { CooldownService } from '../../src/core/cooldowns.js';
import { checkGuards } from '../../src/core/guards.js';
import pingCommand from '../fixtures/commands/ping.command.js';
import { createFakeInteraction } from '../fixtures/interaction.js';
import { makeSettings } from '../fixtures/settings.js';

const env: Env = {
  DISCORD_TOKEN: 'x'.repeat(60),
  CLIENT_ID: '123456789012345678',
  GUILD_ID: '123456789012345678',
  OWNER_ID: '323456789012345678',
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_PATH: ':memory:',
  LOG_DIR: './logs',
  DEFAULT_LOCALE: 'ar',
  DRY_RUN: false,
};

describe('checkGuards', () => {
  it('rejects a guild mismatch before anything else', () => {
    const failure = checkGuards({
      interaction: createFakeInteraction({ guildId: '999999999999999999' }),
      command: pingCommand,
      settings: makeSettings(),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(failure).toEqual({ ok: false, reason: 'guild', messageKey: 'errors.guildOnly' });
  });

  it('rejects a disabled module', () => {
    const failure = checkGuards({
      interaction: createFakeInteraction(),
      command: { ...pingCommand, meta: { ...pingCommand.meta, module: 'economy' } },
      settings: makeSettings({ modulesJson: { ...DEFAULT_MODULES, economy: false } }),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(failure).toMatchObject({ ok: false, reason: 'module', messageKey: 'errors.moduleDisabled' });
  });

  it('rejects a non-owner for ownerOnly commands', () => {
    const failure = checkGuards({
      interaction: createFakeInteraction({ user: { id: '999999999999999999' } }),
      command: { ...pingCommand, meta: { ...pingCommand.meta, ownerOnly: true } },
      settings: makeSettings(),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(failure).toMatchObject({ ok: false, reason: 'owner', messageKey: 'errors.ownerOnly' });
  });

  it('allows a user who has one of the configured owner roles for ownerOnly commands', () => {
    const interaction = createFakeInteraction({
      user: { id: '999999999999999999' },
      member: { roles: ['role-owner-1'] },
    });
    const result = checkGuards({
      interaction,
      command: { ...pingCommand, meta: { ...pingCommand.meta, ownerOnly: true } },
      settings: makeSettings({ rolesJson: { ownerRoleIds: ['role-owner-1', 'role-owner-2'] } }),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects a missing user permission', () => {
    const failure = checkGuards({
      interaction: createFakeInteraction({ memberPermissions: { has: () => false } }),
      command: { ...pingCommand, meta: { ...pingCommand.meta, permissions: ['ManageGuild'] } },
      settings: makeSettings(),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(failure).toMatchObject({ ok: false, reason: 'permissions', messageKey: 'errors.permissions' });
  });

  it('rejects a missing bot permission', () => {
    const failure = checkGuards({
      interaction: createFakeInteraction({ appPermissions: { has: () => false } }),
      command: { ...pingCommand, meta: { ...pingCommand.meta, botPermissions: ['EmbedLinks'] } },
      settings: makeSettings(),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(failure).toMatchObject({
      ok: false,
      reason: 'botPermissions',
      messageKey: 'errors.botPermissions',
    });
  });

  it('rejects when on cooldown', () => {
    const cooldowns = new CooldownService();
    const interaction = createFakeInteraction();
    checkGuards({
      interaction,
      command: { ...pingCommand, meta: { ...pingCommand.meta, cooldownMs: 5000 } },
      settings: makeSettings(),
      env,
      cooldowns,
      now: 1000,
    });
    const failure = checkGuards({
      interaction,
      command: { ...pingCommand, meta: { ...pingCommand.meta, cooldownMs: 5000 } },
      settings: makeSettings(),
      env,
      cooldowns,
      now: 2000,
    });
    expect(failure).toMatchObject({
      ok: false,
      reason: 'cooldown',
      messageKey: 'errors.cooldown',
      retryAt: 6000,
    });
  });

  it('passes when all guards are satisfied', () => {
    const result = checkGuards({
      interaction: createFakeInteraction(),
      command: pingCommand,
      settings: makeSettings(),
      env,
      cooldowns: new CooldownService(),
      now: 1000,
    });
    expect(result).toEqual({ ok: true });
  });
});
