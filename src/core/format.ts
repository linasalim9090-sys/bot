import type { Translator } from '../i18n/index.js';

export function formatDuration(ms: number, t: Translator): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${t('time.day')}`);
  if (hours > 0) parts.push(`${hours} ${t('time.hour')}`);
  if (minutes > 0) parts.push(`${minutes} ${t('time.minute')}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${t('time.second')}`);

  return parts.join(t('time.and'));
}
