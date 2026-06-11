import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db } from '@/db/client';
import { maintenanceRecords, components, bikes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { COMPONENT_LABELS } from '@/lib/intervals';

export default function LogScreen() {
  const { data: records = [] } = useLiveQuery(
    db
      .select({
        id: maintenanceRecords.id,
        action: maintenanceRecords.action,
        date: maintenanceRecords.date,
        distanceAtServiceM: maintenanceRecords.distanceAtServiceM,
        notes: maintenanceRecords.notes,
        componentType: components.type,
        componentBrand: components.brand,
        bikeName: bikes.name,
      })
      .from(maintenanceRecords)
      .innerJoin(components, eq(maintenanceRecords.componentId, components.id))
      .innerJoin(bikes, eq(components.bikeId, bikes.id))
      .orderBy(desc(maintenanceRecords.date)),
  );

  const fmt = (m: number) => `${(m / 1000).toFixed(1)} km`;

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No maintenance logged yet.{'\n'}Open a component to log your first service.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.action}>{item.action.charAt(0).toUpperCase() + item.action.slice(1)}</Text>
                <Text style={styles.component}>
                  {COMPONENT_LABELS[item.componentType]}{item.componentBrand ? ` · ${item.componentBrand}` : ''}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.bike}>{item.bikeName}</Text>
              </View>
            </View>
            <Text style={styles.dist}>At {fmt(item.distanceAtServiceM)}</Text>
            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  action: { fontSize: 16, fontWeight: '700', color: '#fff' },
  component: { fontSize: 13, color: '#888', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  date: { fontSize: 13, color: '#666' },
  bike: { fontSize: 12, color: '#FC4C02', marginTop: 2 },
  dist: { fontSize: 12, color: '#555' },
  notes: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', padding: 48 },
  emptyText: { color: '#555', textAlign: 'center', lineHeight: 22 },
});
