import { Request, Response } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { Project } from '../models/Project';
import { Image } from '../models/Image';
import { Annotation } from '../models/Annotation';
import { User } from '../models/User';

export async function createProject(req: Request, res: Response) {
  const { name, description, createdBy } = req.body || {};
  if (!name) return res.status(400).json({ error: { message: 'name is required' } });

  let createdById;
  if (createdBy) {
    if (!isValidObjectId(createdBy)) return res.status(400).json({ error: { message: 'createdBy must be a valid ObjectId' } });
    createdById = createdBy;
  }

  const project = await Project.create({ name, description, createdBy: createdById });
  res.status(201).json(project);
}

export async function getProjectById(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid project id' } });

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
  res.json(project);
}

export async function getProjectStats(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid project id' } });

  const [imageCount, annotationCount] = await Promise.all([
    Image.countDocuments({ project: id }),
    Annotation.countDocuments({ project: id }),
  ]);

  const perAnnotatorAgg = await Annotation.aggregate([
    { $match: { project: new Types.ObjectId(id) } },
    { $group: { _id: '$createdBy', count: { $sum: 1 } } },
  ]);

  const annotatorIds = perAnnotatorAgg.map((a) => a._id).filter(Boolean);
  const users = annotatorIds.length ? await User.find({ _id: { $in: annotatorIds } }) : [];
  const userMap = new Map(users.map((u) => [String(u._id), { name: u.name, email: u.email }]));

  const perAnnotator = perAnnotatorAgg.map((row) => ({
    annotator: row._id,
    count: row.count,
    user: row._id ? userMap.get(row._id.toString()) || null : null,
  }));

  res.json({ projectId: id, images: imageCount, annotations: annotationCount, perAnnotator });
}
