import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bikes = sqliteTable('bikes', {
  id: text('id').primaryKey(),
  stravaGearId: text('strava_gear_id').unique(),
  name: text('name').notNull(),
  brand: text('brand'),
  model: text('model'),
  totalStravaDistanceM: real('total_strava_distance_m').notNull().default(0),
  isPrimary: int('is_primary', { mode: 'boolean' }).notNull().default(false),
  updatedAt: int('updated_at').notNull(),
});

export const components = sqliteTable('components', {
  id: text('id').primaryKey(),
  bikeId: text('bike_id')
    .notNull()
    .references(() => bikes.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'chain',
      'cassette',
      'chainring',
      'tire_front',
      'tire_rear',
      'brake_pads_front',
      'brake_pads_rear',
      'rotor_front',
      'rotor_rear',
    ],
  }).notNull(),
  brand: text('brand'),
  model: text('model'),
  installedDate: text('installed_date').notNull(),
  installedAtDistanceM: real('installed_at_distance_m').notNull().default(0),
  lubeType: text('lube_type', { enum: ['wax', 'dry', 'wet', 'ceramic'] }),
  customIntervalKm: real('custom_interval_km'),
  isActive: int('is_active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: int('created_at').notNull(),
});

export const maintenanceRecords = sqliteTable('maintenance_records', {
  id: text('id').primaryKey(),
  componentId: text('component_id')
    .notNull()
    .references(() => components.id, { onDelete: 'cascade' }),
  action: text('action', {
    enum: ['replaced', 'lubed', 'cleaned', 'adjusted', 'inspected'],
  }).notNull(),
  date: text('date').notNull(),
  distanceAtServiceM: real('distance_at_service_m').notNull().default(0),
  notes: text('notes'),
  createdAt: int('created_at').notNull(),
});

export const stravaActivities = sqliteTable('strava_activities', {
  stravaId: text('strava_id').primaryKey(),
  stravaGearId: text('strava_gear_id'),
  distanceM: real('distance_m').notNull().default(0),
  startDate: text('start_date').notNull(),
  name: text('name').notNull(),
  syncedAt: int('synced_at').notNull(),
});

export const stravaTokens = sqliteTable('strava_tokens', {
  id: int('id').primaryKey().default(1),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: int('expires_at').notNull(),
  athleteId: int('athlete_id').notNull(),
});
