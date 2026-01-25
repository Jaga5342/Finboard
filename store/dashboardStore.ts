// Dashboard state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Layout } from "react-grid-layout/legacy";

/**
 * Theme type
 */
export type Theme = "light" | "dark";

/**
 * Dashboard store state interface
 */
interface DashboardStoreState {
  layout: Layout;
  theme: Theme;
  isModalOpen: boolean;
}

/**
 * Dashboard store actions interface
 */
interface DashboardStoreActions {
  updateLayout: (layout: Layout) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setModalOpen: (isOpen: boolean) => void;
  resetLayout: () => void;
}

/**
 * Combined dashboard store type
 */
type DashboardStore = DashboardStoreState & DashboardStoreActions;

/**
 * Zustand store for dashboard management
 * Persists layout and theme to localStorage with key 'finboard-dashboard'
 */
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      layout: [],
      theme: "light",
      isModalOpen: false,

      updateLayout: (layout: Layout) => {
        set({ layout });
      },

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        }));
      },

      setModalOpen: (isOpen: boolean) => {
        set({ isModalOpen: isOpen });
      },

      resetLayout: () => {
        set({ layout: [] });
      },
    }),
    {
      name: "finboard-dashboard",
      partialize: (state) => ({
        layout: state.layout,
        theme: state.theme,
      }),
    }
  )
);
