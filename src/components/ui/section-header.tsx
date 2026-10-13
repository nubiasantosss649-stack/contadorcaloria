import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './text';

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}
