import mongoose, { Schema, Types } from 'mongoose';
import type { Segmentation } from '../utils/area';

export interface IAnnotation {
  project: Types.ObjectId;
  image: Types.ObjectId;
  label: string;
  segmentation: Segmentation;
  area: number;
  createdBy?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AnnotationSchema = new Schema<IAnnotation>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  image: { type: Schema.Types.ObjectId, ref: 'Image', required: true, index: true },
  label: { type: String, required: true, index: true },
  segmentation: { type: Schema.Types.Mixed, required: true },
  area: { type: Number, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

AnnotationSchema.index({ image: 1, area: -1 });

export const Annotation = mongoose.model<IAnnotation>('Annotation', AnnotationSchema);
