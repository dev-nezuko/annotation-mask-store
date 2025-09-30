import { Project, IProject } from '../models/Project';

export class ProjectRepo {
  static create(doc: Pick<IProject, 'name' | 'description' | 'createdBy'>) {
    return Project.create(doc);
  }

  static findById(id: string) {
    return Project.findById(id);
  }
}
