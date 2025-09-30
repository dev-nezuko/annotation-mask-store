import { isValidObjectId, Types } from 'mongoose';
import { Image } from '../models/Image';
import { computeSegmentationArea } from '../utils/area';
import { validateSegmentation } from '../validation/segmentation';
import { ApiError } from '../lib/errors';
import { AnnotationRepo } from '../repositories/AnnotationRepo';

export class AnnotationService {
  static async create(input: {
    image: string;
    project?: string;
    label: string;
    segmentation: unknown;
    area?: number;
    createdBy?: string;
    metadata?: Record<string, any>;
  }) {
    const { image: imageId, project: projectId, label, segmentation, area, createdBy, metadata } = input;

    if (!imageId || !isValidObjectId(imageId)) {
      throw ApiError.badRequest('image must be provided as a valid ObjectId');
    }
    if (!label) throw ApiError.badRequest('label is mandatory');
    if (!segmentation) throw ApiError.badRequest('segmentation payload is required');

    // Validate segmentation
    let validSeg = validateSegmentation(segmentation);

    // Verify image exists
    const image = await Image.findById(imageId);
    if (!image) throw ApiError.notFound('Image does not exist');

    // Ensure project alignment
    const derivedProjectId = image.project as Types.ObjectId;
    if (projectId && projectId.toString() !== derivedProjectId.toString()) {
      throw ApiError.badRequest('project does not match the image project');
    }

    // RLE size vs image dims
    if (validSeg.type === 'rle') {
      const [h, w] = validSeg.size;
      if (w !== image.width || h !== image.height) {
        throw ApiError.badRequest(`RLE size (${h}x${w}) must equal image dimensions (${image.height}x${image.width})`);
      }
    }

    // Compute area on server
    const computedArea = computeSegmentationArea(validSeg);
    if (!computedArea || computedArea <= 0) {
      throw ApiError.badRequest('Area could not be determined; supply a valid segmentation');
    }

    if (typeof area === 'number' && area > 0) {
      const epsilon = 1e-6;
      if (Math.abs(area - computedArea) > epsilon) {
        throw ApiError.badRequest(`Client-supplied area ${area} does not match server-computed area ${computedArea}`);
      }
    }

    const ann = await AnnotationRepo.create({
      project: derivedProjectId,
      image: image._id,
      label,
      segmentation: validSeg as any,
      area: computedArea,
      createdBy: createdBy as any,
      metadata,
    } as any);

    // Best-effort status tag
    try { await Image.updateOne({ _id: image._id }, { $set: { status: 'annotated' } }); } catch {}

    return ann;
  }

  static async getById(id: string) {
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid annotation id format');
    const ann = await AnnotationRepo.findById(id);
    if (!ann) throw ApiError.notFound('Annotation does not exist');
    return ann;
  }

  static async query(params: { label?: string; annotator?: string; imageId?: string; projectId?: string; page: number; limit: number; }) {
    const { label, annotator, imageId, projectId, page, limit } = params;

    const filter: any = {};
    if (label) filter.label = label;
    if (annotator) {
      if (!isValidObjectId(annotator)) throw ApiError.badRequest('annotator must be a valid ObjectId string');
      filter.createdBy = annotator;
    }
    if (imageId) {
      if (!isValidObjectId(imageId)) throw ApiError.badRequest('imageId must be a valid ObjectId string');
      filter.image = imageId;
    }
    if (projectId) {
      if (!isValidObjectId(projectId)) throw ApiError.badRequest('projectId must be a valid ObjectId string');
      filter.project = projectId;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AnnotationRepo.find(filter, { skip, limit, sort: { createdAt: -1 } }),
      AnnotationRepo.count(filter),
    ]);

    return { page, limit, total, items };
  }

  static async rank(id: string) {
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid annotation id format');
    const ann = await AnnotationRepo.findById(id);
    if (!ann) throw ApiError.notFound('Annotation does not exist');

    const [biggerCount, total] = await Promise.all([
      AnnotationRepo.countByImageGreaterArea(ann.image, ann.area),
      AnnotationRepo.countByImage(ann.image),
    ]);
    const rank = biggerCount + 1;

    return { annotationId: ann._id, imageId: ann.image, area: ann.area, rank, total };
  }
}
