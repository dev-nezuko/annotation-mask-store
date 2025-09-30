import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({ error: { message: 'Not Found' } });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal Server Error' : err.message || 'Request failed';

  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: { message: 'Validation error' } });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: { message: 'Validation error' } });
  }

  res.status(status).json({ error: { message } });
}
