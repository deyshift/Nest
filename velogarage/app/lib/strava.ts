import { db } from '@/db/client';
import { bikes, stravaActivities } from '@/db/schema';
import { getValidAccessToken } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const LAST_SYNC_KEY = 'strava_last_sync';

async function apiGet(path: string, params?: Record<string, string | number>) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated');

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  return resp.json();
}

export async function syncBikes() {
  const athlete = await apiGet('/api/strava/athlete');
  const stravaBikes: Array<{
    id: string;
    name: string;
    brand_name?: string;
    model_name?: string;
    distance: number;
    primary: boolean;
  }> = athlete.bikes ?? [];

  for (const b of stravaBikes) {
    await db
      .insert(bikes)
      .values({
        id: b.id,
        stravaGearId: b.id,
        name: b.name,
        brand: b.brand_name ?? null,
        model: b.model_name ?? null,
        totalStravaDistanceM: b.distance,
        isPrimary: b.primary,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: bikes.stravaGearId,
        set: {
          name: b.name,
          brand: b.brand_name ?? null,
          model: b.model_name ?? null,
          totalStravaDistanceM: b.distance,
          isPrimary: b.primary,
          updatedAt: Date.now(),
        },
      });
  }
}

export async function syncActivities() {
  const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
  const after = lastSync ? Math.floor(Number(lastSync) / 1000) : undefined;

  let page = 1;
  const nowMs = Date.now();

  while (true) {
    const activities: Array<{
      id: number;
      name: string;
      distance: number;
      start_date: string;
      gear_id?: string;
      type: string;
    }> = await apiGet('/api/strava/activities', {
      ...(after ? { after } : {}),
      page,
      per_page: 100,
    });

    if (activities.length === 0) break;

    // Only cache rides (not runs, swims, etc.)
    const rides = activities.filter((a) =>
      ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'].includes(a.type),
    );

    for (const a of rides) {
      await db
        .insert(stravaActivities)
        .values({
          stravaId: String(a.id),
          stravaGearId: a.gear_id ?? null,
          distanceM: a.distance,
          startDate: a.start_date,
          name: a.name,
          syncedAt: nowMs,
        })
        .onConflictDoUpdate({
          target: stravaActivities.stravaId,
          set: {
            stravaGearId: a.gear_id ?? null,
            distanceM: a.distance,
            startDate: a.start_date,
            name: a.name,
            syncedAt: nowMs,
          },
        });
    }

    if (activities.length < 100) break;
    page++;
  }

  await AsyncStorage.setItem(LAST_SYNC_KEY, String(nowMs));
}

export async function getDistanceSinceService(
  stravaGearId: string,
  sinceDate: string,
): Promise<number> {
  const activities = await db
    .select({ distanceM: stravaActivities.distanceM })
    .from(stravaActivities)
    .where(eq(stravaActivities.stravaGearId, stravaGearId));

  return activities
    .filter((a) => {
      // Compare ISO date strings — activities after sinceDate
      return a.distanceM > 0;
    })
    .reduce((sum, a) => sum + a.distanceM, 0);
}

export async function getLastSyncDate(): Promise<Date | null> {
  const ts = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return ts ? new Date(Number(ts)) : null;
}
