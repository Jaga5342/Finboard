"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Layout } from "react-grid-layout/legacy";
import { Plus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import AddWidgetModal from "@/components/modals/AddWidgetModal";
import { useWidgetStore } from "@/store/widgetStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { fetchWidgetData } from "@/services/dataService";
import { DisplayMode, Widget, WidgetType } from "@/types/widget";

const DEFAULT_SIZE = { width: 4, height: 6 };

function normalizeInterval(interval?: number): number | null {
  if (!interval || interval <= 0) return null;
  if (interval < 1000) return interval * 1000;
  return interval;
}

function getNextWidgetPosition(
  layout: any[],
  size: { width: number; height: number }
): { x: number; y: number } {
  if (layout.length === 0) {
    return { x: 0, y: 0 };
  }

  const maxY = layout.reduce(
    (acc, item) => Math.max(acc, item.y + item.h),
    0
  );

  return { x: 0, y: maxY };
}

function mapDisplayModeToType(displayMode: DisplayMode): WidgetType {
  switch (displayMode) {
    case DisplayMode.TABLE:
      return WidgetType.TABLE;
    case DisplayMode.CHART:
      return WidgetType.CHART;
    default:
      return WidgetType.CARD;
  }
}

export default function Home() {
  const widgets = useWidgetStore((state) => state.widgets);
  const widgetData = useWidgetStore((state) => state.widgetData);
  const addWidget = useWidgetStore((state) => state.addWidget);
  const updateWidgetData = useWidgetStore((state) => state.updateWidgetData);

  const layout = useDashboardStore((state) => state.layout);
  const theme = useDashboardStore((state) => state.theme);
  const toggleTheme = useDashboardStore((state) => state.toggleTheme);
  const isModalOpen = useDashboardStore((state) => state.isModalOpen);
  const setModalOpen = useDashboardStore((state) => state.setModalOpen);

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const intervalRef = useRef<Record<string, number>>({});
  const fetchedRef = useRef<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const widgetPersist = (useWidgetStore as typeof useWidgetStore & {
      persist?: { rehydrate?: () => Promise<void> | void };
    }).persist;
    const dashboardPersist = (useDashboardStore as typeof useDashboardStore & {
      persist?: { rehydrate?: () => Promise<void> | void };
    }).persist;

    Promise.resolve(widgetPersist?.rehydrate?.()).finally(() => {
      Promise.resolve(dashboardPersist?.rehydrate?.()).finally(() => {
        setHydrated(true);
      });
    });
  }, []);

  const fetchAndStoreWidgetData = useCallback(
    async (widget: Widget, showLoading: boolean = true) => {
      if (!widget.apiUrl) return;
      if (showLoading) {
        setLoadingMap((prev) => ({ ...prev, [widget.id]: true }));
      }
      setErrorMap((prev) => ({ ...prev, [widget.id]: null }));

      const interval = normalizeInterval(widget.refreshInterval);
      const response = await fetchWidgetData(
        widget.apiUrl,
        widget.id,
        true,
        interval ?? undefined
      );

      if (response.success && response.data !== undefined) {
        updateWidgetData(widget.id, response.data);
      } else {
        setErrorMap((prev) => ({
          ...prev,
          [widget.id]: response.error?.message ?? "Failed to load widget data.",
        }));
      }

      if (showLoading) {
        setLoadingMap((prev) => ({ ...prev, [widget.id]: false }));
      }
    },
    [updateWidgetData]
  );

  useEffect(() => {
    if (!hydrated) return;
    widgets.forEach((widget) => {
      if (!fetchedRef.current.has(widget.id)) {
        fetchedRef.current.add(widget.id);
        fetchAndStoreWidgetData(widget);
      }
    });
  }, [widgets, hydrated, fetchAndStoreWidgetData]);

  useEffect(() => {
    if (!hydrated) return;
    const activeWidgetIds = new Set(widgets.map((widget) => widget.id));
    fetchedRef.current.forEach((id) => {
      if (!activeWidgetIds.has(id)) {
        fetchedRef.current.delete(id);
      }
    });

    Object.keys(intervalRef.current).forEach((id) => {
      if (!activeWidgetIds.has(id)) {
        window.clearInterval(intervalRef.current[id]);
        delete intervalRef.current[id];
      }
    });

    widgets.forEach((widget) => {
      const interval = normalizeInterval(widget.refreshInterval);
      if (!interval) return;

      if (intervalRef.current[widget.id]) {
        window.clearInterval(intervalRef.current[widget.id]);
      }

      intervalRef.current[widget.id] = window.setInterval(() => {
        fetchAndStoreWidgetData(widget, false);
      }, interval);
    });

    return () => {
      Object.values(intervalRef.current).forEach((timerId) =>
        window.clearInterval(timerId)
      );
      intervalRef.current = {};
    };
  }, [widgets, hydrated, fetchAndStoreWidgetData]);

  const handleAddWidget = async (payload: {
    name: string;
    apiUrl: string;
    refreshInterval: number;
    fields: Widget["selectedFields"];
    displayMode: DisplayMode;
  }) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const position = getNextWidgetPosition(layout as any[], DEFAULT_SIZE);

    const refreshIntervalMs = Math.max(payload.refreshInterval, 5) * 1000;

    const widget: Widget = {
      id,
      name: payload.name,
      type: mapDisplayModeToType(payload.displayMode),
      apiUrl: payload.apiUrl,
      refreshInterval: refreshIntervalMs,
      selectedFields: payload.fields,
      displayMode: payload.displayMode,
      position,
      size: DEFAULT_SIZE,
    };

    addWidget(widget);
    fetchedRef.current.add(widget.id);
    await fetchAndStoreWidgetData(widget);
    setModalOpen(false);
  };

  const emptyState = useMemo(() => widgets.length === 0, [widgets.length]);

  return (
    <div
      className={[
        "min-h-screen",
        theme === "dark"
          ? "dark bg-zinc-950 text-zinc-100"
          : "bg-zinc-50 text-zinc-900",
      ].join(" ")}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          onAddWidget={() => setModalOpen(true)}
          widgetCount={widgets.length}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {emptyState ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/70 text-zinc-300">
                <Plus className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-zinc-100">
                  Build your dashboard
                </h2>
                <p className="text-sm text-zinc-400">
                  Add widgets to track prices, metrics, and live data streams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                Add your first widget
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <DashboardGrid
              widgets={widgets}
              dataMap={widgetData}
              loadingMap={loadingMap}
              errorMap={errorMap}
              onRefreshWidget={(widget) => fetchAndStoreWidgetData(widget)}
              onConfigureWidget={() => setModalOpen(true)}
            />
          </div>
        )}
      </div>

      <AddWidgetModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddWidget}
      />
    </div>
  );
}
