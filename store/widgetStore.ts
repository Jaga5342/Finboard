// Widget state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Widget } from "@/types/widget";

/**
 * Widget store state interface
 */
interface WidgetStoreState {
  widgets: Widget[];
  widgetData: Record<string, unknown>; // widgetId -> fetched data
}

/**
 * Widget store actions interface
 */
interface WidgetStoreActions {
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updateWidgetData: (id: string, data: unknown) => void;
  setWidgets: (widgets: Widget[]) => void;
  reorderWidgets: (newOrder: Widget[]) => void;
  getWidget: (id: string) => Widget | undefined;
  getWidgetData: (id: string) => unknown | undefined;
}

/**
 * Combined widget store type
 */
type WidgetStore = WidgetStoreState & WidgetStoreActions;

/**
 * Zustand store for widget management
 * Persisted to localStorage with key 'finboard-widgets'
 */
export const useWidgetStore = create<WidgetStore>()(
  persist(
    (set, get) => ({
      widgets: [],
      widgetData: {},

      addWidget: (widget: Widget) => {
        set((state) => ({
          widgets: [...state.widgets, widget],
        }));
      },

      removeWidget: (id: string) => {
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
          widgetData: Object.fromEntries(
            Object.entries(state.widgetData).filter(([key]) => key !== id)
          ),
        }));
      },

      updateWidget: (id: string, updates: Partial<Widget>) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, ...updates } : widget
          ),
        }));
      },

      updateWidgetData: (id: string, data: unknown) => {
        set((state) => ({
          widgetData: {
            ...state.widgetData,
            [id]: data,
          },
        }));
      },

      setWidgets: (widgets: Widget[]) => {
        set({ widgets });
      },

      reorderWidgets: (newOrder: Widget[]) => {
        set({ widgets: newOrder });
      },

      getWidget: (id: string) => {
        return get().widgets.find((widget) => widget.id === id);
      },

      getWidgetData: (id: string) => {
        return get().widgetData[id];
      },
    }),
    {
      name: "finboard-widgets",
      partialize: (state) => ({
        widgets: state.widgets,
      }),
    }
  )
);
