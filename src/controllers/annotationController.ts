import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Annotation } from '../models/Annotation';
import { Image } from '../models/Image';
import { Project } from '../models/Project';
import { computeSegmentationArea } from '../utils/area';
import { validateSegmentation } from '../validation/segmentation';

export async function createAnnotation(req: Request, res: Response) {
  const { image: imageId, project: projectId, label, segmentation, area, createdBy, metadata } = req.body || {};

  if (!imageId || !isValidObjectId(imageId)) {
    return res.status(400).json({ error: { message: 'image is required and must be a valid ObjectId' } });
  }
  if (!label) return res.status(400).json({ error: { message: 'label is required' } });
  if (!segmentation) return res.status(400).json({ error: { message: 'segmentation is required' } });

  let validSeg;
  try {
    validSeg = validateSegmentation(segmentation);
  } catch (err: any) {
    return res.status(400).json({ error: { message: 'Invalid segmentation payload', details: err?.errors ?? String(err) } });
  }

  const image = await Image.findById(imageId);
  if (!image) return res.status(404).json({ error: { message: 'Image not found' } });

  const derivedProjectId = image.project;
  if (projectId && projectId.toString() !== derivedProjectId.toString()) {
    return res.status(400).json({ error: { message: 'Provided project does not match image\'s project' } });
  }

  // Cross-check RLE size vs image dimensions
  if (validSeg.type === 'rle') {
    const [h, w] = validSeg.size; // size: [height, width]
    if (w !== image.width || h !== image.height) {
      return res.status(400).json({ error: { message: `RLE size (${h}x${w}) must match image dimensions (${image.height}x${image.width})` } });
    }
  }

  // Always compute area on server for consistency
  let computedArea = 0;
  try {
    computedArea = computeSegmentationArea(validSeg);
  } catch {
    return res.status(400).json({ error: { message: 'Failed to compute area from segmentation' } });
  }
  if (!computedArea || computedArea <= 0) {
    return res.status(400).json({ error: { message: 'area could not be determined; provide a positive area or valid segmentation' } });
  }

  // If area is provided enforce the match with computed area (within small epsilon for float polygons)
  if (typeof area === 'number' && area > 0) {
    const epsilon = 1e-6;
    if (Math.abs(area - computedArea) > epsilon) {
      return res.status(400).json({ error: { message: `Provided area ${area} does not match computed area ${computedArea}` } });
    }
  }

  const ann = await Annotation.create({
    project: derivedProjectId,
    image: image._id,
    label,
    segmentation: validSeg,
    area: computedArea,
    createdBy,
    metadata,
  });

  try {
    await Image.updateOne({ _id: image._id }, { $set: { status: 'annotated' } });
  } catch {}

  res.status(201).json(ann);
}

export async function getAnnotationById(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid annotation id' } });

  const ann = await Annotation.findById(id);
  if (!ann) return res.status(404).json({ error: { message: 'Annotation not found' } });
  res.json(ann);
}

export async function queryAnnotations(req: Request, res: Response) {
  const { label, annotator, imageId, projectId } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));

  const filter: any = {};
  if (label) filter.label = label;
  if (annotator) {
    if (!isValidObjectId(annotator)) return res.status(400).json({ error: { message: 'annotator must be a valid ObjectId' } });
    filter.createdBy = annotator;
  }
  if (imageId) {
    if (!isValidObjectId(imageId)) return res.status(400).json({ error: { message: 'imageId must be a valid ObjectId' } });
    filter.image = imageId;
  }
  if (projectId) {
    if (!isValidObjectId(projectId)) return res.status(400).json({ error: { message: 'projectId must be a valid ObjectId' } });
    filter.project = projectId;
  }

  const [items, total] = await Promise.all([
    Annotation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Annotation.countDocuments(filter),
  ]);

  res.json({ page, limit, total, items });
}

export async function getAnnotationRank(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid annotation id' } });

  const ann = await Annotation.findById(id);
  if (!ann) return res.status(404).json({ error: { message: 'Annotation not found' } });

  const [biggerCount, total] = await Promise.all([
    Annotation.countDocuments({ image: ann.image, area: { $gt: ann.area } }),
    Annotation.countDocuments({ image: ann.image }),
  ]);
  const rank = biggerCount + 1;

  res.json({ annotationId: ann._id, imageId: ann.image, area: ann.area, rank, total });
}
