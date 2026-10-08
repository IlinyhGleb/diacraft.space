import { useState, useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import type { Theme } from '../theme';

type Props = {
  theme: Theme;
  initialPosition: { x: number; y: number };
  children: ReactNode;
};

export function DraggablePanel({ theme, initialPosition, children }: Props) {
  const [pos, setPos] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    panelX: number;
    panelY: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panelX: pos.x,
      panelY: pos.y,
    };
    setDragging(true);
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const panelEl = panelRef.current;
    const panelWidth = panelEl?.offsetWidth ?? 0;
    const panelHeight = panelEl?.offsetHeight ?? 0;
    const maxX = Math.max(0, window.innerWidth - panelWidth);
    const maxY = Math.max(0, window.innerHeight - panelHeight);
    setPos({
      x: Math.max(0, Math.min(maxX, dragRef.current.panelX + dx)),
      y: Math.max(0, Math.min(maxY, dragRef.current.panelY + dy)),
    });
  };

  const onHandlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const style: CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    background: theme.panelBg,
    borderRadius: 6,
    boxShadow: dragging
      ? `0 6px 16px ${theme.panelShadow}`
      : `0 2px 6px ${theme.panelShadow}`,
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: dragging ? 1000 : 100,
  };

  const handleStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '6px 0',
    cursor: dragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  };

  return (
    <div ref={panelRef} style={style}>
      <div
        style={handleStyle}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <div
          style={{
            width: 32,
            height: 3,
            borderRadius: 2,
            background: theme.buttonTextDisabled,
            opacity: 0.6,
          }}
        />
      </div>
      <div
        style={{
          padding: '0 8px 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}
