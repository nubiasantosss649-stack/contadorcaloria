import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View className="items-center gap-3 px-6 py-8">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-800">
        <Icon name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text variant="subheading" center>
        {title}
      </Text>
      {description ? (
        <Text variant="bodySmall" tone="muted" center>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
