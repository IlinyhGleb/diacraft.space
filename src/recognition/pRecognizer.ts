import {
  resample,
  translateToOrigin,
  scaleToSquare,
  dist,
  type Point,
} from './normalize';

const N = 64;          // resampled points per stroke
const SIZE = 250;      // scaling target
const SCORE_SCALE = 60; // lower = stricter; tune 30–80

export type Stroke = Point[];

export type Template = {
  name: string;
  strokes: Stroke[];
};

export type Candidate = {
  name: string;
  score: number;
  distance: number;
};

export type Gesture = Stroke[];

function prepareStroke(stroke: Stroke): Point[] {
  if (stroke.length < 2) return [];
  const resampled = resample([...stroke], N);
  const translated = translateToOrigin(resampled);
  return scaleToSquare(translated, SIZE);
}

function prepareGesture(gesture: Gesture): Point[] {
  const all: Point[] = [];
  for (const stroke of gesture) {
    all.push(...prepareStroke(stroke));
  }
  return all;
}

/**
 * Greedy cloud distance. Returns the *sum* of weighted nearest-neighbor
 * distances across all starting offsets. Lower = more similar.
 */
function greedyCloudMatch(pts1: Point[], pts2: Point[]): number {
  const n = pts1.length;
  const m = pts2.length;
  if (n === 0 || m === 0) return Infinity;

  let min = Infinity;

  for (let start = 0; start < n; start++) {
    let sum = 0;
    const matched = new Array(m).fill(false);

    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      const p1 = pts1[i];

      let index = -1;
      let minDist = Infinity;
      for (let j = 0; j < m; j++) {
        if (matched[j]) continue;
        const d = dist(p1, pts2[j]);
        if (d < minDist) {
          minDist = d;
          index = j;
        }
      }

      if (index === -1) break;
      matched[index] = true;
      const weight = 1 - k / n;
      sum += weight * minDist;
    }

    if (sum < min) min = sum;
  }

  return min;
}

export function distance(pts1: Point[], pts2: Point[]): number {
  return greedyCloudMatch(pts1, pts2);
}

/**
 * Score from distance. Normalize by point count first, then map to 0..1
 * with a smooth curve:
 *   dAvg = 0     → 1.00
 *   dAvg = 30    → 0.67
 *   dAvg = 60    → 0.50
 *   dAvg = 120   → 0.33
 */
function scoreFromDistance(d: number, n: number): number {
  if (n === 0 || !isFinite(d)) return 0;
  const dAvg = d / n;
  return 1 / (1 + dAvg / SCORE_SCALE);
}

export function recognize(
  gesture: Gesture,
  templates: Template[]
): Candidate[] {
  const userPts = prepareGesture(gesture);
  if (userPts.length === 0) return [];

  const results: Candidate[] = templates.map((t) => {
    const templatePts = prepareGesture(t.strokes);
    const d = distance(userPts, templatePts);
    return {
      name: t.name,
      distance: d,
      score: scoreFromDistance(d, userPts.length),
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function bestMatch(
  gesture: Gesture,
  templates: Template[],
  threshold = 0.6
): Candidate | null {
  const results = recognize(gesture, templates);
  if (results.length === 0) return null;
  const best = results[0];
  return best.score >= threshold ? best : null;
}
