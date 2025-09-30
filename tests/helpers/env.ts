// src/config/env.ts parses process.env on import, so test defaults go in first.
process.env.JWT_SECRET ??= 'test-only-secret-0123456789abcdef0123456789abcdef';
process.env.LOG_LEVEL ??= 'silent';
