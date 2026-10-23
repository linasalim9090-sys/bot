import { writeFileSync } from 'node:fs';
import { PermissionFlagsBits, type PermissionResolvable, PermissionsBitField } from 'discord.js';

export async function validateToken(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; username: string }> {
  const res = await fetchImpl('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to validate token: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { id?: string; username?: string };
  if (!data || !data.id || !data.username) {
    throw new Error('Malformed response from Discord API for user info');
  }

  return { id: data.id, username: data.username };
}

export async function validateGuild(
  token: string,
  guildId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; name: string }> {
  const res = await fetchImpl(`https://discord.com/api/v10/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to validate guild: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { id?: string; name?: string };
  if (!data || !data.id || !data.name) {
    throw new Error('Malformed response from Discord API for guild info');
  }

  return { id: data.id, name: data.name };
}

export function buildInviteUrl(
  clientId: string,
  permissions: PermissionResolvable[],
): string {
  const bitfield = permissions.reduce<bigint>((acc, perm) => {
    const bit =
      typeof perm === 'string' && perm in PermissionFlagsBits
        ? PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits]
        : PermissionsBitField.resolve(perm);
    return acc | bit;
  }, 0n);

  const scope = encodeURIComponent('bot applications.commands');
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=${scope}&permissions=${bitfield.toString()}`;
}

export function writeEnvFile(filePath: string, values: Record<string, string>): void {
  const lines = Object.entries(values).map(([key, val]) => `${key}=${val}`);
  writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}
