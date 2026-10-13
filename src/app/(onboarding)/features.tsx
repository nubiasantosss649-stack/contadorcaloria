import { useRef, useState } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import {
  Button,
  FadeInView,
  Icon,
  Screen,
  ScreenHeader,
  Text,
  type IconName,
} from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';

type Slide = {
  key: 'scanner' | 'diary' | 'progress' | 'global';
  icon: IconName;
};

const SLIDES: readonly Slide[] = [
  { key: 'scanner', icon: 'scan-outline' },
  { key: 'diary', icon: 'restaurant-outline' },
  { key: 'progress', icon: 'trending-up-outline' },
  { key: 'global', icon: 'globe-outline' },
];

function Dot({ active }: { active: boolean }) {
  const { colors } = useAppTheme();
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 250 }),
    backgroundColor: active ? colors.primary : colors.border,
  }));
  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} />;
}

export default function FeaturesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { setPreference } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = () => setPreference('hasCompletedOnboarding', true);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (next !== index) setIndex(next);
  };

  const goNext = () => {
    if (isLast) return finish();
    scrollRef.current?.scrollTo({ x: (index + 1) * pageWidth, animated: true });
    setIndex(index + 1);
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      footer={
        <View className="gap-5">
          <View className="flex-row justify-center gap-2">
            {SLIDES.map((slide, i) => (
              <Dot key={slide.key} active={i === index} />
            ))}
          </View>
          <Button
            label={isLast ? t('onboarding.welcome.getStarted') : t('common.next')}
            icon={isLast ? 'checkmark' : 'arrow-forward'}
            iconPosition="right"
            onPress={goNext}
            testID="features-next"
          />
        </View>
      }
    >
      <View className="px-5">
        <ScreenHeader
          showBack
          right={
            !isLast ? (
              <Button
                label={t('common.skip')}
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={finish}
              />
            ) : undefined
          }
        />
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{ width: pageWidth }}
            className="flex-1 justify-center gap-8 px-8"
          >
            <FadeInView
              from="none"
              className="h-40 w-40 items-center justify-center self-center rounded-[48px] bg-brand-50 dark:bg-brand-950"
            >
              <Icon name={slide.icon} size={72} color={colors.primary} />
            </FadeInView>
            <View className="gap-3">
              <Text variant="title" center>
                {t(`onboarding.features.${slide.key}Title`)}
              </Text>
              <Text variant="body" tone="muted" center className="text-[17px] leading-[26px]">
                {t(`onboarding.features.${slide.key}Description`)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <Text variant="caption" tone="muted" center className="px-8 pb-2">
        {t('onboarding.features.roadmapNote')}
      </Text>
    </Screen>
  );
}
