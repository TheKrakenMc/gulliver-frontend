import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HourRecord, FaultRecord, ScrapRecord, DowntimeRecord } from '../types';

interface LocalShiftState {
  planId: string | null;
  date: string | null;
  shift: string | null;
  operativeRecordId: string | null;
  status: 'active' | 'finished' | null;
  
  records: HourRecord[];
  faultsByHour: Record<number, FaultRecord[]>;
  scrapByHour: Record<number, ScrapRecord[]>;
  downtimeByHour: Record<number, DowntimeRecord[]>;

  // Actions
  initShift: (planId: string, date: string, shift: string, operativeRecordId?: string) => void;
  addHourRecord: (record: HourRecord) => void;
  updateHourRecord: (index: number, updates: Partial<HourRecord>) => void;
  addFault: (hourIndex: number, fault: FaultRecord) => void;
  addScrap: (hourIndex: number, scrap: ScrapRecord) => void;
  addDowntime: (hourIndex: number, downtime: DowntimeRecord) => void;
  updateFault: (updatedFault: FaultRecord) => void;
  updateScrap: (updatedScrap: ScrapRecord) => void;
  deleteFault: (hourIndex: number, faultId: string) => void;
  deleteScrap: (hourIndex: number, scrapId: string) => void;
  deleteDowntime: (hourIndex: number, dtId: string) => void;
  clearShift: () => void;
  setRecords: (records: HourRecord[], faultsMap: Record<number, FaultRecord[]>, scrapMap: Record<number, ScrapRecord[]>, dtMap: Record<number, DowntimeRecord[]>) => void;
}

export const useLocalShiftStore = create<LocalShiftState>()(
  persist(
    (set) => ({
      planId: null,
      date: null,
      shift: null,
      operativeRecordId: null,
      status: null,
      records: [],
      faultsByHour: {},
      scrapByHour: {},
      downtimeByHour: {},

      initShift: (planId, date, shift, operativeRecordId) => set({
        planId,
        date,
        shift,
        operativeRecordId: operativeRecordId || `OP-${Date.now()}`,
        status: 'active',
        records: [],
        faultsByHour: {},
        scrapByHour: {},
        downtimeByHour: {}
      }),

      setRecords: (records, faultsByHour, scrapByHour, downtimeByHour) => set({
        records,
        faultsByHour,
        scrapByHour,
        downtimeByHour
      }),

      addHourRecord: (record) => set((state) => ({
        records: [...state.records, record]
      })),

      updateHourRecord: (index, updates) => set((state) => {
        const newRecords = [...state.records];
        if (newRecords[index]) {
          newRecords[index] = { ...newRecords[index], ...updates };
        }
        return { records: newRecords };
      }),

      addFault: (hourIndex, fault) => set((state) => {
        const current = state.faultsByHour[hourIndex] || [];
        return {
          faultsByHour: {
            ...state.faultsByHour,
            [hourIndex]: [...current, fault]
          }
        };
      }),

      addScrap: (hourIndex, scrap) => set((state) => {
        const current = state.scrapByHour[hourIndex] || [];
        return {
          scrapByHour: {
            ...state.scrapByHour,
            [hourIndex]: [...current, scrap]
          }
        };
      }),

      addDowntime: (hourIndex, downtime) => set((state) => {
        const current = state.downtimeByHour[hourIndex] || [];
        return {
          downtimeByHour: {
            ...state.downtimeByHour,
            [hourIndex]: [...current, downtime]
          }
        };
      }),

      updateFault: (updatedFault) => set((state) => {
        const next = { ...state.faultsByHour };
        for (const key in next) {
          next[key] = next[key].map((f) => f.id === updatedFault.id ? updatedFault : f);
        }
        return { faultsByHour: next };
      }),

      updateScrap: (updatedScrap) => set((state) => {
        const next = { ...state.scrapByHour };
        for (const key in next) {
          next[key] = next[key].map((s) => s.id === updatedScrap.id ? updatedScrap : s);
        }
        return { scrapByHour: next };
      }),

      deleteFault: (hourIndex, faultId) => set((state) => {
        const current = state.faultsByHour[hourIndex] || [];
        return {
          faultsByHour: {
            ...state.faultsByHour,
            [hourIndex]: current.filter(f => f.id !== faultId)
          }
        };
      }),

      deleteScrap: (hourIndex, scrapId) => set((state) => {
        const current = state.scrapByHour[hourIndex] || [];
        return {
          scrapByHour: {
            ...state.scrapByHour,
            [hourIndex]: current.filter(s => s.id !== scrapId)
          }
        };
      }),

      deleteDowntime: (hourIndex, dtId) => set((state) => {
        const current = state.downtimeByHour[hourIndex] || [];
        return {
          downtimeByHour: {
            ...state.downtimeByHour,
            [hourIndex]: current.filter(dt => dt.id !== dtId)
          }
        };
      }),

      clearShift: () => set({
        planId: null,
        date: null,
        shift: null,
        operativeRecordId: null,
        status: null,
        records: [],
        faultsByHour: {},
        scrapByHour: {},
        downtimeByHour: {}
      })
    }),
    {
      name: 'gulliver-local-shift',
    }
  )
);
