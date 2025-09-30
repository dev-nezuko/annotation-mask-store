export type PolygonRing = [number, number][];
export type Polygon = { rings: PolygonRing[] };
export type PolygonSegmentation = { type: 'polygon'; polygons: Polygon[] };
export type RLESegmentation = { type: 'rle'; size: [number, number]; counts: number[] };
export type Segmentation = PolygonSegmentation | RLESegmentation;

function ringArea(ring: PolygonRing): number {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

export function computePolygonArea(seg: PolygonSegmentation): number {
  let total = 0;
  for (const poly of seg.polygons || []) {
    if (!poly?.rings?.length) continue;
    const [outer, ...holes] = poly.rings;
    const outerArea = ringArea(outer);
    const holesArea = holes.reduce((acc, r) => acc + ringArea(r), 0);
    total += Math.max(0, outerArea - holesArea);
  }
  return total;
}

export function computeRLEArea(seg: RLESegmentation): number {
  const counts = Array.isArray(seg.counts) ? seg.counts : [];
  let area = 0;
  for (let i = 0; i < counts.length; i++) {
    if (i % 2 === 1) area += counts[i];
  }
  return area;
}

export function computeSegmentationArea(seg: Segmentation): number {
  if (!seg || !('type' in seg)) return 0;
  if (seg.type === 'polygon') return computePolygonArea(seg);
  if (seg.type === 'rle') return computeRLEArea(seg);
  return 0;
}
