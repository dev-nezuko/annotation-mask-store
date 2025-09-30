import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../src/middleware/errorHandler';
import { ApiError } from '../../src/lib/errors';

function run(err: Error) {
  const res = { headersSent: false, status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  errorHandler(err, { originalUrl: '/api/x' } as Request, res as unknown as Response, vi.fn() as NextFunction);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

describe('errorHandler', () => {
  it('passes ApiError status, message and details through', () => {
    expect(run(ApiError.conflict('taken', { field: 'email' }))).toEqual({
      status: 409,
      body: { error: { message: 'taken', details: { field: 'email' } } },
    });
  });

  it('does not leak the message of unexpected errors', () => {
    const out = run(new Error('connection to db-7.internal:27017 refused'));
    expect(out).toEqual({ status: 500, body: { error: { message: 'Internal Server Error' } } });
  });

  it('maps duplicate-key races to 409', () => {
    const dup = Object.assign(new Error('E11000 duplicate key error collection: users'), { code: 11000 });
    expect(run(dup).status).toBe(409);
  });
});
