import { isValidObjectId, Types } from 'mongoose';
import { ProjectRepo } from '../repositories/ProjectRepo';
import { ImageRepo } from '../repositories/ImageRepo';
import { AnnotationRepo } from '../repositories/AnnotationRepo';
import { ApiError } from '../lib/errors';
import { Caller, canAccessProject } from '../lib/access';
import { User } from '../models/User';

export class ProjectService {
  static async create(caller: Caller, input: { name: string; description?: string }) {
    const { name, description } = input;
    if (!name) throw ApiError.badRequest('name is required');

    const project = await ProjectRepo.create({ name, description, createdBy: caller.id as any });
    return project;
  }

  /** Loads a project the caller may see. Other people's projects are reported as missing. */
  static async getById(caller: Caller, id: string) {
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid project id format');
    const project = await ProjectRepo.findById(id);
    if (!project || !canAccessProject(caller, project)) throw ApiError.notFound('Project does not exist');
    return project;
  }

  static async stats(caller: Caller, id: string) {
    await ProjectService.getById(caller, id);

    const [imageCount, annotationCount] = await Promise.all([
      ImageRepo.count({ project: id as any }),
      AnnotationRepo.count({ project: id as any }),
    ]);

    const perAnnotatorAgg = await (await import('mongoose')).default.model('Annotation').aggregate([
      { $match: { project: new Types.ObjectId(id) } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);

    const annotatorIds = perAnnotatorAgg.map((a: any) => a._id).filter(Boolean);
    const users = annotatorIds.length ? await User.find({ _id: { $in: annotatorIds } }) : [];
    const userMap = new Map(users.map((u) => [String(u._id), { name: u.name, email: u.email }]));

    const perAnnotator = perAnnotatorAgg.map((row: any) => ({
      annotator: row._id,
      count: row.count,
      user: row._id ? userMap.get(String(row._id)) || null : null,
    }));

    return { projectId: id, images: imageCount, annotations: annotationCount, perAnnotator };
  }
}
