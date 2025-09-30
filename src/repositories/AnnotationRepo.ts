import { QueryFilter, Types } from 'mongoose';
import { Annotation, IAnnotation } from '../models/Annotation';

export type FindOptions = {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
};

export class AnnotationRepo {
  static create(doc: Omit<IAnnotation, 'createdAt' | 'updatedAt'>) {
    return Annotation.create(doc);
  }

  static findById(id: string) {
    return Annotation.findById(id);
  }

  static find(filter: QueryFilter<IAnnotation>, options: FindOptions = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    return Annotation.find(filter).sort(sort).skip(skip).limit(limit);
  }

  static count(filter: QueryFilter<IAnnotation>) {
    return Annotation.countDocuments(filter);
  }

  static countByImageGreaterArea(imageId: Types.ObjectId, area: number) {
    return Annotation.countDocuments({ image: imageId, area: { $gt: area } });
  }

  static countByImage(imageId: Types.ObjectId) {
    return Annotation.countDocuments({ image: imageId });
  }

  /** Annotation counts per author within a project; `_id` is null for annotations without one. */
  static countByAnnotator(projectId: Types.ObjectId) {
    return Annotation.aggregate<{ _id: Types.ObjectId | null; count: number }>([
      { $match: { project: projectId } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);
  }
}
