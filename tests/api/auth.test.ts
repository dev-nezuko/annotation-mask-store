import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app';
import { verifyToken } from '../../src/lib/tokens';
import { useTestDatabase } from '../helpers/db';

useTestDatabase();

const ada = { name: 'Ada', email: 'ada@example.com', password: 'correct horse battery' };

describe('POST /api/auth/signup', () => {
  it('refuses a self-assigned admin role', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...ada, role: 'admin' }).expect(400);
    expect(JSON.stringify(res.body)).toContain('role');
  });

  it('always issues annotator tokens', async () => {
    const res = await request(app).post('/api/auth/signup').send(ada).expect(201);
    expect(res.body.user.role).toBe('annotator');
    expect(verifyToken(res.body.token).role).toBe('annotator');
  });

  it('stores emails lowercased so case variants cannot register twice', async () => {
    await request(app).post('/api/auth/signup').send({ ...ada, email: '  Ada@Example.COM ' }).expect(201);
    await request(app).post('/api/auth/signup').send(ada).expect(409);
    await request(app).post('/api/auth/login').send({ email: 'ADA@example.com', password: ada.password }).expect(200);
  });

  it('rejects short passwords, passwords bcrypt would truncate and malformed emails', async () => {
    await request(app).post('/api/auth/signup').send({ ...ada, password: 'short' }).expect(400);
    await request(app).post('/api/auth/signup').send({ ...ada, password: 'é'.repeat(37) }).expect(400);
    await request(app).post('/api/auth/signup').send({ ...ada, email: 'not-an-email' }).expect(400);
  });
});

describe('POST /api/auth/login', () => {
  it('rejects query operators in place of an email', async () => {
    await request(app).post('/api/auth/signup').send(ada).expect(201);
    await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: ada.password }).expect(400);
  });

  it('gives the same answer for an unknown email and a wrong password', async () => {
    await request(app).post('/api/auth/signup').send(ada).expect(201);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever1' }).expect(401);
    const wrong = await request(app).post('/api/auth/login').send({ email: ada.email, password: 'whatever1' }).expect(401);
    expect(unknown.body).toEqual(wrong.body);
  });
});
