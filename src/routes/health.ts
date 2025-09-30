import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req, res) => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState as 0 | 1 | 2 | 3;
  res.json({
    service: 'PearlAI API',
    status: 'ok',
    uptime: process.uptime(),
    db: {
      state: stateMap[readyState] || 'unknown',
      readyState,
    },
  });
});

export default router;
