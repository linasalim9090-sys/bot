import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('dist/i18n', { recursive: true });
cpSync('src/i18n/ar.json', 'dist/i18n/ar.json');
cpSync('src/i18n/en.json', 'dist/i18n/en.json');
