import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import type { Command } from './command.js';

export type Importer = (url: string) => Promise<unknown>;

export class CommandRegistry {
  private readonly commands = new Map<string, Command>();
  private readonly importer: Importer;

  constructor(importer?: Importer) {
    this.importer = importer ?? ((url: string) => import(url));
  }

  register(command: Command): void {
    if (!command || !command.data || !command.meta) {
      throw new Error('Command must have data and meta properties.');
    }
    if (this.commands.has(command.data.name)) {
      throw new Error(`Duplicate command registered: ${command.data.name}`);
    }
    this.commands.set(command.data.name, command);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  all(): Command[] {
    return Array.from(this.commands.values());
  }

  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return this.all().map((cmd) => cmd.data.toJSON());
  }

  async loadFromDirectory(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      return;
    }

    const commandFiles: string[] = [];

    const scan = (currentDir: string): void => {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (entry.endsWith('.command.ts') || entry.endsWith('.command.js')) {
          commandFiles.push(fullPath);
        }
      }
    };

    scan(dir);

    for (const file of commandFiles) {
      const fileUrl = pathToFileURL(file).href;
      const mod = (await this.importer(fileUrl)) as { default?: Command };
      const command = mod?.default;
      if (!command || !command.data || !command.meta) {
        throw new Error(`Command file ${file} must have default export with data and meta`);
      }
      this.register(command);
    }
  }
}
