import type { Side } from '../Blocks/Block';
import type { BlockData } from '../types';

export function getAnchor(
  block: BlockData,
  side: Side
): { x: number; y: number } {
  const { x, y, width: w, height: h } = block;
  switch (side) {
    case 'top':
      return { x: x + w / 2, y };
    case 'right':
      return { x: x + w, y: y + h / 2 };
    case 'bottom':
      return { x: x + w / 2, y: y + h };
    case 'left':
      return { x, y: y + h / 2 };
  }
}

export function pickClosestSide(
  block: BlockData,
  x: number,
  y: number
): Side {
  const cx = block.x + block.width / 2;
  const cy = block.y + block.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'bottom' : 'top';
}
