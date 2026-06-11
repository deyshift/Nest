import type { components } from '@/db/schema';

type ComponentType = typeof components.$inferSelect['type'];
type LubeType = NonNullable<typeof components.$inferSelect['lubeType']>;

const DEFAULT_INTERVALS_KM: Record<string, number> = {
  chain_wax: 400,
  chain_dry: 175,
  chain_wet: 400,
  chain_ceramic: 650,
  cassette: 8000,
  chainring: 15000,
  tire_front: 4000,
  tire_rear: 3000,
  brake_pads_front: 2000,
  brake_pads_rear: 2000,
  rotor_front: 10000,
  rotor_rear: 10000,
};

export function getIntervalKm(
  type: ComponentType,
  lubeType?: LubeType | null,
  customIntervalKm?: number | null,
): number {
  if (customIntervalKm) return customIntervalKm;
  if (type === 'chain' && lubeType) {
    return DEFAULT_INTERVALS_KM[`chain_${lubeType}`] ?? DEFAULT_INTERVALS_KM.chain_wet;
  }
  return DEFAULT_INTERVALS_KM[type] ?? 2000;
}

export function getHealthPercent(distanceSinceServiceM: number, intervalKm: number): number {
  return (distanceSinceServiceM / 1000 / intervalKm) * 100;
}

export type HealthStatus = 'good' | 'warning' | 'overdue';

export function getHealthStatus(percent: number): HealthStatus {
  if (percent >= 100) return 'overdue';
  if (percent >= 80) return 'warning';
  return 'good';
}

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  good: '#22c55e',
  warning: '#f59e0b',
  overdue: '#ef4444',
};

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  chain: 'Chain',
  cassette: 'Cassette',
  chainring: 'Chainring',
  tire_front: 'Front Tire',
  tire_rear: 'Rear Tire',
  brake_pads_front: 'Front Brake Pads',
  brake_pads_rear: 'Rear Brake Pads',
  rotor_front: 'Front Rotor',
  rotor_rear: 'Rear Rotor',
};

export const LUBE_LABELS: Record<LubeType, string> = {
  wax: 'Wax (~400 km)',
  dry: 'Dry Lube (~175 km)',
  wet: 'Wet Lube (~400 km)',
  ceramic: 'Ceramic (~650 km)',
};
