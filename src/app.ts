import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './lib/logger';
import { attachUserIfPresent } from './middleware/auth';

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachUserIfPresent);
app.use(pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, _res: ServerResponse) => (req.headers['x-request-id'] as string) || randomUUID(),
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
  customLogLevel: (_req, res, err) => {
    const code = (res as any)?.statusCode ?? 0;
    if (err || code >= 500) return 'error';
    if (code >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err?.message || 'error'}`,
  serializers: {
    req: (req) => ({ id: (req as any).id, method: req.method, url: (req as any).originalUrl || req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
