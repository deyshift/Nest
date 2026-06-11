import { create } from 'zustand';
import { syncBikes, syncActivities, getLastSyncDate } from '@/lib/strava';

interface SyncState {
  syncing: boolean;
  lastSyncDate: Date | null;
  error: string | null;
  sync: () => Promise<void>;
  loadLastSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  syncing: false,
  lastSyncDate: null,
  error: null,

  loadLastSync: async () => {
    const date = await getLastSyncDate();
    set({ lastSyncDate: date });
  },

  sync: async () => {
    set({ syncing: true, error: null });
    try {
      await syncBikes();
      await syncActivities();
      const date = await getLastSyncDate();
      set({ syncing: false, lastSyncDate: date });
    } catch (e) {
      set({ syncing: false, error: e instanceof Error ? e.message : 'Sync failed' });
    }
  },
}));
