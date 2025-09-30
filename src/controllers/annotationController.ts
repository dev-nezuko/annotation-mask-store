import { Request, Response } from 'express';
import { AnnotationService } from '../services/AnnotationService';
import { parsePagination } from '../utils/pagination';

export async function createAnnotation(req: Request, res: Response) {
  const payload = { ...req.body };
  if (!payload.createdBy && req.user?.id) payload.createdBy = req.user.id;
  const ann = await AnnotationService.create(payload);
  res.status(201).json(ann);
}

export async function getAnnotationById(req: Request, res: Response) {
  const { id } = req.params;
  const ann = await AnnotationService.getById(id);
  res.json(ann);
}

export async function queryAnnotations(req: Request, res: Response) {
  const { label, annotator, imageId, projectId } = req.query as Record<string, string>;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
  const result = await AnnotationService.query({ label, annotator, imageId, projectId, page, limit });
  res.json(result);
}

export async function getAnnotationRank(req: Request, res: Response) {
  const { id } = req.params;
  const payload = await AnnotationService.rank(id);
  res.json(payload);
}
