import { Image, IImage } from '../models/Image';
import { FilterQuery } from 'mongoose';

export class ImageRepo {
  static findById(id: string) {
    return Image.findById(id);
  }

  static insertMany(docs: Partial<IImage>[]) {
    return Image.insertMany(docs, { ordered: true });
  }

  static count(filter: FilterQuery<IImage>) {
    return Image.countDocuments(filter);
  }
}
