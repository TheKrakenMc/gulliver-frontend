import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HourRecord } from '../types';

export type OfflineAction = 
  | {
      id: string; // unique ID for the action
      type: 'CREATE_HOUR_RECORD';
      payload: {
        planId: string;
        record: HourRecord; // this will have the temp id
      };
      timestamp: number;
    }
  | {
      id: string;
      type: 'FINISH_SHIFT';
      payload: {
        operativeRecordId: string;
      };
      timestamp: number;
    };

interface SyncState {
  offlineQueue: OfflineAction[];
  enqueueAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => void;
  dequeueAction: (id: string) => void;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      offlineQueue: [],
      enqueueAction: (action) => set((state) => ({
        offlineQueue: [...state.offlineQueue, { ...action, id: crypto.randomUUID(), timestamp: Date.now() }]
      })),
      dequeueAction: (id) => set((state) => ({
        offlineQueue: state.offlineQueue.filter((a) => a.id !== id)
      })),
      clearQueue: () => set({ offlineQueue: [] })
    }),
    {
      name: 'gulliver-offline-sync'
    }
  )
);
