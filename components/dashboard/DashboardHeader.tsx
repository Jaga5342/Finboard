"use client";

// Header component
import { Plus, Moon, Sun, Download, Upload } from "lucide-react";
import Button from "@/components/ui/Button";
import { useDashboardStore, Theme } from "@/store/dashboardStore";
import { useWidgetStore } from "@/store/widgetStore";
import { useRef } from "react";
import { Widget } from "@/types/widget";
import { Layout } from "react-grid-layout/legacy";

interface DashboardHeaderProps {
  onAddWidget: () => void;
  widgetCount?: number;
  theme?: Theme;
  onToggleTheme?: () => void;
}

interface DashboardConfig {
  version: number;
  layout: Layout;
  theme: Theme;
  widgets: Widget[];
  timestamp: number;
}

import { useToast } from "@/context/ToastContext";

// ... previous imports

export default function DashboardHeader({
  onAddWidget,
  widgetCount = 0,
  theme = "dark",
  onToggleTheme,
}: DashboardHeaderProps) {
  const { showToast } = useToast();
  // ... rest of component
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stores
  const layout = useDashboardStore((state) => state.layout);
  const currentTheme = useDashboardStore((state) => state.theme);
  const setTheme = useDashboardStore((state) => state.setTheme);
  const updateLayout = useDashboardStore((state) => state.updateLayout);

  const widgets = useWidgetStore((state) => state.widgets);
  const setWidgets = useWidgetStore((state) => state.setWidgets);

  const handleExport = () => {
    try {
      const config: DashboardConfig = {
        version: 1,
        layout,
        theme: currentTheme,
        widgets,
        timestamp: Date.now(),
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Dashboard configuration exported successfully!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Failed to export dashboard configuration.", "error");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as DashboardConfig;

        // Basic validation
        if (!config.widgets || !Array.isArray(config.widgets)) {
          throw new Error("Invalid configuration: Missing widgets");
        }
        if (!config.layout || !Array.isArray(config.layout)) {
          throw new Error("Invalid configuration: Missing layout");
        }

        // Apply configuration
        setWidgets(config.widgets);
        updateLayout(config.layout);
        if (config.theme && (config.theme === 'dark' || config.theme === 'light')) {
          setTheme(config.theme);
        }

        alert("Dashboard imported successfully!");
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import dashboard: Invalid file format.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-lg shadow-black/20 md:flex-row md:items-center md:justify-between md:p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          FinBoard
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
            {widgetCount} widgets
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
          Real-time Dashboard
        </h1>
        <p className="hidden text-sm text-zinc-400 sm:block">
          Monitor live metrics, charts, and tables in one place.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImport}
        />

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
        >
          <Download className="h-4 w-4" />
          Export
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
        >
          <Upload className="h-4 w-4" />
          Import
        </button>

        <div className="mx-2 h-6 w-px bg-zinc-800" />

        {onToggleTheme ? (
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        ) : null}
        <Button onClick={onAddWidget} size="md" variant="primary">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Widget
          </span>
        </Button>
      </div>
    </div>
  );
}
