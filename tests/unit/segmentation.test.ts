import { describe, expect, it } from 'vitest';
import { validateSegmentation } from '../../src/validation/segmentation';

describe('validateSegmentation', () => {
  it('accepts a polygon with at least three points per ring', () => {
    const seg = { type: 'polygon', polygons: [{ rings: [[[0, 0], [1, 0], [1, 1]]] }] };
    expect(validateSegmentation(seg)).toEqual(seg);
  });

  it('rejects a ring with fewer than three points', () => {
    expect(() => validateSegmentation({ type: 'polygon', polygons: [{ rings: [[[0, 0], [1, 1]]] }] })).toThrow();
  });

  it('rejects non-finite coordinates', () => {
    expect(() =>
      validateSegmentation({ type: 'polygon', polygons: [{ rings: [[[0, 0], [1, Infinity], [1, 1]]] }] }),
    ).toThrow();
  });

  it('accepts RLE with integer, non-negative counts', () => {
    expect(validateSegmentation({ type: 'rle', size: [2, 2], counts: [1, 2, 1] }).type).toBe('rle');
  });

  it('rejects negative RLE counts and unknown types', () => {
    expect(() => validateSegmentation({ type: 'rle', size: [2, 2], counts: [-1, 5] })).toThrow();
    expect(() => validateSegmentation({ type: 'bbox', box: [0, 0, 1, 1] })).toThrow();
  });
});
