import type { BlockData, ArrowData } from '../types';
import type { Crop } from '../../export/exportImage';
import { EXPORT_PADDING } from '../constants';

export function getContentBBox(
  blocks: BlockData[],
  arrows: ArrowData[],
  stageX: number,
  stageY: number
): Crop | null {
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
    x: minX + stageX - EXPORT_PADDING,
    y: minY + stageY - EXPORT_PADDING,
    width: maxX - minX + 2 * EXPORT_PADDING,
    height: maxY - minY + 2 * EXPORT_PADDING,
  };
}
