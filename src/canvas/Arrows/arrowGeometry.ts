import type { Side } from '../Blocks/Block';
import { normalVector, STUB } from './arrowPath';
import type { BlockData, ArrowData } from '../types';
import { getAnchor } from '../utils/blocks';

export type Pt = { x: number; y: number };

export function orthoConnect(P: Pt, Q: Pt): Pt[] {
  if (Math.abs(P.x - Q.x) < 0.5 || Math.abs(P.y - Q.y) < 0.5) {
    return [];
  }
  return [{ x: Q.x, y: P.y }];
}

export function isHorizontalSide(side: Side): boolean {
  return side === 'left' || side === 'right';
}

export function computeElbow(P: Pt, pSide: Side, Q: Pt, qSide: Side): Pt[] {
  const pH = isHorizontalSide(pSide);
  const qH = isHorizontalSide(qSide);
  if (pH && qH) {
    const mx = (P.x + Q.x) / 2;
    return [
      { x: mx, y: P.y },
      { x: mx, y: Q.y },
    ];
  }
  if (!pH && !qH) {
    const my = (P.y + Q.y) / 2;
    return [
      { x: P.x, y: my },
      { x: Q.x, y: my },
    ];
  }
  if (pH) {
    return [{ x: Q.x, y: P.y }];
  }
  return [{ x: P.x, y: Q.y }];
}

export function computeElbowForArrow(
  a: Pt,
  aSide: Side,
  b: Pt,
  bSide: Side
): Pt[] {
  const aN = normalVector(aSide);
  const bN = normalVector(bSide);
  const exit = { x: a.x + aN.x * STUB, y: a.y + aN.y * STUB };
  const entry = { x: b.x + bN.x * STUB, y: b.y + bN.y * STUB };
  return computeElbow(exit, aSide, entry, bSide);
}

/**
 * Build the full path with a per-point `fixed` flag and a list of indices
 * marking where the user's waypoints ended up in the path.
 */
export function buildPathWithFixed(
  a: Pt,
  aSide: Side,
  b: Pt,
  bSide: Side,
  waypoints: Pt[]
): { points: Pt[]; fixed: boolean[]; waypointIndices: number[] } {
  const aN = normalVector(aSide);
  const bN = normalVector(bSide);
  const exit = { x: a.x + aN.x * STUB, y: a.y + aN.y * STUB };
  const entry = { x: b.x + bN.x * STUB, y: b.y + bN.y * STUB };

  const pts: Pt[] = [];
  const fixed: boolean[] = [];
  const waypointIndices: number[] = [];

  const push = (p: Pt, f: boolean) => {
    const last = pts[pts.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5) {
      if (f) fixed[fixed.length - 1] = true;
      return;
    }
    pts.push(p);
    fixed.push(f);
  };

  push(a, true);
  push(exit, true);

  if (waypoints.length > 0) {
    let prev = exit;
    for (const wp of waypoints) {
      for (const m of orthoConnect(prev, wp)) push(m, false);
      waypointIndices.push(pts.length);
      pts.push(wp);
      fixed.push(false);
      prev = wp;
    }
    for (const m of orthoConnect(prev, entry)) push(m, false);
  } else {
    for (const m of computeElbow(exit, aSide, entry, bSide)) push(m, false);
  }

  push(entry, true);
  push(b, true);

  return { points: pts, fixed, waypointIndices };
}

export function computeBendsForArrow(
  arrow: ArrowData,
  blockList: BlockData[]
): Pt[] {
  if (arrow.waypoints !== undefined) return arrow.waypoints;
  const from = blockList.find((b) => b.id === arrow.fromBlockId);
  const to = blockList.find((b) => b.id === arrow.toBlockId);
  if (!from || !to) return [];
  const a = getAnchor(from, arrow.fromSide);
  const b = getAnchor(to, arrow.toSide);
  return computeElbowForArrow(a, arrow.fromSide, b, arrow.toSide);
}
