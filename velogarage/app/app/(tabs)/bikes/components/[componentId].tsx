import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { db } from '@/db/client';
import { components, maintenanceRecords, bikes, stravaActivities } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import {
  getIntervalKm,
  getHealthPercent,
  getHealthStatus,
  HEALTH_COLORS,
  COMPONENT_LABELS,
  LUBE_LABELS,
} from '@/lib/intervals';
import { ComponentHealthBar } from '@/components/ComponentHealthBar';

export default function ComponentDetailScreen() {
  const { componentId } = useLocalSearchParams<{ componentId: string }>();

  const { data: compList = [] } = useLiveQuery(
    db.select().from(components).where(eq(components.id, componentId)),
  );
  const comp = compList[0];

  const { data: records = [] } = useLiveQuery(
    db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.componentId, componentId))
      .orderBy(desc(maintenanceRecords.date)),
  );

  const [distanceM, setDistanceM] = useState(0);

  useEffect(() => {
    if (!comp) return;
    (async () => {
      const bikeRow = await db.select().from(bikes).where(eq(bikes.id, comp.bikeId)).limit(1);
      if (!bikeRow[0]?.stravaGearId) return;

      const sinceDate = records[0]?.date ?? comp.installedDate;
      const acts = await db
        .select({ distanceM: stravaActivities.distanceM })
        .from(stravaActivities)
        .where(
          and(
            eq(stravaActivities.stravaGearId, bikeRow[0].stravaGearId),
            gte(stravaActivities.startDate, sinceDate),
          ),
        );
      setDistanceM(acts.reduce((s, a) => s + a.distanceM, 0));
    })();
  }, [comp, records]);

  if (!comp) return null;

  const intervalKm = getIntervalKm(comp.type, comp.lubeType, comp.customIntervalKm);
  const percent = getHealthPercent(distanceM, intervalKm);
  const status = getHealthStatus(percent);

  const fmt = (m: number) => `${(m / 1000).toFixed(1)} km`;

  const handleRetire = () => {
    Alert.alert('Retire component?', 'This marks the component as inactive.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retire',
        style: 'destructive',
        onPress: async () => {
          await db.update(components).set({ isActive: false }).where(eq(components.id, comp.id));
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: COMPONENT_LABELS[comp.type] }} />

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.type}>{COMPONENT_LABELS[comp.type]}</Text>
          <Text style={[styles.statusText, { color: HEALTH_COLORS[status] }]}>
            {status === 'overdue' ? '⚠ Overdue' : status === 'warning' ? '⏱ Due soon' : '✓ Good'}
          </Text>
        </View>

        {(comp.brand || comp.model) && (
          <Text style={styles.meta}>{[comp.brand, comp.model].filter(Boolean).join(' · ')}</Text>
        )}

        {comp.lubeType && (
          <Text style={styles.meta}>Lube: {LUBE_LABELS[comp.lubeType]}</Text>
        )}

        <ComponentHealthBar percent={percent} status={status} />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fmt(distanceM)}</Text>
            <Text style={styles.statLabel}>Since service</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{intervalKm} km</Text>
            <Text style={styles.statLabel}>Interval</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: HEALTH_COLORS[status] }]}>
              {Math.round(percent)}%
            </Text>
            <Text style={styles.statLabel}>Used</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logBtn}
        onPress={() => router.push(`/(tabs)/bikes/log/new?componentId=${comp.id}`)}
      >
        <Text style={styles.logBtnText}>+ Log Service</Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>Service History</Text>

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No service records yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.record}>
            <View style={styles.recordTop}>
              <Text style={styles.recordAction}>{item.action.charAt(0).toUpperCase() + item.action.slice(1)}</Text>
              <Text style={styles.recordDate}>{item.date}</Text>
            </View>
            <Text style={styles.recordDist}>At {fmt(item.distanceAtServiceM)}</Text>
            {item.notes && <Text style={styles.recordNotes}>{item.notes}</Text>}
          </View>
        )}
      />

      <TouchableOpacity style={styles.retireBtn} onPress={handleRetire}>
        <Text style={styles.retireBtnText}>Retire component</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  card: { backgroundColor: '#1a1a1a', margin: 16, borderRadius: 16, padding: 20, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statusText: { fontSize: 14, fontWeight: '700' },
  meta: { color: '#777', fontSize: 13 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  logBtn: { backgroundColor: '#FC4C02', marginHorizontal: 16, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#888', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, gap: 8 },
  record: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, gap: 4 },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between' },
  recordAction: { color: '#fff', fontWeight: '600', fontSize: 14 },
  recordDate: { color: '#666', fontSize: 13 },
  recordDist: { color: '#555', fontSize: 12 },
  recordNotes: { color: '#888', fontSize: 13, marginTop: 2 },
  empty: { color: '#555', textAlign: 'center', padding: 24 },
  retireBtn: { marginHorizontal: 16, marginTop: 16, padding: 14, alignItems: 'center' },
  retireBtnText: { color: '#ef4444', fontSize: 14 },
});
