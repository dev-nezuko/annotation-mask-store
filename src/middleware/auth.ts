import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors';
import { verifyToken } from '../lib/tokens';

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/** Populates req.user from a valid Bearer token or answers 401. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) return next(ApiError.unauthorized('Authentication required'));
  try {
    req.user = verifyToken(token);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
  next();
}
