import { eq } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { DEFAULT_MODULES } from '../config/constants.js';
import type { Db } from '../db/client.js';
import { guildSettings } from '../db/schema.js';
import type { AuditService } from './audit.service.js';

export class SettingsConflictError extends Error {
  constructor(
    public readonly expected?: number,
    public readonly actual?: number,
  ) {
    super(`Settings conflict: expected version ${expected}, but found version ${actual}`);
    this.name = 'SettingsConflictError';
  }
}

export interface GuildSettings {
  guildId: string;
  locale: 'ar' | 'en';
  timezone: string;
  version: number;
  modulesJson: Record<string, boolean>;
  loggingJson: Record<string, unknown>;
  welcomeJson: Record<string, unknown>;
  ticketsJson: Record<string, unknown>;
  musicJson: Record<string, unknown>;
  rolesJson: { ownerRoleIds: string[] };
  createdAt: number;
  updatedAt: number;
}

export type GuildSettingsPatch = Partial<
  Omit<GuildSettings, 'guildId' | 'version' | 'createdAt' | 'updatedAt'>
>;

const patchSchema = z.object({
  locale: z.enum(['ar', 'en']).optional(),
  timezone: z
    .string()
    .refine(
      (value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid timezone' },
    )
    .optional(),
  modulesJson: z.record(z.string(), z.boolean()).optional(),
  loggingJson: z.record(z.string(), z.unknown()).optional(),
  welcomeJson: z.record(z.string(), z.unknown()).optional(),
  ticketsJson: z.record(z.string(), z.unknown()).optional(),
  musicJson: z.record(z.string(), z.unknown()).optional(),
  rolesJson: z
    .object({
      ownerRoleIds: z.array(z.string()).max(2),
    })
    .optional(),
});

export class SettingsService {
  private readonly cache = new LRUCache<string, GuildSettings>({
    max: 1000,
    ttl: 1000 * 60 * 15,
  });

  constructor(
    private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  async get(guildId: string): Promise<GuildSettings> {
    const cached = this.cache.get(guildId);
    if (cached) return cached;

    const rows = this.db.select().from(guildSettings).where(eq(guildSettings.guildId, guildId)).all();
    if (rows.length > 0 && rows[0]) {
      const row = rows[0] as GuildSettings;
      this.cache.set(guildId, row);
      return row;
    }

    const now = Date.now();
    const defaults: GuildSettings = {
      guildId,
      locale: 'ar',
      timezone: 'Asia/Riyadh',
      version: 1,
      modulesJson: { ...DEFAULT_MODULES },
      loggingJson: {},
      welcomeJson: {},
      ticketsJson: {},
      musicJson: {},
      rolesJson: { ownerRoleIds: [] },
      createdAt: now,
      updatedAt: now,
    };

    this.db.insert(guildSettings).values(defaults).run();
    this.cache.set(guildId, defaults);
    return defaults;
  }

  async update(
    guildId: string,
    patch: GuildSettingsPatch,
    actorId: string,
    expectedVersion?: number,
  ): Promise<GuildSettings> {
    const validated = patchSchema.parse(patch);

    const current = await this.get(guildId);

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new SettingsConflictError(expectedVersion, current.version);
    }

    const nextVersion = current.version + 1;
    const now = Date.now();

    const merged: GuildSettings = {
      ...current,
      ...validated,
      modulesJson: validated.modulesJson
        ? { ...current.modulesJson, ...validated.modulesJson }
        : current.modulesJson,
      version: nextVersion,
      updatedAt: now,
    };

    this.db.update(guildSettings).set(merged).where(eq(guildSettings.guildId, guildId)).run();
    this.cache.set(guildId, merged);

    await this.audit.record({
      guildId,
      actorId,
      action: 'settings.update',
      metadataJson: { patch: validated, version: nextVersion },
      createdAt: now,
    });

    return merged;
  }

  async reset(guildId: string, actorId: string): Promise<GuildSettings> {
    this.db.delete(guildSettings).where(eq(guildSettings.guildId, guildId)).run();
    this.cache.delete(guildId);

    await this.audit.record({
      guildId,
      actorId,
      action: 'settings.reset',
      createdAt: Date.now(),
    });

    return this.get(guildId);
  }
}
