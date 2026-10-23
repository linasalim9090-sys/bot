import { flattenKeys, loadLocales } from '../src/i18n/index.js';

const locales = loadLocales();
const arKeys = new Set(flattenKeys(locales.ar));
const enKeys = new Set(flattenKeys(locales.en));

let hasError = false;

for (const key of arKeys) {
  if (!enKeys.has(key)) {
    console.error(`Missing English key for: ${key}`);
    hasError = true;
  }
}

for (const key of enKeys) {
  if (!arKeys.has(key)) {
    console.error(`Missing Arabic key for: ${key}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log(`i18n check passed: ${arKeys.size} keys match between Arabic and English.`);
}
