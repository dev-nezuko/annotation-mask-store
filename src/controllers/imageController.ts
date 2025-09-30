import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Image } from '../models/Image';
import { Project } from '../models/Project';

export async function createImagesForProject(req: Request, res: Response) {
  const { projectId } = req.params;
  if (!isValidObjectId(projectId)) return res.status(400).json({ error: { message: 'Invalid project id' } });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ error: { message: 'Project not found' } });

  const images: any[] = (req.body?.images as any[]) || [];
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: { message: 'images array is required' } });
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
      return res.status(400).json({ error: { message: 'Each image requires uri, width, height' } });
    }
  }

  const created = await Image.insertMany(docs, { ordered: true });
  res.status(201).json({ inserted: created.length, images: created });
}

export async function getImageById(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid image id' } });

  const image = await Image.findById(id);
  if (!image) return res.status(404).json({ error: { message: 'Image not found' } });
  res.json(image);
}
