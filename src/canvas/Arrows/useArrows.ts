import { useCallback } from 'react';
import type { DiagramState } from '../types';
import { computeBendsForArrow } from './arrowGeometry';
import { applyBendDrag } from './arrowConstraints';

type CommitFn = (updater: (prev: DiagramState) => DiagramState) => void;

export function useArrows(commit: CommitFn) {
  const handleAddWaypoint = useCallback(
    (arrowId: string, x: number, y: number) => {
      commit((s) => {
        const arrow = s.arrows.find((a) => a.id === arrowId);
        if (!arrow) return s;
        const currentBends = computeBendsForArrow(arrow, s.blocks);
        const newBends = [...currentBends, { x, y }];
        return {
          ...s,
          arrows: s.arrows.map((a) =>
            a.id === arrowId ? { ...a, waypoints: newBends } : a
          ),
        };
      });
    },
    [commit]
  );

  const handleBendDragEnd = useCallback(
    (arrowId: string, idx: number, x: number, y: number) => {
      commit((s) => {
        const arrow = s.arrows.find((a) => a.id === arrowId);
        if (!arrow) return s;
        const from = s.blocks.find((b) => b.id === arrow.fromBlockId);
        const to = s.blocks.find((b) => b.id === arrow.toBlockId);
        if (!from || !to) return s;

        const bends = computeBendsForArrow(arrow, s.blocks);
        if (idx < 0 || idx >= bends.length) return s;
        const original = bends[idx];
        const dx = x - original.x;
        const dy = y - original.y;

        const newWaypoints = applyBendDrag(from, to, arrow, idx, dx, dy);
        if (!newWaypoints) return s;

        return {
          ...s,
          arrows: s.arrows.map((a) =>
            a.id === arrowId ? { ...a, waypoints: newWaypoints } : a
          ),
        };
      });
    },
    [commit]
  );

  const handleBendDelete = useCallback(
    (arrowId: string, idx: number) => {
      commit((s) => {
        const arrow = s.arrows.find((a) => a.id === arrowId);
        if (!arrow) return s;
        const currentBends = computeBendsForArrow(arrow, s.blocks);
        if (idx < 0 || idx >= currentBends.length) return s;
        const newBends = currentBends.filter((_, i) => i !== idx);
        return {
          ...s,
          arrows: s.arrows.map((a) =>
            a.id === arrowId ? { ...a, waypoints: newBends } : a
          ),
        };
      });
    },
    [commit]
  );

  return { handleAddWaypoint, handleBendDragEnd, handleBendDelete };
}
