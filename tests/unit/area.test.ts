import { describe, expect, it } from 'vitest';
import { computePolygonArea, computeRLEArea, computeSegmentationArea } from '../../src/utils/area';

describe('computePolygonArea', () => {
  it('measures a square with the shoelace formula', () => {
    const square = { type: 'polygon' as const, polygons: [{ rings: [[[0, 0], [10, 0], [10, 10], [0, 10]] as [number, number][]] }] };
    expect(computePolygonArea(square)).toBe(100);
  });

  it('does not depend on winding direction', () => {
    const cw = { type: 'polygon' as const, polygons: [{ rings: [[[0, 0], [0, 4], [3, 0]] as [number, number][]] }] };
    expect(computePolygonArea(cw)).toBe(6);
  });

  it('subtracts holes from the outer ring', () => {
    const withHole = {
      type: 'polygon' as const,
      polygons: [{
        rings: [
          [[0, 0], [10, 0], [10, 10], [0, 10]],
          [[2, 2], [4, 2], [4, 4], [2, 4]],
        ] as [number, number][][],
      }],
    };
    expect(computePolygonArea(withHole)).toBe(96);
  });

  it('sums separate polygons', () => {
    const two = {
      type: 'polygon' as const,
      polygons: [
        { rings: [[[0, 0], [2, 0], [2, 2], [0, 2]]] as [number, number][][] },
        { rings: [[[5, 5], [8, 5], [8, 8], [5, 8]]] as [number, number][][] },
      ],
    };
    expect(computePolygonArea(two)).toBe(13);
  });
});

describe('computeRLEArea', () => {
  it('counts only the odd (foreground) runs', () => {
    expect(computeRLEArea({ type: 'rle', size: [2, 5], counts: [3, 4, 2, 1] })).toBe(5);
  });
});

describe('computeSegmentationArea', () => {
  it('dispatches on the segmentation type', () => {
    expect(computeSegmentationArea({ type: 'rle', size: [1, 4], counts: [1, 3] })).toBe(3);
    expect(
      computeSegmentationArea({ type: 'polygon', polygons: [{ rings: [[[0, 0], [1, 0], [1, 1], [0, 1]]] }] }),
    ).toBe(1);
  });
});
