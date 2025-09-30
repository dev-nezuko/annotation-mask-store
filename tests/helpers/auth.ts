import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';
import { signToken } from '../../src/lib/tokens';

let counter = 0;

/** Signs up a fresh annotator through the API and returns its id and Bearer header. */
export async function signUpAnnotator(name = 'Annotator') {
  counter += 1;
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name, email: `${name.toLowerCase()}-${counter}@example.com`, password: 'correct horse battery' })
    .expect(201);
  return { id: res.body.user.id as string, auth: { Authorization: `Bearer ${res.body.token}` } };
}

/** Admins cannot sign up through the API, so tests create one directly. */
export async function createAdmin() {
  counter += 1;
  const user = await User.create({ name: 'Admin', email: `admin-${counter}@example.com`, role: 'admin' });
  const token = signToken({ id: String(user._id), email: user.email, role: 'admin', name: user.name });
  return { id: String(user._id), auth: { Authorization: `Bearer ${token}` } };
}
