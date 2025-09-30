import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { env } from '../../src/config/env';
import { createAdmin, signUpAnnotator } from '../helpers/auth';
import { useTestDatabase } from '../helpers/db';

useTestDatabase();

type Who = Awaited<ReturnType<typeof signUpAnnotator>>;
const square = { type: 'polygon', polygons: [{ rings: [[[0, 0], [4, 0], [4, 4], [0, 4]]] }] };

let owner: Who;
let other: Who;
let projectId: string;
let imageId: string;
let annotationId: string;

beforeEach(async () => {
  owner = await signUpAnnotator('Owner');
  other = await signUpAnnotator('Other');
  const project = await request(app).post('/api/projects').set(owner.auth).send({ name: 'Private set' }).expect(201);
  projectId = project.body._id;
  const images = await request(app)
    .post(`/api/projects/${projectId}/images`)
    .set(owner.auth)
    .send({ images: [{ uri: 'https://example.com/p.jpg', width: 32, height: 32 }] })
    .expect(201);
  imageId = images.body.images[0]._id;
  const ann = await request(app).post('/api/annotations').set(owner.auth).send({ image: imageId, label: 'cat', segmentation: square }).expect(201);
  annotationId = ann.body._id;
});

describe('authentication', () => {
  it('requires a Bearer token on every data route', async () => {
    await request(app).post('/api/projects').send({ name: 'x' }).expect(401);
    await request(app).get(`/api/projects/${projectId}`).expect(401);
    await request(app).get(`/api/images/${imageId}`).expect(401);
    await request(app).get('/api/annotations').expect(401);
    await request(app).get(`/api/annotations/${annotationId}/rank`).expect(401);
  });

  it('answers 401 for an expired or forged token instead of treating it as anonymous', async () => {
    const expired = jwt.sign({ email: 'o@example.com', role: 'annotator' }, env.JWT_SECRET, { subject: owner.id, expiresIn: -1 });
    const res = await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${expired}`).expect(401);
    expect(res.body.error.message).toBe('Invalid or expired token');
    await request(app).get(`/api/projects/${projectId}`).set('Authorization', 'Bearer not.a.jwt').expect(401);
  });

  it('keeps the health check public', async () => {
    await request(app).get('/api/health').expect(200);
  });
});

describe('ownership', () => {
  it('records the caller as project owner and annotation author, ignoring the body', async () => {
    const project = await request(app).get(`/api/projects/${projectId}`).set(owner.auth).expect(200);
    expect(project.body.createdBy).toBe(owner.id);

    const spoofed = await request(app)
      .post('/api/annotations')
      .set(owner.auth)
      .send({ image: imageId, label: 'cat', segmentation: square, createdBy: other.id })
      .expect(201);
    expect(spoofed.body.createdBy).toBe(owner.id);
  });

  it("hides another user's project, images and annotations behind 404", async () => {
    await request(app).get(`/api/projects/${projectId}`).set(other.auth).expect(404);
    await request(app).get(`/api/projects/${projectId}/stats`).set(other.auth).expect(404);
    await request(app).get(`/api/images/${imageId}`).set(other.auth).expect(404);
    await request(app).get(`/api/annotations/${annotationId}`).set(other.auth).expect(404);
    await request(app).get(`/api/annotations/${annotationId}/rank`).set(other.auth).expect(404);
    await request(app).get('/api/annotations').query({ projectId }).set(other.auth).expect(404);
  });

  it("refuses writes into another user's project", async () => {
    await request(app)
      .post(`/api/projects/${projectId}/images`)
      .set(other.auth)
      .send({ images: [{ uri: 'https://example.com/x.jpg', width: 8, height: 8 }] })
      .expect(404);
    await request(app).post('/api/annotations').set(other.auth).send({ image: imageId, label: 'dog', segmentation: square }).expect(404);
  });

  it('scopes an unfiltered annotation listing to the caller’s projects', async () => {
    const mine = await request(app).get('/api/annotations').set(owner.auth).expect(200);
    expect(mine.body.total).toBe(1);
    const theirs = await request(app).get('/api/annotations').set(other.auth).expect(200);
    expect(theirs.body).toMatchObject({ total: 0, items: [] });
  });

  it('lets an admin read every project', async () => {
    const admin = await createAdmin();
    await request(app).get(`/api/projects/${projectId}/stats`).set(admin.auth).expect(200);
    await request(app).get(`/api/annotations/${annotationId}`).set(admin.auth).expect(200);
    const all = await request(app).get('/api/annotations').set(admin.auth).expect(200);
    expect(all.body.total).toBe(1);
  });
});
