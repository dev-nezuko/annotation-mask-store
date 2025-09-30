import { Request, Response } from 'express';
import { AnnotationService } from '../services/AnnotationService';
import type { AnnotationQueryInput } from '../validation/requests';

export async function createAnnotation(req: Request, res: Response) {
  const ann = await AnnotationService.create(req.user!, req.body);
  res.status(201).json(ann);
}

export async function getAnnotationById(req: Request, res: Response) {
  const { id } = req.params;
  const ann = await AnnotationService.getById(req.user!, id);
  res.json(ann);
}

export async function queryAnnotations(req: Request, res: Response) {
  const result = await AnnotationService.query(req.user!, req.query as unknown as AnnotationQueryInput);
  res.json(result);
}

export async function getAnnotationRank(req: Request, res: Response) {
  const { id } = req.params;
  const payload = await AnnotationService.rank(req.user!, id);
  res.json(payload);
}
