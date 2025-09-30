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

// Uncompressed COCO-style RLE: alternating background/foreground runs.
export const RLESegmentationZ = z.object({
  type: z.literal('rle'),
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  counts: z.array(z.number().int().nonnegative()).min(1),
});

export const SegmentationZ = z
  .discriminatedUnion('type', [PolygonSegmentationZ, RLESegmentationZ])
  .refine((seg) => seg.type !== 'rle' || seg.counts.reduce((a, b) => a + b, 0) === seg.size[0] * seg.size[1], {
    message: 'RLE counts must add up to height x width',
    path: ['counts'],
  });

export type SegmentationInput = z.infer<typeof SegmentationZ>;

export function validateSegmentation(input: unknown): Segmentation {
  const parsed = SegmentationZ.parse(input);
  return parsed as Segmentation;
}
