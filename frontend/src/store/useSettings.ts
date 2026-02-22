import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  sidebarCollapsed: boolean;
  autoReplyEnabled: boolean;
  pollingInterval: number;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAutoReplyEnabled: (enabled: boolean) => void;
  setPollingInterval: (interval: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      autoReplyEnabled: false,
      pollingInterval: 10000,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      setAutoReplyEnabled: (enabled) =>
        set({ autoReplyEnabled: enabled }),
      setPollingInterval: (interval) =>
        set({ pollingInterval: interval }),
    }),
    {
      name: 'socialautopro-settings',
    }
  )
);
