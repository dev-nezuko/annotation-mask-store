import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export async function signup(req: Request, res: Response) {
  const result = await AuthService.signup(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await AuthService.login(req.body);
  res.json(result);
}
