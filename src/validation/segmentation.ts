import { z } from 'zod';
import { Segmentation } from '../utils/area';

const coordZ = z.tuple([z.number().finite(), z.number().finite()]);

const ringZ = z.array(coordZ).min(3);

const polygonZ = z.object({
  rings: z.array(ringZ).min(1),
});

export const PolygonSegmentationZ = z.object({
  type: z.literal('polygon'),
  polygons: z.array(polygonZ).min(1),
});

export const RLESegmentationZ = z.object({
  type: z.literal('rle'),
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  counts: z.array(z.number().int().nonnegative()).min(1),
});

export const SegmentationZ = z.discriminatedUnion('type', [PolygonSegmentationZ, RLESegmentationZ]);

export type SegmentationInput = z.infer<typeof SegmentationZ>;

export function validateSegmentation(input: unknown): Segmentation {
  const parsed = SegmentationZ.parse(input);
  return parsed as Segmentation;
}
