import { QueryFilter, Types } from 'mongoose';
import { Image, IImage } from '../models/Image';

export class ImageRepo {
  static findById(id: string) {
    return Image.findById(id);
  }

  static insertMany(docs: Omit<IImage, 'status' | 'createdAt' | 'updatedAt'>[]) {
    return Image.insertMany(docs, { ordered: true });
  }

  static count(filter: QueryFilter<IImage>) {
    return Image.countDocuments(filter);
  }

  static markAnnotated(id: Types.ObjectId) {
    return Image.updateOne({ _id: id }, { $set: { status: 'annotated' } });
  }
}
