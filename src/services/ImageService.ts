import { isValidObjectId } from 'mongoose';
import { ApiError } from '../lib/errors';
import type { z } from 'zod';
import type { CreateImagesBody } from '../validation/requests';
import { ProjectRepo } from '../repositories/ProjectRepo';
import { Caller, canAccessProject } from '../lib/access';
import { ImageRepo } from '../repositories/ImageRepo';

type NewImage = z.infer<typeof CreateImagesBody>['images'][number];

export class ImageService {
  static async createForProject(caller: Caller, projectId: string, images: NewImage[]) {
    if (!isValidObjectId(projectId)) throw ApiError.badRequest('Invalid project id format');

    const project = await ProjectRepo.findById(projectId);
    if (!project || !canAccessProject(caller, project)) throw ApiError.notFound('Project does not exist');

    const docs = images.map((img) => ({ ...img, project: project._id }));
    const created = await ImageRepo.insertMany(docs as any);
    return { inserted: created.length, images: created };
  }

  /** Loads an image whose project the caller may see; otherwise reports it as missing. */
  static async getById(caller: Caller, id: string) {
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid image id format');
    const image = await ImageRepo.findById(id);
    const project = image && (await ProjectRepo.findById(String(image.project)));
    if (!image || !project || !canAccessProject(caller, project)) throw ApiError.notFound('Image does not exist');
    return image;
  }
}
