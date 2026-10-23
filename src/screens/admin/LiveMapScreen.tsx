import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { FreshnessBadge } from '../../components/Badges';
import { ListRow } from '../../components/Controls';
import { MapPanel } from '../../components/MapPanel';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { spacing, typography } from '../../theme';
import type { AdminStackParamList } from '../../types/navigation';
import { freshnessOf } from '../../utils/freshness';
import { formatTime } from '../../utils/time';
import { useActiveJourneys } from './ActiveJourneysScreen';

type Props = NativeStackScreenProps<AdminStackParamList, 'LiveMap'>;

export function LiveMapScreen({ navigation }: Props) {
  const { items, error, load, loading, now } = useActiveJourneys();
  const journeys = useMemo(() => items ?? [], [items]);
  const located = useMemo(() => journeys.filter((j) => j.last_latitude != null && j.last_longitude != null), [journeys]);
  const points = useMemo(() => located.map((j) => ({
    id: j.id,
    latitude: j.last_latitude!,
    longitude: j.last_longitude!,
    accuracyM: j.last_accuracy_m,
    title: j.employee?.full_name ?? 'Staff member',
    description: `${j.label} · last updated ${formatTime(j.last_observed_at)} · expires ${formatTime(j.expires_at)}`,
    freshness: freshnessOf(j.last_observed_at, now),
  })), [located, now]);
  const renderJourney = useCallback(({ item: j }: { item: (typeof journeys)[number] }) => (
    <ListRow key={j.id} title={j.employee?.full_name ?? 'Staff member'}
      subtitle={j.last_observed_at
        ? `${j.label} · ${formatTime(j.last_observed_at)} · ETA ${formatTime(j.estimated_arrival_at)} · expires ${formatTime(j.expires_at)}`
        : `${j.label} · location unavailable · started ${formatTime(j.sharing_started_at)}`}
      right={<FreshnessBadge freshness={freshnessOf(j.last_observed_at, now)} />}
      onPress={() => navigation.navigate('AdminJourneyDetail', { journeyId: j.id })} />
  ), [navigation, now]);
  if (!items && error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <LoadingState />;
  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={journeys}
        keyExtractor={(j) => j.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={(
          <>
            <MapPanel
              height={360}
              emptyText="No active journey has shared a location yet."
              onSelect={(id) => navigation.navigate('AdminJourneyDetail', { journeyId: id })}
              points={points}
            />
            <Text style={[typography.small, styles.legend]}>Green: updated within 2 min. Amber: 2–10 min. Red: older than 10 min (not live).</Text>
          </>
        )}
        ListEmptyComponent={<EmptyState title="No active journeys" message="Only staff who approved an active journey appear here." />}
        renderItem={renderJourney}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  legend: { marginBottom: spacing.sm },
});
