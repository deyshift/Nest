import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { db } from '@/db/client';
import { bikes, components, maintenanceRecords, stravaActivities } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import {
  getIntervalKm,
  getHealthPercent,
  getHealthStatus,
  HEALTH_COLORS,
  COMPONENT_LABELS,
} from '@/lib/intervals';
import { ComponentHealthBar } from '@/components/ComponentHealthBar';

export default function BikeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bikeList = [] } = useLiveQuery(db.select().from(bikes).where(eq(bikes.id, id)));
  const bike = bikeList[0];

  const { data: componentList = [] } = useLiveQuery(
    db.select().from(components).where(and(eq(components.bikeId, id), eq(components.isActive, true))),
  );

  const [componentStats, setComponentStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!bike?.stravaGearId) return;
    (async () => {
      const stats: Record<string, number> = {};
      for (const comp of componentList) {
        const records = await db
          .select()
          .from(maintenanceRecords)
          .where(eq(maintenanceRecords.componentId, comp.id))
          .orderBy(desc(maintenanceRecords.date))
          .limit(1);

        const sinceDate = records[0]?.date ?? comp.installedDate;

        const activities = await db
          .select({ distanceM: stravaActivities.distanceM })
          .from(stravaActivities)
          .where(
            and(
              eq(stravaActivities.stravaGearId, bike.stravaGearId!),
              gte(stravaActivities.startDate, sinceDate),
            ),
          );

        stats[comp.id] = activities.reduce((s, a) => s + a.distanceM, 0);
      }
      setComponentStats(stats);
    })();
  }, [componentList, bike]);

  if (!bike) return null;

  const formatDistance = (m: number) => `${(m / 1000).toFixed(0)} km`;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: bike.name }} />

      <View style={styles.bikeCard}>
        <Text style={styles.bikeName}>{bike.name}</Text>
        {(bike.brand || bike.model) && (
          <Text style={styles.bikeMeta}>{[bike.brand, bike.model].filter(Boolean).join(' · ')}</Text>
        )}
        <Text style={styles.totalDist}>{formatDistance(bike.totalStravaDistanceM)} total on Strava</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Components</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(`/(tabs)/bikes/components/new?bikeId=${id}`)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={componentList}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No components yet. Add your chain, tires, and more.</Text>
        }
        renderItem={({ item }) => {
          const distanceM = componentStats[item.id] ?? 0;
          const intervalKm = getIntervalKm(item.type, item.lubeType, item.customIntervalKm);
          const percent = getHealthPercent(distanceM, intervalKm);
          const status = getHealthStatus(percent);

          return (
            <TouchableOpacity
              style={styles.compCard}
              onPress={() => router.push(`/(tabs)/bikes/components/${item.id}`)}
            >
              <View style={styles.compTop}>
                <Text style={styles.compName}>{COMPONENT_LABELS[item.type]}</Text>
                <Text style={[styles.compStatus, { color: HEALTH_COLORS[status] }]}>
                  {status === 'overdue' ? 'Overdue' : status === 'warning' ? 'Due soon' : 'Good'}
                </Text>
              </View>
              {item.brand && <Text style={styles.compMeta}>{item.brand} {item.model ?? ''}</Text>}
              <ComponentHealthBar percent={percent} status={status} />
              <Text style={styles.compDist}>
                {formatDistance(distanceM)} / {intervalKm} km
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  bikeCard: { backgroundColor: '#1a1a1a', margin: 16, borderRadius: 16, padding: 20, gap: 4 },
  bikeName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  bikeMeta: { color: '#888', fontSize: 14 },
  totalDist: { color: '#FC4C02', fontWeight: '600', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#FC4C02', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { paddingHorizontal: 16, gap: 10 },
  compCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, gap: 6 },
  compTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  compStatus: { fontSize: 13, fontWeight: '600' },
  compMeta: { color: '#666', fontSize: 12 },
  compDist: { color: '#555', fontSize: 12, marginTop: 2 },
  empty: { color: '#555', textAlign: 'center', padding: 32, lineHeight: 22 },
});
