import { z } from 'zod';
import { EnvError } from './errors.js';

const snowflake = z.string().regex(/^\d{17,20}$/, 'must be a Discord snowflake');

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(50),
  CLIENT_ID: snowflake,
  GUILD_ID: snowflake,
  OWNER_ID: snowflake,
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_PATH: z.string().min(1).default('./data/bot.db'),
  LOG_DIR: z.string().min(1).default('./logs'),
  DEFAULT_LOCALE: z.enum(['ar', 'en']).default('ar'),
  DRY_RUN: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export { EnvError };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new EnvError(issues);
  }
  return result.data;
}
