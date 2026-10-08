import { describe, it, expect } from 'vitest';
import { computeBendsForArrow } from '../arrowGeometry';
import { applyBendDrag } from '../arrowConstraints';
import type { BlockData, ArrowData } from '../../types';

function makeBlock(
  id: string,
  x: number,
  y: number,
  width = 120,
  height = 60
): BlockData {
  return { id, x, y, width, height, label: id, type: 'action' };
}

function makeArrow(
  fromId: string,
  toId: string,
  fromSide: 'top' | 'right' | 'bottom' | 'left',
  toSide: 'top' | 'right' | 'bottom' | 'left'
): ArrowData {
  return {
    id: 'a1',
    fromBlockId: fromId,
    fromSide,
    toSide,
    toBlockId: toId,
  };
}

describe('computeBendsForArrow', () => {
  it('returns a fixed number of bends for a fresh arrow (right → left, offset)', () => {
    const A = makeBlock('A', 0, 0);
    const B = makeBlock('B', 400, 200);
    const arrow = makeArrow('A', 'B', 'right', 'left');
    const bends = computeBendsForArrow(arrow, [A, B]);
    // Right-to-left diagonal should give exactly 2 bends via computeElbow.
    expect(bends.length).toBe(2);
  });

  it('never returns more than 2 auto-bends for any anchor combination', () => {
    const A = makeBlock('A', 0, 0);
    const B = makeBlock('B', 400, 200);
    const combos: Array<
      ['top' | 'right' | 'bottom' | 'left', 'top' | 'right' | 'bottom' | 'left']
    > = [
      ['right', 'left'],
      ['left', 'right'],
      ['top', 'bottom'],
      ['bottom', 'top'],
      ['right', 'top'],
      ['right', 'bottom'],
      ['left', 'top'],
      ['left', 'bottom'],
    ];
    for (const [fs, ts] of combos) {
      const arrow = makeArrow('A', 'B', fs, ts);
      const bends = computeBendsForArrow(arrow, [A, B]);
      expect(bends.length).toBeLessThanOrEqual(2);
    }
  });

  it('returns stored waypoints verbatim', () => {
    const A = makeBlock('A', 0, 0);
    const B = makeBlock('B', 400, 200);
    const arrow: ArrowData = {
      ...makeArrow('A', 'B', 'right', 'left'),
      waypoints: [
        { x: 100, y: 0 },
        { x: 200, y: 300 },
      ],
    };
    const bends = computeBendsForArrow(arrow, [A, B]);
    expect(bends).toEqual([
      { x: 100, y: 0 },
      { x: 200, y: 300 },
    ]);
  });
});

describe('applyBendDrag', () => {
  it('does not change the number of waypoints', () => {
    const A = makeBlock('A', 0, 0);
    const B = makeBlock('B', 400, 200);
    const arrow = makeArrow('A', 'B', 'right', 'left');
    const initial = computeBendsForArrow(arrow, [A, B]);
    expect(initial.length).toBeGreaterThan(0);

    for (let i = 0; i < initial.length; i++) {
      const next = applyBendDrag(A, B, arrow, i, 30, 30);
      expect(next).not.toBeNull();
      expect(next!.length).toBe(initial.length);
    }
  });

  it('repeatedly dragging the same bend does not multiply waypoints', () => {
    const A = makeBlock('A', 0, 0);
    const B = makeBlock('B', 400, 200);

    let arrow: ArrowData = makeArrow('A', 'B', 'right', 'left');
    const initialCount = computeBendsForArrow(arrow, [A, B]).length;

    for (let step = 0; step < 5; step++) {
      const bends = computeBendsForArrow(arrow, [A, B]);
      const next = applyBendDrag(A, B, arrow, 0, 10, 10);
      expect(next).not.toBeNull();
      expect(next!.length).toBe(initialCount);
      arrow = { ...arrow, waypoints: next! };
      expect(computeBendsForArrow(arrow, [A, B]).length).toBe(initialCount);
    }
  });

  it('each returned waypoint is unique (no duplicates introduced)', () => {
    const A = makeBlock('A', 0, 0);
    const B = makeBlock('B', 400, 200);
    const arrow = makeArrow('A', 'B', 'right', 'left');
    const next = applyBendDrag(A, B, arrow, 0, 40, 40);
    expect(next).not.toBeNull();
    const seen = new Set<string>();
    for (const p of next!) {
      const key = `${Math.round(p.x)},${Math.round(p.y)}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

it('does not multiply waypoints when a block has moved between drags', () => {
  const A = makeBlock('A', 0, 0);
  const B = makeBlock('B', 400, 200);
  let arrow: ArrowData = makeArrow('A', 'B', 'right', 'left');
  const initialCount = computeBendsForArrow(arrow, [A, B]).length;

  // First drag — materializes waypoints.
  let next = applyBendDrag(A, B, arrow, 0, 10, 0);
  expect(next).not.toBeNull();
  expect(next!.length).toBe(initialCount);
  arrow = { ...arrow, waypoints: next! };

  // Move block B to a very different position.
  const B2 = makeBlock('B', 500, 400);

  // Second drag — should still yield the same number of waypoints.
  next = applyBendDrag(A, B2, arrow, 0, 20, 0);
  expect(next).not.toBeNull();
  expect(next!.length).toBe(initialCount);

  // Third drag — still the same count.
  arrow = { ...arrow, waypoints: next! };
  next = applyBendDrag(A, B2, arrow, 0, 20, 0);
  expect(next).not.toBeNull();
  expect(next!.length).toBe(initialCount);
});

it('survives a stress sequence: many drags + block moves', () => {
  const A = makeBlock('A', 0, 0);
  let B = makeBlock('B', 400, 200);
  let arrow: ArrowData = makeArrow('A', 'B', 'right', 'left');
  const initialCount = computeBendsForArrow(arrow, [A, B]).length;

  for (let step = 0; step < 30; step++) {
    const bends = computeBendsForArrow(arrow, [A, B]);
    if (bends.length === 0) break;
    const idx = step % bends.length;
    const dx = (step % 5) * 15 - 30;
    const dy = (step % 3) * 15 - 15;
    const next = applyBendDrag(A, B, arrow, idx, dx, dy);
    if (next === null) continue;
    expect(next.length).toBe(initialCount);
    arrow = { ...arrow, waypoints: next };

    // Occasionally move B.
    if (step % 4 === 0) {
      B = makeBlock('B', 300 + step * 10, 100 + step * 5);
    }
  }
});
});
