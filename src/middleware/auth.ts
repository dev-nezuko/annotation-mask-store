import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import logger from '../lib/logger';
import { verifyToken } from '../lib/tokens';

function parseAuthHeader(req: Request): string | null {
  const h = req.headers['authorization'];
  if (!h || Array.isArray(h)) return null;
  const [scheme, token] = h.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  return token || null;
}

export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = parseAuthHeader(req);
    if (token) req.user = verifyToken(token);
  } catch (err) {
    logger.warn({ err }, 'Failed to parse/verify JWT');
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.AUTH_REQUIRED) return next();
  if (req.user?.id) return next();
  return res.status(401).json({ error: { message: 'Unauthorized' } });
}
