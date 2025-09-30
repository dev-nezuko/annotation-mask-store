import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env';

const secret = 'x'.repeat(32);

describe('parseEnv', () => {
  it('refuses to start without a JWT secret or with a short one', () => {
    expect(() => parseEnv({})).toThrow(/JWT_SECRET/);
    expect(() => parseEnv({ JWT_SECRET: 'change-me-please' })).toThrow(/at least 32/);
    expect(() => parseEnv({ JWT_SECRET: '<replace-with-a-long-random-secret>' })).toThrow(/placeholder/);
  });

  it('defaults the token lifetime to one hour and validates its format', () => {
    expect(parseEnv({ JWT_SECRET: secret }).JWT_EXPIRES_IN).toBe('1h');
    expect(parseEnv({ JWT_SECRET: secret, JWT_EXPIRES_IN: '15m' }).JWT_EXPIRES_IN).toBe('15m');
    expect(() => parseEnv({ JWT_SECRET: secret, JWT_EXPIRES_IN: 'forever' })).toThrow(/JWT_EXPIRES_IN/);
  });
});
