import { Types } from 'mongoose';
import type { TokenUser } from './tokens';

export type Caller = Pick<TokenUser, 'id' | 'role'>;

/** Admins see every project; everyone else only the projects they created. */
export function canAccessProject(caller: Caller, project: { createdBy?: Types.ObjectId | null }) {
  return caller.role === 'admin' || (project.createdBy != null && String(project.createdBy) === caller.id);
}

/** Mongo filter on Project for the projects a caller may see. */
export function ownedProjectsFilter(caller: Caller) {
  return caller.role === 'admin' ? {} : { createdBy: new Types.ObjectId(caller.id) };
}
