import pino from 'pino';
import { env } from '../config/env';

const level = env.LOG_LEVEL;

const logger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
