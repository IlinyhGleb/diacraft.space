import type { BlockData, ArrowData } from '../types';
import { getAnchor } from '../utils/blocks';
import {
  buildPathWithFixed,
  computeBendsForArrow,
  type Pt,
} from './arrowGeometry';

function segmentOrientation(p: Pt, q: Pt): 'H' | 'V' {
  return Math.abs(p.x - q.x) >= Math.abs(p.y - q.y) ? 'H' : 'V';
}

function orientSegments(pts: Pt[]): ('H' | 'V')[] {
  const out: ('H' | 'V')[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    out.push(segmentOrientation(pts[i], pts[i + 1]));
  }
  return out;
}

function groupThroughVertical(
  orient: ('H' | 'V')[],
  startIdx: number
): Set<number> {
  const g = new Set<number>([startIdx]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < orient.length; i++) {
      if (orient[i] !== 'V') continue;
      const a = i;
      const b = i + 1;
      if (g.has(a) && !g.has(b)) {
        g.add(b);
        changed = true;
      }
      if (g.has(b) && !g.has(a)) {
        g.add(a);
        changed = true;
      }
    }
  }
  return g;
}

function groupThroughHorizontal(
  orient: ('H' | 'V')[],
  startIdx: number
): Set<number> {
  const g = new Set<number>([startIdx]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < orient.length; i++) {
      if (orient[i] !== 'H') continue;
      const a = i;
      const b = i + 1;
      if (g.has(a) && !g.has(b)) {
        g.add(b);
        changed = true;
      }
      if (g.has(b) && !g.has(a)) {
        g.add(a);
        changed = true;
      }
    }
  }
  return g;
}

/**
 * Apply a drag to the bend at `bendIndex`, keeping the path orthogonal.
 * - Movement happens along a single axis (the free one).
 * - All waypoints transitively connected by segments perpendicular to that
 *   axis move together, so no new corners are introduced.
 */
export function applyBendDrag(
  from: BlockData,
  to: BlockData,
  arrow: ArrowData,
  bendIndex: number,
  dx: number,
  dy: number
): Pt[] | null {
  const waypoints = arrow.waypoints ?? computeBendsForArrow(arrow, [from, to]);
  if (waypoints.length === 0) return null;
  if (bendIndex < 0 || bendIndex >= waypoints.length) return null;

  const a = getAnchor(from, arrow.fromSide);
  const b = getAnchor(to, arrow.toSide);
  const { points, fixed } = buildPathWithFixed(
    a,
    arrow.fromSide,
    b,
    arrow.toSide,
    waypoints
  );

  const bendPathIndices: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (!fixed[i]) bendPathIndices.push(i);
  }
  if (bendIndex >= bendPathIndices.length) return null;
  const pathIdx = bendPathIndices[bendIndex];

  const orient = orientSegments(points);
  const xGroup = groupThroughVertical(orient, pathIdx);
  const yGroup = groupThroughHorizontal(orient, pathIdx);
  const xBlocked = Array.from(xGroup).some((i) => fixed[i]);
  const yBlocked = Array.from(yGroup).some((i) => fixed[i]);

  if (xBlocked && yBlocked) return null;

  let axis: 'x' | 'y';
  if (xBlocked) axis = 'y';
  else if (yBlocked) axis = 'x';
  else axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';

  const group = axis === 'x' ? xGroup : yGroup;
  const delta = axis === 'x' ? dx : dy;

  const newPoints = points.map((p) => ({ ...p }));
  for (const i of group) {
    if (fixed[i]) continue;
    if (axis === 'x') newPoints[i].x += delta;
    else newPoints[i].y += delta;
  }

  const result: Pt[] = [];
  for (let i = 0; i < newPoints.length; i++) {
    if (!fixed[i]) result.push(newPoints[i]);
  }
  return result;
}
