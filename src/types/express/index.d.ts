import type { Request } from 'express';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: 'annotator' | 'admin';
      name?: string;
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
