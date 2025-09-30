import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/tokens';
import { ApiError } from '../lib/errors';

export class AuthService {
  static async signup(input: { name: string; email: string; password: string; role?: 'annotator' | 'admin' }) {
    const { name, email, password, role = 'annotator' } = input;
    if (!name) throw ApiError.badRequest('name is required');
    if (!email) throw ApiError.badRequest('email is required');
    if (!password) throw ApiError.badRequest('password is required');

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict('user with this email already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });

    const token = signToken({ id: String(user._id), email: user.email, role: user.role, name: user.name });
    return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
  }

  static async login(input: { email: string; password: string }) {
    const { email, password } = input;
    if (!email || !password) throw ApiError.badRequest('email and password are required');

    const user = await User.findOne({ email });
    if (!user?.passwordHash) throw ApiError.unauthorized('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid credentials');

    const token = signToken({ id: String(user._id), email: user.email, role: user.role, name: user.name });
    return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
  }
}
