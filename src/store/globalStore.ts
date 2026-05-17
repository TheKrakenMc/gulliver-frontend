import { create } from 'zustand';

export interface UserSession {
  name: string;
  dept: string;
  role: string;
  regionID?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  preset: 'today' | 'week' | 'month' | 'custom';
}

interface GlobalState {
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
}

const AUTH_STORAGE_KEY = 'gulliver_auth_session';

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

export const useGlobalStore = create<GlobalState>((set) => ({
  globalDateRange: {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    preset: 'today',
  },
  userSession: getInitialSession(),
  isAuthenticated: localStorage.getItem(AUTH_STORAGE_KEY) !== null,
  sidebarCollapsed: false,
  isMobileDrawerOpen: false,
  notifications: 3, // Mock count for demo purposes
  
  setDateRange: (range) => set({ globalDateRange: range }),
  setUserSession: (session) => {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      set({ userSession: session, isAuthenticated: true });
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      set({ userSession: null, isAuthenticated: false });
    }
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ userSession: null, isAuthenticated: false });
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  clearNotifications: () => set({ notifications: 0 }),
}));
