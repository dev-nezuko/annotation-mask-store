import { Project, IProject } from '../models/Project';

export class ProjectRepo {
  static create(doc: Partial<IProject>) {
    return Project.create(doc);
  }

  static findById(id: string) {
    return Project.findById(id);
  }
}
