import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export async function signup(req: Request, res: Response) {
  const { name, email, password, role } = req.body || {};
  const result = await AuthService.signup({ name, email, password, role });
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  const result = await AuthService.login({ email, password });
  res.json(result);
}
