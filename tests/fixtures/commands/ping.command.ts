import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../src/core/command.js';

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription('Ping command'),
  meta: {
    module: 'core',
    cooldownMs: 3000,
    defer: false,
    usage: '/ping',
  },
  execute: async () => {},
});
