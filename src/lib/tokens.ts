import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type Role = 'annotator' | 'admin';
export type TokenUser = { id: string; email: string; role: Role; name?: string };

const ALGORITHM = 'HS256';

export function signToken(user: TokenUser): string {
  return jwt.sign({ email: user.email, role: user.role, name: user.name }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Returns the caller for a valid, unexpired HS256 token; throws otherwise. */
export function verifyToken(token: string): TokenUser {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new jwt.JsonWebTokenError('token payload is missing sub or email');
  }
  const role: Role = payload.role === 'admin' ? 'admin' : 'annotator';
  return { id: payload.sub, email: payload.email, role, name: typeof payload.name === 'string' ? payload.name : undefined };
}
