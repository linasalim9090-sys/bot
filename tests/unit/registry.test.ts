import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SlashCommandBuilder } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineCommand } from '../../src/core/command.js';
import { CommandRegistry } from '../../src/core/registry.js';

let dir!: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'nizam-reg-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('CommandRegistry', () => {
  it('registers commands from directory and exports toJSON', async () => {
    writeFileSync(path.join(dir, 'ping.command.ts'), '// dummy');
    writeFileSync(path.join(dir, 'help.command.ts'), '// dummy');

    const fakeImporter = async (url: string) => {
      if (url.includes('ping')) {
        return {
          default: defineCommand({
            data: new SlashCommandBuilder().setName('ping').setDescription('ping desc'),
            meta: { module: 'core', cooldownMs: 1000 },
            execute: async () => {},
          }),
        };
      }
      return {
        default: defineCommand({
          data: new SlashCommandBuilder().setName('help').setDescription('help desc'),
          meta: { module: 'core', cooldownMs: 1000 },
          execute: async () => {},
        }),
      };
    };

    const registry = new CommandRegistry(fakeImporter);
    await registry.loadFromDirectory(dir);

    expect(registry.all()).toHaveLength(2);
    expect(registry.get('ping')).toBeDefined();
    expect(registry.get('help')).toBeDefined();

    const json = registry.toJSON();
    const names = json.map((c) => c.name);
    expect(names).toContain('ping');
    expect(names).toContain('help');
  });

  it('throws on duplicate command name', async () => {
    const cmd1 = defineCommand({
      data: new SlashCommandBuilder().setName('test').setDescription('test 1'),
      meta: { module: 'core' },
      execute: async () => {},
    });
    const cmd2 = defineCommand({
      data: new SlashCommandBuilder().setName('test').setDescription('test 2'),
      meta: { module: 'core' },
      execute: async () => {},
    });

    const registry = new CommandRegistry();
    registry.register(cmd1);
    expect(() => registry.register(cmd2)).toThrowError(/Duplicate/);
  });

  it('throws when default export lacks data or meta', async () => {
    writeFileSync(path.join(dir, 'bad.command.ts'), '// dummy');
    const fakeImporter = async () => ({ default: {} });

    const registry = new CommandRegistry(fakeImporter);
    await expect(registry.loadFromDirectory(dir)).rejects.toThrow();
  });
});
