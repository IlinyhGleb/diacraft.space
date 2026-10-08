import type { CSSProperties } from 'react';
import { DraggablePanel } from '../../ui/DraggablePanel';
import type { Theme } from '../../theme';

type ExportPanelProps = {
  theme: Theme;
  onExportPng: () => void;
  onExportJpeg: () => void;
  onExportSvg: () => void;
  onClear: () => void;
};

export function ExportPanel({
  theme,
  onExportPng,
  onExportJpeg,
  onExportSvg,
  onClear,
}: ExportPanelProps) {
  const buttonStyle: CSSProperties = {
    padding: '6px 10px',
    border: `1px solid ${theme.buttonBorder}`,
    borderRadius: 4,
    background: theme.buttonBg,
    color: theme.buttonText,
    cursor: 'pointer',
    fontSize: 12,
    textAlign: 'center',
  };

  return (
    <DraggablePanel
      theme={theme}
      initialPosition={{
        x: Math.max(10, window.innerWidth - 90),
        y: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textAlign: 'center',
          color: theme.buttonTextDisabled,
          marginBottom: 2,
        }}
      >
        Export
      </div>
      <button onClick={onExportPng} style={buttonStyle}>
        PNG
      </button>
      <button onClick={onExportJpeg} style={buttonStyle}>
        JPEG
      </button>
      <button onClick={onExportSvg} style={buttonStyle}>
        SVG
      </button>

      <div style={{ height: 1, background: theme.divider, margin: '4px 0' }} />

      <button
        onClick={onClear}
        style={{
          ...buttonStyle,
          color: theme.deleteButton,
          borderColor: theme.deleteButton,
        }}
      >
        Clear
      </button>
    </DraggablePanel>
  );
}
