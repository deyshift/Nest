import * as SecureStore from 'expo-secure-store';
import { db } from '@/db/client';
import { stravaTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const KEYS = {
  accessToken: 'strava_access_token',
  refreshToken: 'strava_refresh_token',
  expiresAt: 'strava_expires_at',
  athleteId: 'strava_athlete_id',
};

export async function saveTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
}) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, tokens.access_token),
    SecureStore.setItemAsync(KEYS.refreshToken, tokens.refresh_token),
    SecureStore.setItemAsync(KEYS.expiresAt, String(tokens.expires_at)),
    SecureStore.setItemAsync(KEYS.athleteId, String(tokens.athlete_id)),
  ]);

  // Mirror to SQLite so we can read expiry offline without SecureStore async call
  await db
    .insert(stravaTokens)
    .values({
      id: 1,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_at,
      athleteId: tokens.athlete_id,
    })
    .onConflictDoUpdate({
      target: stravaTokens.id,
      set: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_at,
        athleteId: tokens.athlete_id,
      },
    });
}

export async function clearTokens() {
  await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
  await db.delete(stravaTokens).where(eq(stravaTokens.id, 1));
}

export async function getValidAccessToken(): Promise<string | null> {
  const [accessToken, expiresAtStr, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.expiresAt),
    SecureStore.getItemAsync(KEYS.refreshToken),
  ]);

  if (!accessToken) return null;

  const expiresAt = Number(expiresAtStr ?? 0);
  const nowSecs = Math.floor(Date.now() / 1000);

  // Refresh if expiring within 5 minutes
  if (nowSecs >= expiresAt - 300 && refreshToken) {
    return doRefresh(refreshToken);
  }

  return accessToken;
}

async function doRefresh(refreshToken: string): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const athleteId = Number(await SecureStore.getItemAsync(KEYS.athleteId) ?? 0);
    await saveTokens({ ...data, athlete_id: athleteId });
    return data.access_token;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(KEYS.accessToken);
  return token !== null;
}
