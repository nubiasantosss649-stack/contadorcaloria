import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  BarChart,
  Button,
  Card,
  EmptyState,
  InDevelopmentNotice,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  type BarDatum,
} from '@/components/ui';

type Range = 'week' | 'month' | 'year';

export default function ProgressScreen() {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>('week');
  // Real history will come from Supabase in Phase 2. Until then the series are empty.
  const weightSeries: BarDatum[] = [];
  const calorieSeries: BarDatum[] = [];

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={t('progress.title')} />
      <SegmentedControl<Range>
        accessibilityLabel={t('progress.title')}
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: t('progress.week') },
          { value: 'month', label: t('progress.month') },
          { value: 'year', label: t('progress.year') },
        ]}
      />

      <InDevelopmentNotice description={t('progress.noDataDescription')} />

      <SectionHeader title={t('progress.weight')} />
      <Card padded={weightSeries.length > 0}>
        {weightSeries.length > 0 ? (
          <BarChart data={weightSeries} accessibilityLabel={t('progress.weight')} />
        ) : (
          <EmptyState icon="scale-outline" title={t('progress.noData')} />
        )}
      </Card>
      <Button label={t('progress.logWeight')} variant="secondary" icon="add" disabled />

      <SectionHeader title={t('progress.calories')} />
      <Card padded={calorieSeries.length > 0}>
        {calorieSeries.length > 0 ? (
          <BarChart data={calorieSeries} accessibilityLabel={t('progress.calories')} />
        ) : (
          <EmptyState icon="flame-outline" title={t('progress.noData')} />
        )}
      </Card>
    </Screen>
  );
}
