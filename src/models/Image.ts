import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IImage extends Document {
  project: Types.ObjectId;
  uri: string;
  width: number;
  height: number;
  status: 'unassigned' | 'in_progress' | 'annotated';
  assignedTo?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  uri: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  status: { type: String, enum: ['unassigned', 'in_progress', 'annotated'], default: 'unassigned', index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Image = mongoose.model<IImage>('Image', ImageSchema);
