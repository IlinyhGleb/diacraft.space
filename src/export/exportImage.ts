import type Konva from 'konva';
import { exportStageSVG } from 'react-konva-to-svg';

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function exportPng(stage: Konva.Stage) {
  const url = stage.toDataURL({ pixelRatio: 2 });
  download(url, 'diagram.png');
}

export function exportJpeg(stage: Konva.Stage) {
  const url = stage.toDataURL({
    pixelRatio: 2,
    mimeType: 'image/jpeg',
    quality: 0.95,
  });
  download(url, 'diagram.jpg');
}

export async function exportSvg(stage: Konva.Stage) {
  const svg: string = await exportStageSVG(stage, false);
  if (!svg) return;
  const dataUrl =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  download(dataUrl, 'diagram.svg');
}
