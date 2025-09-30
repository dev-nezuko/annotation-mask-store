import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
  // HS256 is only as strong as its key; refuse to start with a guessable one.
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters (e.g. `openssl rand -hex 32`)')
    .refine((s) => !/^<.*>$/.test(s), 'JWT_SECRET is still the .env.example placeholder'),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 15m, 1h or 7d').default('1h'),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse({
    PORT: source.PORT,
    MONGODB_URI: source.MONGODB_URI,
    LOG_LEVEL: source.LOG_LEVEL,
    JWT_SECRET: source.JWT_SECRET,
    JWT_EXPIRES_IN: source.JWT_EXPIRES_IN,
  });
  if (!result.success) throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  return result.data;
}

export const env = parseEnv(process.env);
