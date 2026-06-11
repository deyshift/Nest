import { View, StyleSheet } from 'react-native';
import type { HealthStatus } from '@/lib/intervals';
import { HEALTH_COLORS } from '@/lib/intervals';

interface Props {
  percent: number;
  status: HealthStatus;
}

export function ComponentHealthBar({ percent, status }: Props) {
  const fill = Math.min(percent, 100);
  return (
    <View style={styles.track}>
      <View
        style={[styles.fill, { width: `${fill}%` as any, backgroundColor: HEALTH_COLORS[status] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
