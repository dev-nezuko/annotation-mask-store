import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../lib/logger';

type TokenUser = { id: string; email: string; role: 'annotator' | 'admin'; name?: string };

type JwtPayload = {
  sub: string;
  email: string;
  role: 'annotator' | 'admin';
  name?: string;
  iat?: number;
  exp?: number;
};

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
    if (token && env.JWT_SECRET) {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (req as any).user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name } as TokenUser;
    }
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
