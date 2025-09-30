import { Image, IImage } from '../models/Image';
import { QueryFilter } from 'mongoose';

export class ImageRepo {
  static findById(id: string) {
    return Image.findById(id);
  }

  static insertMany(docs: Partial<IImage>[]) {
    return Image.insertMany(docs, { ordered: true });
  }

  static count(filter: QueryFilter<IImage>) {
    return Image.countDocuments(filter);
  }
}
