import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../src/core/version.js';

describe('toolchain', () => {
  it('runs on Node 22 or newer', () => {
    expect(Number(process.versions.node.split('.')[0])).toBeGreaterThanOrEqual(22);
  });

  it('exposes the app version', () => {
    expect(APP_VERSION).toBe('0.1.0');
  });
});
