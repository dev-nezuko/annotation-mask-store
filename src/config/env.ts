import { z } from 'zod';

const RawEnv = {
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  LOG_LEVEL: process.env.LOG_LEVEL,
  JWT_SECRET: process.env.JWT_SECRET,
  AUTH_REQUIRED: process.env.AUTH_REQUIRED,
};

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
  JWT_SECRET: z.string().optional(),
  AUTH_REQUIRED: z.coerce.boolean().default(false),
});

export const env = EnvSchema.parse(RawEnv);
