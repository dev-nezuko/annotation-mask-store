import { existsSync } from 'fs';

// Imported first by src/index.ts so that src/config/env.ts sees the values.
// Variables already present in the environment (e.g. from Compose) win.
if (existsSync('.env')) process.loadEnvFile('.env');
