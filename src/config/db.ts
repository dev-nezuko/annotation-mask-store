import mongoose from 'mongoose';
// Simple Mongoose connection helper
import logger from '../lib/logger';
import { env } from './env';

export async function connectDb() {
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(uri);
  return mongoose.connection;
}
