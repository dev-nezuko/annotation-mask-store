import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'annotator' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['annotator', 'admin'], default: 'annotator' },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
