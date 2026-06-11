import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';

export default function SettingsScreen() {
  const { athleteName, athleteId, logout } = useAuthStore();
  const { lastSyncDate, syncing, sync } = useSyncStore();

  const handleLogout = () => {
    Alert.alert(
      'Disconnect Strava?',
      'Your local maintenance data will be kept, but mileage syncing will stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strava Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Athlete</Text>
            <Text style={styles.rowValue}>{athleteName ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Athlete ID</Text>
            <Text style={styles.rowValue}>{athleteId ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Last Synced</Text>
            <Text style={styles.rowValue}>
              {lastSyncDate ? lastSyncDate.toLocaleString() : 'Never'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={sync} disabled={syncing}>
          <Text style={styles.actionBtnText}>{syncing ? 'Syncing…' : '↻ Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleLogout}>
          <Text style={[styles.actionBtnText, styles.dangerText]}>Disconnect Strava</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>VeloGarage · v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#555', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  rowLabel: { color: '#888', fontSize: 14 },
  rowValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#222' },
  actionBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, alignItems: 'center' },
  actionBtnText: { color: '#FC4C02', fontWeight: '600', fontSize: 15 },
  dangerBtn: { backgroundColor: '#1a1a1a' },
  dangerText: { color: '#ef4444' },
  version: { color: '#333', textAlign: 'center', fontSize: 12, position: 'absolute', bottom: 32, alignSelf: 'center' },
});
