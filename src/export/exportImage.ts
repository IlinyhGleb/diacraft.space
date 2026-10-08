import type Konva from 'konva';
import { exportStageSVG } from 'react-konva-to-svg';

export type Crop = { x: number; y: number; width: number; height: number };

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function clampCrop(
  crop: Crop,
  stageW: number,
  stageH: number
): Crop {
  const x = Math.max(0, Math.min(crop.x, stageW - 1));
  const y = Math.max(0, Math.min(crop.y, stageH - 1));
  const width = Math.max(1, Math.min(crop.width, stageW - x));
  const height = Math.max(1, Math.min(crop.height, stageH - y));
  return { x, y, width, height };
}

export function exportPng(stage: Konva.Stage, crop?: Crop) {
  const opts: Record<string, unknown> = { pixelRatio: 2 };
  if (crop) {
    const c = clampCrop(crop, stage.width(), stage.height());
    opts.x = c.x;
    opts.y = c.y;
    opts.width = c.width;
    opts.height = c.height;
  }
  const url = stage.toDataURL(opts as never);
  download(url, 'diagram.png');
}

export function exportJpeg(stage: Konva.Stage, crop?: Crop) {
  const opts: Record<string, unknown> = {
    pixelRatio: 2,
    mimeType: 'image/jpeg',
    quality: 0.95,
  };
  if (crop) {
    const c = clampCrop(crop, stage.width(), stage.height());
    opts.x = c.x;
    opts.y = c.y;
    opts.width = c.width;
    opts.height = c.height;
  }
  const url = stage.toDataURL(opts as never);
  download(url, 'diagram.jpg');
}

export async function exportSvg(stage: Konva.Stage, crop?: Crop) {
  const svg: string = await exportStageSVG(stage, false);
  if (!svg) return;
  const finalSvg = crop
    ? cropSvg(svg, clampCrop(crop, stage.width(), stage.height()))
    : svg;
  const dataUrl =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(finalSvg);
  download(dataUrl, 'diagram.svg');
}

function cropSvg(svg: string, crop: Crop): string {
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!match) return svg;
  const inner = match[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${crop.width}" height="${crop.height}" viewBox="${crop.x} ${crop.y} ${crop.width} ${crop.height}">${inner}</svg>`;
}
