import { create } from 'zustand';
import { format } from 'date-fns';
import type { PlanRecord, HierarchyLocation, HierarchyBusinessUnit, HierarchyProcess, HierarchyProduct } from '../types';
import { baseDataApi } from '../api/baseDataApi';

export interface UserSession {
  id: number;
  employee_number: string;
  name: string;
  email: string | null;
  role: string;
  dept: string | null;
  regionID?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  preset: 'today' | 'week' | 'month' | 'custom';
}

interface GlobalState {
  hierarchy: HierarchyLocation[];
  fetchHierarchy: () => Promise<void>;
  globalDateRange: DateRange;
  userSession: UserSession | null;
  isAuthenticated: boolean;
  sidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  notifications: number;
  
  setDateRange: (range: DateRange) => void;
  setUserSession: (session: UserSession | null) => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  clearNotifications: () => void;

  isGlobalLoading: boolean;
  globalLoadingText: string;
  setGlobalLoading: (loading: boolean, text?: string) => void;
}

const AUTH_STORAGE_KEY = 'gulliver_auth_session';
const TOKEN_STORAGE_KEY = 'gulliver_token';

const getInitialSession = (): UserSession | null => {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getInitialDateRange = (): DateRange => {
  const now = new Date();
  return {
    startDate: format(now, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
    preset: 'today'
  };
};

export const useGlobalStore = create<GlobalState>((set) => ({
  hierarchy: [],
  fetchHierarchy: async () => {
    try {
      const data = await baseDataApi.getHierarchy();
      set({ hierarchy: data });
    } catch (error) {
      console.error("Failed to fetch hierarchy:", error);
    }
  },
  globalDateRange: getInitialDateRange(),
  userSession: getInitialSession(),
  isAuthenticated: localStorage.getItem(AUTH_STORAGE_KEY) !== null,
  sidebarCollapsed: false,
  isMobileDrawerOpen: false,
  notifications: 3, // Mock count for demo purposes
  
  isGlobalLoading: false,
  globalLoadingText: '',
  
  setDateRange: (range) => set({ globalDateRange: range }),
  setUserSession: (session) => {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      set({ userSession: session, isAuthenticated: true });
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      set({ userSession: null, isAuthenticated: false });
    }
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ userSession: null, isAuthenticated: false });
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  clearNotifications: () => set({ notifications: 0 }),
  setGlobalLoading: (loading: boolean, text: string = '') => set({ isGlobalLoading: loading, globalLoadingText: text }),
}));
