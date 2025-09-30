import { isValidObjectId } from 'mongoose';
import { ApiError } from '../lib/errors';
import { ProjectRepo } from '../repositories/ProjectRepo';
import { Caller, canAccessProject } from '../lib/access';
import { ImageRepo } from '../repositories/ImageRepo';

export class ImageService {
  static async createForProject(caller: Caller, projectId: string, images: any[]) {
    if (!isValidObjectId(projectId)) throw ApiError.badRequest('Invalid project id format');

    const project = await ProjectRepo.findById(projectId);
    if (!project || !canAccessProject(caller, project)) throw ApiError.notFound('Project does not exist');

    if (!Array.isArray(images) || images.length === 0) {
      throw ApiError.badRequest('images array is required');
    }

    const docs = images.map((img) => ({
      project: project._id,
      uri: img.uri,
      width: img.width,
      height: img.height,
      status: img.status || 'unassigned',
      assignedTo: img.assignedTo,
      metadata: img.metadata,
    }));

    for (const d of docs) {
      if (!d.uri || !d.width || !d.height) {
        throw ApiError.badRequest('Each image requires uri, width, height');
      }
    }

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
