import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { db } from '@/db/client';
import { bikes } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

export default function GarageScreen() {
  const { athleteName } = useAuthStore();
  const { syncing, lastSyncDate, sync, loadLastSync } = useSyncStore();
  const { data: bikeList = [] } = useLiveQuery(db.select().from(bikes).orderBy(bikes.isPrimary));

  useEffect(() => {
    loadLastSync();
    if (bikeList.length === 0) sync();
  }, []);

  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(0)} km`;

  const lastSyncText = lastSyncDate
    ? `Synced ${lastSyncDate.toLocaleDateString()}`
    : 'Never synced';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {athleteName ? `${athleteName}'s Garage` : 'My Garage'}
        </Text>
        <TouchableOpacity onPress={sync} disabled={syncing} style={styles.syncBtn}>
          {syncing ? (
            <ActivityIndicator color="#FC4C02" size="small" />
          ) : (
            <Text style={styles.syncBtnText}>↻ Sync</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.syncMeta}>{lastSyncText}</Text>

      <FlatList
        data={bikeList}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={sync} tintColor="#FC4C02" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {syncing ? 'Syncing your bikes…' : 'No bikes found.\nMake sure your bikes are registered in Strava.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(tabs)/bikes/${item.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.bikeName}>{item.name}</Text>
              {item.isPrimary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
            </View>
            {(item.brand || item.model) && (
              <Text style={styles.bikeMeta}>{[item.brand, item.model].filter(Boolean).join(' · ')}</Text>
            )}
            <Text style={styles.bikeDistance}>{formatDistance(item.totalStravaDistanceM)} total</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 4 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  syncBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1a1a1a' },
  syncBtnText: { color: '#FC4C02', fontWeight: '600', fontSize: 14 },
  syncMeta: { color: '#555', fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bikeName: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1 },
  primaryBadge: { backgroundColor: '#FC4C0220', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  primaryText: { color: '#FC4C02', fontSize: 11, fontWeight: '600' },
  bikeMeta: { color: '#888', fontSize: 13 },
  bikeDistance: { color: '#FC4C02', fontSize: 14, fontWeight: '600', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', padding: 40 },
  emptyText: { color: '#555', textAlign: 'center', lineHeight: 22 },
});
