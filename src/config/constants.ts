export const MODULE_NAMES = [
  'core',
  'security',
  'moderation',
  'logging',
  'community',
  'leveling',
  'economy',
  'tickets',
  'music',
  'utility',
  'fun',
] as const;

export type ModuleName = (typeof MODULE_NAMES)[number];
export const DEFAULT_MODULES: Record<ModuleName, boolean> = Object.fromEntries(
  MODULE_NAMES.map((name) => [name, true]),
) as Record<ModuleName, boolean>;
