import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);

// bcrypt only looks at the first 72 bytes, so longer passwords would be
// silently truncated.
const password = z
  .string()
  .min(8, 'password must be at least 8 characters')
  .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'password must be at most 72 bytes');

// No role field: everyone signs up as an annotator. strict() turns an
// attempt to send one into a 400 instead of silently dropping it.
export const SignupBody = z.object({ name: z.string().trim().min(1).max(100), email, password }).strict();

export const LoginBody = z.object({ email, password: z.string().min(1).max(1024) });
