import { dist, pathLength, type Point } from './normalize';
import type { Side } from '../canvas/Blocks/Block';

export type GestureArrowResult = {
  fromBlockId: string;
  toBlockId: string;
  fromSide: Side;
  toSide: Side;
};

export type BlockBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIN_LENGTH = 60;
const STRAIGHTNESS = 0.75;
const SNAP_RADIUS = 60;

/** True if the gesture is a straight line long enough to be an arrow. */
export function looksLikeStraightLine(points: Point[]): boolean {
  if (points.length < 3) return false;
  const len = pathLength(points);
  if (len < MIN_LENGTH) return false;
  const direct = dist(points[0], points[points.length - 1]);
  return direct / len >= STRAIGHTNESS;
}

function findBlockAt(
  p: Point,
  blocks: BlockBox[],
  radius: number
): BlockBox | null {
  for (const b of blocks) {
    if (
      p.x >= b.x &&
      p.x <= b.x + b.width &&
      p.y >= b.y &&
      p.y <= b.y + b.height
    ) {
      return b;
    }
  }
  let best: BlockBox | null = null;
  let bestDist = radius;
  for (const b of blocks) {
    const cx = Math.max(b.x, Math.min(p.x, b.x + b.width));
    const cy = Math.max(b.y, Math.min(p.y, b.y + b.height));
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

function sideFacing(from: Point, block: BlockBox): Side {
  const cx = block.x + block.width / 2;
  const cy = block.y + block.height / 2;
  const dx = from.x - cx;
  const dy = from.y - cy;
  const halfW = Math.max(block.width / 2, 1);
  const halfH = Math.max(block.height / 2, 1);
  const relX = dx / halfW;
  const relY = dy / halfH;
  if (Math.abs(relX) > Math.abs(relY)) {
    return relX > 0 ? 'right' : 'left';
  }
  return relY > 0 ? 'bottom' : 'top';
}

export function gestureToArrow(
  points: Point[],
  blocks: BlockBox[]
): GestureArrowResult | null {
  if (!looksLikeStraightLine(points)) return null;
  const start = points[0];
  const end = points[points.length - 1];
  const fromBlock = findBlockAt(start, blocks, SNAP_RADIUS);
  const toBlock = findBlockAt(end, blocks, SNAP_RADIUS);
  if (!fromBlock || !toBlock) return null;
  if (fromBlock.id === toBlock.id) return null;
  return {
    fromBlockId: fromBlock.id,
    toBlockId: toBlock.id,
    fromSide: sideFacing(end, fromBlock),
    toSide: sideFacing(start, toBlock),
  };
}
