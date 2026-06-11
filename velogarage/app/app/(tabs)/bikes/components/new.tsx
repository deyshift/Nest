import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/db/client';
import { components, bikes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { COMPONENT_LABELS, LUBE_LABELS } from '@/lib/intervals';
import * as Crypto from 'expo-crypto';

type ComponentType = typeof components.$inferSelect['type'];
type LubeType = NonNullable<typeof components.$inferSelect['lubeType']>;

const COMPONENT_TYPES = Object.keys(COMPONENT_LABELS) as ComponentType[];
const LUBE_TYPES = Object.keys(LUBE_LABELS) as LubeType[];

export default function NewComponentScreen() {
  const { bikeId } = useLocalSearchParams<{ bikeId: string }>();

  const [type, setType] = useState<ComponentType>('chain');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [lubeType, setLubeType] = useState<LubeType>('wet');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!bikeId) return;
    setSaving(true);
    try {
      const bike = await db.select().from(bikes).where(eq(bikes.id, bikeId)).limit(1);
      if (!bike[0]) throw new Error('Bike not found');

      const now = Date.now();
      await db.insert(components).values({
        id: await Crypto.randomUUID(),
        bikeId,
        type,
        brand: brand.trim() || null,
        model: model.trim() || null,
        installedDate: new Date().toISOString().split('T')[0],
        installedAtDistanceM: bike[0].totalStravaDistanceM,
        lubeType: type === 'chain' ? lubeType : null,
        isActive: true,
        notes: notes.trim() || null,
        createdAt: now,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save component. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Component Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {COMPONENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
              {COMPONENT_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {type === 'chain' && (
        <>
          <Text style={styles.label}>Lube Type</Text>
          {LUBE_TYPES.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.row, lubeType === l && styles.rowActive]}
              onPress={() => setLubeType(l)}
            >
              <View style={[styles.radio, lubeType === l && styles.radioActive]} />
              <Text style={styles.rowText}>{LUBE_LABELS[l]}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.label}>Brand (optional)</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g. Shimano, SRAM, Continental"
        placeholderTextColor="#444"
      />

      <Text style={styles.label}>Model (optional)</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder="e.g. Ultegra, GP5000"
        placeholderTextColor="#444"
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any notes about this component…"
        placeholderTextColor="#444"
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add Component'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, gap: 8 },
  label: { color: '#888', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipScroll: { marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', marginRight: 8 },
  chipActive: { backgroundColor: '#FC4C02' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#1a1a1a', marginBottom: 6 },
  rowActive: { backgroundColor: '#FC4C0215', borderWidth: 1, borderColor: '#FC4C02' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#444' },
  radioActive: { borderColor: '#FC4C02', backgroundColor: '#FC4C02' },
  rowText: { color: '#ccc', fontSize: 14 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#FC4C02', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
