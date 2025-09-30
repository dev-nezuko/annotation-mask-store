import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { signUpAnnotator } from '../helpers/auth';
import { useTestDatabase } from '../helpers/db';

useTestDatabase();

let auth: Record<string, string>;
let projectId: string;
let imageId: string;

beforeEach(async () => {
  ({ auth } = await signUpAnnotator('Val'));
  const project = await request(app).post('/api/projects').set(auth).send({ name: 'Checks' }).expect(201);
  projectId = project.body._id;
  const images = await request(app)
    .post(`/api/projects/${projectId}/images`)
    .set(auth)
    .send({ images: [{ uri: 'https://example.com/v.jpg', width: 10, height: 10 }] })
    .expect(201);
  imageId = images.body.images[0]._id;
});

const tri = { type: 'polygon', polygons: [{ rings: [[[0, 0], [4, 0], [0, 4]]] }] };

describe('project and image bodies', () => {
  it('requires a non-blank project name', async () => {
    const res = await request(app).post('/api/projects').set(auth).send({ name: '   ' }).expect(400);
    expect(res.body.error.message).toBe('Validation error');
    await request(app).post('/api/projects').set(auth).send({ name: { $ne: null } }).expect(400);
  });

  it('rejects images with non-integer or non-positive sizes and bad URIs', async () => {
    const post = (img: object) => request(app).post(`/api/projects/${projectId}/images`).set(auth).send({ images: [img] });
    await post({ uri: 'https://example.com/a.jpg', width: 0, height: 10 }).expect(400);
    await post({ uri: 'https://example.com/a.jpg', width: 10.5, height: 10 }).expect(400);
    await post({ uri: 'https://example.com/a.jpg', width: '10', height: 10 }).expect(400);
    await post({ uri: 'not a uri', width: 10, height: 10 }).expect(400);
    await request(app).post(`/api/projects/${projectId}/images`).set(auth).send({ images: [] }).expect(400);
  });

  it('ignores a client-supplied status: imported images start unassigned', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/images`)
      .set(auth)
      .send({ images: [{ uri: 'https://example.com/s.jpg', width: 4, height: 4, status: 'annotated' }] })
      .expect(201);
    expect(res.body.images[0].status).toBe('unassigned');
  });
});

describe('annotation body', () => {
  it('requires image, label and a known segmentation type', async () => {
    const post = (body: object) => request(app).post('/api/annotations').set(auth).send(body);
    await post({ label: 'x', segmentation: tri }).expect(400);
    await post({ image: imageId, segmentation: tri }).expect(400);
    await post({ image: imageId, label: 'x', segmentation: { type: 'bbox' } }).expect(400);
    await post({ image: 'nope', label: 'x', segmentation: tri }).expect(400);
    await post({ image: imageId, label: 'x', segmentation: tri }).expect(201);
  });
});

describe('GET /api/annotations query', () => {
  it('rejects operator objects in place of a label', async () => {
    await request(app).get('/api/annotations?label[$ne]=cat').set(auth).expect(400);
  });

  it('rejects non-numeric and out-of-range paging instead of passing NaN to Mongo', async () => {
    await request(app).get('/api/annotations').query({ page: 'abc' }).set(auth).expect(400);
    await request(app).get('/api/annotations').query({ limit: 500 }).set(auth).expect(400);
    await request(app).get('/api/annotations').query({ page: 0 }).set(auth).expect(400);
  });

  it('defaults to the first page of 20', async () => {
    const res = await request(app).get('/api/annotations').set(auth).expect(200);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 0 });
  });

  it('rejects malformed id filters', async () => {
    await request(app).get('/api/annotations').query({ imageId: 'abc' }).set(auth).expect(400);
  });
});

describe('mask geometry', () => {
  it('rejects polygons that reach outside the image', async () => {
    const outside = { type: 'polygon', polygons: [{ rings: [[[0, 0], [11, 0], [0, 4]]] }] };
    const res = await request(app).post('/api/annotations').set(auth).send({ image: imageId, label: 'x', segmentation: outside }).expect(400);
    expect(res.body.error.message).toMatch(/within the 10x10 image/);
    const edge = { type: 'polygon', polygons: [{ rings: [[[0, 0], [10, 0], [10, 10]]] }] };
    await request(app).post('/api/annotations').set(auth).send({ image: imageId, label: 'x', segmentation: edge }).expect(201);
  });

  it('rejects RLE that claims more pixels than the mask has', async () => {
    const inflated = { type: 'rle', size: [10, 10], counts: [0, 1000000] };
    await request(app).post('/api/annotations').set(auth).send({ image: imageId, label: 'x', segmentation: inflated }).expect(400);
    const full = { type: 'rle', size: [10, 10], counts: [0, 100] };
    const res = await request(app).post('/api/annotations').set(auth).send({ image: imageId, label: 'x', segmentation: full }).expect(201);
    expect(res.body.area).toBe(100);
  });
});

describe('request bodies', () => {
  it('answers 400 for malformed JSON', async () => {
    const res = await request(app).post('/api/projects').set(auth).set('Content-Type', 'application/json').send('{"name":').expect(400);
    expect(res.body).toEqual({ error: { message: 'Malformed JSON body' } });
  });

  it('answers 413 for bodies over the size limit', async () => {
    const huge = JSON.stringify({ name: 'x'.repeat(11 * 1024 * 1024) });
    await request(app).post('/api/projects').set(auth).set('Content-Type', 'application/json').send(huge).expect(413);
  });

  it('answers 404 in the standard error shape for unknown routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body).toEqual({ error: { message: 'Not Found' } });
  });
});
