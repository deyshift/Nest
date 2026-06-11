import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/db/client';
import { maintenanceRecords, components, bikes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

type Action = typeof maintenanceRecords.$inferSelect['action'];
const ACTIONS: Action[] = ['replaced', 'lubed', 'cleaned', 'adjusted', 'inspected'];

export default function NewMaintenanceScreen() {
  const { componentId } = useLocalSearchParams<{ componentId: string }>();
  const [action, setAction] = useState<Action>('lubed');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!componentId) return;
    setSaving(true);
    try {
      const comp = await db.select().from(components).where(eq(components.id, componentId)).limit(1);
      if (!comp[0]) throw new Error('Component not found');

      const bike = await db.select().from(bikes).where(eq(bikes.id, comp[0].bikeId)).limit(1);

      await db.insert(maintenanceRecords).values({
        id: await Crypto.randomUUID(),
        componentId,
        action,
        date: new Date().toISOString().split('T')[0],
        distanceAtServiceM: bike[0]?.totalStravaDistanceM ?? 0,
        notes: notes.trim() || null,
        createdAt: Date.now(),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Action</Text>
      {ACTIONS.map((a) => (
        <TouchableOpacity
          key={a}
          style={[styles.row, action === a && styles.rowActive]}
          onPress={() => setAction(a)}
        >
          <View style={[styles.radio, action === a && styles.radioActive]} />
          <Text style={styles.rowText}>{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        value={notes}
        onChangeText={setNotes}
        placeholder="What did you do? Any observations?"
        placeholderTextColor="#444"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Record'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, gap: 6 },
  label: { color: '#888', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#1a1a1a', marginBottom: 6 },
  rowActive: { backgroundColor: '#FC4C0215', borderWidth: 1, borderColor: '#FC4C02' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#444' },
  radioActive: { borderColor: '#FC4C02', backgroundColor: '#FC4C02' },
  rowText: { color: '#ccc', fontSize: 15 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15 },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#FC4C02', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  disabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
