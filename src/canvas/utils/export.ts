import type { BlockData, ArrowData } from '../types';
import { EXPORT_PADDING } from '../constants';

export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Bounding box of everything drawn on the stage, in stage-local coords,
 * with EXPORT_PADDING around it. Returns null for an empty diagram.
 */
export function getContentBBox(
  blocks: BlockData[],
  arrows: ArrowData[]
): BBox | null {
  if (blocks.length === 0 && arrows.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasContent = false;

  for (const b of blocks) {
    hasContent = true;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  for (const ar of arrows) {
    for (const wp of ar.waypoints ?? []) {
      hasContent = true;
      minX = Math.min(minX, wp.x);
      minY = Math.min(minY, wp.y);
      maxX = Math.max(maxX, wp.x);
      maxY = Math.max(maxY, wp.y);
    }
  }

  if (!hasContent) return null;

  return {
    x: minX - EXPORT_PADDING,
    y: minY - EXPORT_PADDING,
    width: maxX - minX + 2 * EXPORT_PADDING,
    height: maxY - minY + 2 * EXPORT_PADDING,
  };
}
