import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { loadLocales } from '../src/i18n/index.js';
import { containsEmoji } from '../src/ui/emoji.js';

let hasEmoji = false;

// 1. Scan locales
const locales = loadLocales();
for (const [localeName, messages] of Object.entries(locales)) {
  for (const [key, value] of Object.entries(messages)) {
    if (containsEmoji(value)) {
      console.error(`Emoji detected in locale '${localeName}', key '${key}': ${value}`);
      hasEmoji = true;
    }
  }
}

// 2. Scan all .ts and .json files under src (except src/ui/emoji.ts)
function scanDir(dir: string): void {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.json')) &&
      !fullPath.endsWith(path.join('src', 'ui', 'emoji.ts'))
    ) {
      const content = readFileSync(fullPath, 'utf8');
      if (containsEmoji(content)) {
        console.error(`Emoji detected in file: ${fullPath}`);
        hasEmoji = true;
      }
    }
  }
}

scanDir(path.resolve('src'));

if (hasEmoji) {
  console.error('Emoji check failed: Bot files or translations contain disallowed emojis.');
  process.exit(1);
} else {
  console.log('Emoji guard passed: 0 emojis detected in src codebase and translations.');
}
