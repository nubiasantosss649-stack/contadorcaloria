import { Tabs } from 'expo-router/js-tabs';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/components/ui';
import { palette } from '@/constants/palette';
import { useAppTheme } from '@/hooks/use-app-theme';

function TabIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: ColorValue;
  focused: boolean;
}) {
  const icon = (focused ? name.replace('-outline', '') : name) as IconName;
  return <Icon name={icon} size={24} color={color} />;
}

/** Highlighted center tab for the AI scanner. */
function ScannerIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 18,
        marginTop: Platform.OS === 'web' ? 0 : -18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? palette.emerald[700] : palette.emerald[600],
        shadowColor: palette.emerald[700],
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <Icon name="scan" size={26} color={palette.white} />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: t('tabs.diary'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t('tabs.scanner'),
          // The raised button speaks for itself; the label stays available to screen readers.
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: t('tabs.scanner'),
          tabBarIcon: ({ focused }) => <ScannerIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stats-chart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
