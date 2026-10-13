import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Text } from './text';

export type BarDatum = { label: string; value: number };

export type BarChartProps = {
  data: readonly BarDatum[];
  height?: number;
  /** Optional horizontal reference line (e.g. daily goal). */
  target?: number;
  color?: string;
  accessibilityLabel?: string;
};

/** Lightweight SVG bar chart. Renders only the data it receives — never placeholder values. */
export function BarChart({ data, height = 160, target, color, accessibilityLabel }: BarChartProps) {
  const { colors } = useAppTheme();
  const width = 320;
  const gap = 10;
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value));
  const barWidth = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : 0;

  return (
    <View accessibilityLabel={accessibilityLabel} accessible={Boolean(accessibilityLabel)}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {data.map((datum, index) => {
          const barHeight = Math.max(0, (datum.value / max) * (height - 4));
          return (
            <Rect
              key={`${datum.label}-${index}`}
              x={index * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={Math.min(8, barWidth / 2)}
              fill={color ?? colors.primary}
            />
          );
        })}
        {target !== undefined ? (
          <Line
            x1={0}
            x2={width}
            y1={height - (target / max) * (height - 4)}
            y2={height - (target / max) * (height - 4)}
            stroke={colors.textMuted}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ) : null}
      </Svg>
      <View className="mt-2 flex-row justify-between">
        {data.map((datum, index) => (
          <Text
            key={`${datum.label}-${index}`}
            variant="caption"
            tone="muted"
            className="flex-1 text-center"
          >
            {datum.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
