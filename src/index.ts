import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import logger from './lib/logger';

const PORT = env.PORT;

async function start() {
  const server = http.createServer(app);
  server.listen(PORT, () => {
    logger.info({ port: PORT }, '[PearlAI] Server listening');
  });

  connectDb().catch((err) => {
    logger.error({ err }, 'MongoDB connection error at startup');
  });

  const shutdown = (signal: string) => {
    logger.warn({ signal }, 'Shutdown signal received, closing server...');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forcing shutdown');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
