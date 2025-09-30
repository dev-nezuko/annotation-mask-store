import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDb } from './config/db';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  await connectDb();
  const server = http.createServer(app);
  server.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
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
  console.error('Startup failed; check database configuration and connectivity');
  process.exit(1);
});
