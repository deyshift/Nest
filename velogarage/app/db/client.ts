import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('velogarage.db', { enableChangeListener: true });

export const db = drizzle(expo, { schema });

export async function initDb() {
  await expo.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS bikes (
      id TEXT PRIMARY KEY,
      strava_gear_id TEXT UNIQUE,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      total_strava_distance_m REAL NOT NULL DEFAULT 0,
      is_primary INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      bike_id TEXT NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      installed_date TEXT NOT NULL,
      installed_at_distance_m REAL NOT NULL DEFAULT 0,
      lube_type TEXT,
      custom_interval_km REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY,
      component_id TEXT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      date TEXT NOT NULL,
      distance_at_service_m REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strava_activities (
      strava_id TEXT PRIMARY KEY,
      strava_gear_id TEXT,
      distance_m REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      name TEXT NOT NULL,
      synced_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strava_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      athlete_id INTEGER NOT NULL
    );
  `);
}
