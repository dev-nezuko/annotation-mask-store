import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
