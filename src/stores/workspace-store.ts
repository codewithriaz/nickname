import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

/** Which profile the dashboard is editing (persisted per browser). */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeProfileId: null,
      setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: "nk-workspace", partialize: (s) => ({ activeProfileId: s.activeProfileId }) },
  ),
);
