import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const guildSettings = sqliteTable('guild_settings', {
  guildId: text('guild_id').primaryKey(),
  locale: text('locale', { enum: ['ar', 'en'] })
    .notNull()
    .default('ar'),
  timezone: text('timezone').notNull().default('Asia/Riyadh'),
  version: integer('version').notNull().default(1),
  modulesJson: text('modules_json', { mode: 'json' }).$type<Record<string, boolean>>().notNull(),
  loggingJson: text('logging_json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  welcomeJson: text('welcome_json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  ticketsJson: text('tickets_json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  musicJson: text('music_json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  rolesJson: text('roles_json', { mode: 'json' })
    .$type<{ ownerRoleIds: string[] }>()
    .notNull()
    .default({ ownerRoleIds: [] }),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const users = sqliteTable('users', {
  userId: text('user_id').primaryKey(),
  locale: text('locale', { enum: ['ar', 'en'] }),
  timezone: text('timezone'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    guildId: text('guild_id').notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    targetId: text('target_id'),
    metadataJson: text('metadata_json', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('audit_guild_created_idx').on(table.guildId, table.createdAt)],
);

export const jobs = sqliteTable(
  'jobs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(),
    runAt: integer('run_at', { mode: 'number' }).notNull(),
    payloadJson: text('payload_json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
    status: text('status', { enum: ['pending', 'running', 'done', 'failed'] })
      .notNull()
      .default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lockedUntil: integer('locked_until', { mode: 'number' }),
    uniqueKey: text('unique_key').unique(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('jobs_status_run_idx').on(table.status, table.runAt)],
);

export const tickets = sqliteTable(
  'tickets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    guildId: text('guild_id').notNull(),
    channelId: text('channel_id').notNull(),
    openerId: text('opener_id').notNull(),
    status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    closedAt: integer('closed_at', { mode: 'number' }),
  },
  (table) => [index('tickets_guild_channel_idx').on(table.guildId, table.channelId)],
);

export const memberLevels = sqliteTable(
  'member_levels',
  {
    guildId: text('guild_id').notNull(),
    userId: text('user_id').notNull(),
    xp: integer('xp').notNull().default(0),
    level: integer('level').notNull().default(1),
    lastMessageAt: integer('last_message_at', { mode: 'number' }).notNull().default(0),
  },
  (table) => [index('member_levels_guild_idx').on(table.guildId, table.xp)],
);

export const memberEconomy = sqliteTable(
  'member_economy',
  {
    guildId: text('guild_id').notNull(),
    userId: text('user_id').notNull(),
    wallet: integer('wallet').notNull().default(0),
    bank: integer('bank').notNull().default(0),
    lastDailyAt: integer('last_daily_at', { mode: 'number' }).notNull().default(0),
  },
  (table) => [index('member_economy_guild_idx').on(table.guildId, table.userId)],
);
