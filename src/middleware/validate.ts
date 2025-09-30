import { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/** Replaces req.body / req.query / req.params with their parsed values; a ZodError goes to the error handler. */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params'];
    // Express 5 exposes req.query as a getter, so it has to be redefined rather than assigned.
    if (schemas.query) {
      Object.defineProperty(req, 'query', { value: schemas.query.parse(req.query), enumerable: true });
    }
    if (schemas.body) req.body = schemas.body.parse(req.body);
    next();
  };
}
