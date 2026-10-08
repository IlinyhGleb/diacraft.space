import type { BlockData, ArrowData } from '../types';
import { getAnchor } from '../utils/blocks';
import {
  buildPathWithFixed,
  computeElbowForArrow,
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
 * Only the *original* waypoint positions are returned — auto-inserted
 * corners are never promoted to waypoints.
 */
export function applyBendDrag(
  from: BlockData,
  to: BlockData,
  arrow: ArrowData,
  bendIndex: number,
  dx: number,
  dy: number
): Pt[] | null {
  const a = getAnchor(from, arrow.fromSide);
  const b = getAnchor(to, arrow.toSide);
  const waypoints =
    arrow.waypoints ??
    computeElbowForArrow(a, arrow.fromSide, b, arrow.toSide);

  if (waypoints.length === 0) return null;
  if (bendIndex < 0 || bendIndex >= waypoints.length) return null;

  const { points, fixed, waypointIndices } = buildPathWithFixed(
    a,
    arrow.fromSide,
    b,
    arrow.toSide,
    waypoints
  );

  if (waypointIndices.length !== waypoints.length) return null;

  const pathIdx = waypointIndices[bendIndex];
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

  return waypointIndices.map((i) => newPoints[i]);
}
