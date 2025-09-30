import { NextFunction, Request, Response } from 'express';
import logger from '../lib/logger';
import { ApiError } from '../lib/errors';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    return;
  }
  logger.warn({ method: req.method, url: req.originalUrl }, 'Route not found');
  res.status(404).json({ error: { message: 'Not Found' } });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    return _next(err);
  }
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (err instanceof ApiError) {
    logger.warn({ err, path: req.originalUrl }, 'API error');
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }

  if (err?.name === 'ZodError') {
    logger.warn({ err, path: req.originalUrl }, 'Validation error (Zod)');
    return res.status(400).json({ error: { message: 'Validation error', details: err.errors } });
  }
  if (err?.name === 'ValidationError') {
    logger.warn({ err, path: req.originalUrl }, 'Validation error (Mongoose)');
    return res.status(400).json({ error: { message: 'Validation error', details: err.errors } });
  }

  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  res.status(status).json({ error: { message } });
}
