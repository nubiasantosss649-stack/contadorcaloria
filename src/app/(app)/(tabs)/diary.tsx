import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Icon, InDevelopmentNotice, Screen, ScreenHeader, Text } from '@/components/ui';
import { MEAL_TYPES } from '@/features/meals/types';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';
import { addDays, diffInDays, formatLongDate, startOfDay } from '@/lib/dates';

export default function DiaryScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { resolvedLanguage } = usePreferences();
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const offset = diffInDays(new Date(), date);
  const title =
    offset === 0
      ? t('diary.today')
      : offset === -1
        ? t('diary.yesterday')
        : formatLongDate(date, resolvedLanguage);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={t('diary.title')} />

      <Card className="flex-row items-center justify-between py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('diary.previousDay')}
          hitSlop={8}
          onPress={() => setDate((current) => addDays(current, -1))}
          className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
        >
          <Icon name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View className="items-center">
          <Text variant="subheading">{title}</Text>
          {offset < -1 || offset === 0 ? null : (
            <Text variant="caption" tone="muted">
              {formatLongDate(date, resolvedLanguage)}
            </Text>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('diary.nextDay')}
          accessibilityState={{ disabled: offset >= 0 }}
          disabled={offset >= 0}
          hitSlop={8}
          onPress={() => setDate((current) => addDays(current, 1))}
          className={cn(
            'h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800',
            offset >= 0 && 'opacity-40',
          )}
        >
          <Icon name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </Card>

      <InDevelopmentNotice description={t('diary.emptyDescription')} />

      <View className="gap-3">
        {MEAL_TYPES.map((meal) => (
          <Card key={meal} className="flex-row items-center justify-between">
            <View className="gap-0.5">
              <Text variant="subheading">{t(`meals.${meal}`)}</Text>
              <Text variant="bodySmall" tone="muted">
                {t('diary.empty')}
              </Text>
            </View>
            <Text variant="subheading" tone="muted">
              0 {t('common.kcal')}
            </Text>
          </Card>
        ))}
      </View>

      <View className="flex-row items-center justify-between px-1">
        <Text variant="subheading">{t('diary.dayTotal')}</Text>
        <Text variant="subheading" tone="primary">
          0 {t('common.kcal')}
        </Text>
      </View>
    </Screen>
  );
}
