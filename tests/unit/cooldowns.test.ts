import { describe, expect, it } from 'vitest';
import { CooldownService } from '../../src/core/cooldowns.js';

describe('CooldownService', () => {
  it('allows once, denies until expiry, then allows again', () => {
    const cooldowns = new CooldownService();
    expect(cooldowns.check('k', 5000, 1000)).toEqual({ allowed: true });
    expect(cooldowns.check('k', 5000, 1500)).toEqual({ allowed: false, retryAt: 6000 });
    expect(cooldowns.check('k', 5000, 7000)).toEqual({ allowed: true });
  });

  it('clears a key', () => {
    const cooldowns = new CooldownService();
    cooldowns.check('k', 5000, 1000);
    cooldowns.clear('k');
    expect(cooldowns.check('k', 5000, 1001)).toEqual({ allowed: true });
  });
});
