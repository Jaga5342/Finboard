"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { Layout } from "react-grid-layout/legacy";
import { Plus } from "lucide-react";
import CardWidget from "@/components/widgets/CardWidget";
import TableWidget from "@/components/widgets/TableWidget";
import ChartWidget from "@/components/widgets/ChartWidget";
import { DisplayMode, Widget } from "@/types/widget";
import { useDashboardStore } from "@/store/dashboardStore";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_SIZE = { w: 1, h: 6 };
const BREAKPOINTS = { lg: 1024, md: 768, sm: 0 };
const COLS = { lg: 3, md: 2, sm: 1 };

interface DashboardGridProps {
  widgets: Widget[];
  dataMap: Record<string, unknown>;
  loadingMap?: Record<string, boolean>;
  errorMap?: Record<string, string | null>;
  onRefreshWidget?: (widget: Widget) => void;
  onConfigureWidget?: (widget: Widget) => void;
  onDeleteWidget?: (widget: Widget) => void;
}

function buildLayout(
  widgets: Widget[],
  savedLayout: Layout | undefined,
  cols: number
): Layout {
  const layoutMap = new Map((savedLayout ?? []).map((item) => [item.i, item]));

  return widgets.map((widget, index) => {
    const existing = layoutMap.get(widget.id);
    if (existing) {
      return { ...existing, i: widget.id };
    }

    const width = widget.size?.width ?? DEFAULT_SIZE.w;
    const height = widget.size?.height ?? DEFAULT_SIZE.h;
    const x = widget.position?.x ?? ((index * width) % cols);
    const y = widget.position?.y ?? Math.floor((index * width) / cols) * height;

    return {
      i: widget.id,
      x,
      y,
      w: width,
      h: height,
      minW: 2,
      minH: 3,
    };
  });
}

export default function DashboardGrid({
  widgets,
  dataMap,
  loadingMap,
  errorMap,
  onRefreshWidget,
  onConfigureWidget,
  onDeleteWidget,
}: DashboardGridProps) {
  const layout = useDashboardStore((state) => state.layout);
  const updateLayout = useDashboardStore((state) => state.updateLayout);

  const derivedLayout = useMemo(
    () => buildLayout(widgets, layout, COLS.lg),
    [widgets, layout]
  );

  const [currentLayout, setCurrentLayout] = useState<Layout>(derivedLayout);

  useEffect(() => {
    setCurrentLayout(derivedLayout);
  }, [derivedLayout]);

  const handleLayoutChange = (newLayout: Layout) => {
    setCurrentLayout(newLayout);
    updateLayout(newLayout);
  };

  if (widgets.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-8 py-10 text-center text-sm text-zinc-400">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/70 bg-zinc-900/60">
            <Plus className="h-5 w-5" />
          </span>
          <div className="text-sm font-medium text-zinc-200">
            No widgets yet
          </div>
          <p className="max-w-xs text-xs text-zinc-500">
            Add your first widget to start tracking real-time data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      breakpoints={BREAKPOINTS}
      cols={COLS}
      layouts={{ lg: currentLayout, md: currentLayout, sm: currentLayout }}
      rowHeight={32}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      draggableHandle=".drag-handle"
      isResizable
      isDraggable
      onLayoutChange={(layoutValue: Layout) => handleLayoutChange(layoutValue)}
    >
      {widgets.map((widget) => {
        const data = dataMap[widget.id];
        const isLoading = loadingMap?.[widget.id] ?? false;
        const error = errorMap?.[widget.id] ?? null;

        let content: ReactNode = null;

        switch (widget.displayMode) {
          case DisplayMode.TABLE:
            content = (
              <TableWidget
                widget={widget}
                data={data}
                isLoading={isLoading}
                error={error}
                onRefresh={() => onRefreshWidget?.(widget)}
                onConfigure={() => onConfigureWidget?.(widget)}
                onDelete={() => onDeleteWidget?.(widget)}
              />
            );
            break;
          case DisplayMode.CHART:
            content = (
              <ChartWidget
                widget={widget}
                data={data}
                chartType="line"
                isLoading={isLoading}
                error={error}
                onRefresh={() => onRefreshWidget?.(widget)}
                onConfigure={() => onConfigureWidget?.(widget)}
                onDelete={() => onDeleteWidget?.(widget)}
              />
            );
            break;
          default:
            content = (
              <CardWidget
                widget={widget}
                data={data}
                isLoading={isLoading}
                error={error}
                onRefresh={() => onRefreshWidget?.(widget)}
                onConfigure={() => onConfigureWidget?.(widget)}
                onDelete={() => onDeleteWidget?.(widget)}
              />
            );
        }

        return (
          <div key={widget.id} className="overflow-hidden">
            {content}
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}
