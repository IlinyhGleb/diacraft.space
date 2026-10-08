import { recognize, type Gesture } from './pRecognizer';
import { templates } from './templates';
import { boundingBox, pathLength, type Point } from './normalize';

export type GestureBlockType =
  | 'action'
  | 'condition'
  | 'io'
  | 'forloop'
  | 'start'
  | 'link';

export type GestureBlock = {
  type: GestureBlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  score: number;
};

const MIN_WIDTH = 80;
const MIN_HEIGHT = 48;
const SCORE_THRESHOLD = 0.5;
const CLOSURE_RATIO = 0.25;
const MAX_LENGTH_RATIO = 1.5;

function isClosed(points: Point[]): boolean {
  if (points.length < 4) return false;
  const total = pathLength(points);
  if (total < 1) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const gap = Math.hypot(last.x - first.x, last.y - first.y);
  return gap / total < CLOSURE_RATIO;
}

/** Reject scribbles: path length should be roughly bbox perimeter, not many times it. */
function isReasonableLength(points: Point[]): boolean {
  const bb = boundingBox(points);
  const perimeter = 2 * (bb.width + bb.height);
  if (perimeter < 1) return false;
  const total = pathLength(points);
  return total / perimeter <= MAX_LENGTH_RATIO;
}

export function gestureToBlock(gesture: Gesture): GestureBlock | null {
  if (gesture.length === 0) return null;
  const allPoints = gesture.flat();
  if (allPoints.length < 8) return null;

  if (!isClosed(gesture[0])) return null;
  if (!isReasonableLength(allPoints)) return null;

  const candidates = recognize(gesture, templates);
  if (candidates.length === 0) return null;

  const best = candidates[0];
  if (best.score < SCORE_THRESHOLD) return null;

  const bb = boundingBox(allPoints);
  if (bb.width < 1 || bb.height < 1) return null;

  let type: GestureBlockType;
  if (best.name === 'ellipse') {
    const ratio = bb.width / Math.max(bb.height, 1);
    // Tall ellipses don't match any block type.
    if (ratio < 0.75) return null;
    type = ratio <= 1.33 ? 'link' : 'start';
  } else {
    type = best.name as GestureBlockType;
  }

  const width = Math.max(bb.width, MIN_WIDTH);
  const height = Math.max(bb.height, MIN_HEIGHT);
  const cx = bb.minX + bb.width / 2;
  const cy = bb.minY + bb.height / 2;
  const x = cx - width / 2;
  const y = cy - height / 2;

  return {
    type,
    x,
    y,
    width,
    height,
    rotation: 0,
    score: best.score,
  };
}
