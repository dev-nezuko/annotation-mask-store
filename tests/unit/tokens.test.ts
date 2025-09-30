import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env';
import { signToken, verifyToken } from '../../src/lib/tokens';

const user = { id: '64b7f0c2a1b2c3d4e5f60718', email: 'ada@example.com', role: 'annotator' as const, name: 'Ada' };

describe('signToken / verifyToken', () => {
  it('round-trips the caller and sets an HS256 header and an expiry', () => {
    const token = signToken(user);
    const decoded = jwt.decode(token, { complete: true })!;
    expect(decoded.header.alg).toBe('HS256');
    const payload = decoded.payload as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(3600);
    expect(verifyToken(token)).toEqual(user);
  });

  it('rejects unsigned tokens', () => {
    const none = jwt.sign({ email: user.email, role: 'admin' }, '', { algorithm: 'none', subject: user.id });
    expect(() => verifyToken(none)).toThrow();
  });

  it('rejects tokens signed with another algorithm, even with the right key', () => {
    const hs512 = jwt.sign({ email: user.email, role: 'admin' }, env.JWT_SECRET, { algorithm: 'HS512', subject: user.id });
    expect(() => verifyToken(hs512)).toThrow(/invalid algorithm/);
  });

  it('rejects expired tokens and tokens signed with a different secret', () => {
    const expired = jwt.sign({ email: user.email, role: 'annotator' }, env.JWT_SECRET, { subject: user.id, expiresIn: -10 });
    expect(() => verifyToken(expired)).toThrow(/expired/);
    const forged = jwt.sign({ email: user.email, role: 'admin' }, 'y'.repeat(40), { subject: user.id });
    expect(() => verifyToken(forged)).toThrow(/signature/);
  });

  it('rejects a token without a subject', () => {
    const noSub = jwt.sign({ email: user.email, role: 'annotator' }, env.JWT_SECRET, { expiresIn: 60 });
    expect(() => verifyToken(noSub)).toThrow(/sub/);
  });
});
