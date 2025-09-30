import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { afterAll, beforeAll, beforeEach } from 'vitest';

/**
 * Connects mongoose to a throwaway database on the server in TEST_MONGODB_URI
 * (a real mongod, e.g. the `mongo` service in docker-compose.yml) and drops it
 * afterwards.
 */
export function useTestDatabase() {
  beforeAll(async () => {
    const base = process.env.TEST_MONGODB_URI;
    if (!base) {
      throw new Error('TEST_MONGODB_URI is not set; API tests need a MongoDB server (see README "Tests")');
    }
    const url = new URL(base);
    url.pathname = `/annotations_test_${randomUUID().slice(0, 8)}`;
    await mongoose.connect(url.toString(), { serverSelectionTimeoutMS: 10_000 });
    await mongoose.connection.syncIndexes();
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}
