import { Line, Group } from 'react-konva';
import { GRID_SIZE, GRID_EXTENT } from './constants';

type GridProps = {
  visible: boolean;
  color: string;
};

export function Grid({ visible, color }: GridProps) {
  const lines = [];
  for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_SIZE) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, -GRID_EXTENT, x, GRID_EXTENT]}
        stroke={color}
        strokeWidth={1}
      />
    );
  }
  for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_SIZE) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[-GRID_EXTENT, y, GRID_EXTENT, y]}
        stroke={color}
        strokeWidth={1}
      />
    );
  }
  return (
    <Group visible={visible} listening={false}>
      {lines}
    </Group>
  );
}
