import { Request, Response } from 'express';
import { ImageService } from '../services/ImageService';

export async function createImagesForProject(req: Request, res: Response) {
  const { projectId } = req.params;
  const result = await ImageService.createForProject(req.user!, projectId, req.body.images);
  res.status(201).json(result);
}

export async function getImageById(req: Request, res: Response) {
  const { id } = req.params;
  const image = await ImageService.getById(req.user!, id);
  res.json(image);
}
