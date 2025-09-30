import { Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';

export async function createProject(req: Request, res: Response) {
  const project = await ProjectService.create(req.body);
  res.status(201).json(project);
}

export async function getProjectById(req: Request, res: Response) {
  const { id } = req.params;
  const project = await ProjectService.getById(id);
  res.json(project);
}

export async function getProjectStats(req: Request, res: Response) {
  const { id } = req.params;
  const stats = await ProjectService.stats(id);
  res.json(stats);
}
