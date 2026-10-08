import type { RefObject } from 'react';
import type { Theme } from '../../theme';
import type { BlockData } from '../types';

type BlockEditInputProps = {
  theme: Theme;
  block: BlockData;
  stageX: number;
  stageY: number;
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onCommit: () => void;
};

export function BlockEditInput({
  theme,
  block,
  stageX,
  stageY,
  value,
  inputRef,
  onChange,
  onCommit,
}: BlockEditInputProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: stageX + block.x - 4,
        top: stageY + block.y + block.height / 2 - 18,
        width: block.width + 8,
        zIndex: 500,
      }}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          textAlign: 'center',
          border: `2px solid ${theme.selection}`,
          borderRadius: 6,
          outline: 'none',
          background: theme.inputBg,
          color: theme.inputText,
          boxShadow: `0 2px 8px ${theme.panelShadow}`,
        }}
      />
    </div>
  );
}
