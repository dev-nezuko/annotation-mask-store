import { Annotation, IAnnotation } from '../models/Annotation';
import { FilterQuery } from 'mongoose';

export type FindOptions = {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
};

export class AnnotationRepo {
  static create(doc: Partial<IAnnotation>) {
    return Annotation.create(doc);
  }

  static findById(id: string) {
    return Annotation.findById(id);
  }

  static find(filter: FilterQuery<IAnnotation>, options: FindOptions = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    return Annotation.find(filter).sort(sort).skip(skip).limit(limit);
  }

  static count(filter: FilterQuery<IAnnotation>) {
    return Annotation.countDocuments(filter);
  }

  static countByImageGreaterArea(imageId: any, area: number) {
    return Annotation.countDocuments({ image: imageId, area: { $gt: area } });
  }

  static countByImage(imageId: any) {
    return Annotation.countDocuments({ image: imageId });
  }
}
