import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({ error: { message: 'Not Found' } });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: { message: 'Validation error', details: err.errors } });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: { message: 'Validation error', details: err.errors } });
  }

  res.status(status).json({ error: { message } });
}
