import bcrypt from 'bcryptjs';
import type { HydratedDocument } from 'mongoose';
import { User, IUser } from '../models/User';
import { signToken } from '../lib/tokens';
import { ApiError } from '../lib/errors';

const BCRYPT_COST = 12;

// Compared against when the email is unknown so that a miss costs as much
// time as a wrong password and does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

function session(user: HydratedDocument<IUser>) {
  const id = String(user._id);
  return {
    user: { id, name: user.name, email: user.email, role: user.role },
    token: signToken({ id, email: user.email, role: user.role, name: user.name }),
  };
}

export class AuthService {
  static async signup(input: { name: string; email: string; password: string }) {
    const { name, email, password } = input;

    const existing = await User.exists({ email });
    if (existing) throw ApiError.conflict('user with this email already exists');

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await User.create({ name, email, passwordHash, role: 'annotator' });
    return session(user);
  }

  static async login(input: { email: string; password: string }) {
    const { email, password } = input;

    const user = await User.findOne({ email });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !ok) throw ApiError.unauthorized('Invalid credentials');

    return session(user);
  }
}
