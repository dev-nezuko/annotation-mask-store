import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDb } from './config/db';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  connectDb().catch((err) => {
    console.error('MongoDB connection error at startup', err);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forcing shutdown');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
