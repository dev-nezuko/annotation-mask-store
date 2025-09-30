import { NextFunction, Request, Response } from 'express';
import logger from '../lib/logger';
import { ApiError } from '../lib/errors';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: 'Not Found' } });
}

type HttpishError = Error & { status?: number; type?: string; code?: number; errors?: unknown; issues?: unknown };

export function errorHandler(err: HttpishError, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: { message: 'Validation error', details: err.issues } });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: { message: 'Validation error', details: err.errors } });
  }
  // Two signups for the same email can both pass the exists() check.
  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'Resource already exists' } });
  }
  // body-parser marks its own failures with a 4xx status and a type.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Request body too large' } });
  }

  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: { message: 'Internal Server Error' } });
}
