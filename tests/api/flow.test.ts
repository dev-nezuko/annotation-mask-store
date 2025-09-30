import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app';
import { useTestDatabase } from '../helpers/db';

useTestDatabase();

const square = (x: number, y: number, s: number) => ({
  type: 'polygon',
  polygons: [{ rings: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s]]] }],
});

async function seedImage() {
  const project = await request(app).post('/api/projects').send({ name: 'Street scenes' }).expect(201);
  const images = await request(app)
    .post(`/api/projects/${project.body._id}/images`)
    .send({ images: [{ uri: 'https://example.com/a.jpg', width: 64, height: 48 }] })
    .expect(201);
  return { projectId: project.body._id as string, imageId: images.body.images[0]._id as string };
}

describe('health', () => {
  it('reports the database connection state', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', db: { state: 'connected' } });
  });
});

describe('auth', () => {
  it('signs up, then logs in with the same password', async () => {
    const creds = { name: 'Ada', email: 'ada@example.com', password: 'correct horse battery' };
    const signup = await request(app).post('/api/auth/signup').send(creds).expect(201);
    expect(signup.body.user).toMatchObject({ email: 'ada@example.com', role: 'annotator' });
    expect(signup.body.user).not.toHaveProperty('passwordHash');
    expect(typeof signup.body.token).toBe('string');

    const login = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password }).expect(200);
    expect(login.body.user.id).toBe(signup.body.user.id);
  });

  it('rejects a wrong password and a duplicate email', async () => {
    const creds = { name: 'Ada', email: 'ada@example.com', password: 'correct horse battery' };
    await request(app).post('/api/auth/signup').send(creds).expect(201);
    await request(app).post('/api/auth/signup').send(creds).expect(409);
    await request(app).post('/api/auth/login').send({ email: creds.email, password: 'nope-nope' }).expect(401);
  });
});

describe('annotations', () => {
  it('computes the area server-side and ranks annotations by area within an image', async () => {
    const { projectId, imageId } = await seedImage();
    const small = await request(app).post('/api/annotations').send({ image: imageId, label: 'car', segmentation: square(0, 0, 4) }).expect(201);
    const big = await request(app).post('/api/annotations').send({ image: imageId, label: 'car', segmentation: square(10, 10, 20) }).expect(201);
    expect(small.body.area).toBe(16);
    expect(big.body.project).toBe(projectId);

    const rank = await request(app).get(`/api/annotations/${small.body._id}/rank`).expect(200);
    expect(rank.body).toMatchObject({ rank: 2, total: 2, area: 16 });

    const image = await request(app).get(`/api/images/${imageId}`).expect(200);
    expect(image.body.status).toBe('annotated');
  });

  it('accepts RLE whose size matches the image and rejects one that does not', async () => {
    const { imageId } = await seedImage();
    const ok = await request(app)
      .post('/api/annotations')
      .send({ image: imageId, label: 'sky', segmentation: { type: 'rle', size: [48, 64], counts: [100, 50, 2922] } })
      .expect(201);
    expect(ok.body.area).toBe(50);

    await request(app)
      .post('/api/annotations')
      .send({ image: imageId, label: 'sky', segmentation: { type: 'rle', size: [64, 48], counts: [100, 50, 2922] } })
      .expect(400);
  });

  it('rejects a client area that disagrees with the computed one', async () => {
    const { imageId } = await seedImage();
    await request(app).post('/api/annotations').send({ image: imageId, label: 'car', segmentation: square(0, 0, 4), area: 17 }).expect(400);
  });

  it('filters by label and paginates', async () => {
    const { imageId, projectId } = await seedImage();
    for (const label of ['car', 'car', 'car', 'tree']) {
      await request(app).post('/api/annotations').send({ image: imageId, label, segmentation: square(0, 0, 2) }).expect(201);
    }
    const page = await request(app).get('/api/annotations').query({ label: 'car', projectId, limit: 2, page: 2 }).expect(200);
    expect(page.body).toMatchObject({ page: 2, limit: 2, total: 3 });
    expect(page.body.items).toHaveLength(1);
  });

  it('answers 400 for malformed ids and 404 for unknown ones', async () => {
    await request(app).get('/api/annotations/not-an-id').expect(400);
    await request(app).get('/api/annotations/64b7f0c2a1b2c3d4e5f60718').expect(404);
  });
});

describe('projects', () => {
  it('counts images and annotations per annotator', async () => {
    const { projectId, imageId } = await seedImage();
    await request(app).post('/api/annotations').send({ image: imageId, label: 'car', segmentation: square(0, 0, 2) }).expect(201);
    const stats = await request(app).get(`/api/projects/${projectId}/stats`).expect(200);
    expect(stats.body).toMatchObject({ images: 1, annotations: 1 });
    expect(stats.body.perAnnotator).toHaveLength(1);
  });
});
