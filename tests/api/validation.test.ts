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
