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
    return ProjectRepo.create({ name, description, createdBy: new Types.ObjectId(caller.id) });
  }

  /** Loads a project the caller may see. Other people's projects are reported as missing. */
  static async getById(caller: Caller, id: string) {
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid project id format');
    const project = await ProjectRepo.findById(id);
    if (!project || !canAccessProject(caller, project)) throw ApiError.notFound('Project does not exist');
    return project;
  }

  static async stats(caller: Caller, id: string) {
    const project = await ProjectService.getById(caller, id);

    const [imageCount, annotationCount, perAnnotatorAgg] = await Promise.all([
      ImageRepo.count({ project: project._id }),
      AnnotationRepo.count({ project: project._id }),
      AnnotationRepo.countByAnnotator(project._id),
    ]);

    const annotatorIds = perAnnotatorAgg.flatMap((row) => (row._id ? [row._id] : []));
    const users = annotatorIds.length ? await User.find({ _id: { $in: annotatorIds } }) : [];
    const userMap = new Map(users.map((u) => [String(u._id), { name: u.name, email: u.email }]));

    const perAnnotator = perAnnotatorAgg.map((row) => ({
      annotator: row._id,
      count: row.count,
      user: row._id ? userMap.get(String(row._id)) ?? null : null,
    }));

    return { projectId: id, images: imageCount, annotations: annotationCount, perAnnotator };
  }
}
