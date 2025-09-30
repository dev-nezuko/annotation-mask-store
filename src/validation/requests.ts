import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { SegmentationZ } from './segmentation';

export const objectId = z.string().refine((v) => isValidObjectId(v), 'must be a valid ObjectId');
const metadata = z.record(z.string(), z.unknown()).optional();

export const CreateProjectBody = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

const ImageInput = z.object({
  uri: z.string().trim().pipe(z.url({ protocol: /^(https?|s3|gs)$/ }).max(2048)),
  width: z.number().int().positive().max(100_000),
  height: z.number().int().positive().max(100_000),
  assignedTo: objectId.optional(),
  metadata,
});

// Images always start as `unassigned`; `annotated` is set when an
// annotation lands, so the import does not accept a status.
export const CreateImagesBody = z.object({
  images: z.array(ImageInput).min(1).max(1000),
});

export const CreateAnnotationBody = z.object({
  image: objectId,
  project: objectId.optional(),
  label: z.string().trim().min(1).max(100),
  segmentation: SegmentationZ,
  area: z.number().positive().optional(),
  metadata,
});

// Every field is a plain string: qs would otherwise turn ?label[$ne]=x
// into an object that Mongo reads as an operator.
export const AnnotationQuery = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  annotator: objectId.optional(),
  imageId: objectId.optional(),
  projectId: objectId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AnnotationQueryInput = z.infer<typeof AnnotationQuery>;
